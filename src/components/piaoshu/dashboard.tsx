'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  Shield,
  Network,
  Activity,
  CheckCircle2,
  Zap,
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
  Search,
  Link2,
  Cpu,
  Rocket,
  Crown,
  Wrench,
  Target,
  Sparkles,
  CircleDot,
  FileText,
  Flame,
  UserCircle2,
  Clock,
  Radio,
  Server,
  Database,
  Terminal,
  Hexagon,
  BarChart3,
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
import { motion, AnimatePresence } from 'framer-motion'
import {
  useShards,
  useEvidences,
  useTasks,
  useProjects,
  useRoadmap,
  useCloneAgents,
  useBlockchainStatus,
  useCloneActivities,
} from '@/lib/api-hooks'
import { useWebSocket } from '@/lib/use-websocket'

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

// ─── Fallback data ────────────────────────────────────────────────────────────

const fallbackRoadmapPhases = [
  { phase: 'Phase 1', days: 'D1 - D30', title: '基建与协议验证', status: 'active' as const, progress: 45 },
  { phase: 'Phase 2', days: 'D31 - D60', title: '认知分身 MVP', status: 'pending' as const, progress: 0 },
  { phase: 'Phase 3', days: 'D61 - D90', title: '流体协作闭环', status: 'pending' as const, progress: 0 },
]

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

const agentActivityData = [
  { name: 'CEO', cycles: 12, outputs: 28, color: '#f59e0b' },
  { name: 'CTO', cycles: 15, outputs: 35, color: '#06b6d4' },
  { name: 'Growth', cycles: 9, outputs: 22, color: '#10b981' },
  { name: 'Engineer', cycles: 18, outputs: 42, color: '#14b8a6' },
]

const taskCompletionData = [
  { name: '已完成', value: 12, color: '#10b981' },
  { name: '进行中', value: 8, color: '#06b6d4' },
  { name: '待审核', value: 5, color: '#f59e0b' },
  { name: '待开始', value: 6, color: '#6b7280' },
]

const evidenceGrowthData = [
  { day: 'D1', total: 1, verified: 0 },
  { day: 'D4', total: 3, verified: 1 },
  { day: 'D7', total: 5, verified: 3 },
  { day: 'D10', total: 8, verified: 5 },
  { day: 'D13', total: 12, verified: 8 },
  { day: 'D16', total: 16, verified: 12 },
  { day: 'D18', total: 20, verified: 14 },
]

// ─── Agent card config for Avatar Live Square ─────────────────────────────────

const AGENT_CONFIG: Record<string, {
  icon: React.ElementType
  accentColor: string
  accentBg: string
  accentBorder: string
  glowColor: string
  pulseColor: string
  gradientFrom: string
  gradientTo: string
}> = {
  CEO: {
    icon: Crown,
    accentColor: 'text-amber-400',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
    pulseColor: 'bg-amber-400',
    gradientFrom: 'from-amber-500/10',
    gradientTo: 'to-amber-500/5',
  },
  CTO: {
    icon: Cpu,
    accentColor: 'text-cyan-400',
    accentBg: 'bg-cyan-500/15',
    accentBorder: 'border-cyan-500/30',
    glowColor: 'shadow-cyan-500/20',
    pulseColor: 'bg-cyan-400',
    gradientFrom: 'from-cyan-500/10',
    gradientTo: 'to-cyan-500/5',
  },
  Growth: {
    icon: Rocket,
    accentColor: 'text-emerald-400',
    accentBg: 'bg-emerald-500/15',
    accentBorder: 'border-emerald-500/30',
    glowColor: 'shadow-emerald-500/20',
    pulseColor: 'bg-emerald-400',
    gradientFrom: 'from-emerald-500/10',
    gradientTo: 'to-emerald-500/5',
  },
  Engineer: {
    icon: Wrench,
    accentColor: 'text-teal-400',
    accentBg: 'bg-teal-500/15',
    accentBorder: 'border-teal-500/30',
    glowColor: 'shadow-teal-500/20',
    pulseColor: 'bg-teal-400',
    gradientFrom: 'from-teal-500/10',
    gradientTo: 'to-teal-500/5',
  },
}

