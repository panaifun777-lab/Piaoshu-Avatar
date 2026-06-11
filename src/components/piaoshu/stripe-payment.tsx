'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  CreditCard,
  Wallet,
  Shield,
  Check,
  ArrowRight,
  Loader2,
  Link2,
  Lock,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  useCreateStripeSession,
  useVerifyStripePayment,
  useStripeLinkStatus,
  usePaymentMethods,
} from '@/lib/api-hooks'

type PaymentMethodId = 'stripe_link' | 'stripe_card' | 'crypto'

interface StripePaymentProps {
  planId?: string
  amount?: number
  currency?: string
  onSuccess?: (sessionId: string) => void
}

const METHOD_CONFIG: Record<PaymentMethodId, {
  icon: React.ElementType
  label: string
  description: string
  badge?: string
  badgeColor?: string
  accent: string
  accentBg: string
  accentBorder: string
  estimatedTime: string
}> = {
  stripe_link: {
    icon: Zap,
    label: 'Stripe Link',
    description: '一键支付 · 保存付款信息',
    badge: 'Link by Stripe',
    badgeColor: '#635BFF',
    accent: 'text-purple-600 dark:text-purple-400',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-300 dark:border-purple-700',
    estimatedTime: '< 1s',
  },
  stripe_card: {
    icon: CreditCard,
    label: '信用卡',
    description: 'Visa / Mastercard / AMEX',
    accent: 'text-slate-600 dark:text-slate-400',
    accentBg: 'bg-slate-500/10',
    accentBorder: 'border-slate-300 dark:border-slate-700',
    estimatedTime: '1-3s',
  },
  crypto: {
    icon: Wallet,
    label: '链上支付',
    description: 'AFC Token · Base Chain',
    badge: 'Base Sepolia',
    badgeColor: '#10b981',
    accent: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-300 dark:border-emerald-700',
    estimatedTime: '~15s',
  },
}

