'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Box,
  Eye,
  MousePointer,
  Mic,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Layers,
  Globe,
  Sparkles,
  Code,
  Zap,
  Move3d,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProjectType = '3d_prototype' | 'spatial_ui' | 'ar_scene'
type ProjectStatus = 'interactive' | 'building' | 'published' | 'draft'

interface PrototypeProject {
  name: string
  type: ProjectType
  status: ProjectStatus
  xdpEnabled: boolean
  version: number
}

interface InteractionLoop {
  trigger: string
  triggerType: string
  action: string
  actionType: string
  response: string
  stateChange: string
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const prototypeProjects: PrototypeProject[] = [
  { name: 'SpaceUI-v2', type: '3d_prototype', status: 'interactive', xdpEnabled: true, version: 3 },
  { name: 'Dashboard-AR', type: 'spatial_ui', status: 'building', xdpEnabled: true, version: 1 },
  { name: 'ProductWalkthrough', type: '3d_prototype', status: 'published', xdpEnabled: false, version: 5 },
  { name: 'InvestorPitch3D', type: '3d_prototype', status: 'interactive', xdpEnabled: true, version: 2 },
  { name: 'DataViz-Spatial', type: 'ar_scene', status: 'draft', xdpEnabled: false, version: 1 },
]

const interactionLoops: InteractionLoop[] = [
  {
    trigger: '点击产品卡片',
    triggerType: 'click',
    action: '展开3D详情',
    actionType: 'navigate',
    response: '显示规格动画',
    stateChange: '标记已浏览',
  },
  {
    trigger: '凝视导航点',
    triggerType: 'gaze',
    action: '平滑位移',
    actionType: 'animate',
    response: '环境音效',
    stateChange: '更新位置',
  },
  {
    trigger: '语音搜索',
    triggerType: 'voice',
    action: 'AI解析意图',
    actionType: 'data_fetch',
    response: '高亮匹配项',
    stateChange: '记录搜索',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeLabel(t: ProjectType): string {
  switch (t) {
    case '3d_prototype':
      return '3D 原型'
    case 'spatial_ui':
      return '空间 UI'
    case 'ar_scene':
      return 'AR 场景'
  }
}

function typeColor(t: ProjectType): string {
  switch (t) {
    case '3d_prototype':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'spatial_ui':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
    case 'ar_scene':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }
}

function statusLabel(s: ProjectStatus): string {
  switch (s) {
    case 'interactive':
      return '交互中'
    case 'building':
      return '构建中'
    case 'published':
      return '已发布'
    case 'draft':
      return '草稿'
  }
}

function statusColor(s: ProjectStatus): string {
  switch (s) {
    case 'interactive':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'building':
      return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
    case 'published':
      return 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
    case 'draft':
      return 'bg-gray-500/15 text-gray-500 dark:text-gray-400'
  }
}

function triggerIcon(type: string) {
  switch (type) {
    case 'click':
      return <MousePointer className="h-3.5 w-3.5" />
    case 'gaze':
      return <Eye className="h-3.5 w-3.5" />
    case 'proximity':
      return <Move3d className="h-3.5 w-3.5" />
    case 'voice':
      return <Mic className="h-3.5 w-3.5" />
    default:
      return <Zap className="h-3.5 w-3.5" />
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: number
  description: string
}) {
  return (
    <Card className="relative overflow-hidden border-emerald-200/50 dark:border-emerald-800/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ProjectCard({
  project,
  xdpState,
  onToggleXdp,
}: {
  project: PrototypeProject
  xdpState: boolean
  onToggleXdp: () => void
}) {
  return (
    <Card className="group flex flex-col justify-between border-border/60 transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">{project.name}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            v{project.version}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge className={`text-[10px] ${typeColor(project.type)}`}>{typeLabel(project.type)}</Badge>
          <Badge className={`text-[10px] ${statusColor(project.status)}`}>{statusLabel(project.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>XDP:</span>
            <Switch
              checked={xdpState}
              onCheckedChange={onToggleXdp}
              className="scale-75 data-[state=checked]:bg-emerald-500"
            />
            <span className={xdpState ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
              {xdpState ? 'enabled' : 'disabled'}
            </span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            打开
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function XDPSandboxView() {
  // XDP toggle states per project (initialised from data)
  const [xdpToggles, setXdpToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(prototypeProjects.map((p) => [p.name, p.xdpEnabled]))
  )
  const [xdpProtocolEnabled, setXdpProtocolEnabled] = useState(true)
  const [selectedTriggerType, setSelectedTriggerType] = useState('click')
  const [selectedActionType, setSelectedActionType] = useState('navigate')

  const toggleXdp = (name: string) => {
    setXdpToggles((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* 1. 沙盒概览 Sandbox Overview                                       */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">沙盒概览</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Box className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            title="原型项目"
            value={5}
            description="活跃的空间计算原型总数"
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            title="已发布"
            value={2}
            description="已上线可公开访问的原型"
          />
          <StatCard
            icon={<Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            title="XDP协议启用"
            value={3}
            description="启用跨维度社交协议的原型"
          />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. 原型项目列表 Prototype Projects                                  */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">原型项目</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prototypeProjects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              xdpState={xdpToggles[project.name]}
              onToggleXdp={() => toggleXdp(project.name)}
            />
          ))}

          {/* Create new prototype button card */}
          <Card className="group flex flex-col items-center justify-center border-dashed border-emerald-300 bg-emerald-50/50 py-10 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/20 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30">
            <div className="mb-3 rounded-full bg-emerald-200 p-3 dark:bg-emerald-800/60">
              <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <Button variant="ghost" className="text-emerald-700 dark:text-emerald-300">
              创建新原型
            </Button>
          </Card>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. 3D视口预览区 3D Viewport Preview                                 */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">3D 视口预览</h2>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-700/30" style={{ background: '#0a0f1a' }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Play className="h-3.5 w-3.5" />
              <Pause className="h-3.5 w-3.5" />
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Maximize2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* 3D Viewport area */}
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden">
            {/* CSS Grid floor */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(16,185,129,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.35) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                transform: 'perspective(600px) rotateX(55deg)',
                transformOrigin: 'center 80%',
              }}
            />

            {/* Floating UI element - product card */}
            <div
              className="absolute left-1/2 top-1/3 z-10 w-52 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-500/30 bg-emerald-950/80 p-3 shadow-lg shadow-emerald-500/10 backdrop-blur-sm"
              style={{ transform: 'translate(-50%, -50%) perspective(800px) rotateY(-8deg) rotateX(4deg)' }}
            >
              <div className="mb-2 h-2 w-16 rounded-full bg-emerald-500/40" />
              <div className="mb-1 h-2 w-28 rounded-full bg-white/20" />
              <div className="mb-2 h-2 w-20 rounded-full bg-white/10" />
              <div className="flex gap-1.5">
                <span className="inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">
                  3D
                </span>
                <span className="inline-block rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/60">
                  Interactive
                </span>
              </div>
            </div>

            {/* Floating UI element - nav node */}
            <div
              className="absolute right-1/4 top-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-teal-400/40 bg-teal-900/60 shadow-lg shadow-teal-500/10 backdrop-blur-sm"
              style={{ transform: 'translate(50%, -50%) perspective(600px) translateZ(20px)' }}
            >
              <Globe className="h-4 w-4 text-teal-400" />
            </div>

            {/* Floating UI element - data panel */}
            <div
              className="absolute bottom-1/4 left-1/4 z-10 w-40 rounded-md border border-emerald-500/20 bg-emerald-950/70 p-2 shadow-md backdrop-blur-sm"
              style={{ transform: 'perspective(600px) rotateY(6deg) rotateX(-3deg)' }}
            >
              <div className="mb-1.5 flex items-center gap-1">
                <Code className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Data</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div className="h-1.5 w-3/4 rounded-full bg-emerald-500/60" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div className="h-1.5 w-1/2 rounded-full bg-teal-500/60" />
                </div>
              </div>
            </div>

            {/* Orbit controls hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] text-white/40 backdrop-blur-sm">
              拖拽旋转 · 滚轮缩放 · 右键平移
            </div>

            {/* Top-left overlay */}
            <div className="absolute left-4 top-4 rounded-md border border-emerald-500/30 bg-emerald-950/70 px-3 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm">
              SpaceUI-v2 &nbsp;|&nbsp; Interactive Mode
            </div>

            {/* Top-right overlay */}
            <div className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] tabular-nums text-white/50 backdrop-blur-sm">
              FPS: 60 &nbsp;|&nbsp; Draw Calls: 42
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. 交互循环编辑器 Interaction Loop Editor                           */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">核心交互循环定义</h2>
        </div>

        {/* Type selectors */}
        <div className="mb-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">触发类型:</span>
            <Select value={selectedTriggerType} onValueChange={setSelectedTriggerType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">click</SelectItem>
                <SelectItem value="gaze">gaze</SelectItem>
                <SelectItem value="proximity">proximity</SelectItem>
                <SelectItem value="voice">voice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">动作类型:</span>
            <Select value={selectedActionType} onValueChange={setSelectedActionType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="navigate">navigate</SelectItem>
                <SelectItem value="animate">animate</SelectItem>
                <SelectItem value="data_fetch">data_fetch</SelectItem>
                <SelectItem value="state_change">state_change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Interaction loop rows */}
        <div className="space-y-4">
          {interactionLoops.map((loop, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start gap-2 rounded-lg border border-border/50 bg-card p-4 sm:flex-row sm:items-center sm:gap-0"
            >
              {/* Trigger */}
              <Card className="flex-1 border-emerald-300/40 dark:border-emerald-700/40">
                <CardContent className="flex items-center gap-2 p-3">
                  <span className="shrink-0 rounded bg-emerald-100 p-1 dark:bg-emerald-900/40">
                    {triggerIcon(loop.triggerType)}
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      触发
                    </p>
                    <p className="text-sm font-medium">{loop.trigger}</p>
                  </div>
                </CardContent>
              </Card>

              <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

              {/* Action */}
              <Card className="flex-1 border-teal-300/40 dark:border-teal-700/40">
                <CardContent className="flex items-center gap-2 p-3">
                  <span className="shrink-0 rounded bg-teal-100 p-1 dark:bg-teal-900/40">
                    <Code className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      动作
                    </p>
                    <p className="text-sm font-medium">{loop.action}</p>
                  </div>
                </CardContent>
              </Card>

              <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

              {/* Response */}
              <Card className="flex-1 border-amber-300/40 dark:border-amber-700/40">
                <CardContent className="flex items-center gap-2 p-3">
                  <span className="shrink-0 rounded bg-amber-100 p-1 dark:bg-amber-900/40">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      响应
                    </p>
                    <p className="text-sm font-medium">{loop.response}</p>
                  </div>
                </CardContent>
              </Card>

              <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

              {/* State Change */}
              <Card className="flex-1 border-rose-300/40 dark:border-rose-700/40">
                <CardContent className="flex items-center gap-2 p-3">
                  <span className="shrink-0 rounded bg-rose-100 p-1 dark:bg-rose-900/40">
                    <Zap className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      状态变更
                    </p>
                    <p className="text-sm font-medium">{loop.stateChange}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Hard constraint warning */}
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20">
          <span className="text-amber-600 dark:text-amber-400">⚠️</span>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">硬性约束：</span>原型必须包含核心交互循环。不能只是静态展示模型。
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. XDP协议接口 XDP Protocol Interface                               */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">XDP 协议接口</h2>
        </div>

        <Card className="border-emerald-200/50 dark:border-emerald-800/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">跨维度社交协议 (XDP)</CardTitle>
                <CardDescription className="mt-1">v0.1.0-draft</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {xdpProtocolEnabled ? '已启用' : '已禁用'}
                </span>
                <Switch
                  checked={xdpProtocolEnabled}
                  onCheckedChange={setXdpProtocolEnabled}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Connected dimensions */}
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">连接维度</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: 'Web2D', status: 'active', color: 'emerald' },
                  { name: 'Web3D', status: 'active', color: 'emerald' },
                  { name: 'AR', status: 'standby', color: 'amber' },
                  { name: 'VR', status: 'planned', color: 'gray' },
                ].map((dim) => (
                  <div
                    key={dim.name}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dim.status === 'active'
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : dim.status === 'standby'
                            ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                            : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium">{dim.name}</span>
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[9px] ${
                        dim.status === 'active'
                          ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                          : dim.status === 'standby'
                            ? 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                            : 'border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {dim.status === 'active' ? '活跃' : dim.status === 'standby' ? '待命' : '计划中'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Asset migration */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">资产迁移状态</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">3</span>{' '}
                  个资产已迁移至XDP兼容格式
                </p>
              </div>
            </div>

            <Separator />

            {/* Identity bridging */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/40">
                <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium">身份桥接</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  did:piaoshu:0x3f...&nbsp;↔&nbsp;XDP:entity:spatial-001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
