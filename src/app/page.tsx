'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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
  Settings2,
  Command,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWebSocket, type WSEventType } from '@/lib/use-websocket'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import dynamic from 'next/dynamic'
import { DashboardView } from '@/components/piaoshu/dashboard'
import { AIChatWidget } from '@/components/piaoshu/ai-chat-widget'
import { CommandPalette } from '@/components/piaoshu/command-palette'
import { AuthModal } from '@/components/piaoshu/auth-modal'
import { SettingsPanel } from '@/components/piaoshu/settings-panel'
import { NotificationCenter } from '@/components/piaoshu/notification-center'
import { ModuleErrorBoundary } from '@/components/piaoshu/error-boundary'
import { TopLoadingBar } from '@/components/piaoshu/top-loading-bar'

// Lazy-load heavy module views to reduce initial bundle size
const AvatarCloneView = dynamic(
  () => import('@/components/piaoshu/avatar-clone').then(m => ({ default: m.AvatarCloneView })),
  { loading: () => <ModuleSkeleton /> }
)
const CognitiveEngineView = dynamic(
  () => import('@/components/piaoshu/cognitive-engine').then(m => ({ default: m.CognitiveEngineView })),
  { loading: () => <ModuleSkeleton /> }
)
const EvidenceChainView = dynamic(
  () => import('@/components/piaoshu/evidence-chain').then(m => ({ default: m.EvidenceChainView })),
  { loading: () => <ModuleSkeleton /> }
)
const CollaborationRouterView = dynamic(
  () => import('@/components/piaoshu/collaboration-router').then(m => ({ default: m.CollaborationRouterView })),
  { loading: () => <ModuleSkeleton /> }
)
const XDPSandboxView = dynamic(
  () => import('@/components/piaoshu/xdp-sandbox').then(m => ({ default: m.XDPSandboxView })),
  { loading: () => <ModuleSkeleton /> }
)
const RoadmapTrackerView = dynamic(
  () => import('@/components/piaoshu/roadmap-tracker').then(m => ({ default: m.RoadmapTrackerView })),
  { loading: () => <ModuleSkeleton /> }
)

function ModuleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  )
}

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
  mounted: boolean
  onNavigate: (module: ActiveModule) => void
  onToggleTheme: () => void
  onOpenSettings: () => void
  onMobileClose?: () => void
}

