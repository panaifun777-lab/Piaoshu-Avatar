'use client'

import { useLeaderboard } from '@/lib/api-hooks'
import type { LeaderboardEntry } from '@/lib/api-hooks'

// ─── Terminal-theme constants (matching swarm-terminal.tsx) ───
const COLORS = {
  bg: '#0a0a0a',
  fg: '#00ff00',
  fgDim: '#008800',
  fgFaint: '#005500',
  border: '#1a1a1a',
  red: '#ff3333',
  yellow: '#ffcc00',
  cyan: '#00cccc',
  magenta: '#cc00cc',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
}

const MEDALS: Record<number, { emoji: string; color: string }> = {
  1: { emoji: '🥇', color: COLORS.gold },
  2: { emoji: '🥈', color: COLORS.silver },
  3: { emoji: '🥉', color: COLORS.bronze },
}

// ─── Helpers ──────────────────────────────────────────────────
function formatScore(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

// ─── Skeleton row for loading state ──────────────────────────
const SkeletonRow = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '3px 0',
      borderBottom: '1px dotted #111',
      fontSize: 10,
      opacity: 0.5,
    }}
  >
    <span style={{ width: 30, color: COLORS.fgFaint }}>--</span>
    <span
      style={{
        flex: 1,
        height: 10,
        background: '#111',
        borderRadius: 0,
        marginRight: 8,
      }}
    />
    <span style={{ width: 60, height: 10, background: '#111', borderRadius: 0 }} />
  </div>
)

// ─── Single leaderboard row ───────────────────────────────────
const LeaderboardRow = ({ entry }: { entry: LeaderboardEntry }) => {
  const medal = MEDALS[entry.rank]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '2px 0',
        borderBottom: '1px dotted #111',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Rank */}
      <span
        style={{
          width: 30,
          textAlign: 'right',
          paddingRight: 8,
          color: medal ? medal.color : COLORS.fgFaint,
          fontWeight: medal ? 700 : 400,
        }}
      >
        {medal ? medal.emoji : `${entry.rank}`}
      </span>

      {/* Username */}
      <span
        style={{
          flex: 1,
          color: medal ? COLORS.fg : COLORS.fgDim,
          fontWeight: medal ? 700 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.username}
      </span>

      {/* Score */}
      <span
        style={{
          width: 70,
          textAlign: 'right',
          color: COLORS.cyan,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontWeight: 600,
        }}
      >
        {formatScore(entry.score)} pts
      </span>
    </div>
  )
}

// ─── User's own rank highlight ────────────────────────────────
const UserRankRow = ({
  rank,
  score,
  username,
}: {
  rank: number | null
  score: number
  username: string
}) => (
  <div
    style={{
      marginTop: 8,
      borderTop: `1px solid ${COLORS.border}`,
      paddingTop: 6,
      fontSize: 10,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}
  >
    <div style={{ color: COLORS.fgDim, marginBottom: 4 }}>■ YOUR RANK</div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 6px',
        background: '#0c0c0c',
        border: `1px solid ${COLORS.fg}`,
      }}
    >
      <span style={{ color: COLORS.fg, fontWeight: 700, width: 40 }}>
        {rank ? `#${rank}` : '--'}
      </span>
      <span style={{ flex: 1, color: COLORS.fg, fontWeight: 700 }}>{username}</span>
      <span style={{ color: COLORS.cyan, fontWeight: 700 }}>
        {formatScore(score)} pts
      </span>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────
export default function LeaderboardPanel({
  username,
  maxEntries = 10,
}: {
  username?: string
  maxEntries?: number
}) {
  const { data, isLoading, isError, error } = useLeaderboard(username)

  const entries = data?.leaderboard?.slice(0, maxEntries) || []
  const userRank = data?.user

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Header */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 11,
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 6,
          marginBottom: 8,
          color: COLORS.fg,
        }}
      >
        🏆 天梯榜 LEADERBOARD
        {data?._fallback && (
          <span style={{ color: COLORS.yellow, fontSize: 9, marginLeft: 6 }}>
            [FALLBACK]
          </span>
        )}
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '2px 0',
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 9,
          color: COLORS.fgFaint,
          marginBottom: 2,
        }}
      >
        <span style={{ width: 30, textAlign: 'right', paddingRight: 8 }}>#</span>
        <span style={{ flex: 1 }}>USERNAME</span>
        <span style={{ width: 70, textAlign: 'right' }}>SCORE</span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          style={{
            padding: '10px 0',
            color: COLORS.red,
            fontSize: 10,
            textAlign: 'center',
          }}
        >
          ⚠ Failed to load leaderboard
          <div style={{ fontSize: 8, color: COLORS.fgFaint, marginTop: 4 }}>
            {(error as Error)?.message || 'Network error'}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && entries.length === 0 && (
        <div
          style={{
            padding: '20px 0',
            color: COLORS.fgDim,
            fontSize: 10,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>👻</div>
          No entries yet — be the first!
        </div>
      )}

      {/* Leaderboard entries */}
      {!isLoading &&
        !isError &&
        entries.map((entry) => (
          <LeaderboardRow key={entry.username} entry={entry} />
        ))}

      {/* User's own rank */}
      {!isLoading && !isError && username && userRank && (
        <UserRankRow
          rank={userRank.rank}
          score={userRank.score}
          username={username}
        />
      )}

      {/* Auto-refresh indicator */}
      {!isLoading && !isError && (
        <div
          style={{
            marginTop: 6,
            fontSize: 8,
            color: COLORS.fgFaint,
            textAlign: 'right',
          }}
        >
          ⏱ auto-refresh 30s
        </div>
      )}
    </div>
  )
}
