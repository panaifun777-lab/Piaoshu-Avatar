import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LandingPage } from '@/components/piaoshu/landing-page'

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, variants, whileInView, viewport, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    nav: ({ children, ...props }: any) => {
      const { initial, animate, transition, style, ...rest } = props
      return <nav {...rest} style={style}>{children}</nav>
    },
    line: (props: any) => {
      const { initial, animate, transition, ...rest } = props
      return <line {...rest} />
    },
    circle: (props: any) => {
      const { initial, animate, transition, ...rest } = props
      return <circle {...rest} />
    },
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Brain: () => <span data-testid="icon-brain" />,
  Shield: () => <span data-testid="icon-shield" />,
  Users: () => <span data-testid="icon-users" />,
  Database: () => <span data-testid="icon-database" />,
  Zap: () => <span data-testid="icon-zap" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Globe: () => <span data-testid="icon-globe" />,
  Lock: () => <span data-testid="icon-lock" />,
  Cpu: () => <span data-testid="icon-cpu" />,
  Network: () => <span data-testid="icon-network" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Eye: () => <span data-testid="icon-eye" />,
  Fingerprint: () => <span data-testid="icon-fingerprint" />,
  Layers: () => <span data-testid="icon-layers" />,
  Workflow: () => <span data-testid="icon-workflow" />,
  Server: () => <span data-testid="icon-server" />,
  GitBranch: () => <span data-testid="icon-git-branch" />,
  Send: () => <span data-testid="icon-send" />,
  Quote: () => <span data-testid="icon-quote" />,
  Flame: () => <span data-testid="icon-flame" />,
  Heart: () => <span data-testid="icon-heart" />,
  Share2: () => <span data-testid="icon-share2" />,
  ExternalLink: () => <span data-testid="icon-external-link" />,
  Search: () => <span data-testid="icon-search" />,
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('LandingPage', () => {
  it('renders without crashing', () => {
    const onLogin = vi.fn()
    const { container } = render(<LandingPage onLogin={onLogin} />)
    expect(container).toBeTruthy()
  })

  it('displays the heading "飘叔 Avatar OS"', () => {
    const onLogin = vi.fn()
    render(<LandingPage onLogin={onLogin} />)
    const headings = screen.getAllByText('飘叔 Avatar OS')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('displays the subtitle "Web4.0 数字孪生操作系统"', () => {
    const onLogin = vi.fn()
    render(<LandingPage onLogin={onLogin} />)
    expect(screen.getByText('Web4.0 数字孪生操作系统')).toBeInTheDocument()
  })

  it('has login and CTA buttons', () => {
    const onLogin = vi.fn()
    render(<LandingPage onLogin={onLogin} />)
    expect(screen.getByText('登录')).toBeInTheDocument()
    expect(screen.getByText('开始体验')).toBeInTheDocument()
  })

  it('has core feature sections', () => {
    const onLogin = vi.fn()
    render(<LandingPage onLogin={onLogin} />)
    expect(screen.getAllByText('认知引擎').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('记忆宫殿').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('数字分身').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('分布式存储')).toBeInTheDocument()
  })

  it('has navigation links', () => {
    const onLogin = vi.fn()
    render(<LandingPage onLogin={onLogin} />)
    expect(screen.getByText('核心能力')).toBeInTheDocument()
    expect(screen.getAllByText('Agent vs Avatar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('技术栈')).toBeInTheDocument()
  })
})
