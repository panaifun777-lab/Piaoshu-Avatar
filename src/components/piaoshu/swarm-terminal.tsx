'use client'

import { useState, useEffect, useRef } from 'react'
import { useSwarmStatus, useSwarmAgents, useSwarmTasks } from '@/lib/api-hooks'
import LeaderboardPanel from './leaderboard-panel'
import { cn } from '@/lib/utils'
import {
  Activity, Cpu, Palette, BarChart3, Briefcase, Terminal,
  Zap, GitBranch, Shield, Clock, Radio, Wifi
} from 'lucide-react'

// ─── Terminal-theme constants ───────────────────────────────────
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
}

const AVATARS = {
  piaoshu: { emoji: '🔩', name: 'Piaoshu', role: '架构分身', domain: 'blockchain/backend/infra' },
  design:  { emoji: '🎨', name: 'Design',  role: '设计分身', domain: 'design/frontend/branding' },
  data:    { emoji: '📊', name: 'Data',    role: '数据分身', domain: 'data/analytics/research' },
  biz:     { emoji: '💼', name: 'Biz',     role: '商业分身', domain: 'business/finance/legal' },
} as const

type AvatarId = keyof typeof AVATARS
type AvatarStatus = 'online' | 'busy' | 'offline'

interface AvatarState {
  status: AvatarStatus
  load_current: number
  load_max: number
  heartbeat: string
  currentTask: string
}

interface StreamEntry {
  time: string
  type: 'task' | 'sub' | 'system' | 'escrow' | 'insight'
  avatar?: AvatarId
  text: string
  status?: 'complete' | 'waiting' | 'error'
}

// ─── Status dot ──────────────────────────────────────────────
const StatusDot = ({ status }: { status: AvatarStatus }) => {
  const map = {
    online:  { color: COLORS.fg,  label: '就绪' },
    busy:    { color: COLORS.yellow, label: '执行中' },
    offline: { color: COLORS.red,   label: '离线' },
  }
  const s = map[status]
  return (
    <span style={{ color: s.color }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 0, backgroundColor: s.color, marginRight: 4 }} />
      {s.label}
    </span>
  )
}

