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
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Brain,
  Building2,
  DoorOpen,
  Archive,
  Zap,
  Crown,
  Cpu,
  Rocket,
  User,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Network,
  Link2,
  Eye,
  Loader2,
  Tag,
  ArrowRight,
  Circle,
  GitBranch,
  Lightbulb,
  Layers,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import {
  useMemoryPalace,
  useMemoryDrawers,
  useCreateDrawer,
  useMemoryTunnels,
  useMemoryWake,
  useKGEntities,
  useKGTriples,
  useAddKGTriple,
  useDiscoverTunnels,
} from '@/lib/api-hooks'

// ─── Types ──────────────────────────────────────────────────────────────

interface WingRow {
  id: string
  name: string
  wingKey: string
  priority: number
  icon: string
  color: string
  description: string | null
  createdAt: string
  rooms?: RoomRow[]
}

interface RoomRow {
  id: string
  wingId: string
  name: string
  hallType: string
  description: string | null
  createdAt: string
  _count?: { drawers: number }
}

interface DrawerRow {
  id: string
  roomId: string
  content: string
  aaaakSummary: string | null
  sourceType: string
  importance: number
  validFrom: string | null
  validTo: string | null
  tags: string | null
  accessCount: number
  lastAccessedAt: string | null
  createdAt: string
}

interface TunnelRow {
  id: string
  fromRoomId: string
  toRoomId: string
  sharedTheme: string | null
  strength: number
  createdAt: string
  fromRoom?: { id: string; name: string; wing?: { name: string } }
  toRoom?: { id: string; name: string; wing?: { name: string } }
}

interface EntityRow {
  id: string
  entityName: string
  entityType: string
  description: string | null
  createdAt: string
}

interface TripleRow {
  id: string
  subjectName: string
  predicate: string
  objectName: string
  confidence: number
  validFrom: string | null
  validTo: string | null
  createdAt: string
}

interface WakeData {
  L0?: { content: string; tokens: number } | null
  L1?: { items: Array<{ content: string; tokens: number }> } | null
  totalTokens?: number
}

// ─── Wing Config ────────────────────────────────────────────────────────