const DEFAULT_AGENT_CONFIG = {
  icon: UserCircle2,
  accentColor: 'text-violet-400',
  accentBg: 'bg-violet-500/15',
  accentBorder: 'border-violet-500/30',
  glowColor: 'shadow-violet-500/20',
  pulseColor: 'bg-violet-400',
  gradientFrom: 'from-violet-500/10',
  gradientTo: 'to-violet-500/5',
}

// Simulated "other users' avatars" for the multi-avatar ecosystem feel
const SIMULATED_AVATARS = [
  { id: 'sim-1', name: '张伟的AI分身', role: 'CEO', status: 'working', task: '市场分析报告生成中', progress: 72, cycleCount: 8 },
  { id: 'sim-2', name: '李明的AI分身', role: 'Engineer', status: 'idle', task: '等待任务分配', progress: 100, cycleCount: 15 },
  { id: 'sim-3', name: '王芳的AI分身', role: 'Growth', status: 'working', task: '用户增长策略优化', progress: 45, cycleCount: 6 },
  { id: 'sim-4', name: '赵磊的AI分身', role: 'CTO', status: 'sleeping', task: '休眠中', progress: 0, cycleCount: 22 },
]

// Ticker items for live activity ticker
const TICKER_ITEMS = [
  { id: 't1', text: 'CEO分身 完成了Q2战略分析', time: '刚刚', color: 'text-amber-400' },
  { id: 't2', text: 'CTO分身 代码审查3个PR', time: '2分钟前', color: 'text-cyan-400' },
  { id: 't3', text: '张伟的分身 市场报告已生成', time: '5分钟前', color: 'text-amber-400' },
  { id: 't4', text: 'Growth分身 用户增长12%', time: '8分钟前', color: 'text-emerald-400' },
  { id: 't5', text: 'Engineer分身 CI/CD优化完成', time: '12分钟前', color: 'text-teal-400' },
  { id: 't6', text: '王芳的分身 增长策略更新', time: '15分钟前', color: 'text-emerald-400' },
  { id: 't7', text: '证据 #E-012 已上链确认', time: '20分钟前', color: 'text-teal-400' },
  { id: 't8', text: '协作任务 T-008 已完成', time: '25分钟前', color: 'text-cyan-400' },
]

// ─── Helper: time ago ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// ─── Sparkline Mini Component ──────────────────────────────────────────────────