export function StripePayment({
  planId,
  amount = 0,
  currency = 'usd',
  onSuccess,
}: StripePaymentProps) {
  const { data: session } = useSession()
  const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('stripe_link')
  const [step, setStep] = useState<'method' | 'form' | 'confirm' | 'processing' | 'result'>('method')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'paid' | 'failed' | 'pending'>('idle')

  // Form state
  const [linkEmail, setLinkEmail] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [walletAddress, setWalletAddress] = useState('0x742d...A3f2')

  // Hooks
  const createSessionMutation = useCreateStripeSession()
  const verifyMutation = useVerifyStripePayment()
  const { data: linkStatusData } = useStripeLinkStatus(userId)
  const { data: methodsData } = usePaymentMethods()

  const config = METHOD_CONFIG[selectedMethod]
  const linkStatus = linkStatusData?.data
  const isLinkEnabled = linkStatus?.linkEnabled ?? false

  const displayAmount = amount > 0 ? `$${(amount).toFixed(2)}` : '—'
  const afcAmount = amount > 0 ? Math.round(amount * 10) : 0

  const handleCreateSession = async () => {
    if (!amount || amount <= 0) {
      toast.error('无效金额')
      return
    }

    try {
      const result = await createSessionMutation.mutateAsync({
        planId,
        userId,
        amount,
        currency,
        paymentMethod: selectedMethod,
      })

      if (result.success && result.data) {
        setSessionId(result.data.sessionId)
        setStep('confirm')
        toast.success('支付会话已创建')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建会话失败')
    }
  }

  const handleConfirmPayment = async () => {
    if (!sessionId) return

    setStep('processing')
    try {
      const result = await verifyMutation.mutateAsync({ sessionId })

      if (result.success && result.data) {
        setPaymentStatus(result.data.status as 'paid' | 'failed' | 'pending')
        setStep('result')

        if (result.data.status === 'paid') {
          toast.success('支付成功！')
          onSuccess?.(sessionId)
        } else if (result.data.status === 'failed') {
          toast.error('支付失败，请重试')
        } else {
          toast.info('支付处理中...')
        }
      }
    } catch (error) {
      setPaymentStatus('failed')
      setStep('result')
      toast.error(error instanceof Error ? error.message : '验证支付失败')
    }
  }

  const handleReset = () => {
    setStep('method')
    setSessionId(null)
    setPaymentStatus('idle')
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
  }

  const isFormValid = () => {
    if (selectedMethod === 'stripe_link') return linkEmail.includes('@')
    if (selectedMethod === 'stripe_card') return cardNumber.length >= 15 && cardExpiry.length >= 4 && cardCvc.length >= 3
    if (selectedMethod === 'crypto') return walletAddress.length > 0
    return false
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* Step 1: Payment Method Selector */}
        {step === 'method' && (
          <motion.div
            key="method"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">选择支付方式</span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">
                安全加密
              </Badge>
            </div>

            <div className="space-y-2">
              {(Object.keys(METHOD_CONFIG) as PaymentMethodId[]).map((methodId) => {
                const cfg = METHOD_CONFIG[methodId]
                const Icon = cfg.icon
                const isSelected = selectedMethod === methodId
                const methodData = methodsData?.data?.methods?.find((m: { id: string }) => m.id === methodId)
                const isEnabled = methodData?.supported !== false

                return (
                  <button
                    key={methodId}
                    onClick={() => isEnabled && setSelectedMethod(methodId)}
                    disabled={!isEnabled}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? `${cfg.accentBorder} ${cfg.accentBg} ring-1 ring-current/20`
                        : 'border-border hover:border-muted-foreground/30'
                    } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? cfg.accentBg : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${isSelected ? cfg.accent : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{cfg.label}</span>
                        {cfg.badge && (
                          <Badge
                            className="text-[8px] h-4 px-1.5 border-0 text-white"
                            style={{ backgroundColor: cfg.badgeColor }}
                          >
                            {cfg.badge}
                          </Badge>
                        )}
                        {methodId === 'stripe_link' && isLinkEnabled && (
                          <Badge className="text-[8px] h-4 px-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">
                            已连接
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{cfg.description}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {cfg.estimatedTime}
                        </span>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? cfg.accentBorder : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <div className={`h-2.5 w-2.5 rounded-full ${
                        methodId === 'stripe_link' ? 'bg-purple-500' :
                        methodId === 'crypto' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => setStep('form')}
            >
              继续
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Payment Form */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('method')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← 返回
              </button>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-sm font-medium flex items-center gap-1.5">
                {(() => { const Ic = config.icon; return <Ic className={`h-4 w-4 ${config.accent}`} /> })()}
                {config.label}
              </span>
            </div>

            {selectedMethod === 'stripe_link' && (
              <div className="space-y-3">
                {isLinkEnabled && linkStatus?.savedPaymentMethods?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">已保存的付款方式</p>
                    {linkStatus.savedPaymentMethods.map((pm: { id: string; type: string; last4?: string; brand?: string; email?: string; isDefault: boolean }) => (
                      <div
                        key={pm.id}
                        className="flex items-center gap-3 rounded-lg border p-3 bg-purple-50/50 dark:bg-purple-950/20"
                      >
                        {pm.type === 'link' ? (
                          <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            {pm.type === 'link' ? 'Link' : `${pm.brand?.toUpperCase() || 'Card'} •••• ${pm.last4}`}
                          </p>
                          {pm.email && <p className="text-[10px] text-muted-foreground">{pm.email}</p>}
                        </div>
                        {pm.isDefault && (
                          <Badge className="text-[8px] h-3.5 px-1.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-0">
                            默认
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">邮箱地址</p>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    className="border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Link 将安全保存您的付款信息
                  </p>
                </div>
                <Button
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleCreateSession}
                  disabled={!isFormValid() || createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Continue with Link
                </Button>
              </div>
            )}

            {selectedMethod === 'stripe_card' && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">卡号</p>
                  <div className="relative">
                    <Input
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, '').slice(0, 19))}
                      className="pr-10"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">有效期</p>
                    <Input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">CVC</p>
                    <Input
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                    />
                  </div>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleCreateSession}
                  disabled={!isFormValid() || createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  确认支付 {displayAmount}
                </Button>
              </div>
            )}

            {selectedMethod === 'crypto' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">AFC Token 支付</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">支付金额</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">{afcAmount} AFC</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">≈ 等值</p>
                      <p className="font-bold">{displayAmount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">网络</p>
                      <p className="font-medium">Base Sepolia</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gas 估算</p>
                      <p className="font-medium">~0.001 ETH</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">钱包地址</p>
                  <Input
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500 font-mono text-xs"
                  />
                </div>
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreateSession}
                  disabled={!isFormValid() || createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  链上支付 {afcAmount} AFC
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${config.accentBg}`}>
                {(() => { const Ic = config.icon; return <Ic className={`h-6 w-6 ${config.accent}`} /> })()}
              </div>
              <h3 className="text-lg font-bold">确认支付</h3>
              <p className="text-sm text-muted-foreground">请确认以下订单信息</p>
            </div>

            <Card className="rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">支付方式</span>
                  <span className="font-medium">{config.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">金额</span>
                  <span className="font-bold text-lg">
                    {selectedMethod === 'crypto' ? `${afcAmount} AFC` : displayAmount}
                  </span>
                </div>
                {selectedMethod !== 'crypto' && afcAmount > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>等值 AFC</span>
                    <span>{afcAmount} AFC</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">会话 ID</span>
                  <span className="font-mono text-xs">{sessionId?.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>有效期</span>
                  <span>30 分钟</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
              <Lock className="h-3 w-3" />
              <span>由 Stripe 安全加密处理</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('form')}
              >
                返回
              </Button>
              <Button
                className={`flex-1 gap-2 ${
                  selectedMethod === 'stripe_link'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : selectedMethod === 'crypto'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : ''
                }`}
                onClick={handleConfirmPayment}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                确认支付
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="inline-flex">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              >
                <Loader2 className="h-10 w-10 text-purple-500" />
              </motion.div>
            </div>
            <h3 className="text-lg font-bold">处理中...</h3>
            <p className="text-sm text-muted-foreground">
              {selectedMethod === 'crypto'
                ? '正在等待链上确认...'
                : '正在验证支付信息...'}
            </p>
          </motion.div>
        )}

        {/* Step 5: Result */}
        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            {paymentStatus === 'paid' ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
                >
                  <Check className="h-8 w-8 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">支付成功！</h3>
                <p className="text-sm text-muted-foreground">您的订阅已激活</p>
              </>
            ) : paymentStatus === 'pending' ? (
              <>
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">处理中</h3>
                <p className="text-sm text-muted-foreground">支付正在处理，请稍后查看</p>
              </>
            ) : (
              <>
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">支付失败</h3>
                <p className="text-sm text-muted-foreground">请检查信息后重试</p>
              </>
            )}

            <Button
              className="gap-2"
              variant={paymentStatus === 'paid' ? 'default' : 'outline'}
              onClick={handleReset}
            >
              {paymentStatus === 'paid' ? '完成' : '重新支付'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
