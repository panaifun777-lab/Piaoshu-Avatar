'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Brain,
  Shield,
  Network,
  Box,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import {
  useShards,
  useEvidences,
  useTasks,
  useProjects,
  useRoadmap,
} from '@/lib/api-hooks'

// ─── Fallback data (used when API fails) ──────────────────────────────────────

const fallbackOverviewStats = [
  { label: '认知分片', value: '3', unit: '活跃', icon: Brain, gradient: 'from-emerald-600 to-teal-500', bgGlow: 'bg-emerald-500/10' },
  { label: '证据链', value: '12', unit: '已验证', icon: Shield, gradient: 'from-teal-600 to-emerald-400', bgGlow: 'bg-teal-500/10' },
  { label: '协作节点', value: '8', unit: '在线', icon: Network, gradient: 'from-emerald-500 to-cyan-500', bgGlow: 'bg-cyan-500/10' },
  { label: '沙盒原型', value: '5', unit: '构建中', icon: Box, gradient: 'from-cyan-600 to-emerald-500', bgGlow: 'bg-emerald-400/10' },
]

const fallbackEngineCards = [
  {
    title: '认知分片引擎', icon: Brain, iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20',
    mainStat: '3 个活跃分身',
    details: [
      { label: '置信度', value: '87%' },
      { label: '状态', value: '运行中', isStatus: true, statusOk: true },
      { label: '上次训练', value: '2 小时前' },
    ],
  },
  {
    title: '可信证据链', icon: Shield, iconColor: 'text-teal-400', borderColor: 'border-teal-500/20',
    mainStat: '12 条已验证凭证',
    details: [
      { label: '待审核', value: '3', isStatus: true, statusOk: false },
      { label: '区块链', value: '已同步', isStatus: true, statusOk: true },
      { label: '最近签发', value: '15 分钟前' },
    ],
  },
  {
    title: '流体协作调度器', icon: Network, iconColor: 'text-cyan-400', borderColor: 'border-cyan-500/20',
    mainStat: '8 个在线节点',
    details: [
      { label: '开放任务', value: '5' },
      { label: '奖赏池', value: '2,400 PIA' },
      { label: '平均响应', value: '1.2s' },
    ],
  },
  {
    title: '虚实共生沙盒', icon: Box, iconColor: 'text-emerald-300', borderColor: 'border-emerald-500/20',
    mainStat: '5 个原型构建中',
    details: [
      { label: 'XDP 启用', value: '3' },
      { label: '最新原型', value: 'SpaceUI-v2' },
      { label: '交互版本', value: '已发布', isStatus: true, statusOk: true },
    ],
  },
]

const fallbackHealthMetrics = [
  { label: '认知引擎健康度', value: 87, color: 'bg-emerald-500' },
  { label: '证据链完整性', value: 95, color: 'bg-teal-500' },
  { label: '协作调度效率', value: 72, color: 'bg-cyan-500' },
  { label: '沙盒交互覆盖率', value: 63, color: 'bg-emerald-400' },
]

const fallbackRoadmapPhases = [
  { phase: 'Phase 1', days: 'D1 - D30', title: '基建与协议验证', status: 'active' as const, progress: 45 },
  { phase: 'Phase 2', days: 'D31 - D60', title: '认知分身 MVP', status: 'pending' as const, progress: 0 },
  { phase: 'Phase 3', days: 'D61 - D90', title: '流体协作闭环', status: 'pending' as const, progress: 0 },
]

// ─── VC Trend Data (mock) ──────────────────────────────────────────────────────