function Sparkline({ data, color = '#10b981', height = 40 }: { data: { day: string; v: number }[]; color?: string; height?: number }) {
  return (
    <div style={{ width: '100%', height }} className="opacity-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Pulsing Live Dot ─────────────────────────────────────────────────────────

function LiveDot({ color = 'bg-emerald-400', size = 'h-2 w-2' }: { color?: string; size?: string }) {
  return (
    <span className="relative flex items-center justify-center">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex rounded-full ${size} ${color}`} />
    </span>
  )
}

// ─── Motion variants ──────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Quick Action Card Data ──────────────────────────────────────────────────

const quickActions: {
  title: string
  desc: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  module: ModuleId
}[] = [
  { title: '启动AI周期', desc: '启动分身智能体', icon: Play, iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', module: 'avatar' },
  { title: '提交新证据', desc: '签发可验证凭证', icon: FileCheck, iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400', module: 'evidence' },
  { title: '发布协作任务', desc: '分发给协作节点', icon: Users, iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', module: 'collaboration' },
  { title: '运行红蓝对抗', desc: '对抗性模拟验证', icon: Swords, iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', module: 'cognitive' },
  { title: '查看路线图', desc: '90天创业里程碑', icon: Map, iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400', module: 'roadmap' },
  { title: '查看沙盒', desc: '虚实共生原型', icon: Monitor, iconBg: 'bg-amber-600/15', iconColor: 'text-amber-500', module: 'sandbox' },
]

// ─── Status text mapping ─────────────────────────────────────────────────────

function statusLabel(status: string): string {
  switch (status) {
    case 'working': return '工作中'
    case 'idle': return '待命'
    case 'sleeping': return '休眠'
    case 'error': return '异常'
    default: return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'working': return 'text-emerald-400'
    case 'idle': return 'text-amber-400'
    case 'sleeping': return 'text-zinc-500'
    case 'error': return 'text-red-400'
    default: return 'text-zinc-400'
  }
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'working': return 'bg-emerald-400'
    case 'idle': return 'bg-amber-400'
    case 'sleeping': return 'bg-zinc-500'
    case 'error': return 'bg-red-400'
    default: return 'bg-zinc-400'
  }
}

function taskLabel(agent: { role: string; status: string }): string {
  if (agent.status === 'sleeping') return '休眠中'
  if (agent.status === 'error') return '需要关注'
  if (agent.status === 'idle') return '等待任务分配'
  switch (agent.role) {
    case 'CEO': return '战略分析与决策制定'
    case 'CTO': return '架构审查与技术规划'
    case 'Growth': return '增长策略与数据优化'
    case 'Engineer': return '代码实现与部署执行'
    default: return '执行任务中'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardView({ onNavigate }: DashboardViewProps) {
  // ── Simulated uptime counter ────────────────────────────────────────────────
  const [uptime, setUptime] = useState('00:00:00')
  const startTime = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - startTime.current
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      setUptime(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Ticker scroll simulation ────────────────────────────────────────────────
  const [tickerIndex, setTickerIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_ITEMS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // ── Fetch real API data ─────────────────────────────────────────────────────
  const shardsQuery = useShards()
  const evidencesQuery = useEvidences()
  const tasksQuery = useTasks()
  const projectsQuery = useProjects()
  const roadmapQuery = useRoadmap()
  const cloneAgentsQuery = useCloneAgents()
  const blockchainStatusQuery = useBlockchainStatus()
  const cloneActivitiesQuery = useCloneActivities()

  const { connected: wsConnected } = useWebSocket()

  const shards = (shardsQuery.data?.shards as ShardData[] | undefined) ?? []
  const evidences = (evidencesQuery.data?.evidences as EvidenceData[] | undefined) ?? []
  const tasks = (tasksQuery.data?.tasks as TaskData[] | undefined) ?? []
  const projects = (projectsQuery.data?.projects as ProjectData[] | undefined) ?? []
  const phases = (roadmapQuery.data?.phases as PhaseData[] | undefined) ?? []
  const cloneAgents = (cloneAgentsQuery.data?.agents as CloneAgentData[] | undefined) ?? []
  const cloneActivities = (cloneActivitiesQuery.data?.activities as ActivityData[] | undefined) ?? []

  const anyError = shardsQuery.isError || evidencesQuery.isError || tasksQuery.isError || projectsQuery.isError || roadmapQuery.isError

  // ── Compute stats ───────────────────────────────────────────────────────────
  const activeShards = shards.filter(s => s.status === 'active')
  const onchainEvidences = evidences.filter(e => e.status === 'onchain' || e.chainTxHash)
  const openTasks = tasks.filter(t => t.status === 'open')
  const workingAgents = cloneAgents.filter(a => a.status === 'working')
  const totalCycles = cloneAgents.reduce((sum, a) => sum + (a.cycleCount || 0), 0)

  // ── System health ───────────────────────────────────────────────────────────
  const cognitiveHealth = activeShards.length > 0
    ? Math.round((activeShards.reduce((sum, s) => sum + s.confidence, 0) / activeShards.length) * 100)
    : shards.length > 0
      ? Math.round((shards.reduce((sum, s) => sum + s.confidence, 0) / shards.length) * 100)
      : 0

  const blockHeight = blockchainStatusQuery.data?.data?.network?.blockHeight ?? 0
  const gasPrice = blockchainStatusQuery.data?.data?.network?.gasPrice ?? '0'
  const walletConnected = blockchainStatusQuery.data?.data?.wallet?.connected ?? false

  // ── Real-time Stats Cards ───────────────────────────────────────────────────
  const realtimeStats = [
    { label: '今日AI周期', value: String(totalCycles), unit: '已完成', icon: Zap, gradient: 'from-emerald-600 to-teal-500', sparkData: sparklineData.cycles, sparkColor: '#10b981', live: true },
    { label: '活跃智能体', value: String(workingAgents.length || cloneAgents.length), unit: '运行中', icon: Cpu, gradient: 'from-violet-500 to-purple-600', sparkData: sparklineData.agents, sparkColor: '#8b5cf6', live: true },
    { label: '链上证据', value: String(onchainEvidences.length), unit: '已验证', icon: Shield, gradient: 'from-teal-600 to-emerald-400', sparkData: sparklineData.evidence, sparkColor: '#14b8a6', live: false },
    { label: '开放任务', value: String(openTasks.length), unit: '待领取', icon: Target, gradient: 'from-amber-500 to-orange-500', sparkData: sparklineData.tasks, sparkColor: '#f59e0b', live: false },
  ]

  // ── Activity timeline ───────────────────────────────────────────────────────
  const activityModuleIcons: Record<string, React.ElementType> = {
    cycle_completed: CheckCircle2,
    output_created: FileText,
    skill_upgraded: Sparkles,
    agent_added: Users,
    evidence_anchored: Link2,
    task_updated: Target,
    shard_created: Brain,
  }

  const activityModuleBadges: Record<string, { label: string; color: string }> = {
    cycle_completed: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    output_created: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    skill_upgraded: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    agent_added: { label: '分身系统', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    evidence_anchored: { label: '证据链', color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
    task_updated: { label: '协作调度', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
    shard_created: { label: '认知引擎', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  }

  const combinedActivities: {
    id: string
    title: string
    description: string
    timestamp: string
    type: string
    module: string
  }[] = []

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

  combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const displayActivities = combinedActivities.slice(0, 20)

  // ── Roadmap phases ──────────────────────────────────────────────────────────
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

  const displayRoadmapPhases = anyError ? fallbackRoadmapPhases : roadmapPhases

  // ── Merge real agents with simulated avatars for the Live Square ─────────────
  const liveSquareAgents = [
    ...cloneAgents.map(a => ({
      id: a.id,
      name: a.name || `${a.role}分身`,
      role: a.role,
      status: a.status,
      task: taskLabel(a),
      progress: a.status === 'working' ? Math.floor(Math.random() * 40 + 30) : a.status === 'idle' ? 100 : 0,
      cycleCount: a.cycleCount || 0,
      lastCycleAt: a.lastCycleAt,
      isOwn: true,
    })),
    ...SIMULATED_AVATARS.map(a => ({
      ...a,
      isOwn: false,
      lastCycleAt: null as string | null,
    })),
  ]

  return (
    <div className="bg-background text-foreground">
      <div className="space-y-4 sm:space-y-5">

        {/* ── API Error Warning ──────────────────────────────────────────────── */}
        {anyError && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>部分数据加载失败，已使用缓存数据展示</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            0. LIVE ACTIVITY TICKER
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-lg border border-emerald-500/15 bg-emerald-500/5 backdrop-blur-sm"
        >
          <div className="flex items-center">
            {/* LIVE badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border-r border-emerald-500/15 shrink-0">
              <LiveDot color="bg-emerald-400" size="h-1.5 w-1.5" />
              <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
            {/* Scrolling text */}
            <div className="overflow-hidden flex-1 py-2 px-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tickerIndex}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <span className={`text-xs font-medium ${TICKER_ITEMS[tickerIndex].color}`}>
                    {TICKER_ITEMS[tickerIndex].text}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {TICKER_ITEMS[tickerIndex].time}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            1. MISSION CONTROL HEADER
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-4 sm:p-5"
        >
          {/* Dark techy background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-zinc-900/5" />
          <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            {/* Top row: Title + LIVE + God Mode */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Mission Control</h2>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[9px] h-5 gap-1 font-mono">
                      <LiveDot color="bg-emerald-400" size="h-1.5 w-1.5" />
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Piaoshu Avatar OS · {cloneAgents.length} 分身在线 · {totalCycles} 周期完成
                  </p>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 gap-2 font-bold text-sm"
                  onClick={() => onNavigate?.('avatar')}
                >
                  <Flame className="h-4 w-4" />
                  上帝模式
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            </div>

            {/* System status metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-background/50 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">活跃分身</p>
                  <p className="text-sm font-bold font-mono">{workingAgents.length}<span className="text-[10px] text-muted-foreground">/{cloneAgents.length}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-background/50 px-3 py-2">
                <Activity className="h-3.5 w-3.5 text-teal-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">当前周期</p>
                  <p className="text-sm font-bold font-mono">{totalCycles}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-background/50 px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">系统运行</p>
                  <p className="text-sm font-bold font-mono">{uptime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-background/50 px-3 py-2">
                {wsConnected ? <Wifi className="h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="h-3.5 w-3.5 text-red-400" />}
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">实时连接</p>
                  <p className={`text-sm font-bold font-mono ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>{wsConnected ? 'ONLINE' : 'OFFLINE'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. OS-LIKE STAT WIDGETS
        ══════════════════════════════════════════════════════════════════════ */}
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
                <Card className="relative overflow-hidden rounded-xl border border-emerald-500/10 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 h-full group">
                  {/* Animated glow border on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
                  {/* Blinking live dot */}
                  {stat.live && (
                    <div className="absolute top-3 right-3">
                      <LiveDot color="bg-emerald-400" size="h-1.5 w-1.5" />
                    </div>
                  )}
                  <CardContent className="relative p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-emerald-500/20`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold font-mono">{stat.value}</span>
                          <span className="text-[10px] text-muted-foreground">{stat.unit}</span>
                        </div>
                      </div>
                    </div>
                    <Sparkline data={stat.sparkData} color={stat.sparkColor} height={32} />
                    <p className="mt-1 text-[9px] text-muted-foreground font-mono">7D TREND</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            3. 分身实时广场 (AVATAR LIVE SQUARE)
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                <Hexagon className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold">分身实时广场</h3>
                <p className="text-[10px] text-muted-foreground">Avatar Live Square · 实时查看所有分身工作状态</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] h-5 bg-emerald-500/5 text-emerald-400 border-emerald-500/20 gap-1">
              <LiveDot color="bg-emerald-400" size="h-1 w-1" />
              {liveSquareAgents.filter(a => a.status === 'working').length} 运行中
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {liveSquareAgents.map((agent, i) => {
              const config = AGENT_CONFIG[agent.role] || DEFAULT_AGENT_CONFIG
              const ConfigIcon = config.icon
              const isWorking = agent.status === 'working'

              return (
                <motion.div
                  key={agent.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className={`relative overflow-hidden rounded-xl border ${config.accentBorder} bg-card transition-all duration-300 ${isWorking ? `shadow-lg ${config.glowColor}` : ''}`}>
                    {/* Glow background for working agents */}
                    {isWorking && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} animate-pulse`} />
                    )}
                    {/* Top accent line */}
                    <div className={`h-0.5 w-full bg-gradient-to-r ${config.gradientFrom.replace('/10', '/60')} ${config.gradientTo.replace('/5', '/30')}`} />

                    <div className="relative p-3.5">
                      {/* Header: Icon + Name + Status */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`relative flex h-8 w-8 items-center justify-center rounded-lg ${config.accentBg}`}>
                            <ConfigIcon className={`h-4 w-4 ${config.accentColor}`} />
                            {isWorking && (
                              <span className="absolute -top-0.5 -right-0.5">
                                <LiveDot color={config.pulseColor} size="h-1.5 w-1.5" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{agent.name}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{agent.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor(agent.status)}`} />
                          <span className={`text-[9px] font-medium ${statusColor(agent.status)}`}>
                            {statusLabel(agent.status)}
                          </span>
                        </div>
                      </div>

                      {/* Current task */}
                      <div className="mb-2 rounded-md bg-background/50 border border-border/30 px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Terminal className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground font-mono">CURRENT TASK</span>
                        </div>
                        <p className="text-[11px] font-medium truncate">{agent.task}</p>
                      </div>

                      {/* Progress bar for working agents */}
                      {isWorking && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-muted-foreground">进度</span>
                            <span className="text-[9px] font-mono font-medium">{agent.progress}%</span>
                          </div>
                          <Progress value={agent.progress} className="h-1.5 bg-muted/50" />
                        </div>
                      )}

                      {/* Footer stats */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {agent.cycleCount} 周期
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {agent.lastCycleAt ? timeAgo(agent.lastCycleAt) : '—'}
                        </span>
                        {!agent.isOwn && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-background/50 text-muted-foreground border-border/30">
                            远程
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            4. QUICK SYSTEM STATUS BAR
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-wrap items-center gap-2 sm:gap-3"
        >
          {[
            { label: 'WebSocket', online: wsConnected, icon: wsConnected ? Wifi : WifiOff },
            { label: '向量搜索', online: true, icon: Search },
            { label: '区块链', online: walletConnected, icon: Link2 },
            { label: '记忆宫殿', online: true, icon: Database },
            { label: '认知引擎', online: cognitiveHealth >= 50, icon: Brain },
          ].map((service) => {
            const SvcIcon = service.icon
            return (
              <div
                key={service.label}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono transition-colors ${
                  service.online
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${service.online ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <SvcIcon className="h-3 w-3" />
                <span>{service.label}</span>
              </div>
            )
          })}
          <div className="ml-auto text-[10px] text-muted-foreground font-mono">
            Block #{blockHeight} · Gas {gasPrice}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            5. TWO-COLUMN: ACTIVITY TIMELINE + ANALYTICS & ACTIONS
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">

          {/* LEFT: Enhanced AI Activity Feed (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-xl border border-emerald-500/10 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    AI 活动流
                  </CardTitle>
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border-0 h-5 gap-1">
                    <LiveDot color="bg-emerald-400" size="h-1 w-1" />
                    实时
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {displayActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Activity className="h-6 w-6 mb-2 opacity-40" />
                    <p className="text-xs">暂无活动记录</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[460px]">
                    <div className="relative pl-4">
                      {/* Timeline connecting line */}
                      <div className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/30 via-teal-500/20 to-transparent" />

                      <div className="space-y-1">
                        {displayActivities.slice(0, 10).map((activity, idx) => {
                          const Icon = activityModuleIcons[activity.type] || CircleDot
                          const badge = activityModuleBadges[activity.type] || { label: activity.module, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
                          return (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-emerald-500/5 transition-colors group relative"
                            >
                              {/* Timeline dot */}
                              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-background mt-0.5 group-hover:border-emerald-500/50 transition-colors">
                                <Icon className="h-2.5 w-2.5 text-emerald-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[11px] font-medium">{activity.title}</p>
                                  <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border ${badge.color}`}>
                                    {badge.label}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                                <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">{timeAgo(activity.timestamp)}</p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Analytics + Actions + Roadmap (3 cols) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Agent Activity Bar Chart */}
            <Card className="rounded-xl border border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  智能体活动统计
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentActivityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
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

            {/* Two-column: Donut + Evidence Growth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="rounded-xl border border-emerald-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">任务完成率</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[160px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskCompletionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
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
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {taskCompletionData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] text-muted-foreground">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-emerald-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">证据链增长</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evidenceGrowthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="total" name="总数" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="verified" name="已验证" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.1} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions + Roadmap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quick Actions */}
              <Card className="rounded-xl border border-emerald-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    快捷操作
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.slice(0, 6).map((action) => {
                      const Icon = action.icon
                      return (
                        <motion.button
                          key={action.title}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 rounded-lg border border-border/50 p-2.5 text-left transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/5"
                          onClick={() => onNavigate?.(action.module)}
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${action.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold truncate">{action.title}</p>
                            <p className="text-[8px] text-muted-foreground truncate">{action.desc}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Roadmap Mini */}
              <Card className="rounded-xl border border-emerald-500/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Map className="h-4 w-4 text-emerald-500" />
                      90天路线图
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300"
                      onClick={() => onNavigate?.('roadmap')}
                    >
                      查看全部
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2.5">
                  {displayRoadmapPhases.map((phase) => (
                    <div key={phase.phase} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            phase.status === 'active' ? 'bg-emerald-400' :
                            phase.status === 'completed' ? 'bg-teal-400' : 'bg-zinc-500'
                          }`} />
                          <span className="text-[10px] font-mono text-muted-foreground">{phase.phase}</span>
                          <span className="text-[11px] font-medium">{phase.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-1 bg-muted/50" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card className="rounded-xl border border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-500" />
                  引擎健康度
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '认知引擎', icon: Brain, value: cognitiveHealth, detail: `${activeShards.length} 活跃` },
                    { label: '向量搜索', icon: Search, value: 95, detail: '在线' },
                    { label: '区块链', icon: Link2, value: walletConnected ? 90 : 60, detail: walletConnected ? '已连接' : '未连接' },
                    { label: '协作调度', icon: Network, value: 85, detail: '正常' },
                  ].map((engine) => {
                    const EngIcon = engine.icon
                    const color = engine.value >= 80 ? 'text-emerald-400' : engine.value >= 50 ? 'text-amber-400' : 'text-red-400'
                    const barColor = engine.value >= 80 ? 'bg-emerald-500' : engine.value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    return (
                      <div key={engine.label} className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5">
                        <EngIcon className={`h-4 w-4 ${color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{engine.label}</span>
                            <span className={`text-[10px] font-mono font-bold ${color}`}>{engine.value}%</span>
                          </div>
                          <div className="mt-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${barColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${engine.value}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-[8px] text-muted-foreground">{engine.detail}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