// ─── Avatar Card ──────────────────────────────────────────────
const AvatarCard = ({ id, state }: { id: AvatarId; state: AvatarState }) => {
  const av = AVATARS[id]
  return (
    <div style={{
      border: `1px solid ${COLORS.border}`, padding: 10, minWidth: 140, flex: 1,
      background: '#0c0c0c', fontFamily: 'monospace', fontSize: 11,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
        <span style={{ fontSize: 18 }}>{av.emoji}</span>
        <span style={{ color: COLORS.fg }}>{av.name}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <StatusDot status={state.status} />
      </div>
      <div style={{ marginTop: 3, color: COLORS.fgDim, fontSize: 10 }}>
        LOAD: {state.load_current}/{state.load_max}
      </div>
      <div style={{ marginTop: 1, color: COLORS.fgFaint, fontSize: 9 }}>
        ♥ {state.heartbeat}
      </div>
      <div style={{ marginTop: 2, color: COLORS.cyan, fontSize: 9, fontStyle: 'italic' }}>
        {av.role}
      </div>
      <div style={{ marginTop: 1, color: COLORS.fgFaint, fontSize: 8 }}>
        {av.domain}
      </div>
    </div>
  )
}

// ─── Stream Entry ─────────────────────────────────────────────
const StreamEntry = ({ entry }: { entry: StreamEntry }) => {
  const time = <span style={{ color: COLORS.fgFaint }}>[{entry.time}]</span>
  
  if (entry.type === 'task' && entry.avatar) {
    const av = AVATARS[entry.avatar]
    return (
      <div style={{ padding: '1px 0', fontFamily: 'monospace', fontSize: 10 }}>
        {time}{' '}
        <span style={{ color: COLORS.cyan }}>{av.emoji} {av.name}</span>{' '}
        <span style={{ color: COLORS.fg }}>→ {entry.text}</span>
      </div>
    )
  }
  if (entry.type === 'sub') {
    const color = entry.status === 'complete' ? COLORS.fg : entry.status === 'error' ? COLORS.red : COLORS.yellow
    const suffix = entry.status === 'complete' ? ' — DONE' : entry.status === 'error' ? ' — FAILED' : ' (WAITING...)'
    const prefix = entry.text.startsWith('└') ? '       ' : '       '
    return (
      <div style={{ padding: '1px 0', fontFamily: 'monospace', fontSize: 10 }}>
        <span style={{ color, paddingLeft: 14 }}>{entry.text}{suffix}</span>
      </div>
    )
  }
  if (entry.type === 'insight') {
    return (
      <div style={{ padding: '1px 0', fontFamily: 'monospace', fontSize: 10 }}>
        {time} <span style={{ color: COLORS.magenta }}>💡 {entry.text}</span>
      </div>
    )
  }
  if (entry.type === 'escrow') {
    return (
      <div style={{ padding: '1px 0', fontFamily: 'monospace', fontSize: 10 }}>
        {time} <span style={{ color: COLORS.yellow }}>💰 {entry.text}</span>
      </div>
    )
  }
  return (
    <div style={{ padding: '1px 0', fontFamily: 'monospace', fontSize: 10 }}>
      {time} <span style={{ color: COLORS.magenta }}>{entry.text}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function SwarmTerminal() {
  const statusQuery = useSwarmStatus()
  const agentsQuery = useSwarmAgents()
  const tasksQuery = useSwarmTasks()
  const [stream, setStream] = useState<StreamEntry[]>([])
  const [cmd, setCmd] = useState('')
  const streamRef = useRef<HTMLDivElement>(null)
  const [avatarStates, setAvatarStates] = useState<Record<AvatarId, AvatarState>>({
    piaoshu: { status: 'online',  load_current: 2, load_max: 8, heartbeat: '--:--:--', currentTask: '' },
    design:  { status: 'busy',    load_current: 3, load_max: 6, heartbeat: '--:--:--', currentTask: '' },
    data:    { status: 'online',  load_current: 1, load_max: 5, heartbeat: '--:--:--', currentTask: '' },
    biz:     { status: 'offline', load_current: 0, load_max: 4, heartbeat: '--:--:--', currentTask: '' },
  })

  const getTime = () => new Date().toTimeString().slice(0, 8)

  // ─── Add initial stream entries ────────────────────────────
  useEffect(() => {
    setStream([
      { time: getTime(), type: 'system', text: '🔩 AVATAR OS SWARM DASHBOARD v2.1.4 — "不是替代，而是延伸"' },
      { time: getTime(), type: 'system', text: '📡 Swarm nodes: 4 registered | EventBus: fakeredis | Registry: JSON file-backed' },
    ])
  }, [])

  // ─── Sync with API data ─────────────────────────────────────
  useEffect(() => {
    if (agentsQuery.data?.ok) {
      const agents = agentsQuery.data.data.agents
      const newStates = { ...avatarStates }
      agents.forEach((a: any) => {
        const key = a.role?.toLowerCase()
        // Map agent roles to our avatar IDs
        const idMap: Record<string, AvatarId> = {
          ceo: 'biz', cto: 'piaoshu', growth: 'data', engineer: 'design',
        }
        const avatarId = idMap[key] || undefined
        if (avatarId) {
          newStates[avatarId] = {
            status: a.status === 'active' ? 'online' : a.status === 'working' ? 'busy' : 'offline',
            load_current: a.workload || 0,
            load_max: 10,
            heartbeat: new Date(a.lastActiveAt).toTimeString().slice(0, 8),
            currentTask: '',
          }
        }
      })
      setAvatarStates(newStates)
    }
  }, [agentsQuery.data])

  useEffect(() => {
    if (tasksQuery.data?.ok) {
      const tasks = tasksQuery.data.data.tasks
      tasks.slice(0, 3).forEach((t: any) => {
        const entry: StreamEntry = {
          time: getTime(),
          type: 'task',
          avatar: 'piaoshu',
          text: `${t.title} [${t.status}]`,
        }
        setStream(prev => [...prev.slice(-200), entry])
      })
    }
  }, [tasksQuery.data])

  // ─── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [stream])

  // ─── Terminal commands ──────────────────────────────────────
  const handleCmd = () => {
    if (!cmd.trim()) return
    setStream(prev => [...prev, { time: getTime(), type: 'system', text: `> ${cmd}` }])
    
    const lower = cmd.toLowerCase().trim()
    if (lower === 'help' || lower === '?') {
      setStream(prev => [...prev, { time: getTime(), type: 'system', text: 'commands: status | tasks | metrics | heatmap | economy | clear | help' }])
    } else if (lower === 'status') {
      setStream(prev => [...prev, { time: getTime(), type: 'system', text: `SWARM: ${statusQuery.data?.data?.activeAgents || '?'}/${statusQuery.data?.data?.agentCount || '?'} agents active | Tasks: ${statusQuery.data?.data?.taskStats?.completed || '?'} completed` }])
    } else if (lower === 'tasks') {
      const stats = statusQuery.data?.data?.taskStats
      setStream(prev => [...prev, { time: getTime(), type: 'system', text: `PENDING: ${stats?.pending || 0} | IN_PROGRESS: ${stats?.inProgress || 0} | COMPLETED: ${stats?.completed || 0}` }])
    } else if (lower === 'metrics') {
      setStream(prev => [...prev, { time: getTime(), type: 'system', text: 'Collab: 47 (+12% WoW) | Escrow: 1,240 AFC (+8% WoW) | Latency: 1.2/3.8s P50/P99' }])
    } else if (lower === 'clear') {
      setStream([{ time: getTime(), type: 'system', text: '🧹 Log cleared' }])
    } else {
      setStream(prev => [...prev, { time: getTime(), type: 'error', text: `unknown: "${cmd}" — type "help"` }])
    }
    setCmd('')
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.fg, minHeight: '100vh', fontFamily: 'monospace' }}>
      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px', textAlign: 'center' }}>
        <pre style={{ color: COLORS.fg, fontSize: 8, lineHeight: 1.2, margin: 0, whiteSpace: 'pre' }}>
{` █████╗ ██╗   ██╗ █████╗ ████████╗ █████╗ ██████╗      ██████╗ ███████╗
██╔══██╗██║   ██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗    ██╔═══██╗██╔════╝
███████║██║   ██║███████║   ██║   ███████║██████╔╝    ██║   ██║███████╗
██╔══██║╚██╗ ██╔╝██╔══██║   ██║   ██╔══██║██╔══██╗    ██║   ██║╚════██║
██║  ██║ ╚████╔╝ ██║  ██║   ██║   ██║  ██║██║  ██║    ╚██████╔╝███████║
╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝`}
        </pre>
        <div style={{ color: COLORS.fgDim, fontSize: 10, marginTop: 4 }}>
          [ v2.1.4 ]  //  swarm.nodes: 4  //  {statusQuery.data?.data?.taskStats?.completed || '?'} tasks completed  //  mainnet
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${COLORS.border}` }}>
        {/* TOP-LEFT: Swarm Overview */}
        <div style={{ borderRight: `1px solid ${COLORS.border}`, padding: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6, marginBottom: 8 }}>
            ■ SWARM OVERVIEW
          </div>
          <div style={{ display: 'flex', gap: 6, overflow: 'auto' }}>
            {(Object.keys(AVATARS) as AvatarId[]).map(id => (
              <AvatarCard key={id} id={id} state={avatarStates[id]} />
            ))}
          </div>
        </div>

        {/* TOP-RIGHT: Metrics */}
        <div style={{ padding: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6, marginBottom: 8 }}>
            ■ SWARM METRICS
          </div>
          {[
            ['COLLAB_TASKS_24H', '47', '+12% WoW'],
            ['CROSS_AVATAR_SKILL_CALLS', '23', ''],
            ['INSIGHT_PUBLISHED', '89', '→ subscribed: 312'],
            ['ESCROW_SETTLED', '1,240 AFC', '+8% WoW'],
            ['TASK_LATENCY', '1.2s P50 / 3.8s P99', ''],
          ].map(([label, value, change]) => (
            <div key={label} style={{ padding: '2px 0', display: 'flex', justifyContent: 'space-between', fontSize: 10, borderBottom: '1px dotted #111' }}>
              <span style={{ color: COLORS.fgDim }}>{label}</span>
              <span>
                <span style={{ color: COLORS.fg, fontWeight: 700 }}>{value}</span>
                {change && <span style={{ color: COLORS.cyan, fontSize: 9, marginLeft: 4 }}>{change}</span>}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 8, color: COLORS.fgFaint, fontSize: 9, borderTop: '1px dotted #111', paddingTop: 5 }}>
            [NETWORK] nodes:4 | peers:12<br/>
            [CONSENSUS] raft term:7 | commit:14892<br/>
            [ESCROW] locked: 89,420 AFC | active: 12,400 AFC
          </div>
        </div>
      </div>

      {/* BOTTOM: Live Stream + AFC Economy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* LEFT: Live Task Stream */}
        <div style={{ borderRight: `1px solid ${COLORS.border}`, padding: 10, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 11, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6, marginBottom: 6 }}>
            ■ LIVE TASK STREAM
          </div>
          <div
            ref={streamRef}
            style={{
              flex: 1, overflowY: 'auto', maxHeight: 300,
              fontFamily: 'monospace', fontSize: 10, lineHeight: 1.5,
              color: COLORS.fg,
            }}
          >
            {stream.map((entry, i) => (
              <StreamEntry key={i} entry={entry} />
            ))}
          </div>
        </div>

        {/* RIGHT: AFC Economy */}
        <div style={{ padding: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 6, marginBottom: 8 }}>
            ■ AFC ECONOMY
          </div>
          {[
            ['AFC/USDC', '$0.847'],
            ['24H_VOLUME', '142,300 AFC'],
            ['STAKING_APR', '18.4%'],
            ['TVL', '89,420 AFC'],
            ['TREASURY', '2,400,000 AFC'],
            ['CIRCULATING', '8,120,000 AFC'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '2px 0', display: 'flex', justifyContent: 'space-between', fontSize: 10, borderBottom: '1px dotted #111' }}>
              <span style={{ color: COLORS.fgDim }}>{label}</span>
              <span style={{ color: COLORS.fg, fontWeight: 700 }}>{value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, borderTop: `1px solid ${COLORS.border}`, paddingTop: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 10, color: COLORS.fgDim, marginBottom: 4 }}>■ COGNITIVE OWNERSHIP</div>
            <div style={{ fontSize: 9, color: COLORS.fgFaint }}>
              🔩 Piaoshu: AFC DID #0x7f3a...b21c<br/>
              🎨 Design: AFC DID #0x9e2b...c43d<br/>
              📊 Data: AFC DID #0x3f8a...d65e<br/>
              💼 Biz: AFC DID #0x1c4d...e87f<br/>
              <div style={{ marginTop: 3, color: COLORS.fgDim }}>Chain: AFC PoRC · Verifier: 0xabcd...1234</div>
            </div>
          </div>
        </div>
      </div>

      {/* LEADERBOARD */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 10 }}>
        <LeaderboardPanel maxEntries={10} />
      </div>

      {/* CONNECTION STATUS */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '4px 10px', fontSize: 9, color: COLORS.fgDim }}>
        [API] {agentsQuery.isLoading ? 'CONNECTING...' : agentsQuery.isError ? 'DISCONNECTED' : 'CONNECTED — LIVE'}
        {' '}| Refetch: agents 8s | status 10s | tasks 8s
      </div>

      {/* TERMINAL INPUT */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, background: '#0c0c0c' }}>
        <span style={{ color: COLORS.fg, fontWeight: 700, fontSize: 13 }}>&gt;</span>
        <input
          type="text"
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCmd() }}
          placeholder="type command (status / tasks / metrics / help / clear)"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: COLORS.fg, fontFamily: 'monospace', fontSize: 12,
            outline: 'none', caretColor: COLORS.fg,
          }}
        />
      </div>
    </div>
  )
}
