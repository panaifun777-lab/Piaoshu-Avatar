'use client'

import { useState, useMemo } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
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
  Dna,
  Database,
} from 'lucide-react'
import { useShards, useCreateShard, useRunSimulation, useDecisions, useMemories } from '@/lib/api-hooks'

// ─── Data Types ──────────────────────────────────────────────────────────────

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

// ─── DB Row Types ────────────────────────────────────────────────────────────

interface ShardRow {
  id: string
  name: string
  description: string | null
  modelBase: string
  loraAdapter: string | null
  status: string
  confidence: number
  shardType: string
  lastTrained: string | null
  createdAt: string
  updatedAt: string
}

interface SimulationRow {
  id: string
  shardId: string
  inputIdea: string
  redOutput: string | null
  blueOutput: string | null
  verdict: string | null
  confidence: number
  status: string
  createdAt: string
}

interface DecisionRow {
  id: string
  founderId: string
  title: string
  content: string
  category: string
  outcome: string | null
  confidence: number
  tags: string | null
  createdAt: string
}

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

function getCategoryConfig(category: string) {
  switch (category) {
    case 'strategic':
      return { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', label: '战略' }
    case 'hiring':
      return { color: 'bg-teal-500/10 text-teal-700 border-teal-200', label: '招聘' }
    case 'technical':
      return { color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200', label: '技术' }
    case 'financial':
      return { color: 'bg-amber-500/10 text-amber-700 border-amber-200', label: '财务' }
    case 'product':
      return { color: 'bg-violet-500/10 text-violet-700 border-violet-200', label: '产品' }
    default:
      return { color: 'bg-slate-500/10 text-slate-700 border-slate-200', label: category }
  }
}

function getShardTypeBadge(type: string) {
  switch (type) {
    case 'red':
      return { color: 'bg-red-500/10 text-red-600 border-red-200', label: '红方·攻击' }
    case 'blue':
      return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: '蓝方·防御' }
    case 'neutral':
      return { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: '中立·观察' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: type }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return { color: 'bg-emerald-500/10 text-emerald-700', label: '运行中' }
    case 'training':
      return { color: 'bg-amber-500/10 text-amber-700', label: '训练中' }
    case 'draft':
      return { color: 'bg-slate-500/10 text-slate-600', label: '草稿' }
    case 'error':
      return { color: 'bg-red-500/10 text-red-600', label: '异常' }
    case 'offline':
      return { color: 'bg-slate-500/10 text-slate-600', label: '离线' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600', label: status }
  }
}

function getModelDisplay(modelBase: string): string {
  const map: Record<string, string> = {
    qwen: 'Qwen-72B',
    llama: 'Llama-3-70B',
    qwen14b: 'Qwen-14B',
    'llama-3': 'Llama-3-70B',
    glm: 'GLM-4',
    deepseek: 'DeepSeek-V2',
  }
  return map[modelBase] || modelBase
}

// ─── Parse AI Simulation Output ──────────────────────────────────────────────

function parseRedOutput(raw: string | null): Vulnerability[] {
  if (!raw) return []
  try {
    const json = JSON.parse(raw)
    const vulns = json.vulnerabilities || []
    return vulns.map((v: Record<string, string>, i: number) => {
      const sev = v.severity || '中危'
      let severity: Vulnerability['severity'] = 'medium'
      if (sev === '致命' || sev === 'critical') severity = 'critical'
      else if (sev === '高危' || sev === 'high') severity = 'high'
      return {
        id: `rv-${i}`,
        title: v.impact || v.description?.substring(0, 20) || `漏洞 #${i + 1}`,
        severity,
        description: v.description || '',
      }
    })
  } catch {
    // Not valid JSON, try to extract lines
    const lines = raw.split('\n').filter((l) => l.trim().length > 0)
    return lines.slice(0, 5).map((line, i) => ({
      id: `rv-${i}`,
      title: line.substring(0, 30) || `风险 #${i + 1}`,
      severity: (i === 0 ? 'critical' : i === 1 ? 'high' : 'medium') as Vulnerability['severity'],
      description: line,
    }))
  }
}

function parseBlueOutput(raw: string | null): DefenseStrategy[] {
  if (!raw) return []
  try {
    const json = JSON.parse(raw)
    const defs = json.defenses || []
    return defs.map((d: Record<string, string>, i: number) => {
      const str = d.strength || '中'
      let strength: DefenseStrategy['strength'] = 'moderate'
      if (str === '强' || str === 'strong') strength = 'strong'
      else if (str === '弱' || str === 'weak') strength = 'weak'
      return {
        id: `bd-${i}`,
        title: d.strategy?.substring(0, 30) || d.target_vulnerability || `策略 #${i + 1}`,
        strength,
        description: d.strategy || '',
      }
    })
  } catch {
    const lines = raw.split('\n').filter((l) => l.trim().length > 0)
    return lines.slice(0, 5).map((line, i) => ({
      id: `bd-${i}`,
      title: line.substring(0, 30) || `防御 #${i + 1}`,
      strength: (i === 0 ? 'strong' : 'moderate') as DefenseStrategy['strength'],
      description: line,
    }))
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

function ShardCard({ shard }: { shard: ShardRow }) {
  const typeBadge = getShardTypeBadge(shard.shardType)
  const statusBadge = getStatusBadge(shard.status)
  const confidencePercent = Math.round(shard.confidence * 100)

  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${
          shard.shardType === 'red'
            ? 'bg-red-500'
            : shard.shardType === 'blue'
            ? 'bg-emerald-500'
            : 'bg-slate-400'
        }`}
      />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                shard.shardType === 'red'
                  ? 'bg-red-500/10 text-red-500'
                  : shard.shardType === 'blue'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
              {shard.shardType === 'red' ? (
                <Swords className="h-4 w-4" />
              ) : shard.shardType === 'blue' ? (
                <Shield className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{shard.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {getModelDisplay(shard.modelBase)}
              </CardDescription>
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
            <span className={`font-semibold ${getConfidenceColor(confidencePercent)}`}>
              {confidencePercent}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getConfidenceBg(
                confidencePercent
              )}`}
              style={{ width: `${confidencePercent}%` }}
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
        {shard.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {shard.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ShardCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.5 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-16 rounded-full" />
      </CardContent>
    </Card>
  )
}

function CreateShardCard({ onCreate }: { onCreate: () => void; disabled?: boolean }) {
  return (
    <Card
      className="group flex flex-col items-center justify-center border-dashed border-2 border-border/50 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer min-h-[180px]"
      onClick={onCreate}
    >
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

function DecisionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-10" />
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CognitiveEngineView() {
  const [strategyInput, setStrategyInput] = useState('')
  const [simulationResult, setSimulationResult] = useState<SimulationRow | null>(null)
  const humanThreshold = 60

  // ── Data hooks ──────────────────────────────────────────────────────────
  const { data: shardsData, isLoading: shardsLoading } = useShards()
  const createShardMutation = useCreateShard()
  const runSimulationMutation = useRunSimulation()
  const { data: decisionsData, isLoading: decisionsLoading } = useDecisions()
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories()

  // ── Derived data ────────────────────────────────────────────────────────
  const shards: ShardRow[] = useMemo(
    () => (shardsData?.shards as ShardRow[]) || [],
    [shardsData]
  )

  const decisions: DecisionRow[] = useMemo(
    () => (decisionsData?.decisions as DecisionRow[]) || [],
    [decisionsData]
  )

  const systemConfidence = useMemo(() => {
    if (shards.length === 0) return 0
    const avg = shards.reduce((sum, s) => sum + s.confidence, 0) / shards.length
    return Math.round(avg * 100)
  }, [shards])

  const activeShardCount = useMemo(
    () => shards.filter((s) => s.status === 'active' || s.status === 'training').length,
    [shards]
  )

  // ── Parsed simulation outputs ───────────────────────────────────────────
  const vulnerabilities = useMemo(
    () => parseRedOutput(simulationResult?.redOutput),
    [simulationResult?.redOutput]
  )

  const defenses = useMemo(
    () => parseBlueOutput(simulationResult?.blueOutput),
    [simulationResult?.blueOutput]
  )

  const simConfidencePercent = useMemo(
    () => (simulationResult ? Math.round(simulationResult.confidence * 100) : 0),
    [simulationResult]
  )

  const isEscalated = useMemo(
    () => simulationResult ? simulationResult.confidence < 0.6 : false,
    [simulationResult]
  )

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCreateShard = () => {
    const names = ['战略分析分身', '市场洞察分身', '技术评估分身', '风险预警分身', '产品直觉分身']
    const types = ['red', 'blue', 'neutral'] as const
    const models = ['qwen', 'llama', 'qwen14b'] as const
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomModel = models[Math.floor(Math.random() * models.length)]

    createShardMutation.mutate({
      name: randomName,
      description: `${randomName} - 负责${randomType === 'red' ? '攻击视角的风险识别' : randomType === 'blue' ? '防御视角的策略构建' : '中立的客观观察'}`,
      modelBase: randomModel,
      shardType: randomType,
    })
  }

  const handleStartAdversarial = async () => {
    if (!strategyInput.trim()) return
    setSimulationResult(null)

    try {
      const result = await runSimulationMutation.mutateAsync({
        inputIdea: strategyInput,
      })
      // The API returns { simulation: SimulationRow }
      if (result?.simulation) {
        setSimulationResult(result.simulation as SimulationRow)
      }
    } catch {
      // Error is handled by the mutation state
    }
  }

  const isSimulating = runSimulationMutation.isPending

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
          <div className="flex items-center gap-2 flex-wrap">
            {/* SOUL.md Badge */}
            <Badge
              variant="outline"
              className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-500/5"
            >
              <Dna className="h-3 w-3" />
              🧬 SOUL.md 人格已加载
            </Badge>
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
              {shardsLoading ? '...' : `${activeShardCount} 活跃`}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shardsLoading ? (
              <>
                <ShardCardSkeleton />
                <ShardCardSkeleton />
                <ShardCardSkeleton />
              </>
            ) : (
              shards.map((shard) => (
                <ShardCard key={shard.id} shard={shard} />
              ))
            )}
            <CreateShardCard
              onCreate={handleCreateShard}
              disabled={createShardMutation.isPending}
            />
            {createShardMutation.isPending && <ShardCardSkeleton />}
          </div>
          {createShardMutation.isError && (
            <p className="text-xs text-red-500">
              创建分身失败: {(createShardMutation.error as Error)?.message || '未知错误'}
            </p>
          )}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {isSimulating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      AI分析中...
                    </>
                  ) : (
                    <>
                      <Swords className="h-4 w-4" />
                      启动对抗
                    </>
                  )}
                </Button>
              </div>
              {runSimulationMutation.isError && (
                <p className="text-xs text-red-500">
                  对抗模拟失败: {(runSimulationMutation.error as Error)?.message || '未知错误'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Adversarial output panels */}
          {(isSimulating || simulationResult) && (
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
                    {!isSimulating && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-red-200 text-red-600"
                      >
                        {vulnerabilities.length} 致命漏洞
                      </Badge>
                    )}
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
                  ) : vulnerabilities.length > 0 ? (
                    vulnerabilities.map((vuln) => {
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
                  ) : (
                    <p className="text-xs text-muted-foreground">红方攻击结果解析为空</p>
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
                    {!isSimulating && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-200 text-emerald-600"
                      >
                        {defenses.length} 防御策略
                      </Badge>
                    )}
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
                  ) : defenses.length > 0 ? (
                    defenses.map((defense) => {
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
                  ) : (
                    <p className="text-xs text-muted-foreground">蓝方防御结果解析为空</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Verdict Section */}
          {simulationResult && !isSimulating && (
            <Card className={`border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5 ${isEscalated ? '!border-red-500/40 !from-red-500/5 !via-background !to-red-500/5' : ''}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isEscalated ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">对抗裁决</h3>
                      <Badge className={`text-[10px] ${isEscalated ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {isEscalated ? '需人工介入' : simulationResult.status === 'escalated' ? '已升级' : '通过'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {simulationResult.verdict || '分析完成'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0 sm:ml-4">
                    <span className={`text-2xl font-bold ${isEscalated ? 'text-red-600' : 'text-emerald-600'}`}>
                      {simConfidencePercent}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      综合置信度
                    </span>
                  </div>
                </div>
                {/* Escalation Warning */}
                {isEscalated && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-300/60 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <span className="text-[11px] text-red-700 font-medium">
                      ⚠️ 置信度低于阈值（{simConfidencePercent}% &lt; {humanThreshold}%）→ 自动触发人工介入！需要创始人审核后方可执行。
                    </span>
                  </div>
                )}
                {/* Normal threshold indicator */}
                {!isEscalated && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-200/60 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] text-amber-700">
                      置信度高于阈值 → 无需人工介入（当前 {simConfidencePercent}% &gt; 阈值 {humanThreshold}%）
                    </span>
                  </div>
                )}
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
                {decisionsLoading ? '...' : `${decisions.length} 条记录`}
              </Badge>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {decisionsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i}>
                        <DecisionSkeleton />
                        {i < 4 && <Separator />}
                      </div>
                    ))
                  ) : decisions.length > 0 ? (
                    decisions.map((entry, index) => {
                      const categoryConfig = getCategoryConfig(entry.category)
                      const confidencePercent = Math.round(entry.confidence * 100)
                      return (
                        <div key={entry.id}>
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                confidencePercent > 80
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
                                {new Date(entry.createdAt).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-sm font-semibold ${getConfidenceColor(
                                  confidencePercent
                                )}`}
                              >
                                {confidencePercent}%
                              </span>
                            </div>
                          </div>
                          {index < decisions.length - 1 && <Separator />}
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Clock className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">暂无决策记录</p>
                      <p className="text-xs mt-1">通过红蓝对抗模拟器生成决策</p>
                    </div>
                  )}
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
                  {shardsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1 w-full" />
                      </div>
                    ))
                  ) : shards.length > 0 ? (
                    shards.map((shard) => {
                      const pct = Math.round(shard.confidence * 100)
                      return (
                        <div key={shard.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground truncate mr-2">
                              {shard.name}
                            </span>
                            <span className={`font-medium ${getConfidenceColor(pct)}`}>
                              {pct}%
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            className="h-1"
                          />
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-[11px] text-muted-foreground">暂无分身数据</p>
                  )}
                </div>
                <Separator className="w-full" />
                {/* Memory Continuity Indicator */}
                <div className="w-full space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-muted-foreground">
                      记忆连续性
                    </span>
                  </div>
                  {memoriesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200/60 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">记忆条目</span>
                        <span className="font-semibold">{memoriesData?.total ?? 0} 条</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">最近记忆</span>
                        <span className="font-medium truncate max-w-[120px]">
                          {memoriesData?.memories && memoriesData.memories.length > 0
                            ? String(memoriesData.memories[0].content).substring(0, 20) + '...'
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">记忆连贯性</span>
                        <Badge
                          className={`text-[10px] ${
                            (memoriesData?.continuity ?? 0) > 80
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : (memoriesData?.continuity ?? 0) > 50
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {Math.round(memoriesData?.continuity ?? 0)}%
                        </Badge>
                      </div>
                    </div>
                  )}
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