const WING_CONFIG: Record<string, { icon: React.ElementType; color: string; bgLight: string; text: string; border: string; accentBar: string }> = {
  strategy: { icon: Crown, color: '#f59e0b', bgLight: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', accentBar: 'bg-amber-500' },
  engineering: { icon: Cpu, color: '#06b6d4', bgLight: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-200', accentBar: 'bg-cyan-500' },
  growth: { icon: Rocket, color: '#10b981', bgLight: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200', accentBar: 'bg-emerald-500' },
  relationships: { icon: User, color: '#f43f5e', bgLight: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200', accentBar: 'bg-rose-500' },
  identity: { icon: Brain, color: '#8b5cf6', bgLight: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-200', accentBar: 'bg-violet-500' },
}

const DEFAULT_WING_CONFIG = { icon: Building2, color: '#64748b', bgLight: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-200', accentBar: 'bg-slate-500' }

function getWingConfig(wingKey: string) {
  return WING_CONFIG[wingKey] || DEFAULT_WING_CONFIG
}

function getHallTypeBadge(hallType: string) {
  const map: Record<string, { color: string; label: string }> = {
    grand: { color: 'bg-amber-500/10 text-amber-700 border-amber-200', label: '大殿' },
    working: { color: 'bg-teal-500/10 text-teal-700 border-teal-200', label: '工坊' },
    archive: { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: '档案' },
    vault: { color: 'bg-violet-500/10 text-violet-700 border-violet-200', label: '金库' },
  }
  return map[hallType] || { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: hallType }
}

function getSourceTypeBadge(sourceType: string) {
  const map: Record<string, { color: string; label: string }> = {
    simulation: { color: 'bg-red-500/10 text-red-600 border-red-200', label: '模拟' },
    chat: { color: 'bg-teal-500/10 text-teal-600 border-teal-200', label: '对话' },
    decision: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '决策' },
    manual: { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200', label: '手动' },
    cycle: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: '周期' },
  }
  return map[sourceType] || { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: sourceType }
}

function getEntityTypeBadge(entityType: string) {
  const map: Record<string, { color: string; label: string }> = {
    person: { color: 'bg-rose-500/10 text-rose-600 border-rose-200', label: '人物' },
    project: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '项目' },
    technology: { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200', label: '技术' },
    concept: { color: 'bg-violet-500/10 text-violet-600 border-violet-200', label: '概念' },
    organization: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: '组织' },
  }
  return map[entityType] || { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: entityType }
}

function isExpired(validTo: string | null): boolean {
  if (!validTo) return false
  return new Date(validTo) < new Date()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Fallback Data ──────────────────────────────────────────────────────

const FALLBACK_WINGS: WingRow[] = [
  { id: 'w1', name: '战略决策翼', wingKey: 'strategy', priority: 10, icon: 'crown', color: '#f59e0b', description: '核心战略决策与愿景规划', createdAt: new Date().toISOString(), rooms: [
    { id: 'r1', wingId: 'w1', name: '愿景大厅', hallType: 'grand', description: '公司愿景与使命', createdAt: new Date().toISOString(), _count: { drawers: 8 } },
    { id: 'r2', wingId: 'w1', name: '竞争情报室', hallType: 'working', description: '市场竞品分析', createdAt: new Date().toISOString(), _count: { drawers: 5 } },
    { id: 'r3', wingId: 'w1', name: '投资决策库', hallType: 'vault', description: '重大投资决策记录', createdAt: new Date().toISOString(), _count: { drawers: 3 } },
  ]},
  { id: 'w2', name: '工程架构翼', wingKey: 'engineering', priority: 9, icon: 'cpu', color: '#06b6d4', description: '技术架构与工程实践', createdAt: new Date().toISOString(), rooms: [
    { id: 'r4', wingId: 'w2', name: '架构设计室', hallType: 'working', description: '系统架构设计', createdAt: new Date().toISOString(), _count: { drawers: 6 } },
    { id: 'r5', wingId: 'w2', name: '代码质量厅', hallType: 'working', description: '代码审查与质量', createdAt: new Date().toISOString(), _count: { drawers: 4 } },
  ]},
  { id: 'w3', name: '增长运营翼', wingKey: 'growth', priority: 8, icon: 'rocket', color: '#10b981', description: '用户增长与运营策略', createdAt: new Date().toISOString(), rooms: [
    { id: 'r6', wingId: 'w3', name: '用户增长工坊', hallType: 'working', description: '用户获取与留存', createdAt: new Date().toISOString(), _count: { drawers: 7 } },
    { id: 'r7', wingId: 'w3', name: '数据洞察室', hallType: 'working', description: '数据分析与洞察', createdAt: new Date().toISOString(), _count: { drawers: 4 } },
  ]},
  { id: 'w4', name: '人脉关系翼', wingKey: 'relationships', priority: 7, icon: 'user', color: '#f43f5e', description: '人际网络与合作管理', createdAt: new Date().toISOString(), rooms: [
    { id: 'r8', wingId: 'w4', name: '合作伙伴厅', hallType: 'grand', description: '合作伙伴关系', createdAt: new Date().toISOString(), _count: { drawers: 3 } },
    { id: 'r9', wingId: 'w4', name: '导师顾问室', hallType: 'archive', description: '导师与顾问网络', createdAt: new Date().toISOString(), _count: { drawers: 2 } },
  ]},
  { id: 'w5', name: '个人身份翼', wingKey: 'identity', priority: 10, icon: 'brain', color: '#8b5cf6', description: 'SOUL.md与核心价值观', createdAt: new Date().toISOString(), rooms: [
    { id: 'r10', wingId: 'w5', name: '身份金库', hallType: 'vault', description: '核心身份与信念', createdAt: new Date().toISOString(), _count: { drawers: 5 } },
    { id: 'r11', wingId: 'w5', name: '价值观档案', hallType: 'archive', description: '价值观与原则', createdAt: new Date().toISOString(), _count: { drawers: 3 } },
  ]},
]

const FALLBACK_DRAWERS: DrawerRow[] = [
  { id: 'd1', roomId: 'r1', content: '公司愿景：打造AI原生创业操作系统，让每个创始人拥有自己的AI分身团队，实现一人公司的超级杠杆效应。', aaaakSummary: 'AI原生OS→创始人分身→1人=1团队', sourceType: 'decision', importance: 5, validFrom: null, validTo: null, tags: '愿景,核心,AI原生', accessCount: 42, lastAccessedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'd2', roomId: 'r1', content: '竞品分析：Polsia.com采用角色制AI Agent架构，CEO/CTO/Growth三个角色分工明确，每日自动执行规划-执行-报告三阶段循环。', aaaakSummary: 'Polsia=角色Agent+日循环(3阶段)', sourceType: 'simulation', importance: 4, validFrom: null, validTo: null, tags: '竞品,Polsia,Agent', accessCount: 28, lastAccessedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'd3', roomId: 'r4', content: '架构决策：采用Next.js 16 + Prisma + SQLite技术栈，前后端一体化部署，通过微服务扩展AI能力和WebSocket实时通信。', aaaakSummary: 'Next.js16+Prisma+微服务扩展', sourceType: 'decision', importance: 4, validFrom: null, validTo: null, tags: '架构,Next.js,技术栈', accessCount: 35, lastAccessedAt: new Date(Date.now() - 7200000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'd4', roomId: 'r6', content: '增长实验：通过GEO优化（AI搜索引擎优化）获取有机流量，重点优化AI引用率而非传统SEO排名。', aaaakSummary: 'GEO>SEO→AI引用率优先', sourceType: 'cycle', importance: 3, validFrom: null, validTo: new Date(Date.now() + 86400000 * 90).toISOString(), tags: '增长,GEO,实验', accessCount: 15, lastAccessedAt: new Date(Date.now() - 14400000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'd5', roomId: 'r10', content: 'SOUL.md核心：我是飘叔，一个相信AI可以将个体能力放大的连续创业者。我的风格是直接、务实、不废话。', aaaakSummary: '飘叔=务实直接+AI放大个体', sourceType: 'manual', importance: 5, validFrom: null, validTo: null, tags: 'SOUL,身份,核心', accessCount: 56, lastAccessedAt: new Date(Date.now() - 1800000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 14).toISOString() },
]

const FALLBACK_TUNNELS: TunnelRow[] = [
  { id: 't1', fromRoomId: 'r1', toRoomId: 'r10', sharedTheme: '愿景与身份一致性', strength: 0.92, createdAt: new Date().toISOString(), fromRoom: { id: 'r1', name: '愿景大厅', wing: { name: '战略决策翼' } }, toRoom: { id: 'r10', name: '身份金库', wing: { name: '个人身份翼' } } },
  { id: 't2', fromRoomId: 'r2', toRoomId: 'r6', sharedTheme: '增长策略与竞争分析', strength: 0.78, createdAt: new Date().toISOString(), fromRoom: { id: 'r2', name: '竞争情报室', wing: { name: '战略决策翼' } }, toRoom: { id: 'r6', name: '用户增长工坊', wing: { name: '增长运营翼' } } },
  { id: 't3', fromRoomId: 'r4', toRoomId: 'r5', sharedTheme: '代码质量与架构平衡', strength: 0.85, createdAt: new Date().toISOString(), fromRoom: { id: 'r4', name: '架构设计室', wing: { name: '工程架构翼' } }, toRoom: { id: 'r5', name: '代码质量厅', wing: { name: '工程架构翼' } } },
]

const FALLBACK_ENTITIES: EntityRow[] = [
  { id: 'e1', entityName: '飘叔', entityType: 'person', description: '创始人，AI原生创业操作系统构建者', createdAt: new Date().toISOString() },
  { id: 'e2', entityName: 'Polsia', entityType: 'organization', description: 'AI Agent角色制创业平台', createdAt: new Date().toISOString() },
  { id: 'e3', entityName: 'GEO优化', entityType: 'concept', description: 'AI搜索引擎优化策略', createdAt: new Date().toISOString() },
  { id: 'e4', entityName: '记忆宫殿', entityType: 'technology', description: '层次化记忆管理系统', createdAt: new Date().toISOString() },
  { id: 'e5', entityName: 'AI分身', entityType: 'concept', description: 'AI代理角色化运营', createdAt: new Date().toISOString() },
]

const FALLBACK_TRIPLES: TripleRow[] = [
  { id: 'tr1', subjectName: '飘叔', predicate: '创建', objectName: 'Piaoshu', confidence: 0.99, validFrom: null, validTo: null, createdAt: new Date().toISOString() },
  { id: 'tr2', subjectName: 'Piaoshu', predicate: '采用', objectName: '记忆宫殿', confidence: 0.95, validFrom: null, validTo: null, createdAt: new Date().toISOString() },
  { id: 'tr3', subjectName: 'Polsia', predicate: '启发', objectName: 'AI分身', confidence: 0.88, validFrom: null, validTo: null, createdAt: new Date().toISOString() },
  { id: 'tr4', subjectName: 'GEO优化', predicate: '替代', objectName: '传统SEO', confidence: 0.82, validFrom: null, validTo: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
  { id: 'tr5', subjectName: '飘叔', predicate: '定义', objectName: 'AI分身', confidence: 0.91, validFrom: null, validTo: null, createdAt: new Date().toISOString() },
]

const FALLBACK_WAKE: WakeData = {
  L0: { content: '我是飘叔，AI原生创业操作系统Piaoshu的创始人。我相信AI可以将个体能力放大1000倍，让一个创始人拥有一个团队的产出。我的风格：直接、务实、不废话。', tokens: 68 },
  L1: { items: [
    { content: 'Polsia=角色Agent+日循环(3阶段)', tokens: 12 },
    { content: 'Next.js16+Prisma+微服务扩展', tokens: 10 },
    { content: 'GEO>SEO→AI引用率优先', tokens: 9 },
    { content: 'AI原生OS→创始人分身→1人=1团队', tokens: 11 },
  ]},
  totalTokens: 110,
}

// ─── Sub-Components ─────────────────────────────────────────────────────

function WingCard({
  wing,
  isActive,
  expanded,
  onClick,
  onRoomClick,
  activeRoomId,
}: {
  wing: WingRow
  isActive: boolean
  expanded: boolean
  onClick: () => void
  onRoomClick: (room: RoomRow) => void
  activeRoomId: string | null
}) {
  const config = getWingConfig(wing.wingKey)
  const IconComponent = config.icon
  const rooms = wing.rooms || []
  const totalDrawers = rooms.reduce((sum, r) => sum + (r._count?.drawers || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`group relative overflow-hidden border-border/60 transition-all duration-300 cursor-pointer hover:shadow-lg ${
          isActive ? `ring-2 ring-teal-500/30 ${config.border}` : 'hover:border-teal-500/30'
        }`}
        onClick={onClick}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 ${config.accentBar}`} />
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgLight} ${config.text}`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{wing.name}</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">{wing.description || wing.wingKey}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${config.border} ${config.text}`}>
                P{wing.priority}
              </Badge>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-teal-500/10 text-teal-700">
                {totalDrawers} 抽屉
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {/* Priority bar */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">优先级</span>
              <span className="font-semibold" style={{ color: config.color }}>{wing.priority}/10</span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${wing.priority * 10}%`, backgroundColor: config.color }} />
            </div>
          </div>

          {/* Rooms list */}
          <div className="flex items-center justify-between mb-2" onClick={(e) => { e.stopPropagation() }}>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <DoorOpen className="h-3 w-3" /> {rooms.length} 个房间
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => { e.stopPropagation(); onClick() }}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 pt-1">
                  {rooms.map((room) => {
                    const hallBadge = getHallTypeBadge(room.hallType)
                    const isRoomActive = activeRoomId === room.id
                    return (
                      <button
                        key={room.id}
                        onClick={(e) => { e.stopPropagation(); onRoomClick(room) }}
                        className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-all text-xs ${
                          isRoomActive
                            ? `bg-teal-500/10 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500/20`
                            : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <DoorOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate">{room.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 ${hallBadge.color}`}>{hallBadge.label}</Badge>
                          <span className="text-[9px] text-muted-foreground">{room._count?.drawers || 0}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function WingCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-1 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-28" /></div>
          </div>
          <div className="flex gap-1.5"><Skeleton className="h-4 w-8 rounded-full" /><Skeleton className="h-4 w-12 rounded-full" /></div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="space-y-1"><div className="flex justify-between"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-8" /></div><Skeleton className="h-1 w-full rounded-full" /></div>
        <div className="space-y-1.5"><Skeleton className="h-8 w-full rounded-md" /><Skeleton className="h-8 w-full rounded-md" /></div>
      </CardContent>
    </Card>
  )
}

function DrawerCard({ drawer, onExpand }: { drawer: DrawerRow; onExpand: () => void }) {
  const sourceBadge = getSourceTypeBadge(drawer.sourceType)
  const expired = isExpired(drawer.validTo)
  const tags = drawer.tags ? drawer.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group border-border/60 transition-all duration-200 hover:border-teal-500/30 hover:shadow-sm ${expired ? 'opacity-60' : ''}`}>
        <CardContent className="p-4 space-y-2.5">
          {/* Content preview */}
          <p className="text-xs leading-relaxed line-clamp-3">{drawer.content}</p>

          {/* AAAK summary */}
          {drawer.aaaakSummary && (
            <div className="rounded-md bg-amber-500/5 border border-amber-200/40 px-2.5 py-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="text-[9px] font-semibold text-amber-600">AAAK</span>
              </div>
              <code className="text-[10px] text-amber-700 dark:text-amber-400 font-mono leading-tight">{drawer.aaaakSummary}</code>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${sourceBadge.color}`}>{sourceBadge.label}</Badge>

            {/* Importance stars */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-2.5 w-2.5 ${i < drawer.importance ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
              ))}
            </div>

            {/* Validity indicator */}
            <div className="flex items-center gap-1">
              <Circle className={`h-2 w-2 ${expired ? 'text-red-500 fill-red-500' : 'text-emerald-500 fill-emerald-500'}`} />
              <span className="text-[9px] text-muted-foreground">
                {expired ? `过期 ${formatDate(drawer.validTo)}` : '有效'}
              </span>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-[8px] px-1.5 py-0 bg-teal-500/10 text-teal-700 dark:text-teal-400 border-0">
                  <Tag className="h-2 w-2 mr-0.5" />{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{drawer.accessCount}</span>
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatDate(drawer.lastAccessedAt)}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5" onClick={onExpand}>
              展开 <ArrowRight className="h-2.5 w-2.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DrawerSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="flex gap-1.5"><Skeleton className="h-4 w-10 rounded-full" /><Skeleton className="h-4 w-16 rounded-full" /></div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

interface MemoryPalaceProps {
  onNavigate?: (module: string) => void
}

export function MemoryPalace({ onNavigate: _onNavigate }: MemoryPalaceProps) {
  const [expandedWingId, setExpandedWingId] = useState<string | null>(null)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [activeWingId, setActiveWingId] = useState<string | null>(null)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [addTripleOpen, setAddTripleOpen] = useState(false)
  const [newDrawerContent, setNewDrawerContent] = useState('')
  const [newDrawerImportance, setNewDrawerImportance] = useState([3])
  const [newDrawerTags, setNewDrawerTags] = useState('')
  const [tripleSubject, setTripleSubject] = useState('')
  const [triplePredicate, setTriplePredicate] = useState('')
  const [tripleObject, setTripleObject] = useState('')
  const [expandedDrawerId, setExpandedDrawerId] = useState<string | null>(null)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [wakeLayer, setWakeLayer] = useState<number>(0)
  const { toast } = useToast()

  // ── Data hooks ──────────────────────────────────────────────────
  const { data: palaceData, isLoading: palaceLoading } = useMemoryPalace()
  const { data: drawersData, isLoading: drawersLoading } = useMemoryDrawers(
    activeRoomId ? { roomId: activeRoomId } : undefined
  )
  const createDrawerMutation = useCreateDrawer()
  const { data: tunnelsData, isLoading: tunnelsLoading } = useMemoryTunnels()
  const { data: wakeData, isLoading: wakeLoading } = useMemoryWake()
  const { data: entitiesData, isLoading: entitiesLoading } = useKGEntities(entityTypeFilter || undefined)
  const { data: triplesData, isLoading: triplesLoading } = useKGTriples(selectedEntity || undefined)
  const addTripleMutation = useAddKGTriple()
  const discoverTunnelsMutation = useDiscoverTunnels()

  // ── Derived data with fallbacks ──────────────────────────────────
  const wings: WingRow[] = useMemo(
    () => {
      const w = palaceData?.wings || palaceData?.data?.wings
      if (w && Array.isArray(w) && w.length > 0) return w
      return FALLBACK_WINGS
    },
    [palaceData]
  )

  const drawers: DrawerRow[] = useMemo(
    () => {
      const d = drawersData?.drawers || drawersData?.data?.drawers
      if (d && Array.isArray(d) && d.length > 0) return d
      if (activeRoomId) return FALLBACK_DRAWERS.filter(dr => dr.roomId === activeRoomId)
      return FALLBACK_DRAWERS
    },
    [drawersData, activeRoomId]
  )

  const tunnels: TunnelRow[] = useMemo(
    () => {
      const t = tunnelsData?.tunnels || tunnelsData?.data?.tunnels
      if (t && Array.isArray(t)) return t
      return FALLBACK_TUNNELS
    },
    [tunnelsData]
  )

  const wake: WakeData = useMemo(
    () => wakeData?.data || wakeData || FALLBACK_WAKE,
    [wakeData]
  )

  const entities: EntityRow[] = useMemo(
    () => {
      const e = entitiesData?.entities || entitiesData?.data?.entities
      if (e && Array.isArray(e)) return e
      return FALLBACK_ENTITIES
    },
    [entitiesData]
  )

  const triples: TripleRow[] = useMemo(
    () => {
      const t = triplesData?.triples || triplesData?.data?.triples
      if (t && Array.isArray(t)) return t
      return FALLBACK_TRIPLES
    },
    [triplesData]
  )

  // ── Stats ───────────────────────────────────────────────────────
  const totalWings = wings.length
  const totalRooms = wings.reduce((s, w) => s + (w.rooms?.length || 0), 0)
  const totalDrawers = wings.reduce((s, w) => s + (w.rooms?.reduce((s2, r) => s2 + (r._count?.drawers || 0), 0) || 0), 0)
  const totalTunnels = tunnels.length

  // ── Handlers ────────────────────────────────────────────────────
  const handleWingClick = (wingId: string) => {
    if (expandedWingId === wingId) {
      setExpandedWingId(null)
    } else {
      setExpandedWingId(wingId)
      setActiveWingId(wingId)
    }
  }

  const handleRoomClick = (room: RoomRow) => {
    setActiveRoomId(activeRoomId === room.id ? null : room.id)
  }

  const handleCreateDrawer = async () => {
    if (!newDrawerContent.trim() || !activeRoomId) return
    try {
      await createDrawerMutation.mutateAsync({
        roomId: activeRoomId,
        content: newDrawerContent,
        sourceType: 'manual',
        importance: newDrawerImportance[0],
        tags: newDrawerTags ? newDrawerTags.split(',').map(t => t.trim()) : undefined,
      })
      toast({ title: '记忆已添加', description: '新记忆抽屉创建成功' })
      setAddDrawerOpen(false)
      setNewDrawerContent('')
      setNewDrawerImportance([3])
      setNewDrawerTags('')
    } catch {
      toast({ title: '添加失败', description: '创建记忆抽屉时出错', variant: 'destructive' })
    }
  }

  const handleAddTriple = async () => {
    if (!tripleSubject.trim() || !triplePredicate.trim() || !tripleObject.trim()) return
    try {
      await addTripleMutation.mutateAsync({
        subjectName: tripleSubject,
        predicate: triplePredicate,
        objectName: tripleObject,
      })
      toast({ title: '关系已添加', description: '知识图谱三元组创建成功' })
      setAddTripleOpen(false)
      setTripleSubject('')
      setTriplePredicate('')
      setTripleObject('')
    } catch {
      toast({ title: '添加失败', description: '创建知识关系时出错', variant: 'destructive' })
    }
  }

  const handleDiscoverTunnels = async () => {
    try {
      await discoverTunnelsMutation.mutateAsync()
      toast({ title: '隧道发现完成', description: '已自动检测跨翼连接' })
    } catch {
      toast({ title: '发现失败', description: '隧道自动发现出错', variant: 'destructive' })
    }
  }

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null
    for (const w of wings) {
      const room = w.rooms?.find(r => r.id === activeRoomId)
      if (room) return room
    }
    return null
  }, [wings, activeRoomId])

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* ── A. Header Section ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">记忆宫殿</h1>
            <p className="text-xs text-muted-foreground">Memory Palace · 层次化记忆系统</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] gap-1 border-teal-200 text-teal-700 dark:text-teal-400">
            <Building2 className="h-3 w-3" />{totalWings} 翼
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 border-teal-200 text-teal-700 dark:text-teal-400">
            <DoorOpen className="h-3 w-3" />{totalRooms} 房间
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 border-teal-200 text-teal-700 dark:text-teal-400">
            <Archive className="h-3 w-3" />{totalDrawers} 抽屉
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 border-emerald-200 text-emerald-700 dark:text-emerald-400">
            <Zap className="h-3 w-3" />L0+L1 已加载
          </Badge>
        </div>
      </div>

      {/* ── B. Palace Map ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-semibold">宫殿地图</h2>
          <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-700">5 Wings</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {palaceLoading ? (
            Array.from({ length: 5 }).map((_, i) => <WingCardSkeleton key={i} />)
          ) : (
            wings.map((wing) => (
              <WingCard
                key={wing.id}
                wing={wing}
                isActive={activeWingId === wing.id}
                expanded={expandedWingId === wing.id}
                onClick={() => handleWingClick(wing.id)}
                onRoomClick={handleRoomClick}
                activeRoomId={activeRoomId}
              />
            ))
          )}
        </div>
      </section>

      {/* ── C. Drawer Timeline ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold">
              {activeRoom ? `${activeRoom.name} · 抽屉` : '记忆抽屉时间线'}
            </h2>
            <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-700">{drawers.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {activeRoomId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-7 text-muted-foreground"
                onClick={() => setActiveRoomId(null)}
              >
                查看全部
              </Button>
            )}
            <Button
              size="sm"
              className="gap-1 text-xs bg-teal-500 hover:bg-teal-600 text-white"
              onClick={() => setAddDrawerOpen(true)}
              disabled={!activeRoomId}
            >
              <Plus className="h-3 w-3" />
              添加记忆
            </Button>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {drawersLoading ? (
            Array.from({ length: 3 }).map((_, i) => <DrawerSkeleton key={i} />)
          ) : drawers.length > 0 ? (
            drawers.map((drawer) => (
              <DrawerCard
                key={drawer.id}
                drawer={drawer}
                onExpand={() => setExpandedDrawerId(expandedDrawerId === drawer.id ? null : drawer.id)}
              />
            ))
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Archive className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">选择一个房间查看记忆抽屉</p>
                <p className="text-[10px] mt-1">点击上方宫殿地图中的房间名称</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Expanded drawer dialog */}
        <Dialog open={!!expandedDrawerId} onOpenChange={(open) => { if (!open) setExpandedDrawerId(null) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm">记忆详情</DialogTitle>
              <DialogDescription className="text-xs">完整的记忆抽屉内容</DialogDescription>
            </DialogHeader>
            {expandedDrawerId && (() => {
              const drawer = drawers.find(d => d.id === expandedDrawerId)
              if (!drawer) return null
              const sourceBadge = getSourceTypeBadge(drawer.sourceType)
              const tags = drawer.tags ? drawer.tags.split(',').map(t => t.trim()).filter(Boolean) : []
              return (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/60 p-3 bg-muted/30">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{drawer.content}</p>
                  </div>
                  {drawer.aaaakSummary && (
                    <div className="rounded-md bg-amber-500/5 border border-amber-200/40 px-3 py-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-semibold text-amber-600">AAAK 压缩摘要</span>
                      </div>
                      <code className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">{drawer.aaaakSummary}</code>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${sourceBadge.color}`}>{sourceBadge.label}</Badge>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < drawer.importance ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-teal-500/10 text-teal-700 dark:text-teal-400 border-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />访问 {drawer.accessCount} 次</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatDate(drawer.lastAccessedAt)}</span>
                    <span className="flex items-center gap-0.5">
                      <Circle className={`h-2.5 w-2.5 ${isExpired(drawer.validTo) ? 'text-red-500 fill-red-500' : 'text-emerald-500 fill-emerald-500'}`} />
                      {isExpired(drawer.validTo) ? '已过期' : '有效'}
                    </span>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      </section>

      {/* ── D. Knowledge Graph Panel ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold">知识图谱</h2>
            <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-700">{entities.length} 实体</Badge>
          </div>
          <Button
            size="sm"
            className="gap-1 text-xs bg-teal-500 hover:bg-teal-600 text-white"
            onClick={() => setAddTripleOpen(true)}
          >
            <Plus className="h-3 w-3" />
            添加关系
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Entity List */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold">实体列表</CardTitle>
                <div className="flex gap-1">
                  {['', 'person', 'project', 'technology', 'concept', 'organization'].map((type) => {
                    const badge = type ? getEntityTypeBadge(type) : { label: '全部' }
                    return (
                      <Button
                        key={type || 'all'}
                        variant={entityTypeFilter === type ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-5 text-[8px] px-1.5 ${entityTypeFilter === type ? 'bg-teal-500 text-white' : ''}`}
                        onClick={() => { setEntityTypeFilter(type); setSelectedEntity('') }}
                      >
                        {badge.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-64">
                {entitiesLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded" />
                        <div className="flex-1 space-y-1"><Skeleton className="h-3 w-20" /><Skeleton className="h-2 w-12" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {entities.map((entity) => {
                      const badge = getEntityTypeBadge(entity.entityType)
                      const isSelected = selectedEntity === entity.entityName
                      return (
                        <button
                          key={entity.id}
                          onClick={() => setSelectedEntity(isSelected ? '' : entity.entityName)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                            isSelected ? 'bg-teal-500/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded ${badge.color.split(' ')[0]}`}>
                            <Network className={`h-3 w-3 ${badge.color.split(' ')[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{entity.entityName}</p>
                            {entity.description && <p className="text-[9px] text-muted-foreground truncate">{entity.description}</p>}
                          </div>
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 shrink-0 ${badge.color}`}>{badge.label}</Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Triple Table */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold">
                  关系三元组 {selectedEntity && `· ${selectedEntity}`}
                </CardTitle>
                <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-700">{triples.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-64">
                {triplesLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {triples.map((triple) => {
                      const expired = isExpired(triple.validTo)
                      return (
                        <div key={triple.id} className={`px-3 py-2.5 space-y-1.5 ${expired ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-1 text-xs flex-wrap">
                            <span className={`font-medium ${expired ? 'line-through' : ''}`}>{triple.subjectName}</span>
                            <ArrowRight className="h-3 w-3 text-teal-500 shrink-0" />
                            <span className="text-teal-600 dark:text-teal-400 font-medium">{triple.predicate}</span>
                            <ArrowRight className="h-3 w-3 text-teal-500 shrink-0" />
                            <span className={`font-medium ${expired ? 'line-through' : ''}`}>{triple.objectName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Confidence bar */}
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-[9px] text-muted-foreground shrink-0">置信度</span>
                              <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${triple.confidence > 0.8 ? 'bg-emerald-500' : triple.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${triple.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-muted-foreground shrink-0">{Math.round(triple.confidence * 100)}%</span>
                            </div>
                            {/* Validity */}
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Circle className={`h-2 w-2 ${expired ? 'text-red-500 fill-red-500' : 'text-emerald-500 fill-emerald-500'}`} />
                              {expired ? `过期 ${formatDate(triple.validTo)}` : '当前有效'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── E. Tunnel Discovery Panel ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold">跨翼隧道</h2>
            <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-700">{totalTunnels} 条</Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs border-teal-200 text-teal-700 hover:bg-teal-500/10"
            onClick={handleDiscoverTunnels}
            disabled={discoverTunnelsMutation.isPending}
          >
            {discoverTunnelsMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Lightbulb className="h-3 w-3" />
            )}
            自动发现隧道
          </Button>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4">
            {tunnelsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : tunnels.length > 0 ? (
              <div className="space-y-3">
                {tunnels.map((tunnel) => {
                  const fromName = tunnel.fromRoom?.name || tunnel.fromRoomId
                  const toName = tunnel.toRoom?.name || tunnel.toRoomId
                  const fromWing = tunnel.fromRoom?.wing?.name
                  const toWing = tunnel.toRoom?.wing?.name
                  return (
                    <motion.div
                      key={tunnel.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:border-teal-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-500/10 text-teal-600">
                          <DoorOpen className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{fromName}</p>
                          {fromWing && <p className="text-[9px] text-muted-foreground">{fromWing}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <div className="flex items-center gap-1">
                          <div className="h-px w-6 bg-teal-300" />
                          <Link2 className="h-4 w-4 text-teal-500" />
                          <div className="h-px w-6 bg-teal-300" />
                        </div>
                        {tunnel.sharedTheme && (
                          <span className="text-[8px] text-teal-600 bg-teal-500/10 px-1.5 py-0.5 rounded">
                            {tunnel.sharedTheme}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{toName}</p>
                          {toWing && <p className="text-[9px] text-muted-foreground">{toWing}</p>}
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-500/10 text-teal-600">
                          <DoorOpen className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Strength indicator */}
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] text-muted-foreground">强度</span>
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${tunnel.strength > 0.8 ? 'bg-emerald-500' : tunnel.strength > 0.5 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${tunnel.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-medium text-muted-foreground">{Math.round(tunnel.strength * 100)}%</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Link2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">暂无隧道</p>
                <p className="text-[10px] mt-1">点击"自动发现隧道"检测跨翼连接</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── F. Memory Wake Preview ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-semibold">记忆唤醒预览</h2>
            <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700">
              {wake.totalTokens || 0} tokens
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((layer) => (
              <Button
                key={layer}
                variant={wakeLayer === layer ? 'default' : 'ghost'}
                size="sm"
                className={`h-6 text-[9px] px-2 ${wakeLayer === layer ? 'bg-teal-500 text-white' : ''}`}
                onClick={() => setWakeLayer(layer)}
              >
                L{layer}
              </Button>
            ))}
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            {wakeLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                {/* L0 - Identity */}
                {(wakeLayer === 0 || wakeLayer === 1) && wake.L0 && (
                  <div className="rounded-lg border border-teal-200/40 bg-teal-500/[0.03] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-teal-200 text-teal-700 bg-teal-500/10">L0</Badge>
                        <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">身份核心</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">{wake.L0.tokens} tokens</span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{wake.L0.content}</p>
                  </div>
                )}

                {/* L1 - Essential Facts */}
                {(wakeLayer === 0 || wakeLayer === 1) && wake.L1 && wake.L1.items.length > 0 && (
                  <div className="rounded-lg border border-amber-200/40 bg-amber-500/[0.03] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-500/10">L1</Badge>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">关键事实 (AAAK)</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {wake.L1.items.reduce((s, i) => s + i.tokens, 0)} tokens
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {wake.L1.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Zap className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                          <code className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">{item.content}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* L2/L3 Placeholder */}
                {wakeLayer >= 2 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">
                      L{wakeLayer} 层记忆按需加载
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      此层记忆在对话或周期中按需从数据库检索
                    </p>
                  </div>
                )}

                {/* Token usage summary */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                  <span>唤醒总量: {wake.totalTokens || 0} tokens</span>
                  <span>L0+L1 常驻内存 · L2/L3 按需检索</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Add Drawer Dialog ──────────────────────────────────────── */}
      <Dialog open={addDrawerOpen} onOpenChange={setAddDrawerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">添加记忆</DialogTitle>
            <DialogDescription className="text-xs">
              向 {activeRoom?.name || '当前房间'} 添加新的记忆抽屉
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">内容</label>
              <Textarea
                value={newDrawerContent}
                onChange={(e) => setNewDrawerContent(e.target.value)}
                placeholder="输入记忆内容..."
                rows={4}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">重要性</label>
                <span className="text-xs text-teal-600 font-semibold">{newDrawerImportance[0]} / 5</span>
              </div>
              <Slider
                value={newDrawerImportance}
                onValueChange={setNewDrawerImportance}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>低</span>
                <span>高</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">标签（逗号分隔）</label>
              <Input
                value={newDrawerTags}
                onChange={(e) => setNewDrawerTags(e.target.value)}
                placeholder="标签1, 标签2, ..."
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddDrawerOpen(false)} className="text-xs">取消</Button>
            <Button
              size="sm"
              className="text-xs bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleCreateDrawer}
              disabled={!newDrawerContent.trim() || createDrawerMutation.isPending}
            >
              {createDrawerMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Triple Dialog ──────────────────────────────────────── */}
      <Dialog open={addTripleOpen} onOpenChange={setAddTripleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">添加知识关系</DialogTitle>
            <DialogDescription className="text-xs">创建新的知识图谱三元组</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">主体 (Subject)</label>
              <Input
                value={tripleSubject}
                onChange={(e) => setTripleSubject(e.target.value)}
                placeholder="实体名称"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">谓词 (Predicate)</label>
              <Input
                value={triplePredicate}
                onChange={(e) => setTriplePredicate(e.target.value)}
                placeholder="关系类型 (如: 创建, 采用, 依赖)"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">客体 (Object)</label>
              <Input
                value={tripleObject}
                onChange={(e) => setTripleObject(e.target.value)}
                placeholder="实体名称"
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddTripleOpen(false)} className="text-xs">取消</Button>
            <Button
              size="sm"
              className="text-xs bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleAddTriple}
              disabled={!tripleSubject.trim() || !triplePredicate.trim() || !tripleObject.trim() || addTripleMutation.isPending}
            >
              {addTripleMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              创建关系
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
