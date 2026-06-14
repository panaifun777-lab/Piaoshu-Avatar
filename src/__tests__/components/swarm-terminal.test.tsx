import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SwarmTerminal from '@/components/piaoshu/swarm-terminal'

// Mock the API hooks
vi.mock('@/lib/api-hooks', () => ({
  useSwarmStatus: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    status: 'success',
  }),
  useSwarmAgents: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    status: 'success',
  }),
  useSwarmTasks: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    status: 'success',
  }),
}))

// Mock LeaderboardPanel
vi.mock('@/components/piaoshu/leaderboard-panel', () => ({
  default: ({ maxEntries }: any) => <div data-testid="leaderboard-panel">Leaderboard ({maxEntries} entries)</div>,
}))

// Mock lucide-react
vi.mock('lucide-react', () => {
  const icons = ['Activity', 'Cpu', 'Palette', 'BarChart3', 'Briefcase', 'Terminal', 'Zap', 'GitBranch', 'Shield', 'Clock', 'Radio', 'Wifi']
  const result: Record<string, any> = {}
  for (const icon of icons) {
    result[icon] = () => null
  }
  return result
})

describe('SwarmTerminal (smoke)', () => {
  afterEach(() => {
    cleanup()
  })

  function renderTerminal() {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false, refetchInterval: false },
      },
    })
    return render(
      <QueryClientProvider client={qc}>
        <SwarmTerminal />
      </QueryClientProvider>
    )
  }

  it('renders without crashing', () => {
    const { container } = renderTerminal()
    expect(container).toBeTruthy()
  })

  it('displays ASCII art header (AVATAR OS)', () => {
    renderTerminal()
    expect(screen.getAllByText(/AVATAR/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows version number', () => {
    renderTerminal()
    expect(screen.getAllByText(/v2\.1\.4/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows SWARM OVERVIEW section', () => {
    renderTerminal()
    expect(screen.getByText('■ SWARM OVERVIEW')).toBeInTheDocument()
  })

  it('shows AFC ECONOMY section', () => {
    renderTerminal()
    expect(screen.getByText('■ AFC ECONOMY')).toBeInTheDocument()
  })

  it('renders agent names (Piaoshu, Design, Data, Biz)', () => {
    renderTerminal()
    expect(screen.getByText('Piaoshu')).toBeInTheDocument()
    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.getByText('Data')).toBeInTheDocument()
    expect(screen.getByText('Biz')).toBeInTheDocument()
  })

  it('renders the leaderboard panel', () => {
    renderTerminal()
    expect(screen.getByTestId('leaderboard-panel')).toBeInTheDocument()
  })

  it('has a terminal input field', () => {
    renderTerminal()
    const input = screen.getByPlaceholderText(/type command/)
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
  })
})
