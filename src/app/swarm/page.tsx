import SwarmTerminal from '@/components/piaoshu/swarm-terminal'

export const metadata = {
  title: 'AVATAR OS SWARM DASHBOARD',
  description: 'Web4.0 多分身协作终端仪表盘 — EventBus + Router + Matcher',
}

export default function SwarmPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar with back link */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#006600] hover:text-[#00ff00] transition-colors no-underline"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline-block">
            <path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ← 返回总控台
        </a>
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-[#004400] hover:text-[#008800] transition-colors no-underline"
        >
          terminal v2 ⊞
        </a>
      </div>
      <SwarmTerminal />
    </div>
  )
}
