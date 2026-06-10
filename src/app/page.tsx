'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Brain,
  Shield,
  Network,
  Box,
  Target,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  Zap,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  UserCircle2,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWebSocket, type WSEventType } from '@/lib/use-websocket'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { DashboardView } from '@/components/piaoshu/dashboard'
import { AvatarCloneView } from '@/components/piaoshu/avatar-clone'
import { CognitiveEngineView } from '@/components/piaoshu/cognitive-engine'
import { EvidenceChainView } from '@/components/piaoshu/evidence-chain'
import { CollaborationRouterView } from '@/components/piaoshu/collaboration-router'
import { XDPSandboxView } from '@/components/piaoshu/xdp-sandbox'
import { RoadmapTrackerView } from '@/components/piaoshu/roadmap-tracker'
import { AIChatWidget } from '@/components/piaoshu/ai-chat-widget'
import { AuthModal } from '@/components/piaoshu/auth-modal'

type ActiveModule = 'dashboard' | 'avatar' | 'cognitive' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap'

interface NavItem {
  id: ActiveModule
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '总览', sublabel: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
  { id: 'avatar', label: '分身系统', sublabel: 'Avatar Clone', icon: UserCircle2, color: 'text-violet-500' },
  { id: 'cognitive', label: '认知分片引擎', sublabel: 'Cognitive Sharding', icon: Brain, color: 'text-emerald-600' },
  { id: 'evidence', label: '可信证据链', sublabel: 'Evidence Chain', icon: Shield, color: 'text-teal-600' },
  { id: 'collaboration', label: '流体协作调度', sublabel: 'Fluid Router', icon: Network, color: 'text-cyan-600' },
  { id: 'sandbox', label: '虚实共生沙盒', sublabel: 'XDP Sandbox', icon: Box, color: 'text-amber-600' },
  { id: 'roadmap', label: '90天路线图', sublabel: 'Roadmap', icon: Target, color: 'text-rose-500' },
]

// Extracted sidebar component to avoid render-time component creation
interface SidebarContentProps {
  activeModule: ActiveModule
  sidebarCollapsed: boolean
  theme: string | undefined
  onNavigate: (module: ActiveModule) => void
  onToggleTheme: () => void
  onMobileClose?: () => void
}

function SidebarContent({ activeModule, sidebarCollapsed, theme, onNavigate, onToggleTheme, onMobileClose }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 h-10 w-10">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight text-foreground truncate">飘数 Piaoshu</span>
              <span className="text-[10px] text-muted-foreground font-mono">FOUNDER OS v0.1</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="mx-3 my-2" />

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive = activeModule === item.id
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      onNavigate(item.id)
                      onMobileClose?.()
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                        : "text-muted-foreground border border-transparent",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? item.color : '')} />
                    {!sidebarCollapsed && (
                      <div className="flex flex-col items-start min-w-0">
                        <span className="truncate text-sm">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">{item.sublabel}</span>
                      </div>
                    )}
                    {!sidebarCollapsed && isActive && (
                      <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0">
                        Active
                      </Badge>
                    )}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                    <span className="block text-xs text-muted-foreground">{item.sublabel}</span>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>

      <Separator className="mx-3 my-2" />

      {/* System Status */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-2">
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">系统状态</span>
              <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0">
                运行中
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Phase</span>
                <span className="font-semibold">1/3</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Day</span>
                <span className="font-semibold">18/90</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">分身</span>
                <span className="font-semibold text-emerald-600">3 Active</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">凭证</span>
                <span className="font-semibold text-teal-600">12 Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-3 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={onToggleTheme}
        >
          {theme === undefined ? (
            <Sun className="h-4 w-4" />
          ) : theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!sidebarCollapsed && (
            <span className="ml-2 text-xs">
              {theme === undefined ? '' : theme === 'dark' ? '浅色' : '深色'}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

// Map WS event types to friendly Chinese labels
const EVENT_LABELS: Record<WSEventType, string> = {
  'task:updated': '任务更新',
  'task:created': '新任务',
  'shard:updated': '分片更新',
  'simulation:completed': '模拟完成',
  'node:status': '节点状态',
  'notification': '通知',
  'agent:status': '分身状态',
  'agent:cycle': '周期事件',
  'agent:output': '新产出',
  'clone:activity': '分身活动',
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { connected, lastEvent } = useWebSocket()
  const lastToastRef = useRef<string | null>(null)
  const { data: session } = useSession()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Only render theme-dependent UI after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // Show toast on WebSocket events (with debounce to avoid spam)
  useEffect(() => {
    if (!lastEvent) return
    const key = `${lastEvent.type}-${lastEvent.timestamp}`
    if (key === lastToastRef.current) return
    lastToastRef.current = key

    const label = EVENT_LABELS[lastEvent.type] || lastEvent.type
    const data = lastEvent.data as Record<string, unknown> | undefined
    const message = data?.message || data?.title || ''

    toast.info(`[${label}] ${message}`, {
      duration: 3000,
    })
  }, [lastEvent])

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveModule} />
      case 'avatar':
        return <AvatarCloneView />
      case 'cognitive':
        return <CognitiveEngineView />
      case 'evidence':
        return <EvidenceChainView />
      case 'collaboration':
        return <CollaborationRouterView />
      case 'sandbox':
        return <XDPSandboxView />
      case 'roadmap':
        return <RoadmapTrackerView />
      default:
        return <DashboardView onNavigate={setActiveModule} />
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-card transition-all duration-300 shrink-0",
          sidebarCollapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <SidebarContent
          activeModule={activeModule}
          sidebarCollapsed={sidebarCollapsed}
          theme={mounted ? resolvedTheme : undefined}
          onNavigate={setActiveModule}
          onToggleTheme={toggleTheme}
        />
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r bg-card transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <span className="text-sm font-semibold">导航菜单</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <SidebarContent
          activeModule={activeModule}
          sidebarCollapsed={false}
          theme={mounted ? resolvedTheme : undefined}
          onNavigate={setActiveModule}
          onToggleTheme={toggleTheme}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">
              {navItems.find(i => i.id === activeModule)?.label || '总览'}
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono h-5">
              {navItems.find(i => i.id === activeModule)?.sublabel}
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] h-6 border-0 transition-colors",
                connected
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              )}
            >
              {connected ? (
                <Wifi className="mr-1 h-3 w-3" />
              ) : (
                <WifiOff className="mr-1 h-3 w-3" />
              )}
              {connected ? '实时连接' : '连接断开'}
            </Badge>
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <span>Phase 1</span>
              <span>·</span>
              <span>Day 18</span>
            </div>

            {/* Auth button */}
            {session?.user ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-500/10 px-2.5 py-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[9px] font-bold text-white">
                    {(session.user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-medium text-violet-700 dark:text-violet-400 max-w-[60px] truncate">
                    {session.user.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  title="退出登录"
                >
                  <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                onClick={() => setAuthModalOpen(true)}
              >
                <UserCircle2 className="h-3.5 w-3.5" />
                登录
              </Button>
            )}
          </div>
        </header>

        {/* Module Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            {renderModule()}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-card px-4 md:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span className="font-medium">飘数 Piaoshu · 创始人操作系统</span>
              <span className="font-mono">v0.1.0-alpha</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Web4.0 AI-Native</span>
              <span>·</span>
              <span>将AI从执行者升维为共生体</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating AI Chat Widget */}
      <AIChatWidget />

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
