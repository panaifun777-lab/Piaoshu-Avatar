'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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

// ─── Types ────────────────────────────────────────────────────────────────────

type EvidenceType = 'interview' | 'ab_test' | 'decision_log' | 'metric'
type CredentialStatus = 'draft' | 'signed' | 'onchain' | 'verified'

interface Credential {
  id: string
  title: string
  type: EvidenceType
  status: CredentialStatus
  did: string | null
  hash: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CREDENTIALS: Credential[] = [
  {
    id: 'VC-001',
    title: '用户访谈#23 - 支付痛点验证',
    type: 'interview',
    status: 'verified',
    did: 'did:piaoshu:0x3f...',
    hash: '0x3f8a2c...b7e1',
  },
  {
    id: 'VC-002',
    title: 'A/B测试 - 首页转化率',
    type: 'ab_test',
    status: 'verified',
    did: 'did:piaoshu:0x7a...',
    hash: '0x7a4d9f...c3d2',
  },
  {
    id: 'VC-003',
    title: '决策日志 - 定价策略调整',
    type: 'decision_log',
    status: 'signed',
    did: 'did:piaoshu:0x1c...',
    hash: '0x1cb5e7...8a94',
  },
  {
    id: 'VC-004',
    title: '核心指标 - 月活增长率',
    type: 'metric',
    status: 'onchain',
    did: 'did:piaoshu:0x9e...',
    hash: '0x9e2f3a...d1c6',
  },
  {
    id: 'VC-005',
    title: '用户访谈#24 - 功能优先级',
    type: 'interview',
    status: 'draft',
    did: null,
    hash: '—',
  },
]

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: 'interview', label: '用户访谈' },
  { value: 'ab_test', label: 'A/B测试' },
  { value: 'decision_log', label: '决策日志' },
  { value: 'metric', label: '核心指标' },
]

const TYPE_BADGE_MAP: Record<EvidenceType, { label: string; className: string }> = {
  interview: { label: '用户访谈', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  ab_test: { label: 'A/B测试', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  decision_log: { label: '决策日志', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  metric: { label: '核心指标', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
}

const STATUS_BADGE_MAP: Record<CredentialStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  signed: { label: '已签名', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
  onchain: { label: '已上链', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  verified: { label: '已验证', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800' },
}

// Evidence type counts for visualization
const TYPE_COUNTS: Record<EvidenceType, number> = {
  interview: 5,
  ab_test: 3,
  decision_log: 4,
  metric: 2,
}

const PIPELINE_STEPS: { key: CredentialStatus; label: string; count: number }[] = [
  { key: 'draft', label: '草稿', count: 1 },
  { key: 'signed', label: '已签名', count: 1 },
  { key: 'onchain', label: '已上链', count: 1 },
  { key: 'verified', label: '已验证', count: 2 },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function EvidenceChainView() {
  const [evidenceType, setEvidenceType] = useState<string>('')
  const [evidenceTitle, setEvidenceTitle] = useState('')
  const [evidenceContent, setEvidenceContent] = useState('')
  const [evidenceTags, setEvidenceTags] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verifyResult, setVerifyResult] = useState<'idle' | 'valid' | 'invalid'>('idle')

  const handleVerify = () => {
    if (!verifyHash.trim()) return
    // Simulate verification: if it starts with "0x" treat as valid
    setVerifyResult(verifyHash.trim().startsWith('0x') ? 'valid' : 'invalid')
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
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">12</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">+2</span> 本周新增
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">待签发</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">3</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-amber-600 font-medium">需处理</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">链上存证</CardTitle>
            <Link className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">8</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Fingerprint className="h-3 w-3 text-teal-500" />
              <span className="text-teal-600 font-medium">100%</span> 不可篡改
            </p>
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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileCheck className="h-4 w-4 mr-2" />
              签发VC凭证
            </Button>
            <Button variant="outline" className="border-teal-600 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950">
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
              {CREDENTIALS.map((cred) => {
                const typeInfo = TYPE_BADGE_MAP[cred.type]
                const statusInfo = STATUS_BADGE_MAP[cred.status]

                return (
                  <div
                    key={cred.id}
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* ID + Title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{cred.id}</span>
                          <Badge variant="outline" className={typeInfo.className}>
                            {typeInfo.label}
                          </Badge>
                          <Badge variant="outline" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{cred.title}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          {cred.did && (
                            <span className="flex items-center gap-1 truncate">
                              <Fingerprint className="h-3 w-3 shrink-0" />
                              W3C DID: {cred.did}
                            </span>
                          )}
                          {!cred.did && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3 shrink-0" />
                              待签发
                            </span>
                          )}
                          <span className="flex items-center gap-1 shrink-0">
                            <Lock className="h-3 w-3" />
                            {cred.hash}
                          </span>
                        </div>
                      </div>

                      {/* Status icon */}
                      <div className="shrink-0">
                        {cred.status === 'verified' && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {cred.status === 'onchain' && (
                          <Link className="h-5 w-5 text-emerald-600" />
                        )}
                        {cred.status === 'signed' && (
                          <Shield className="h-5 w-5 text-yellow-600" />
                        )}
                        {cred.status === 'draft' && (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
            {(Object.entries(TYPE_COUNTS) as [EvidenceType, number][]).map(([type, count]) => {
              const typeInfo = TYPE_BADGE_MAP[type]
              const maxCount = Math.max(...Object.values(TYPE_COUNTS))
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
            })}
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
            <div className="flex items-center justify-between gap-1">
              {PIPELINE_STEPS.map((step, idx) => {
                const statusInfo = STATUS_BADGE_MAP[step.key]
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
                    {idx < PIPELINE_STEPS.length - 1 && (
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
                {PIPELINE_STEPS.reduce((sum, s) => sum + s.count, 0)} 条凭证中{' '}
                {PIPELINE_STEPS.find((s) => s.key === 'verified')?.count ?? 0} 条已完成全链路验证
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
