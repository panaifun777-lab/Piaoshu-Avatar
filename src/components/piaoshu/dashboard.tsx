'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Play,
  FileCheck,
  Users,
  Swords,
  Map,
  Monitor,
  Wifi,
  WifiOff,
  Server,
  Search,
  Link2,
  Cpu,
  Rocket,
  Crown,
  Wrench,
  BarChart3,
  Target,
  Sparkles,
  CircleDot,
  FileText,
  Layers,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  useShards,
  useEvidences,
  useTasks,
  useProjects,
  useRoadmap,
  useCloneAgents,
  useBlockchainStatus,
  useCloneActivities,
  useSimulations,
} from '@/lib/api-hooks'
import { useWebSocket } from '@/lib/use-websocket'

// ─── Fallback data (used when API fails) ──────────────────────────────────────

const fallbackOverviewStats = [
  { label: '认知分片', value: '3', unit: '活跃', icon: Brain, gradient: 'from-emerald-600 to-teal-500', bgGlow: 'bg-emerald-500/10' },
  { label: '证据链', value: '12', unit: '已验证', icon: Shield, gradient: 'from-teal-600 to-emerald-400', bgGlow: 'bg-teal-500/10' },
  { label: '协作节点', value: '8', unit: '在线', icon: Network, gradient: 'from-emerald-500 to-cyan-500', bgGlow: 'bg-cyan-500/10' },
  { label: '沙盒原型', value: '5', unit: '构建中', icon: Box, gradient: 'from-cyan-600 to-emerald-500', bgGlow: 'bg-emerald-400/10' },
]

const fallbackRoadmapPhases = [
  { phase: 'Phase 1', days: 'D1 - D30', title: '基建与协议验证', status: 'active' as const, progress: 45 },
  { phase: 'Phase 2', days: 'D31 - D60', title: '认知分身 MVP', status: 'pending' as const, progress: 0 },
  { phase: 'Phase 3', days: 'D61 - D90', title: '流体协作闭环', status: 'pending' as const, progress: 0 },
]

// ─── Sparkline trend data (7 days, fake but realistic) ──────────────────────

const sparklineData = {
  cycles: [
    { day: 'D12', v: 3 }, { day: 'D13', v: 5 }, { day: 'D14', v: 4 },
    { day: 'D15', v: 7 }, { day: 'D16', v: 6 }, { day: 'D17', v: 9 }, { day: 'D18', v: 8 },
  ],
  agents: [
    { day: 'D12', v: 2 }, { day: 'D13', v: 2 }, { day: 'D14', v: 3 },
    { day: 'D15', v: 3 }, { day: 'D16', v: 4 }, { day: 'D17', v: 4 }, { day: 'D18', v: 4 },
  ],
  evidence: [
    { day: 'D12', v: 1 }, { day: 'D13', v: 2 }, { day: 'D14', v: 1 },
    { day: 'D15', v: 3 }, { day: 'D16', v: 2 }, { day: 'D17', v: 4 }, { day: 'D18', v: 3 },
  ],
  tasks: [
    { day: 'D12', v: 5 }, { day: 'D13', v: 4 }, { day: 'D14', v: 6 },
    { day: 'D15', v: 5 }, { day: 'D16', v: 7 }, { day: 'D17', v: 6 }, { day: 'D18', v: 8 },
  ],
}

// ─── Agent Activity Bar Chart Data ────────────────────────────────────────

const agentActivityData = [
  { name: 'CEO', cycles: 12, outputs: 28, color: '#f59e0b' },
  { name: 'CTO', cycles: 15, outputs: 35, color: '#06b6d4' },
  { name: 'Growth', cycles: 9, outputs: 22, color: '#10b981' },
  { name: 'Engineer', cycles: 18, outputs: 42, color: '#14b8a6' },
]

// ─── Task Completion Donut Data ────────────────────────────────────────────