function SidebarContent({ activeModule, sidebarCollapsed, theme, mounted, onNavigate, onToggleTheme, onOpenSettings, onMobileClose }: SidebarContentProps) {
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
          className="w-full justify-center gap-2"
          onClick={onOpenSettings}
        >
          <Settings2 className="h-4 w-4" />
          {!sidebarCollapsed && (
            <span className="text-xs">系统设置</span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={onToggleTheme}
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 opacity-0" />
          )}
          {!sidebarCollapsed && (
            <span className="ml-2 text-xs">
              {mounted ? (theme === 'dark' ? '浅色' : '深色') : '\u00A0'}
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

// Module name mapping for error boundary
const MODULE_NAMES: Record<ActiveModule, string> = {
  dashboard: '总览 Dashboard',
  avatar: '分身系统 Avatar Clone',
  cognitive: '认知分片引擎 Cognitive Engine',
  evidence: '可信证据链 Evidence Chain',
  collaboration: '流体协作调度 Collaboration Router',
  sandbox: '虚实共生沙盒 XDP Sandbox',
  roadmap: '90天路线图 Roadmap',
}

// Page transition animation variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()
  const { connected, lastEvent } = useWebSocket()
  const lastToastRef = useRef<string | null>(null)
  const { data: session } = useSession()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [isModuleLoading, setIsModuleLoading] = useState(false)
  const [, startTransition] = useTransition()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // Navigate to a new module with loading bar
  const handleNavigate = useCallback((module: ActiveModule) => {
    if (module === activeModule) return
    setIsModuleLoading(true)
    startTransition(() => {
      setActiveModule(module)
    })
    // Close mobile sidebar on navigation
    setMobileMenuOpen(false)
    // Give a small window for the loading bar to show before module renders
    const timer = setTimeout(() => setIsModuleLoading(false), 600)
    return () => clearTimeout(timer)
  }, [activeModule])

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
    const moduleName = MODULE_NAMES[activeModule]
    switch (activeModule) {
      case 'dashboard':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <DashboardView onNavigate={handleNavigate} />
          </ModuleErrorBoundary>
        )
      case 'avatar':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <AvatarCloneView />
          </ModuleErrorBoundary>
        )
      case 'cognitive':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <CognitiveEngineView />
          </ModuleErrorBoundary>
        )
      case 'evidence':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <EvidenceChainView />
          </ModuleErrorBoundary>
        )
      case 'collaboration':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <CollaborationRouterView />
          </ModuleErrorBoundary>
        )
      case 'sandbox':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <XDPSandboxView />
          </ModuleErrorBoundary>
        )
      case 'roadmap':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <RoadmapTrackerView />
          </ModuleErrorBoundary>
        )
      default:
        return (
          <ModuleErrorBoundary moduleName="总览 Dashboard">
            <DashboardView onNavigate={handleNavigate} />
          </ModuleErrorBoundary>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Loading Bar */}
      <TopLoadingBar isLoading={isModuleLoading} />

      <div className="flex flex-1">
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
            theme={resolvedTheme}
            mounted={mounted}
            onNavigate={handleNavigate}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setSettingsPanelOpen(true)}
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
            theme={resolvedTheme}
            mounted={mounted}
            onNavigate={handleNavigate}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setSettingsPanelOpen(true)}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar - compact on mobile */}
          <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 md:px-6 h-12 sm:h-14">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold truncate">
                {navItems.find(i => i.id === activeModule)?.label || '总览'}
              </h1>
              <Badge variant="outline" className="text-[8px] sm:text-[10px] font-mono h-4 sm:h-5 shrink-0 hidden sm:inline-flex">
                {navItems.find(i => i.id === activeModule)?.sublabel}
              </Badge>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Connection badge - compact on mobile */}
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] sm:text-[10px] h-5 sm:h-6 border-0 transition-colors",
                  connected
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                )}
              >
                {connected ? (
                  <Wifi className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <WifiOff className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                <span className="hidden sm:inline">{connected ? '实时连接' : '连接断开'}</span>
              </Badge>
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono cursor-pointer hover:text-foreground transition-colors rounded-md border border-border/50 px-2 py-1 hover:bg-accent"
                title="打开命令面板 (⌘K)"
              >
                <Command className="h-3 w-3" />
                <span>⌘K</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <span>Phase 1</span>
                <span>·</span>
                <span>Day 18</span>
              </div>

              {/* Notification Center */}
              <NotificationCenter onNavigate={handleNavigate} />

              {/* Auth button - smaller on mobile */}
              {session?.user ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-500/10 px-1.5 sm:px-2.5 py-0.5 sm:py-1">
                    <div className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[8px] sm:text-[9px] font-bold text-white">
                      {(session.user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-violet-700 dark:text-violet-400 max-w-[40px] sm:max-w-[60px] truncate">
                      {session.user.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    title="退出登录"
                  >
                    <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <UserCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">登录</span>
                </Button>
              )}
            </div>
          </header>

          {/* Module Content with page transitions */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeModule}
                  variants={pageVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {renderModule()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Footer - sticky to bottom */}
          <footer className="mt-auto border-t bg-card px-3 sm:px-4 md:px-6 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500" />
                <span className="font-medium">飘数 Piaoshu · 创始人操作系统</span>
                <span className="font-mono">v0.1.0-alpha</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span>Web4.0 AI-Native</span>
                <span>·</span>
                <span>将AI从执行者升维为共生体</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette onNavigate={handleNavigate} onToggleTheme={toggleTheme} />

      {/* Floating AI Chat Widget */}
      <AIChatWidget />

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Settings Panel */}
      <SettingsPanel open={settingsPanelOpen} onOpenChange={setSettingsPanelOpen} />
    </div>
  )
}
