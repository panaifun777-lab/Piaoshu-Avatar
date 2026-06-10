'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Eye,
  Mail,
  Flame,
  ListChecks,
  UserCircle2,
  LayoutGrid,
  Plus,
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

// ─── AI Activity Feed data ──────────────────────────────────────────────

const aiFeedItems = [
  { id: 'f1', agent: 'CEO分身', action: '完成战略分析周期', output: 'Q2市场策略建议已生成', time: '3分钟前', type: 'cycle', color: 'text-amber-500' },
  { id: 'f2', agent: 'CTO分身', action: '代码审查完成', output: '3个PR已审核，1个需修改', time: '12分钟前', type: 'output', color: 'text-cyan-500' },
  { id: 'f3', agent: 'Growth分身', action: '用户增长分析', output: '周活跃用户增长12%', time: '25分钟前', type: 'analysis', color: 'text-emerald-500' },
  { id: 'f4', agent: 'Engineer分身', action: '部署自动化脚本', output: 'CI/CD管道优化完成', time: '1小时前', type: 'deployment', color: 'text-teal-500' },
  { id: 'f5', agent: 'CEO分身', action: '合作伙伴评估', output: '3个合作方案已评分', time: '2小时前', type: 'cycle', color: 'text-amber-500' },
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
  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview')

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

  const vectorOnline = true
  const vectorCount = 12

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

  const displayRoadmapPhases = anyError ? fallbackRoadmapPhases : roadmapPhases

  // ── Collaboration tasks summary for right column ──────────────────────────
  const tasksByStatus = {
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="bg-background text-foreground">
      <div className="space-y-6">
        {/* ── API Error Warning ──────────────────────────────────────────────── */}
        {anyError && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>部分数据加载失败，已使用缓存数据展示</span>
          </div>
        )}

        {/* ── 1. Hero Banner with God Mode CTA ──────────────────────────── */}
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

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
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

            {/* God Mode Button - Polsia-style orange CTA */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 gap-2 font-bold text-sm sm:text-base"
                onClick={() => onNavigate?.('avatar')}
              >
                <Flame className="h-5 w-5" />
                上帝模式
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* ── 2. Stat Cards Row ───────────────────────────────────────────── */}
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
                <Card className="relative overflow-hidden rounded-xl shadow-sm border-emerald-500/10 transition-colors hover:border-emerald-500/30 h-full">
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

        {/* ── 3. Tab Navigation ─────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <LayoutGrid className="h-3.5 w-3.5" />
              概览
            </TabsTrigger>
            <TabsTrigger value="clones" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <UserCircle2 className="h-3.5 w-3.5" />
              分身
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <ListChecks className="h-3.5 w-3.5" />
              任务
            </TabsTrigger>
            <TabsTrigger value="evidence" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
              <Shield className="h-3.5 w-3.5" />
              证据
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab: Three-column layout ────────────────────────── */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
              {/* LEFT COLUMN: AI Activity Feed */}
              <div className="space-y-4">
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        AI 活动流
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
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
                      <ScrollArea className="max-h-[420px]">
                        <div className="space-y-2">
                          {displayActivities.slice(0, 8).map((activity) => {
                            const Icon = activityModuleIcons[activity.type] || CircleDot
                            const badge = activityModuleBadges[activity.type] || { label: activity.module, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
                            return (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-emerald-500/5 transition-colors"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                                  <Icon className="h-3 w-3 text-emerald-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-medium leading-relaxed">{activity.title}</p>
                                    <Badge variant="outline" className={`text-[9px] h-4 px-1 border ${badge.color}`}>
                                      {badge.label}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                                  <p className="text-[9px] text-muted-foreground font-mono">{timeAgo(activity.timestamp)}</p>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions - compact */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      快捷操作
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.slice(0, 4).map((action) => {
                        const Icon = action.icon
                        return (
                          <motion.button
                            key={action.title}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 rounded-lg border border-border/50 p-2.5 text-left transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/5"
                            onClick={() => onNavigate?.(action.module)}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                              <Icon className="h-4 w-4 text-foreground/80" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold truncate">{action.title}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{action.desc}</p>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MIDDLE COLUMN: Data Analytics Charts */}
              <div className="space-y-4">
                {/* Agent Activity Bar Chart */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">智能体活动统计</CardTitle>
                    <CardDescription className="text-xs">各角色周期执行与产出数量</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[220px] w-full">
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

                {/* Task Completion Donut */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">任务完成率</CardTitle>
                    <CardDescription className="text-xs">按状态分布</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[180px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskCompletionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={72}
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
                    <div className="flex flex-wrap justify-center gap-3 mt-1">
                      {taskCompletionData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[11px] text-muted-foreground">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Evidence Chain Growth */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">证据链增长趋势</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={evidenceGrowthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Area type="monotone" dataKey="total" name="证据总量" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                          <Area type="monotone" dataKey="verified" name="已验证" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: System Health + Collaboration Tasks */}
              <div className="space-y-4">
                {/* System Health */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Server className="h-4 w-4 text-emerald-500" />
                        系统健康
                      </CardTitle>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px] border-emerald-500/20">
                        实时
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {systemHealthItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 shrink-0 ${healthColor(item.value)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{item.label}</span>
                              <span className={`text-[10px] font-medium ${healthColor(item.value)}`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/10">
                              {allLoading ? (
                                <Skeleton className="h-full w-full rounded-full" />
                              ) : (
                                <div
                                  className={`${healthBg(item.value)} h-full rounded-full transition-all duration-700`}
                                  style={{ width: `${item.value}%` }}
                                />
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{item.detail}</p>
                          </div>
                        </div>
                      )
                    })}

                    {/* Combined health overview */}
                    <div className="pt-2 mt-2 border-t border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">综合健康度</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-400">
                          {Math.round((cognitiveHealth + evidenceIntegrity + collaborationEfficiency + sandboxCoverage) / 4)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: '认知引擎', value: cognitiveHealth, color: 'bg-emerald-500' },
                          { label: '证据链', value: evidenceIntegrity, color: 'bg-teal-500' },
                          { label: '协作效率', value: collaborationEfficiency, color: 'bg-cyan-500' },
                          { label: '沙盒覆盖', value: sandboxCoverage, color: 'bg-amber-500' },
                        ].map((metric) => (
                          <div key={metric.label} className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground w-12 shrink-0">{metric.label}</span>
                            <div className="flex-1 relative h-1 w-full overflow-hidden rounded-full bg-emerald-500/10">
                              <div className={`${metric.color} h-full rounded-full transition-all duration-700`} style={{ width: `${metric.value}%` }} />
                            </div>
                            <span className="text-[9px] font-medium tabular-nums w-6 text-right">{metric.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Collaboration Tasks Summary */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-emerald-500" />
                        协作任务
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5" onClick={() => onNavigate?.('collaboration')}>
                        查看全部 <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2.5">
                    {[
                      { status: '待领取', count: tasksByStatus.open, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
                      { status: '进行中', count: tasksByStatus.in_progress, color: 'bg-cyan-500', textColor: 'text-cyan-600 dark:text-cyan-400' },
                      { status: '审核中', count: tasksByStatus.review, color: 'bg-violet-500', textColor: 'text-violet-600 dark:text-violet-400' },
                      { status: '已完成', count: tasksByStatus.completed, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-500/5 transition-colors">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}/10`}>
                          <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{item.status}</p>
                          <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: tasks.length > 0 ? `${(item.count / tasks.length) * 100}%` : '0%' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 90-Day Roadmap Mini */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Map className="h-4 w-4 text-emerald-500" />
                        路线图
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5" onClick={() => onNavigate?.('roadmap')}>
                        详情 <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {displayRoadmapPhases.map((phase) => (
                      <div key={phase.phase} className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full ${phase.status === 'active' ? 'bg-emerald-400 animate-pulse' : phase.status === 'completed' ? 'bg-emerald-600' : 'bg-muted-foreground/30'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium truncate">{phase.title}</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">{phase.progress}%</span>
                          </div>
                          <Progress value={phase.progress} className={`h-1 mt-1 ${phase.status === 'active' ? '[&>[data-slot=progress-indicator]]:bg-emerald-500' : '[&>[data-slot=progress-indicator]]:bg-muted-foreground/30'}`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Clones Tab ──────────────────────────────────────────────── */}
          <TabsContent value="clones" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Agent Status Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cloneAgents.length > 0 ? cloneAgents.map((agent, i) => {
                    const agentColors = [
                      { accent: 'amber', icon: Crown, gradient: 'from-amber-500 to-amber-600' },
                      { accent: 'cyan', icon: Cpu, gradient: 'from-cyan-500 to-cyan-600' },
                      { accent: 'emerald', icon: Rocket, gradient: 'from-emerald-500 to-emerald-600' },
                      { accent: 'teal', icon: Wrench, gradient: 'from-teal-500 to-teal-600' },
                    ]
                    const config = agentColors[i % agentColors.length]
                    const AgentIcon = config.icon
                    return (
                      <motion.div
                        key={agent.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Card className="rounded-xl shadow-sm border-emerald-500/10 h-full">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
                                <AgentIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{agent.name}</p>
                                <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                              </div>
                              <Badge variant="secondary" className={`text-[9px] border-0 ${agent.status === 'working' ? 'bg-emerald-500/10 text-emerald-600' : agent.status === 'idle' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                                {agent.status === 'working' ? '工作中' : agent.status === 'idle' ? '空闲' : '休眠'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-lg bg-muted/50 p-2 text-center">
                                <p className="text-[10px] text-muted-foreground">周期数</p>
                                <p className="text-sm font-bold">{agent.cycleCount || 0}</p>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-2 text-center">
                                <p className="text-[10px] text-muted-foreground">经验值</p>
                                <p className="text-sm font-bold">{agent.experience || 0}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  }) : (
                    <div className="col-span-2">
                      <Card className="rounded-xl shadow-sm border-emerald-500/10">
                        <CardContent className="p-8 text-center">
                          <UserCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">暂无活跃分身</p>
                          <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => onNavigate?.('avatar')}>
                            <Plus className="h-3 w-3" /> 创建分身
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* AI Feed for clones tab */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      分身实时动态
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2">
                        {aiFeedItems.map((item) => (
                          <div key={item.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-emerald-500/5 transition-colors">
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${item.color.replace('text-', 'bg-')}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs"><span className={`font-semibold ${item.color}`}>{item.agent}</span> {item.action}</p>
                              <p className="text-[11px] text-muted-foreground">{item.output}</p>
                              <p className="text-[9px] text-muted-foreground font-mono">{item.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions for Clones */}
              <div className="space-y-4">
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      分身操作
                    </h3>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 gap-1.5" onClick={() => onNavigate?.('avatar')}>
                      <Flame className="h-4 w-4" />
                      启动全部周期
                    </Button>
                    <Button variant="outline" className="w-full gap-1.5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10" onClick={() => onNavigate?.('avatar')}>
                      <Plus className="h-4 w-4" />
                      添加新分身
                    </Button>
                    <Button variant="outline" className="w-full gap-1.5" onClick={() => onNavigate?.('avatar')}>
                      <Eye className="h-4 w-4" />
                      查看分身详情
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-emerald-500" />
                      分身状态概览
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{cloneAgents.length}</p>
                        <p className="text-[10px] text-muted-foreground">总分身</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{workingAgents.length}</p>
                        <p className="text-[10px] text-muted-foreground">工作中</p>
                      </div>
                      <div className="rounded-lg bg-violet-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{totalCycles}</p>
                        <p className="text-[10px] text-muted-foreground">总周期</p>
                      </div>
                      <div className="rounded-lg bg-teal-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-teal-600 dark:text-teal-400">98%</p>
                        <p className="text-[10px] text-muted-foreground">可用率</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Tasks Tab ────────────────────────────────────────────────── */}
          <TabsContent value="tasks" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tasks chart */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">任务分布统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agentActivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                          <Bar dataKey="cycles" name="周期数" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="outputs" name="产出数" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Tasks List */}
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">近期任务</CardTitle>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5" onClick={() => onNavigate?.('collaboration')}>
                        全部 <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2">
                        {tasks.slice(0, 8).map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-500/5 transition-colors">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-cyan-500' : 'bg-amber-500'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{task.title}</p>
                              <p className="text-[10px] text-muted-foreground">{task.category} · {task.complexity}</p>
                            </div>
                            <Badge variant="secondary" className="text-[9px] h-4 border-0 shrink-0">{task.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Task Stats */}
              <div className="space-y-4">
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">任务状态分布</h3>
                    {[
                      { status: '待领取', count: tasksByStatus.open, color: 'bg-amber-500' },
                      { status: '进行中', count: tasksByStatus.in_progress, color: 'bg-cyan-500' },
                      { status: '审核中', count: tasksByStatus.review, color: 'bg-violet-500' },
                      { status: '已完成', count: tasksByStatus.completed, color: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center gap-3 mb-3">
                        <div className={`h-3 w-3 rounded ${item.color}`} />
                        <span className="text-xs flex-1">{item.status}</span>
                        <span className="text-sm font-bold">{item.count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 gap-1.5" onClick={() => onNavigate?.('collaboration')}>
                  <Plus className="h-4 w-4" /> 发布新任务
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Evidence Tab ─────────────────────────────────────────────── */}
          <TabsContent value="evidence" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Evidence growth chart */}
              <div className="lg:col-span-2">
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">证据链增长趋势</CardTitle>
                    <CardDescription className="text-xs">证据总量与已验证数量增长</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={evidenceGrowthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="total" name="证据总量" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                          <Area type="monotone" dataKey="verified" name="已验证" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Evidence stats */}
              <div className="space-y-4">
                <Card className="rounded-xl shadow-sm border-emerald-500/10">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      证据统计
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{evidences.length}</p>
                        <p className="text-[10px] text-muted-foreground">总证据</p>
                      </div>
                      <div className="rounded-lg bg-teal-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{verifiedEvidences.length}</p>
                        <p className="text-[10px] text-muted-foreground">已验证</p>
                      </div>
                      <div className="rounded-lg bg-cyan-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{onchainEvidences.length}</p>
                        <p className="text-[10px] text-muted-foreground">链上</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{evidenceIntegrity}%</p>
                        <p className="text-[10px] text-muted-foreground">完整率</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 gap-1.5" onClick={() => onNavigate?.('evidence')}>
                  <Plus className="h-4 w-4" /> 提交新证据
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer spacer */}
        <div className="h-4" />
      </div>
    </div>
  )
}
