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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Flag,
  Zap,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type MilestoneStatus = 'completed' | 'in_progress' | 'pending'

interface Milestone {
  label: string
  status: MilestoneStatus
}

interface Phase {
  id: number
  title: string
  period: string
  status: 'active' | 'pending'
  progress: number
  goal: string
  criteria: string
  milestones: Milestone[]
}

interface Metric {
  label: string
  value: string
  target: string
  status: 'pass' | 'na' | 'pending'
  phase: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const phases: Phase[] = [
  {
    id: 1,
    title: '基建与协议验证',
    period: 'D1-D30',
    status: 'active',
    progress: 60,
    goal:
      '实现"输入一段访谈记录 → 自动提取假设 → 生成带哈希的VC凭证"',
    criteria: '凭证生成时间 < 2秒，链上查询延迟 < 500ms',
    milestones: [
      { label: '搭建 Qdrant 向量库', status: 'completed' },
      { label: '接入 W3C VC 签发模块', status: 'completed' },
      { label: '定义证据数据模型', status: 'completed' },
      { label: '实现访谈记录→假设提取管道', status: 'in_progress' },
      { label: '凭证生成性能优化', status: 'pending' },
      { label: '链上查询延迟测试', status: 'pending' },
      { label: 'Benchmark 验收', status: 'pending' },
    ],
  },
  {
    id: 2,
    title: '认知分身MVP',
    period: 'D31-D60',
    status: 'pending',
    progress: 0,
    goal:
      '上线"虚拟红蓝对抗"功能。输入新想法，分身必须输出至少3个致命漏洞',
    criteria:
      '分身找出的漏洞，经人工复核，准确率需 > 70%。达不到就换基座模型',
    milestones: [
      { label: '导入创始人过去3年决策日志', status: 'pending' },
      { label: '导入Code Review记录和项目文档', status: 'pending' },
      { label: '训练首个LoRA适配器', status: 'pending' },
      { label: '实现红蓝对抗交互界面', status: 'pending' },
      { label: '人工复核准确率测试', status: 'pending' },
      { label: '基座模型评估与切换', status: 'pending' },
    ],
  },
  {
    id: 3,
    title: '流体协作闭环',
    period: 'D61-D90',
    status: 'pending',
    progress: 0,
    goal:
      '验证"任务发布 → 节点接单 → 代码提交 → 自动化审计 → 微支付结算"全链路',
    criteria:
      '完成至少10次无摩擦的外部协作。系统无资金卡死或权限越界Bug',
    milestones: [
      { label: '接入外部开发者节点', status: 'pending' },
      { label: '发布首个基于微支付的开源任务', status: 'pending' },
      { label: '实现自动化CI/CD管道', status: 'pending' },
      { label: '安全扫描集成', status: 'pending' },
      { label: '微支付结算网关上线', status: 'pending' },
      { label: '10次协作全链路验收测试', status: 'pending' },
    ],
  },
]

const metrics: Metric[] = [
  { label: '凭证生成时间', value: '1.8s', target: '< 2s', status: 'pass', phase: 'Phase 1' },
  { label: '链上查询延迟', value: '380ms', target: '< 500ms', status: 'pass', phase: 'Phase 1' },
  { label: '分身漏洞准确率', value: 'N/A', target: '> 70%', status: 'na', phase: 'Phase 2' },
  { label: '外部协作完成数', value: '0', target: '10次', status: 'pending', phase: 'Phase 3' },
  { label: '系统资金异常', value: '0', target: '0', status: 'pass', phase: '全局' },
  { label: '权限越界Bug', value: '0', target: '0', status: 'pass', phase: '全局' },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function MilestoneIcon({ status }: { status: MilestoneStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
    case 'in_progress':
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
    case 'pending':
      return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
  }
}

function StatusBadge({ status }: { status: 'active' | 'pending' }) {
  if (status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
        <Zap className="mr-1 h-3 w-3" />
        进行中
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      <Clock className="mr-1 h-3 w-3" />
      待启动
    </Badge>
  )
}

function PhaseCard({ phase }: { phase: Phase }) {
  const [expanded, setExpanded] = useState(phase.status === 'active')

  const completedCount = phase.milestones.filter(
    (m) => m.status === 'completed'
  ).length
  const totalCount = phase.milestones.length

  const phaseColor =
    phase.status === 'active'
      ? 'border-emerald-200 bg-emerald-50/30'
      : 'border-border'

  return (
    <Card className={`transition-all duration-200 ${phaseColor}`}>
      {/* Header — always visible */}
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <CardHeader className="flex-1 py-4 px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Flag className="h-3.5 w-3.5" />
              Phase {phase.id}
            </span>
            <span className="text-lg font-semibold tracking-tight">
              {phase.title}
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {phase.period}
            </Badge>
            <StatusBadge status={phase.status} />
          </div>
          {/* Progress mini bar */}
          <div className="mt-2 flex items-center gap-3">
            <Progress
              value={phase.progress}
              className="h-2 flex-1"
            />
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {completedCount}/{totalCount} 里程碑 · {phase.progress}%
            </span>
          </div>
        </CardHeader>
        <div className="pr-6 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <CardContent className="px-6 pb-6 pt-0 space-y-5">
          <Separator />

          {/* Goal */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Target className="h-4 w-4 text-emerald-600" />
              目标
            </div>
            <p className="pl-5.5 text-sm text-muted-foreground leading-relaxed">
              {phase.goal}
            </p>
          </div>

          {/* Criteria */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              验收标准
            </div>
            <p className="pl-5.5 text-sm text-muted-foreground leading-relaxed">
              {phase.criteria}
            </p>
          </div>

          <Separator />

          {/* Milestones checklist */}
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-foreground mb-2">
              里程碑清单
            </div>
            {phase.milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <MilestoneIcon status={milestone.status} />
                <span
                  className={`text-sm ${
                    milestone.status === 'completed'
                      ? 'text-muted-foreground line-through'
                      : milestone.status === 'in_progress'
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {milestone.label}
                </span>
                {milestone.status === 'in_progress' && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] border-amber-300 text-amber-600 bg-amber-50"
                  >
                    进行中
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RoadmapTrackerView() {
  const currentDay = 18
  const totalDays = 90
  const overallProgress = Math.round((currentDay / totalDays) * 100)

  return (
    <div className="space-y-6">
      {/* ── Roadmap Overview ──────────────────────────────────────────────── */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                90天硬核序列
              </CardTitle>
              <CardDescription className="text-sm">
                不追求大而全，先跑通核心链路
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                <Calendar className="mr-1 h-3 w-3" />
                第 {currentDay} 天
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                Phase 1 进行中
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">整体进度</span>
            <span className="font-semibold text-emerald-700">
              Day {currentDay} / {totalDays}（{overallProgress}%）
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          {/* Phase timeline markers */}
          <div className="relative mt-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>D1</span>
              <span>D30</span>
              <span>D60</span>
              <span>D90</span>
            </div>
            <div className="absolute top-0 left-0 right-0 flex justify-between">
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
            </div>
          </div>
          {/* Phase summaries */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {phases.map((p) => (
              <div
                key={p.id}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  p.status === 'active'
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="text-[11px] font-medium text-muted-foreground">
                  Phase {p.id}
                </div>
                <div
                  className={`text-lg font-bold ${
                    p.status === 'active' ? 'text-emerald-700' : 'text-muted-foreground/60'
                  }`}
                >
                  {p.progress}%
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {p.title}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Phase Cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ArrowRight className="h-4 w-4 text-emerald-600" />
          阶段详情
        </div>
        {phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>

      {/* ── Key Metrics ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">关键指标追踪</CardTitle>
          </div>
          <CardDescription>实时验收指标，硬性标准不容妥协</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: card list / Desktop: table-like rows */}
          <div className="space-y-2">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                {/* Label */}
                <div className="flex items-center gap-2 sm:w-[200px] shrink-0">
                  {metric.status === 'pass' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : metric.status === 'na' ? (
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  ) : (
                    <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                {/* Value & Target */}
                <div className="flex items-center gap-3 pl-6 sm:pl-0 sm:flex-1 sm:justify-between">
                  <span className="text-sm text-foreground font-semibold">
                    {metric.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    目标 {metric.target}
                  </span>
                </div>
                {/* Phase tag & Status */}
                <div className="flex items-center gap-2 pl-6 sm:pl-0 sm:shrink-0 sm:w-[120px] sm:justify-end">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {metric.phase}
                  </Badge>
                  {metric.status === 'pass' ? (
                    <span className="text-xs font-medium text-emerald-600">✅ 达标</span>
                  ) : metric.status === 'na' ? (
                    <span className="text-xs text-muted-foreground">待验证</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600">进行中</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Summary row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                达标: {metrics.filter((m) => m.status === 'pass').length}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                进行中: {metrics.filter((m) => m.status === 'pending').length}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                待验证: {metrics.filter((m) => m.status === 'na').length}
              </span>
            </div>
            <span className="text-xs">
              最后更新: {new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
