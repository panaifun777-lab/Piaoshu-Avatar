'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Brain,
  Swords,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  TrendingUp,
  Zap,
  Eye,
} from 'lucide-react'

// ─── Data Types ──────────────────────────────────────────────────────────────

interface CognitiveShard {
  id: string
  name: string
  model: string
  confidence: number
  status: 'active' | 'training' | 'offline'
  type: 'red' | 'blue' | 'neutral'
}

interface Vulnerability {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium'
  description: string
}

interface DefenseStrategy {
  id: string
  title: string
  strength: 'strong' | 'moderate' | 'weak'
  description: string
}

interface DecisionEntry {
  id: string
  title: string
  category: 'strategic' | 'hiring' | 'technical' | 'financial'
  timestamp: string
  confidence: number
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const initialShards: CognitiveShard[] = [
  {
    id: 'shard-1',
    name: '战略决策分身',
    model: 'Qwen-72B',
    confidence: 87,
    status: 'active',
    type: 'blue',
  },
  {
    id: 'shard-2',
    name: '风险扫描分身',
    model: 'Llama-3-70B',
    confidence: 72,
    status: 'active',
    type: 'red',
  },
  {
    id: 'shard-3',
    name: '产品直觉分身',
    model: 'Qwen-14B',
    confidence: 65,
    status: 'training',
    type: 'neutral',
  },
]

const sampleVulnerabilities: Vulnerability[] = [
  {
    id: 'v-1',
    title: '市场时机误判风险',
    severity: 'critical',
    description:
      '当前垂直赛道头部玩家已占据70%市场份额，窗口期可能不足6个月，进入壁垒被低估。',
  },
  {
    id: 'v-2',
    title: '现金流断裂链路',
    severity: 'high',
    description:
      '按当前烧钱速度，12个月内现金储备将降至安全线以下，需提前规划过桥资金。',
  },
  {
    id: 'v-3',
    title: '技术债务积累',
    severity: 'medium',
    description:
      '快速迭代导致核心架构耦合度升高，3个月内可能面临大规模重构需求。',
  },
  {
    id: 'v-4',
    title: '团队执行偏差',
    severity: 'high',
    description:
      '现有团队缺乏垂直行业经验，产品-市场匹配可能需要额外2个迭代周期。',
  },
]

const sampleDefenses: DefenseStrategy[] = [
  {
    id: 'd-1',
    title: '差异化定位策略',
    strength: 'strong',
    description:
      '聚焦未被满足的细分场景，通过场景深度而非功能广度建立护城河，避开头部正面竞争。',
  },
  {
    id: 'd-2',
    title: '收入前置模式',
    strength: 'moderate',
    description:
      '引入预付费年度合同模式，将客户承诺周期从月度提升至年度，平滑现金流波动。',
  },
  {
    id: 'd-3',
    title: '架构渐进式解耦',
    strength: 'strong',
    description:
      '采用绞杀者模式逐步拆分核心模块，每个迭代周期分配20%资源用于技术债偿还。',
  },
  {
    id: 'd-4',
    title: '顾问委员会机制',
    strength: 'moderate',
    description:
      '引入3-5位行业资深顾问，弥补团队行业认知短板，加速产品-市场匹配迭代。',
  },
]

const decisionLog: DecisionEntry[] = [
  {
    id: 'dec-1',
    title: '切入垂直SaaS市场',
    category: 'strategic',
    timestamp: '2024-12-15 14:32',
    confidence: 92,
  },
  {
    id: 'dec-2',
    title: '推迟C轮融资',
    category: 'strategic',
    timestamp: '2024-12-14 09:18',
    confidence: 78,
  },
  {
    id: 'dec-3',
    title: '引入CTO联合创始人',
    category: 'hiring',
    timestamp: '2024-12-13 16:45',
    confidence: 85,
  },
  {
    id: 'dec-4',
    title: '转向AI-first产品架构',
    category: 'technical',
    timestamp: '2024-12-12 11:20',
    confidence: 71,
  },
  {
    id: 'dec-5',
    title: '暂停海外扩张',
    category: 'strategic',
    timestamp: '2024-12-11 08:55',
    confidence: 88,
  },
  {
    id: 'dec-6',
    title: '启动种子客户计划',
    category: 'strategic',
    timestamp: '2024-12-10 15:30',
    confidence: 94,
  },
  {
    id: 'dec-7',
    title: '招聘数据工程负责人',
    category: 'hiring',
    timestamp: '2024-12-09 10:12',
    confidence: 81,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getConfidenceColor(value: number): string {
  if (value > 80) return 'text-emerald-500'
  if (value >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function getConfidenceBg(value: number): string {
  if (value > 80) return 'bg-emerald-500'
  if (value >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function getSeverityConfig(severity: Vulnerability['severity']) {
  switch (severity) {
    case 'critical':
      return { color: 'bg-red-500/10 text-red-600 border-red-200', label: '致命' }
    case 'high':
      return { color: 'bg-orange-500/10 text-orange-600 border-orange-200', label: '高危' }
    case 'medium':
      return { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '中危' }
  }
}

function getStrengthConfig(strength: DefenseStrategy['strength']) {
  switch (strength) {
    case 'strong':
      return { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', label: '强' }
    case 'moderate':
      return { color: 'bg-teal-500/10 text-teal-700 border-teal-200', label: '中' }
    case 'weak':
      return { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '弱' }
  }
}

function getCategoryConfig(category: DecisionEntry['category']) {
  switch (category) {
    case 'strategic':
      return { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', label: '战略' }
    case 'hiring':
      return { color: 'bg-teal-500/10 text-teal-700 border-teal-200', label: '招聘' }
    case 'technical':
      return { color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200', label: '技术' }
    case 'financial':
      return { color: 'bg-amber-500/10 text-amber-700 border-amber-200', label: '财务' }
  }
}

function getShardTypeBadge(type: CognitiveShard['type']) {
  switch (type) {
    case 'red':
      return { color: 'bg-red-500/10 text-red-600 border-red-200', label: '红方·攻击' }
    case 'blue':
      return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: '蓝方·防御' }
    case 'neutral':
      return { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: '中立·观察' }
  }
}

function getStatusBadge(status: CognitiveShard['status']) {
  switch (status) {
    case 'active':
      return { color: 'bg-emerald-500/10 text-emerald-700', label: '运行中' }
    case 'training':
      return { color: 'bg-amber-500/10 text-amber-700', label: '训练中' }
    case 'offline':
      return { color: 'bg-slate-500/10 text-slate-600', label: '离线' }
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ConfidenceGauge({ value, threshold = 60 }: { value: number; threshold: number }) {
  const circumference = 2 * Math.PI * 54
  const progress = (value / 100) * circumference
  const thresholdAngle = (threshold / 100) * 360
  const thresholdX = 60 + 54 * Math.sin((thresholdAngle * Math.PI) / 180)
  const thresholdY = 60 - 54 * Math.cos((thresholdAngle * Math.PI) / 180)

  const strokeColor =
    value > 80 ? 'stroke-emerald-500' : value >= 60 ? 'stroke-amber-500' : 'stroke-red-500'

  const glowColor =
    value > 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            className="stroke-muted"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            className={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor}40)`,
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
        </svg>
        {/* Threshold marker */}
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'rotate(0deg)' }}
        >
          <line
            x1={60 + 48 * Math.sin((thresholdAngle * Math.PI) / 180)}
            y1={60 - 48 * Math.cos((thresholdAngle * Math.PI) / 180)}
            x2={60 + 60 * Math.sin((thresholdAngle * Math.PI) / 180)}
            y2={60 - 60 * Math.cos((thresholdAngle * Math.PI) / 180)}
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text
            x={thresholdX + 4}
            y={thresholdY - 2}
            className="fill-amber-500"
            fontSize="6"
            fontWeight="600"
            textAnchor="start"
          >
            {threshold}%
          </text>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className={`text-2xl font-bold ${getConfidenceColor(value)}`}>{value}%</span>
          <span className="text-[10px] text-muted-foreground">置信度</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">&gt;80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">60-80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">&lt;60%</span>
        </div>
      </div>
    </div>
  )
}

function ShardCard({ shard }: { shard: CognitiveShard }) {
  const typeBadge = getShardTypeBadge(shard.type)
  const statusBadge = getStatusBadge(shard.status)
  const shardIcon =
    shard.type === 'red' ? Swords : shard.type === 'blue' ? Shield : Eye

  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${
          shard.type === 'red'
            ? 'bg-red-500'
            : shard.type === 'blue'
            ? 'bg-emerald-500'
            : 'bg-slate-400'
        }`}
      />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                shard.type === 'red'
                  ? 'bg-red-500/10 text-red-500'
                  : shard.type === 'blue'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
              {shard.type === 'red' ? (
                <Swords className="h-4 w-4" />
              ) : shard.type === 'blue' ? (
                <Shield className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{shard.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{shard.model}</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${statusBadge.color}`}
          >
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {/* Confidence bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">置信度</span>
            <span className={`font-semibold ${getConfidenceColor(shard.confidence)}`}>
              {shard.confidence}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getConfidenceBg(
                shard.confidence
              )}`}
              style={{ width: `${shard.confidence}%` }}
            />
          </div>
        </div>
        {/* Shard type badge */}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${typeBadge.color}`}
        >
          {typeBadge.label}
        </Badge>
      </CardContent>
    </Card>
  )
}

function CreateShardCard() {
  return (
    <Card className="group flex flex-col items-center justify-center border-dashed border-2 border-border/50 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer min-h-[180px]">
      <CardContent className="flex flex-col items-center justify-center gap-2 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">
          创建新分身
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          吸收新的认知维度
        </span>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CognitiveEngineView() {
  const [strategyInput, setStrategyInput] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [systemConfidence] = useState(87)
  const humanThreshold = 60

  const handleStartAdversarial = () => {
    if (!strategyInput.trim()) return
    setIsSimulating(true)
    setHasResult(false)
    // Simulate adversarial processing
    setTimeout(() => {
      setIsSimulating(false)
      setHasResult(true)
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">认知分片引擎</h1>
              <p className="text-xs text-muted-foreground">
                创始人战略直觉数字化 · 认知分身与红蓝对抗系统
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-500/5"
            >
              <Zap className="h-3 w-3" />
              引擎在线
            </Badge>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              v2.4.1
            </Badge>
          </div>
        </div>

        <Separator />

        {/* ── Section 1: Digital Twin Management ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold">分身管理区</h2>
            <Badge variant="secondary" className="text-[10px]">
              {initialShards.length} 活跃
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {initialShards.map((shard) => (
              <ShardCard key={shard.id} shard={shard} />
            ))}
            <CreateShardCard />
          </div>
        </section>

        {/* ── Section 2: Red-Blue Adversarial Simulator ──────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold">红蓝对抗模拟器</h2>
            <Badge
              variant="outline"
              className="text-[10px] border-red-200 text-red-600 bg-red-500/5"
            >
              RED
            </Badge>
            <span className="text-muted-foreground text-xs">vs</span>
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-500/5"
            >
              BLUE
            </Badge>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">输入战略假设</CardTitle>
              <CardDescription className="text-xs">
                输入你的战略构想、产品决策或风险假设，启动红蓝对抗模拟
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="例如：我们应该在Q1进入东南亚市场，利用现有技术优势快速建立据点..."
                className="min-h-[100px] resize-none text-sm"
                value={strategyInput}
                onChange={(e) => setStrategyInput(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    置信度低于阈值 → 自动触发人工介入
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-200 text-amber-600"
                  >
                    阈值 {humanThreshold}%
                  </Badge>
                </div>
                <Button
                  onClick={handleStartAdversarial}
                  disabled={!strategyInput.trim() || isSimulating}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSimulating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      对抗模拟中...
                    </>
                  ) : (
                    <>
                      <Swords className="h-4 w-4" />
                      启动对抗
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Adversarial output panels */}
          {(isSimulating || hasResult) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Red Team Panel */}
              <Card className="border-red-500/20 bg-red-500/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/10 text-red-500">
                      <Swords className="h-3.5 w-3.5" />
                    </div>
                    <CardTitle className="text-sm text-red-700">
                      红方攻击
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-red-200 text-red-600"
                    >
                      {sampleVulnerabilities.length} 致命漏洞
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    攻击视角：识别战略中的致命缺陷与潜在风险
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isSimulating ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg bg-red-500/5 animate-pulse"
                      />
                    ))
                  ) : (
                    sampleVulnerabilities.map((vuln) => {
                      const severityConfig = getSeverityConfig(vuln.severity)
                      return (
                        <div
                          key={vuln.id}
                          className="rounded-lg border border-red-200/60 bg-background p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                              <span className="text-xs font-semibold">
                                {vuln.title}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${severityConfig.color}`}
                            >
                              {severityConfig.label}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {vuln.description}
                          </p>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              {/* Blue Team Panel */}
              <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <CardTitle className="text-sm text-emerald-700">
                      蓝方防御
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-200 text-emerald-600"
                    >
                      {sampleDefenses.length} 防御策略
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    防御视角：构建反证论据与战略加固方案
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isSimulating ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg bg-emerald-500/5 animate-pulse"
                      />
                    ))
                  ) : (
                    sampleDefenses.map((defense) => {
                      const strengthConfig = getStrengthConfig(defense.strength)
                      return (
                        <div
                          key={defense.id}
                          className="rounded-lg border border-emerald-200/60 bg-background p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs font-semibold">
                                {defense.title}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${strengthConfig.color}`}
                            >
                              强度: {strengthConfig.label}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {defense.description}
                          </p>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Verdict Section */}
          {hasResult && (
            <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">对抗裁决</h3>
                      <Badge className="bg-emerald-600 text-white text-[10px] hover:bg-emerald-700">
                        通过
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      该战略假设在红蓝对抗中展现出较强韧性。蓝方防御策略可覆盖
                      3/4 红方攻击向量，但需关注现金流风险与团队执行偏差的叠加效应。
                      建议在执行前完成收入前置模式的验证。
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0 sm:ml-4">
                    <span className="text-2xl font-bold text-emerald-600">76%</span>
                    <span className="text-[10px] text-muted-foreground">
                      综合置信度
                    </span>
                  </div>
                </div>
                {/* Hard constraint indicator */}
                <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-200/60 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px] text-amber-700">
                    置信度低于阈值 → 自动触发人工介入（当前 76% &gt; 阈值
                    60%，无需人工介入）
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Section 3 & 4: Decision Log + Confidence Dashboard ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decision Log */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold">决策日志</h2>
              <Badge variant="secondary" className="text-[10px]">
                {decisionLog.length} 条记录
              </Badge>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {decisionLog.map((entry, index) => {
                    const categoryConfig = getCategoryConfig(entry.category)
                    return (
                      <div key={entry.id}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              entry.confidence > 80
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {entry.title}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 shrink-0 ${categoryConfig.color}`}
                              >
                                {categoryConfig.label}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {entry.timestamp}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-sm font-semibold ${getConfidenceColor(
                                entry.confidence
                              )}`}
                            >
                              {entry.confidence}%
                            </span>
                          </div>
                        </div>
                        {index < decisionLog.length - 1 && <Separator />}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Confidence Dashboard */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold">置信度仪表盘</h2>
            </div>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">系统整体置信度</CardTitle>
                <CardDescription className="text-xs">
                  基于所有认知分身的加权综合评估
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pb-5">
                <ConfidenceGauge value={systemConfidence} threshold={humanThreshold} />
                <Separator className="w-full" />
                {/* Shard breakdown */}
                <div className="w-full space-y-2.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    分身贡献度
                  </span>
                  {initialShards.map((shard) => (
                    <div key={shard.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate mr-2">
                          {shard.name}
                        </span>
                        <span className={`font-medium ${getConfidenceColor(shard.confidence)}`}>
                          {shard.confidence}%
                        </span>
                      </div>
                      <Progress
                        value={shard.confidence}
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
                <Separator className="w-full" />
                {/* Intervention threshold indicator */}
                <div className="w-full rounded-lg border border-amber-200/60 bg-amber-500/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">
                      人工介入阈值
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-600/80 leading-relaxed">
                    当综合置信度低于 {humanThreshold}% 时，系统将自动挂起决策并通知创始人介入审核。
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground">当前状态:</span>
                    <Badge
                      className={`text-[10px] ${
                        systemConfidence > humanThreshold
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {systemConfidence > humanThreshold ? '自动决策中' : '等待人工审核'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