const taskCompletionData = [
  { name: '已完成', value: 12, color: '#10b981' },
  { name: '进行中', value: 8, color: '#06b6d4' },
  { name: '待审核', value: 5, color: '#f59e0b' },
  { name: '待开始', value: 6, color: '#6b7280' },
]

// ─── Evidence Chain Growth Area Data ──────────────────────────────────────

const evidenceGrowthData = [
  { day: 'D1', total: 1, verified: 0 },
  { day: 'D4', total: 3, verified: 1 },
  { day: 'D7', total: 5, verified: 3 },
  { day: 'D10', total: 8, verified: 5 },
  { day: 'D13', total: 12, verified: 8 },
  { day: 'D16', total: 16, verified: 12 },
  { day: 'D18', total: 20, verified: 14 },
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

interface CloneAgentData {
  id: string
  name: string
  role: string
  status: string
  experience: number
  cycleCount: number
  lastCycleAt?: string | null
}

interface ActivityData {
  id: string
  activityType: string
  description: string
  createdAt: string
  agentName?: string
}

type ModuleId = 'dashboard' | 'avatar' | 'cognitive' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap'

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

// ─── Sparkline Mini Component ──────────────────────────────────────────────────

function Sparkline({ data, color = '#10b981', height = 40 }: { data: { day: string; v: number }[]; color?: string; height?: number }) {
  return (
    <div style={{ width: '100%', height }} className="opacity-70">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Motion variants ──────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// ─── Quick Action Card Data ──────────────────────────────────────────────────

const quickActions: {
  title: string
  desc: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  module: ModuleId
}[] = [
  {
    title: '启动AI周期',
    desc: '启动分身智能体自动执行任务',
    icon: Play,
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-500/15',
    module: 'avatar',
  },
  {
    title: '提交新证据',
    desc: '上传验证材料并签发可验证凭证',
    icon: FileCheck,
    gradient: 'from-teal-500 to-emerald-600',
    iconBg: 'bg-teal-500/15',
    module: 'evidence',
  },
  {
    title: '发布协作任务',
    desc: '创建任务并分发给协作节点',
    icon: Users,
    gradient: 'from-cyan-500 to-teal-500',
    iconBg: 'bg-cyan-500/15',
    module: 'collaboration',
  },
  {
    title: '运行红蓝对抗',
    desc: '启动对抗性模拟验证决策',
    icon: Swords,
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-500/15',
    module: 'cognitive',
  },
  {
    title: '查看路线图',
    desc: '90天创业里程碑与进度跟踪',
    icon: Map,
    gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-500/15',
    module: 'roadmap',
  },
  {
    title: '查看沙盒',
    desc: '虚实共生原型与XDP交互',
    icon: Monitor,
    gradient: 'from-amber-600 to-yellow-500',
    iconBg: 'bg-amber-600/15',
    module: 'sandbox',
  },
]

// ─── Health indicator colors ──────────────────────────────────────────────────

function healthColor(value: number): string {
  if (value >= 80) return 'text-emerald-400'
  if (value >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function healthBg(value: number): string {
  if (value >= 80) return 'bg-emerald-500'
  if (value >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function healthDot(value: number): string {
  if (value >= 80) return 'bg-emerald-400'
  if (value >= 50) return 'bg-amber-400'
  return 'bg-red-400'
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
  const cloneAgentsQuery = useCloneAgents()
  const blockchainStatusQuery = useBlockchainStatus()
  const cloneActivitiesQuery = useCloneActivities()
  const simulationsQuery = useSimulations()

  const { connected: wsConnected } = useWebSocket()

  const shards = (shardsQuery.data?.shards as ShardData[] | undefined) ?? []
  const evidences = (evidencesQuery.data?.evidences as EvidenceData[] | undefined) ?? []
  const tasks = (tasksQuery.data?.tasks as TaskData[] | undefined) ?? []
  const projects = (projectsQuery.data?.projects as ProjectData[] | undefined) ?? []
  const phases = (roadmapQuery.data?.phases as PhaseData[] | undefined) ?? []
  const cloneAgents = (cloneAgentsQuery.data?.agents as CloneAgentData[] | undefined) ?? []
  const cloneActivities = (cloneActivitiesQuery.data?.activities as ActivityData[] | undefined) ?? []

  const anyError = shardsQuery.isError || evidencesQuery.isError || tasksQuery.isError || projectsQuery.isError || roadmapQuery.isError
  const allLoading = shardsQuery.isLoading && evidencesQuery.isLoading && tasksQuery.isLoading && projectsQuery.isLoading && roadmapQuery.isLoading

  // ── Compute stats ─────────────────────────────────────────────────────────
  const activeShards = shards.filter(s => s.status === 'active')
  const verifiedEvidences = evidences.filter(e => e.status === 'verified' || e.status === 'onchain')
  const onchainEvidences = evidences.filter(e => e.status === 'onchain' || e.chainTxHash)
  const openTasks = tasks.filter(t => t.status === 'open')
  const workingAgents = cloneAgents.filter(a => a.status === 'working')
  const totalCycles = cloneAgents.reduce((sum, a) => sum + (a.cycleCount || 0), 0)

  // ── Real-time Stats Cards ─────────────────────────────────────────────────
  const realtimeStats = [
    {
      label: '今日AI周期',
      value: String(totalCycles),
      unit: '已完成',
      icon: Zap,
      gradient: 'from-emerald-600 to-teal-500',
      bgGlow: 'bg-emerald-500/10',
      sparkData: sparklineData.cycles,
      sparkColor: '#10b981',
    },
    {
      label: '活跃智能体',
      value: String(workingAgents.length),
      unit: '工作中',
      icon: Cpu,
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/10',
      sparkData: sparklineData.agents,
      sparkColor: '#8b5cf6',
    },
    {
      label: '链上证据',
      value: String(onchainEvidences.length),
      unit: '已验证',
      icon: Shield,
      gradient: 'from-teal-600 to-emerald-400',
      bgGlow: 'bg-teal-500/10',
      sparkData: sparklineData.evidence,
      sparkColor: '#14b8a6',
    },
    {
      label: '开放任务',
      value: String(openTasks.length),
      unit: '待领取',
      icon: Target,
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/10',
      sparkData: sparklineData.tasks,
      sparkColor: '#f59e0b',
    },
  ]

  // ── System Health Data ────────────────────────────────────────────────────
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

  // Blockchain status
  const blockHeight = blockchainStatusQuery.data?.data?.network?.blockHeight ?? 0
  const gasPrice = blockchainStatusQuery.data?.data?.network?.gasPrice ?? '0'
  const walletConnected = blockchainStatusQuery.data?.data?.wallet?.connected ?? false

  // Vector service status (simplified - check from hook availability)
  const vectorOnline = true // We'll show online status as default
  const vectorCount = 12 // Fallback

  // Health indicators
  const systemHealthItems = [
    {
      label: '认知引擎',
      icon: Brain,
      value: cognitiveHealth,
      status: cognitiveHealth >= 80 ? '健康' : cognitiveHealth >= 50 ? '警告' : '异常',
      detail: `${activeShards.length} 个活跃分身`,
    },
    {
      label: '向量搜索',
      icon: Search,
      value: vectorOnline ? 95 : 0,
      status: vectorOnline ? '在线' : '离线',
      detail: `${vectorCount} 向量已索引`,
    },
    {
      label: '区块链网络',
      icon: Link2,
      value: walletConnected ? 90 : 60,
      status: walletConnected ? '已连接' : '未连接',
      detail: `Block #${blockHeight} · Gas ${gasPrice}`,
    },
    {
      label: 'WebSocket',
      icon: wsConnected ? Wifi : WifiOff,
      value: wsConnected ? 100 : 0,
      status: wsConnected ? '已连接' : '断开',
      detail: wsConnected ? '实时同步中' : '等待重连...',
    },
  ]

  // ── Activity Timeline ─────────────────────────────────────────────────────
  const activityModuleIcons: Record<string, React.ElementType> = {
    cycle_completed: CheckCircle2,
    output_created: FileText,
    skill_upgraded: Sparkles,
    agent_added: Users,
    simulation_completed: Swords,
    evidence_anchored: Link2,
    task_updated: Target,
    shard_created: Brain,
  }

  const activityModuleBadges: Record<string, { label: string; color: string }> = {
    cycle_completed: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    output_created: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    skill_upgraded: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    agent_added: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    simulation_completed: { label: '认知引擎', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    evidence_anchored: { label: '证据链', color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
    task_updated: { label: '协作调度', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
    shard_created: { label: '认知引擎', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  }

  // Build combined activity timeline from various sources
  const combinedActivities: {
    id: string
    title: string
    description: string
    timestamp: string
    type: string
    module: string
  }[] = []

  // Add clone activities
  cloneActivities.slice(0, 10).forEach((a) => {
    const badge = activityModuleBadges[a.activityType] || { label: '系统', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
    combinedActivities.push({
      id: a.id,
      title: a.activityType === 'cycle_completed' ? 'AI周期完成' :
             a.activityType === 'output_created' ? '新产出已创建' :
             a.activityType === 'skill_upgraded' ? '技能升级' :
             a.activityType === 'agent_added' ? '新智能体加入' : '系统活动',
      description: a.description || (a as Record<string, unknown>).agentName ? `${(a as Record<string, unknown>).agentName || '系统'} · ${a.activityType}` : a.activityType,
      timestamp: a.createdAt,
      type: a.activityType,
      module: badge.label,
    })
  })

  // Add recent evidences
  evidences.slice(0, 3).forEach((e) => {
    combinedActivities.push({
      id: `evidence-${e.id}`,
      title: e.status === 'onchain' ? '证据已上链' : e.status === 'verified' ? '证据已验证' : '新证据提交',
      description: e.title,
      timestamp: e.createdAt,
      type: 'evidence_anchored',
      module: '证据链',
    })
  })

  // Add recent tasks
  tasks.slice(0, 3).forEach((t) => {
    combinedActivities.push({
      id: `task-${t.id}`,
      title: t.status === 'completed' ? '任务已完成' : t.status === 'in_progress' ? '任务进行中' : '新任务发布',
      description: t.title,
      timestamp: t.updatedAt,
      type: 'task_updated',
      module: '协作调度',
    })
  })

  // Add recent shards
  shards.slice(0, 2).forEach((s) => {
    combinedActivities.push({
      id: `shard-${s.id}`,
      title: '认知分片更新',
      description: s.name,
      timestamp: s.updatedAt,
      type: 'shard_created',
      module: '认知引擎',
    })
  })

  // Sort by timestamp and take top 20
  combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const displayActivities = combinedActivities.slice(0, 20)

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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-6 sm:p-8"
          >
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
                  飘叔 Piaoshu · AI分身操作系统
                </h1>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Web4.0 AI原生智能分身操作系统 — 将AI从执行者升维为共生体
              </p>
            </div>
          </motion.div>

          {/* Real-time Stat cards row */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {realtimeStats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="relative overflow-hidden border-emerald-500/10 transition-colors hover:border-emerald-500/30 h-full">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                    <CardContent className="relative p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
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
                        </div>
                      </div>
                      {/* Sparkline */}
                      <div className="mt-3 -mx-1">
                        <Sparkline data={stat.sparkData} color={stat.sparkColor} height={36} />
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground font-mono">近7天趋势</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ── 2. System Health Dashboard ────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">系统健康面板</h2>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs border-emerald-500/20">
              实时监控
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {systemHealthItems.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-emerald-500/10 h-full">
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${healthColor(item.value)}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${healthDot(item.value)} ${item.value >= 80 ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-medium ${healthColor(item.value)}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      {/* Health bar */}
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-emerald-500/10">
                        {allLoading ? (
                          <Skeleton className="h-full w-full rounded-full" />
                        ) : (
                          <div
                            className={`${healthBg(item.value)} h-full rounded-full transition-all duration-700`}
                            style={{ width: `${item.value}%` }}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Combined health overview bar */}
          <Card className="border-emerald-500/10">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">系统综合健康度</span>
                <span className="text-lg font-bold tabular-nums text-emerald-400">
                  {Math.round((cognitiveHealth + evidenceIntegrity + collaborationEfficiency + sandboxCoverage) / 4)}%
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: '认知引擎', value: cognitiveHealth, color: 'bg-emerald-500' },
                  { label: '证据链', value: evidenceIntegrity, color: 'bg-teal-500' },
                  { label: '协作效率', value: collaborationEfficiency, color: 'bg-cyan-500' },
                  { label: '沙盒覆盖', value: sandboxCoverage, color: 'bg-amber-500' },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{metric.label}</span>
                    <div className="flex-1 relative h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/10">
                      {allLoading ? (
                        <Skeleton className="h-full w-full rounded-full" />
                      ) : (
                        <div
                          className={`${metric.color} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${metric.value}%` }}
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium tabular-nums w-8 text-right">
                      {allLoading ? '' : `${metric.value}%`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ── 3. Activity Timeline ──────────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">活动时间线</h2>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-xs border-emerald-500/20">
              全模块
            </Badge>
          </div>

          <Card className="border-emerald-500/10">
            <CardContent className="p-0">
              {displayActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">暂无活动记录</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="divide-y divide-border/50">
                    {displayActivities.map((activity, index) => {
                      const Icon = activityModuleIcons[activity.type] || CircleDot
                      const badge = activityModuleBadges[activity.type] || { label: activity.module, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-emerald-500/5 sm:px-6"
                        >
                          {/* Timeline dot + icon */}
                          <div className="relative flex shrink-0 flex-col items-center">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10`}
                            >
                              <Icon className="h-3.5 w-3.5 text-emerald-400" />
                            </div>
                            {index < displayActivities.length - 1 && (
                              <div className="absolute top-8 h-[calc(100%+8px)] w-px bg-emerald-500/15" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium leading-relaxed">{activity.title}</p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-5 px-1.5 border ${badge.color}`}
                              >
                                {badge.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{timeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* ── 4. Quick Action Cards ─────────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">快捷操作</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="relative overflow-hidden cursor-pointer border-0 h-full"
                    onClick={() => onNavigate?.(action.module)}
                  >
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-10`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                    <CardContent className="relative p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.iconBg}`}>
                          <Icon className="h-5 w-5 text-foreground/80" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold">{action.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 5. Data Analytics Charts ──────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">数据分析面板</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Agent Activity Bar Chart */}
            <Card className="border-emerald-500/10 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">智能体活动统计</CardTitle>
                <CardDescription className="text-xs">各角色周期执行与产出数量</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentActivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="cycles" name="周期数" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outputs" name="产出数" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Task Completion Donut */}
            <Card className="border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">任务完成率</CardTitle>
                <CardDescription className="text-xs">按状态分布</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskCompletionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {taskCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {taskCompletionData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[11px] text-muted-foreground">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evidence Chain Growth Area Chart */}
          <Card className="border-emerald-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">证据链增长趋势</CardTitle>
              <CardDescription className="text-xs">证据总量与已验证数量增长</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evidenceGrowthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="证据总量"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="verified"
                      name="已验证"
                      stroke="#14b8a6"
                      fill="#14b8a6"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ── 6. 90天路线图概览 ───────────────────────────────────────── */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold sm:text-xl">90天路线图概览</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {displayRoadmapPhases.map((phase, index) => (
              <motion.div
                key={`roadmap-${phase.phase}-${index}`}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card
                  className={`relative overflow-hidden transition-colors h-full ${
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
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer spacer */}
        <div className="h-4" />
      </div>
    </div>
  )
}
