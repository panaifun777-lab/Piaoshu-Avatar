import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeaderboardPanel from '@/components/piaoshu/leaderboard-panel'

// Mock the API hook
const mockLeaderboardData = {
  success: true,
  leaderboard: [
    { rank: 1, username: 'piaoshu', score: 9842 },
    { rank: 2, username: 'design_ai', score: 8721 },
    { rank: 3, username: 'data_node', score: 7640 },
    { rank: 4, username: 'biz_mind', score: 6983 },
    { rank: 5, username: 'shadow_01', score: 5410 },
  ],
  user: undefined,
  _fallback: false,
}

const mockLeaderboardWithUser = {
  ...mockLeaderboardData,
  user: { rank: 1, score: 9842 },
}

vi.mock('@/lib/api-hooks', () => ({
  useLeaderboard: vi.fn(),
}))

import { useLeaderboard } from '@/lib/api-hooks'

describe('LeaderboardPanel', () => {
  it('renders without crashing', () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: mockLeaderboardData,
      isLoading: false,
      isError: false,
      error: null,
      // Required react-query return type fields
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetching: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPending: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: vi.fn(),
      status: 'success',
      fetchStatus: 'idle',
      promise: Promise.resolve(mockLeaderboardData),
    } as any)

    render(<LeaderboardPanel />)
    expect(screen.getByText('🏆 天梯榜 LEADERBOARD')).toBeInTheDocument()
  })

  it('renders leaderboard entries as a table', () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: mockLeaderboardData,
      isLoading: false,
      isError: false,
      error: null,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetching: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPending: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: vi.fn(),
      status: 'success',
      fetchStatus: 'idle',
      promise: Promise.resolve(mockLeaderboardData),
    } as any)

    render(<LeaderboardPanel maxEntries={10} />)

    // Check header row is present
    expect(screen.getByText('USERNAME')).toBeInTheDocument()
    expect(screen.getByText('SCORE')).toBeInTheDocument()

    // Check entries are rendered
    expect(screen.getByText('piaoshu')).toBeInTheDocument()
    expect(screen.getByText('design_ai')).toBeInTheDocument()
    expect(screen.getByText('data_node')).toBeInTheDocument()
    expect(screen.getByText('biz_mind')).toBeInTheDocument()
    expect(screen.getByText('shadow_01')).toBeInTheDocument()

    // Check scores are displayed (9842 < 10000, so uses locale format not "k")
    expect(screen.getByText(/9,842/)).toBeInTheDocument()
    expect(screen.getAllByText(/pts/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows loading skeleton when isLoading', () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetching: true,
      isFetched: false,
      isFetchedAfterMount: false,
      isInitialLoading: true,
      isLoadingError: false,
      isPaused: false,
      isPending: true,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isSuccess: false,
      refetch: vi.fn(),
      status: 'pending',
      fetchStatus: 'fetching',
      promise: Promise.resolve(undefined),
    } as any)

    render(<LeaderboardPanel />)
    // Loading state should show the header
    expect(screen.getByText('🏆 天梯榜 LEADERBOARD')).toBeInTheDocument()
  })

  it('shows error state when isError', () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: new Error('Network error'),
      isFetching: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: true,
      isPaused: false,
      isPending: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isSuccess: false,
      refetch: vi.fn(),
      status: 'error',
      fetchStatus: 'idle',
      promise: Promise.reject(new Error('Network error')).catch(() => {}),
    } as any)

    render(<LeaderboardPanel />)
    expect(screen.getByText('⚠ Failed to load leaderboard')).toBeInTheDocument()
  })

  it('shows user rank when username is provided', () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: mockLeaderboardWithUser,
      isLoading: false,
      isError: false,
      error: null,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetching: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPending: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: vi.fn(),
      status: 'success',
      fetchStatus: 'idle',
      promise: Promise.resolve(mockLeaderboardWithUser),
    } as any)

    render(<LeaderboardPanel username="piaoshu" />)
    expect(screen.getByText('■ YOUR RANK')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('respects maxEntries prop', () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: mockLeaderboardData,
      isLoading: false,
      isError: false,
      error: null,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetching: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPending: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: vi.fn(),
      status: 'success',
      fetchStatus: 'idle',
      promise: Promise.resolve(mockLeaderboardData),
    } as any)

    render(<LeaderboardPanel maxEntries={3} />)
    // All 5 entries are in mock data, but only top 3 should show
    expect(screen.getByText('piaoshu')).toBeInTheDocument()
    expect(screen.getByText('design_ai')).toBeInTheDocument()
    expect(screen.getByText('data_node')).toBeInTheDocument()
    // biz_mind is rank 4, should NOT appear with maxEntries=3
    expect(screen.queryByText('biz_mind')).not.toBeInTheDocument()
  })
})
