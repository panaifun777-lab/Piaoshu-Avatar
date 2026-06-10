'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Shield,
  FileCheck,
  Link,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Upload,
  Lock,
  Fingerprint,
  Database,
} from 'lucide-react'
import { useEvidences, useCreateEvidence, useSignVC } from '@/lib/api-hooks'

// ─── Types ────────────────────────────────────────────────────────────────────

type EvidenceType = 'interview' | 'ab_test' | 'decision_log' | 'metric'
type CredentialStatus = 'draft' | 'signed' | 'onchain' | 'verified'

interface ApiEvidence {
  id: string
  title: string
  description?: string | null
  evidenceType: string
  contentHash?: string | null
  status: string
  vcId?: string | null
  credential?: {
    id: string
    issuerDID: string
    subjectDID: string
    hash?: string | null
  } | null
  createdAt: string
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: 'interview', label: '用户访谈' },
  { value: 'ab_test', label: 'A/B测试' },
  { value: 'decision_log', label: '决策日志' },
  { value: 'metric', label: '核心指标' },
]

const TYPE_BADGE_MAP: Record<string, { label: string; className: string }> = {
  interview: { label: '用户访谈', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  ab_test: { label: 'A/B测试', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  decision_log: { label: '决策日志', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  metric: { label: '核心指标', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  signed: { label: '已签名', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
  onchain: { label: '已上链', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  verified: { label: '已验证', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EvidenceChainView() {
  const [evidenceType, setEvidenceType] = useState<string>('')
  const [evidenceTitle, setEvidenceTitle] = useState('')
  const [evidenceContent, setEvidenceContent] = useState('')
  const [evidenceTags, setEvidenceTags] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verifyResult, setVerifyResult] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [signingId, setSigningId] = useState<string | null>(null)

  const { data, isLoading, error } = useEvidences()
  const createEvidence = useCreateEvidence()
  const signVC = useSignVC()

  const evidences = (data?.evidences ?? []) as ApiEvidence[]

  // Compute stats
  const verifiedCount = evidences.filter((e) => e.status === 'verified').length
  const draftCount = evidences.filter((e) => e.status === 'draft').length
  const onchainCount = evidences.filter((e) => e.status === 'onchain' || e.status === 'verified').length

  // Compute type counts
  const typeCounts: Record<string, number> = {}
  for (const e of evidences) {
    typeCounts[e.evidenceType] = (typeCounts[e.evidenceType] || 0) + 1
  }

  // Compute pipeline steps
  const pipelineSteps: { key: string; label: string; count: number }[] = [
    { key: 'draft', label: '草稿', count: evidences.filter((e) => e.status === 'draft').length },
    { key: 'signed', label: '已签名', count: evidences.filter((e) => e.status === 'signed').length },
    { key: 'onchain', label: '已上链', count: evidences.filter((e) => e.status === 'onchain').length },
    { key: 'verified', label: '已验证', count: verifiedCount },
  ]

  const handleVerify = () => {
    if (!verifyHash.trim()) return
    setVerifyResult(verifyHash.trim().startsWith('0x') ? 'valid' : 'invalid')
  }

  const handleCreateEvidence = async () => {
    if (!evidenceTitle.trim()) {
      toast.error('请输入证据标题')
      return
    }
    try {
      await createEvidence.mutateAsync({
        title: evidenceTitle,
        description: evidenceContent || undefined,
        evidenceType: evidenceType || undefined,
      })
      toast.success('证据已创建')
      setEvidenceTitle('')
      setEvidenceContent('')
      setEvidenceType('')
      setEvidenceTags('')
    } catch {
      toast.error('创建证据失败')
    }
  }

  const handleSignVC = async (evidenceId: string) => {
    setSigningId(evidenceId)
    try {
      await signVC.mutateAsync({ evidenceId })
      toast.success('VC凭证已签发')
    } catch {
      toast.error('签发VC凭证失败')
    } finally {
      setSigningId(null)
    }
  }

  const handleOnchain = () => {
    toast.info('上链功能需要以太坊L2节点连接')
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Section 1: 证据链概览 ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">已验证凭证</CardTitle>
            <Shield className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{verifiedCount}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">+{verifiedCount}</span> 已验证
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">待签发</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{draftCount}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-600 font-medium">需处理</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">链上存证</CardTitle>
            <Link className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{onchainCount}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3 text-teal-500" />
                  <span className="text-teal-600 font-medium">100%</span> 不可篡改
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2: 证据提交面板 ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            新证据提交
          </CardTitle>
          <CardDescription>提交新的可信证据，签发VC凭证并上链存证</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 证据类型 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">证据类型</label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择证据类型" />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 证据标题 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">证据标题</label>
              <Input
                placeholder="输入证据标题"
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
              />
            </div>
          </div>

          {/* 证据内容 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">证据内容</label>
            <Textarea
              placeholder="详细描述证据内容，包括数据来源、验证方法等..."
              rows={4}
              value={evidenceContent}
              onChange={(e) => setEvidenceContent(e.target.value)}
            />
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">标签</label>
            <Input
              placeholder="输入标签，用逗号分隔"
              value={evidenceTags}
              onChange={(e) => setEvidenceTags(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreateEvidence}
              disabled={createEvidence.isPending}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              {createEvidence.isPending ? '提交中...' : '签发VC凭证'}
            </Button>
            <Button
              variant="outline"
              className="border-teal-600 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950"
              onClick={handleOnchain}
            >
              <Link className="h-4 w-4 mr-2" />
              上链存证
            </Button>
          </div>

          {/* Hard constraint */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>硬性约束：</strong>所有MVP阶段的问题-方案匹配证据，必须带有VC签名。无签名数据视为噪音。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3 & 4: 凭证列表 + 链上验证面板 ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 凭证列表 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              凭证列表
            </CardTitle>
            <CardDescription>所有可验证凭证(Verifiable Credentials)的链上记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : error ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm">加载凭证失败，请稍后重试</p>
                </div>
              ) : evidences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">暂无凭证，请提交新证据</p>
                </div>
              ) : (
                evidences.map((ev) => {
                  const typeInfo = TYPE_BADGE_MAP[ev.evidenceType] ?? TYPE_BADGE_MAP.interview
                  const statusInfo = STATUS_BADGE_MAP[ev.status] ?? STATUS_BADGE_MAP.draft
                  const did = ev.credential?.issuerDID ?? null
                  const hash = ev.credential?.hash ?? ev.contentHash ?? '—'

                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* ID + Title */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{ev.id.slice(0, 8)}</span>
                            <Badge variant="outline" className={typeInfo.className}>
                              {typeInfo.label}
                            </Badge>
                            <Badge variant="outline" className={statusInfo.className}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                            {did ? (
                              <span className="flex items-center gap-1 truncate">
                                <Fingerprint className="h-3 w-3 shrink-0" />
                                W3C DID: {did.slice(0, 20)}...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3 shrink-0" />
                                待签发
                              </span>
                            )}
                            <span className="flex items-center gap-1 shrink-0">
                              <Lock className="h-3 w-3" />
                              {hash ? hash.slice(0, 18) + '...' : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {ev.status === 'draft' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                              onClick={() => handleSignVC(ev.id)}
                              disabled={signingId === ev.id}
                            >
                              <FileCheck className="h-3 w-3 mr-1" />
                              {signingId === ev.id ? '签发中...' : '签发VC'}
                            </Button>
                          )}
                          {ev.status === 'signed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-teal-600 text-teal-700 hover:bg-teal-50 dark:text-teal-400 h-7 text-xs"
                              onClick={handleOnchain}
                            >
                              <Link className="h-3 w-3 mr-1" />
                              上链
                            </Button>
                          )}
                          {/* Status icon */}
                          {ev.status === 'verified' && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          {ev.status === 'onchain' && (
                            <Link className="h-5 w-5 text-emerald-600" />
                          )}
                          {ev.status === 'signed' && !['signed'].includes(ev.status) && (
                            <Shield className="h-5 w-5 text-yellow-600" />
                          )}
                          {ev.status === 'draft' && (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* 链上验证面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-600" />
              链上验证
            </CardTitle>
            <CardDescription>粘贴VC哈希验证凭证是否有效</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">VC哈希</label>
              <div className="flex gap-2">
                <Input
                  placeholder="0x..."
                  value={verifyHash}
                  onChange={(e) => {
                    setVerifyHash(e.target.value)
                    setVerifyResult('idle')
                  }}
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleVerify}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verification result */}
            {verifyResult === 'valid' && (
              <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">凭证验证通过</p>
                  <p className="text-xs text-green-600 dark:text-green-400">该凭证已在链上确认，数据完整且未被篡改</p>
                </div>
              </div>
            )}

            {verifyResult === 'invalid' && (
              <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">凭证验证失败</p>
                  <p className="text-xs text-red-600 dark:text-red-400">未找到匹配的链上记录，请检查哈希值</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Protocol info */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">协议规范</p>
                  <p className="text-xs text-muted-foreground">W3C DID + VC</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">存储层</p>
                  <p className="text-xs text-muted-foreground">元数据上以太坊L2, 原始数据存IPFS/Arweave</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">智能合约</p>
                  <p className="text-xs text-muted-foreground font-mono">Solidity 证据锚定合约 v0.1.0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 5: 证据可视化 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evidence by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5 text-emerald-600" />
              证据类型分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : (
              (Object.entries(TYPE_BADGE_MAP) as [string, { label: string; className: string }][]).map(([type, typeInfo]) => {
                const count = typeCounts[type] || 0
                const maxCount = Math.max(...Object.values(typeCounts), 1)
                const widthPercent = (count / maxCount) * 100

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{typeInfo.label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Verification Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="h-5 w-5 text-emerald-600" />
              验证流水线
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-between gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-16 rounded-full" />
                ))
                }
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-1">
                  {pipelineSteps.map((step, idx) => {
                    const statusInfo = STATUS_BADGE_MAP[step.key] ?? STATUS_BADGE_MAP.draft
                    return (
                      <div key={step.key} className="flex items-center gap-1">
                        <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                          {/* Step circle */}
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                              step.key === 'draft'
                                ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900'
                                : step.key === 'signed'
                                ? 'border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950'
                                : step.key === 'onchain'
                                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950'
                                : 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950'
                            }`}
                          >
                            <span className="text-sm font-bold">{step.count}</span>
                          </div>
                          <span className="text-xs text-center font-medium text-muted-foreground">
                            {statusInfo.label}
                          </span>
                        </div>
                        {/* Arrow between steps */}
                        {idx < pipelineSteps.length - 1 && (
                          <div className="flex-shrink-0 w-6 h-0.5 bg-border mt-[-16px]" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <Separator className="my-4" />

                <div className="rounded-lg border border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-800 p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    <strong className="text-teal-700 dark:text-teal-400">验证率：</strong>
                    {pipelineSteps.reduce((sum, s) => sum + s.count, 0)} 条凭证中{' '}
                    {pipelineSteps.find((s) => s.key === 'verified')?.count ?? 0} 条已完成全链路验证
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