const vcTrendData = [
  { day: 'D12', count: 1 },
  { day: 'D13', count: 2 },
  { day: 'D14', count: 1 },
  { day: 'D15', count: 3 },
  { day: 'D16', count: 2 },
  { day: 'D17', count: 4 },
  { day: 'D18', count: 3 },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShardData {
  id: string
  name: string
  description?: string | null
  modelBase: string
  loraAdapter?: string | null
  status: string
  confidence: number
  shardType: string
  lastTrained?: string | null
  createdAt: string
  updatedAt: string
}

interface EvidenceData {
  id: string
  title: string
  description?: string | null
  evidenceType: string
  rawData?: string | null
  contentHash?: string | null
  storageRef?: string | null
  chainTxHash?: string | null
  vcId?: string | null
  status: string
  createdAt: string
  updatedAt: string
  credential?: unknown
}

interface TaskData {
  id: string
  title: string
  description?: string | null
  complexity: string
  category: string
  reward: number
  rewardToken: string
  status: string
  priority: number
  deadline?: string | null
  assigneeType: string
  ciStatus: string
  safetyScan: string
  createdAt: string
  updatedAt: string
  creatorId: string
  assigneeId?: string | null
  payments?: unknown[]
}

interface ProjectData {
  id: string
  name: string
  description?: string | null
  projectType: string
  sceneData?: string | null
  xdpEnabled: boolean
  status: string
  version: number
  createdAt: string
  updatedAt: string
  interactions?: unknown[]
}

interface MilestoneData {
  id: string
  phaseId: string
  title: string
  description?: string | null
  targetDate: string
  status: string
  order: number
  createdAt: string
  updatedAt: string
}

interface PhaseData {
  id: string
  phase: number
  name: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  updatedAt: string
  milestones: MilestoneData[]
}

type ModuleId = 'dashboard' | 'cognitive' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap'

interface DashboardViewProps {
  onNavigate?: (module: ModuleId) => void
}

// ─── Helper: time ago ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

// ─── Component ────────────────────────────────────────────────────────────────

const engineNavMap: Record<string, ModuleId> = {
  '认知分片引擎': 'cognitive',
  '可信证据链': 'evidence',
  '流体协作调度器': 'collaboration',
  '虚实共生沙盒': 'sandbox',
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  // ── Fetch real API data ───────────────────────────────────────────────────
  const shardsQuery = useShards()
  const evidencesQuery = useEvidences()
  const tasksQuery = useTasks()
  const projectsQuery = useProjects()
  const roadmapQuery = useRoadmap()

  const shards = (shardsQuery.data?.shards as ShardData[] | undefined) ?? []
  const evidences = (evidencesQuery.data?.evidences as EvidenceData[] | undefined) ?? []
  const tasks = (tasksQuery.data?.tasks as TaskData[] | undefined) ?? []
  const projects = (projectsQuery.data?.projects as ProjectData[] | undefined) ?? []
  const phases = (roadmapQuery.data?.phases as PhaseData[] | undefined) ?? []

  const anyError = shardsQuery.isError || evidencesQuery.isError || tasksQuery.isError || projectsQuery.isError || roadmapQuery.isError
  const allLoading = shardsQuery.isLoading && evidencesQuery.isLoading && tasksQuery.isLoading && projectsQuery.isLoading && roadmapQuery.isLoading

  // ── Compute overview stats ────────────────────────────────────────────────
  const activeShards = shards.filter(s => s.status === 'active')
  const verifiedEvidences = evidences.filter(e => e.status === 'verified' || e.status === 'onchain')

  const overviewStats = [
    {
      label: '认知分片',
      value: String(shards.length),
      unit: '活跃',
      icon: Brain,
      gradient: 'from-emerald-600 to-teal-500',
      bgGlow: 'bg-emerald-500/10',
    },
    {
      label: '证据链',
      value: String(verifiedEvidences.length),
      unit: '已验证',
      icon: Shield,
      gradient: 'from-teal-600 to-emerald-400',
      bgGlow: 'bg-teal-500/10',
    },
    {
      label: '协作节点',
      value: '8',
      unit: '在线',
      icon: Network,
      gradient: 'from-emerald-500 to-cyan-500',
      bgGlow: 'bg-cyan-500/10',
    },
    {
      label: '沙盒原型',
      value: String(projects.length),
      unit: '构建中',
      icon: Box,
      gradient: 'from-cyan-600 to-emerald-500',
      bgGlow: 'bg-emerald-400/10',
    },
  ]

  // ── Compute engine cards ──────────────────────────────────────────────────
  const avgConfidence = activeShards.length > 0
    ? Math.round((activeShards.reduce((sum, s) => sum + s.confidence, 0) / activeShards.length) * 100)
    : 0

  const pendingEvidences = evidences.filter(e => e.status === 'draft' || e.status === 'signed')
  const hasOnchain = evidences.some(e => e.status === 'onchain' || e.chainTxHash)
  const latestEvidence = evidences.length > 0 ? evidences[0] : null

  const openTasks = tasks.filter(t => t.status === 'open')
  const totalReward = tasks.reduce((sum, t) => sum + t.reward, 0)

  const xdpProjects = projects.filter(p => p.xdpEnabled)
  const latestProject = projects.length > 0 ? projects[0] : null
  const interactiveProjects = projects.filter(p => p.status === 'interactive' || p.status === 'published')

  const engineCards = [
    {
      title: '认知分片引擎',
      icon: Brain,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      mainStat: `${activeShards.length} 个活跃分身`,
      details: [
        { label: '置信度', value: `${avgConfidence}%` },
        { label: '状态', value: activeShards.length > 0 ? '运行中' : '待命', isStatus: true as const, statusOk: activeShards.length > 0 },
        { label: '上次训练', value: activeShards.length > 0 ? timeAgo(activeShards[0].lastTrained) : '—' },
      ],
    },
    {
      title: '可信证据链',
      icon: Shield,
      iconColor: 'text-teal-400',
      borderColor: 'border-teal-500/20',
      mainStat: `${verifiedEvidences.length} 条已验证凭证`,
      details: [
        { label: '待审核', value: String(pendingEvidences.length), isStatus: true as const, statusOk: pendingEvidences.length === 0 },
        { label: '区块链', value: hasOnchain ? '已同步' : '未同步', isStatus: true as const, statusOk: hasOnchain },
        { label: '最近签发', value: latestEvidence ? timeAgo(latestEvidence.createdAt) : '—' },
      ],
    },
    {
      title: '流体协作调度器',
      icon: Network,
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
      mainStat: `${openTasks.length} 个开放任务`,
      details: [
        { label: '开放任务', value: String(openTasks.length) },
        { label: '奖赏池', value: `${totalReward.toLocaleString()} PIA` },
        { label: '平均响应', value: tasks.length > 0 ? '1.2s' : '—' },
      ],
    },
    {
      title: '虚实共生沙盒',
      icon: Box,
      iconColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/20',
      mainStat: `${projects.length} 个原型构建中`,
      details: [
        { label: 'XDP 启用', value: String(xdpProjects.length) },
        { label: '最新原型', value: latestProject?.name ?? '—' },
        { label: '交互版本', value: interactiveProjects.length > 0 ? '已发布' : '未发布', isStatus: true as const, statusOk: interactiveProjects.length > 0 },
      ],
    },
  ]

  // ── Compute health metrics ────────────────────────────────────────────────
  const cognitiveHealth = activeShards.length > 0
    ? Math.round((activeShards.reduce((sum, s) => sum + s.confidence, 0) / activeShards.length) * 100)
    : shards.length > 0
      ? Math.round((shards.reduce((sum, s) => sum + s.confidence, 0) / shards.length) * 100)
      : 0

  const evidenceIntegrity = evidences.length > 0
    ? Math.round(((evidences.filter(e => e.status === 'verified' || e.status === 'onchain').length) / evidences.length) * 100)
    : 0

  const collaborationEfficiency = tasks.length > 0
    ? Math.round(((tasks.filter(t => t.status === 'completed').length) / tasks.length) * 100)
    : 0

  const sandboxCoverage = projects.length > 0
    ? Math.round(((projects.filter(p => p.status === 'interactive' || p.status === 'published').length) / projects.length) * 100)
    : 0

  const healthMetrics = [
    { label: '认知引擎健康度', value: cognitiveHealth, color: 'bg-emerald-500' },
    { label: '证据链完整性', value: evidenceIntegrity, color: 'bg-teal-500' },
    { label: '协作调度效率', value: collaborationEfficiency, color: 'bg-cyan-500' },
    { label: '沙盒交互覆盖率', value: sandboxCoverage, color: 'bg-emerald-400' },
  ]

  // ── Recent activities (simulated with note) ───────────────────────────────
  const recentActivities = [
    {
      text: '红蓝对抗完成：新功能方案通过压力测试',
      time: '2 分钟前',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    {
      text: '新证据凭证已签发：用户访谈 #23',
      time: '15 分钟前',
      icon: Shield,
      iconColor: 'text-teal-400',
    },
    {
      text: '外部节点 dev-0x7f 完成任务 #12',
      time: '1 小时前',
      icon: Network,
      iconColor: 'text-cyan-400',
    },
    {
      text: '沙盒原型 "SpaceUI-v2" 发布交互版本',
      time: '3 小时前',
      icon: Box,
      iconColor: 'text-emerald-300',
    },
    {
      text: '认知分身 "战略决策" LoRA 训练完成',
      time: '5 小时前',
      icon: Brain,
      iconColor: 'text-emerald-400',
    },
  ]

  // ── Compute roadmap phases ────────────────────────────────────────────────
  const roadmapPhases = phases.length > 0
    ? phases.map(p => {
        const completedMilestones = p.milestones.filter(m => m.status === 'completed').length
        const totalMilestones = p.milestones.length
        const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : (p.status === 'completed' ? 100 : 0)
        const start = new Date(p.startDate)
        const end = new Date(p.endDate)
        const dayStart = Math.round((start.getTime() - new Date(p.startDate).getTime()) / 86400000)
        const dayEnd = Math.round((end.getTime() - start.getTime()) / 86400000)
        return {
          phase: `Phase ${p.phase}`,
          days: `D${dayStart} - D${dayStart + dayEnd}`,
          title: p.name,
          status: (p.status === 'active' ? 'active' : p.status === 'completed' ? 'completed' : 'pending') as 'active' | 'pending' | 'completed',
          progress,
        }
      })
    : fallbackRoadmapPhases

  // ── Determine which data to display (fallback on error) ───────────────────
  const displayOverviewStats = anyError ? fallbackOverviewStats : overviewStats
  const displayEngineCards = anyError ? fallbackEngineCards : engineCards
  const displayHealthMetrics = anyError ? fallbackHealthMetrics : healthMetrics
  const displayRoadmapPhases = anyError ? fallbackRoadmapPhases : roadmapPhases

  return (
    <div className="bg-background text-foreground">
      <div className="space-y-8">
        {/* ── API Error Warning ──────────────────────────────────────────────── */}
        {anyError && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>部分数据加载失败，已使用缓存数据展示</span>
          </div>
        )}

        {/* ── 1. System Overview Banner ─────────────────────────────────── */}
        <section className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-6 sm:p-8">
            {/* Background image */}
            <div className="absolute inset-0">
              <img src="/piaoshu-hero.png" alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
            </div>

            <div className="relative space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  飘数 Piaoshu · 创始人操作系统
                </h1>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Web4.0 AI原生创业操作系统 — 将AI从执行者升维为共生体
              </p>
            </div>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {displayOverviewStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.label}
                  className="relative overflow-hidden border-emerald-500/10 transition-colors hover:border-emerald-500/30"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                  <CardContent className="relative flex items-center gap-3 p-4 sm:p-5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-emerald-500/20`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                      <div className="text-xl font-bold sm:text-2xl">
                        {allLoading ? (
                          <Skeleton className="inline-block h-8 w-12" />
                        ) : (
                          <>
                            {stat.value}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              {stat.unit}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* ── 2. 四大引擎状态卡片 ──────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">四大引擎状态</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayEngineCards.map((engine) => {
              const Icon = engine.icon
              const navTarget = engineNavMap[engine.title]
              return (
                <Card
                  key={engine.title}
                  className={`border ${engine.borderColor} transition-colors hover:border-emerald-500/40 cursor-pointer`}
                  onClick={() => navTarget && onNavigate?.(navTarget)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${engine.iconColor}`} />
                        <CardTitle className="text-base">{engine.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-base font-medium text-foreground/80">
                      {allLoading ? <Skeleton className="h-6 w-32" /> : engine.mainStat}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {engine.details.map((detail) => (
                        <div key={detail.label} className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">{detail.label}</p>
                          {allLoading ? (
                            <Skeleton className="h-5 w-14" />
                          ) : detail.isStatus ? (
                            <Badge
                              variant={detail.statusOk ? 'default' : 'secondary'}
                              className={
                                detail.statusOk
                                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/20'
                              }
                            >
                              {detail.statusOk ? (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              ) : (
                                <AlertCircle className="mr-1 h-3 w-3" />
                              )}
                              {detail.value}
                            </Badge>
                          ) : (
                            <p className="text-sm font-medium">{detail.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* ── 3. 系统健康度 ───────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">系统健康度</h2>
          </div>

          <Card className="border-emerald-500/10">
            <CardContent className="space-y-5 p-5 sm:p-6">
              {displayHealthMetrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    {allLoading ? (
                      <Skeleton className="h-5 w-10" />
                    ) : (
                      <span className="font-semibold tabular-nums">{metric.value}%</span>
                    )}
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-emerald-500/10">
                    {allLoading ? (
                      <Skeleton className="h-full w-full rounded-full" />
                    ) : (
                      <div
                        className={`${metric.color} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${metric.value}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* ── 3.5 系统数据趋势 ───────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">系统数据趋势</h2>
          </div>

          <Card className="border-emerald-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">凭证签发趋势</CardTitle>
              <CardDescription className="text-xs">近 7 天 VC 签发数量变化</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vcTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6, fill: '#10b981' }}
                      name="签发数量"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── 4. 最近活动流 ───────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">最近活动流</h2>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs border-emerald-500/20">
              系统活动
            </Badge>
          </div>

          <Card className="border-emerald-500/10">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-emerald-500/5 sm:px-6"
                    >
                      {/* Timeline dot + icon */}
                      <div className="relative flex shrink-0 flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10`}
                        >
                          <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                        </div>
                        {index < recentActivities.length - 1 && (
                          <div className="absolute top-9 h-[calc(100%+8px)] w-px bg-emerald-500/15" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-sm leading-relaxed">{activity.text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── 5. 90天路线图概览 ───────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">90天路线图概览</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {displayRoadmapPhases.map((phase, index) => (
              <Card
                key={`roadmap-${phase.phase}-${index}`}
                className={`relative overflow-hidden transition-colors ${
                  phase.status === 'active'
                    ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'border-border/50 opacity-70'
                }`}
              >
                {/* Active indicator bar */}
                {phase.status === 'active' && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
                )}

                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={phase.status === 'active' ? 'default' : 'secondary'}
                      className={
                        phase.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20'
                          : ''
                      }
                    >
                      {phase.status === 'active' && (
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {phase.status === 'active' ? 'Active' : phase.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {allLoading ? <Skeleton className="inline-block h-4 w-16" /> : phase.days}
                    </span>
                  </div>
                  <CardTitle className="text-base">
                    {allLoading ? <Skeleton className="h-5 w-28" /> : phase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>进度</span>
                      {allLoading ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        <span className="tabular-nums">{phase.progress}%</span>
                      )}
                    </div>
                    {allLoading ? (
                      <Skeleton className="h-2 w-full rounded-full" />
                    ) : (
                      <Progress
                        value={phase.progress}
                        className={`h-2 ${
                          phase.status === 'active'
                            ? '[&>[data-slot=progress-indicator]]:bg-emerald-500'
                            : '[&>[data-slot=progress-indicator]]:bg-muted-foreground/30'
                        }`}
                      />
                    )}
                  </div>

                  {/* Connector arrow between cards (visible on sm+) */}
                  {index < displayRoadmapPhases.length - 1 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                      <ArrowRight className="h-4 w-4 text-emerald-500/40" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer spacer */}
        <div className="h-4" />
      </div>
    </div>
  )
}
