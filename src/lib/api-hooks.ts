import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Base fetcher
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// ===== Cognitive Shards =====
export function useShards() {
  return useQuery({
    queryKey: ['shards'],
    queryFn: () => apiFetch<{ shards: unknown[] }>('/api/cognitive/shards'),
  })
}

export function useCreateShard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; modelBase?: string; shardType?: string }) =>
      apiFetch('/api/cognitive/shards', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shards'] }),
  })
}

export function useUpdateShard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/cognitive/shards/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shards'] }),
  })
}

export function useDeleteShard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cognitive/shards/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shards'] }),
  })
}

// ===== Simulations =====
export function useSimulations() {
  return useQuery({
    queryKey: ['simulations'],
    queryFn: () => apiFetch<{ simulations: unknown[] }>('/api/cognitive/simulations'),
  })
}

export function useRunSimulation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { shardId?: string; inputIdea: string }) =>
      apiFetch('/api/cognitive/simulations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulations'] }),
  })
}

// ===== Evidence =====
export function useEvidences() {
  return useQuery({
    queryKey: ['evidences'],
    queryFn: () => apiFetch<{ evidences: unknown[] }>('/api/evidence'),
  })
}

export function useCreateEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string; evidenceType?: string; rawData?: unknown }) =>
      apiFetch('/api/evidence', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidences'] }),
  })
}

export function useSignVC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { evidenceId: string }) =>
      apiFetch('/api/evidence/sign-vc', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidences'] }),
  })
}

export function useUpdateEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/evidence/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidences'] }),
  })
}

export function useDeleteEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/evidence/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidences'] }),
  })
}

// ===== Collaboration Tasks =====
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiFetch<{ tasks: unknown[] }>('/api/collaboration/tasks'),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string; complexity?: string; category?: string; reward?: number; rewardToken?: string; deadline?: string; assigneeType?: string }) =>
      apiFetch('/api/collaboration/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/collaboration/tasks/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/collaboration/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

// ===== Sandbox Projects =====
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<{ projects: unknown[] }>('/api/sandbox/projects'),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; projectType?: string; xdpEnabled?: boolean }) =>
      apiFetch('/api/sandbox/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/sandbox/projects/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/sandbox/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

// ===== Roadmap =====
export function useRoadmap() {
  return useQuery({
    queryKey: ['roadmap'],
    queryFn: () => apiFetch<{ phases: unknown[] }>('/api/roadmap'),
  })
}

export function useUpdateMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/roadmap/milestones/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap'] }),
  })
}

// ===== AI Chat =====
export function useChat() {
  return useMutation({
    mutationFn: (data: { message: string; systemPrompt?: string; context?: string }) =>
      apiFetch<{ success: boolean; response: string }>('/api/chat', { method: 'POST', body: JSON.stringify(data) }),
  })
}

// ===== Decision Logs =====
export function useDecisions() {
  return useQuery({
    queryKey: ['decisions'],
    queryFn: () => apiFetch<{ decisions: unknown[] }>('/api/cognitive/decisions'),
  })
}

// ===== Notifications =====
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<{ notifications: unknown[] }>('/api/notifications'),
  })
}

// ===== Memories =====
export function useMemories(agentId?: string) {
  return useQuery({
    queryKey: ['memories', agentId],
    queryFn: () => apiFetch<{ memories: unknown[]; total: number; continuity: number; memoryChains?: unknown[] }>(
      agentId ? `/api/cognitive/memory?agentId=${agentId}` : '/api/cognitive/memory'
    ),
  })
}

// ===== Agent Roles =====
export function useAgentRoles() {
  return useQuery({
    queryKey: ['agentRoles'],
    queryFn: () => apiFetch<{ agents: unknown[] }>('/api/cognitive/agents'),
  })
}

export function useCreateAgentRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; persona?: string; capabilities?: string[] }) =>
      apiFetch('/api/cognitive/agents', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentRoles'] }),
  })
}

export function useUpdateAgentRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/cognitive/agents/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentRoles'] }),
  })
}

export function useDeleteAgentRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cognitive/agents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentRoles'] }),
  })
}

export function useTriggerCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { agentId: string }) =>
      apiFetch(`/api/cognitive/agents/${data.agentId}/cycle`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agentRoles'] })
      qc.invalidateQueries({ queryKey: ['memories'] })
    },
  })
}

export function useAgentCycles(agentId: string) {
  return useQuery({
    queryKey: ['agentCycles', agentId],
    queryFn: () => apiFetch<{ cycles: unknown[] }>(`/api/cognitive/agents/${agentId}/cycle`),
    enabled: !!agentId,
  })
}

// ===== Avatar Clone =====
export function useAvatarClone() {
  return useQuery({
    queryKey: ['avatarClone'],
    queryFn: () => apiFetch<{ clone: unknown }>('/api/avatar'),
  })
}

export function useCreateClone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; persona?: string }) =>
      apiFetch('/api/avatar', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avatarClone'] }),
  })
}

export function useCloneAgents() {
  return useQuery({
    queryKey: ['cloneAgents'],
    queryFn: () => apiFetch<{ agents: unknown[] }>('/api/avatar/agents'),
  })
}

export function useAddCloneAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; role: string; persona?: string }) =>
      apiFetch('/api/avatar/agents', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cloneAgents'] }),
  })
}

export function useUpdateCloneAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/avatar/agents/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cloneAgents'] }),
  })
}

export function useTriggerCloneCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { agentId: string }) =>
      apiFetch(`/api/avatar/agents/${data.agentId}/cycle`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cloneAgents'] })
      qc.invalidateQueries({ queryKey: ['cloneOutputs'] })
      qc.invalidateQueries({ queryKey: ['cloneActivities'] })
    },
  })
}

export function useCloneSkills() {
  return useQuery({
    queryKey: ['cloneSkills'],
    queryFn: () => apiFetch<{ skills: unknown[] }>('/api/avatar/skills'),
  })
}

export function useCloneActivities() {
  return useQuery({
    queryKey: ['cloneActivities'],
    queryFn: () => apiFetch<{ activities: unknown[] }>('/api/avatar/activities'),
  })
}

export function useCloneSchedule() {
  return useQuery({
    queryKey: ['cloneSchedule'],
    queryFn: () => apiFetch<{ schedule: unknown }>('/api/avatar/schedule'),
  })
}

export function useGenerateSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch('/api/avatar/schedule', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cloneSchedule'] }),
  })
}

export function useCloneOutputs() {
  return useQuery({
    queryKey: ['cloneOutputs'],
    queryFn: () => apiFetch<{ outputs: unknown[] }>('/api/avatar/outputs'),
  })
}

// ===== Shared Knowledge =====
export function useSharedKnowledge(domain?: string) {
  return useQuery({
    queryKey: ['sharedKnowledge', domain],
    queryFn: () => apiFetch<{ success: boolean; data: { knowledge: unknown[]; total: number; domainDistribution: { domain: string; count: number; avgConfidence: number }[] } }>(
      domain ? `/api/avatar/knowledge?domain=${domain}` : '/api/avatar/knowledge'
    ),
  })
}

export function useAddSharedKnowledge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { domain: string; insight: string; sourceType: string; confidence?: number }) =>
      apiFetch('/api/avatar/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sharedKnowledge'] }),
  })
}

export function useApplySharedKnowledge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string }) =>
      apiFetch('/api/avatar/knowledge', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sharedKnowledge'] }),
  })
}

// ===== Vector Search =====
export function useVectorSearch() {
  return useMutation({
    mutationFn: (data: { query: string; topK?: number }) =>
      apiFetch<{ success: boolean; data: { results: Array<{ id: string; text: string; similarity: number; metadata: Record<string, unknown> }>; total: number } }>(
        `/api/cognitive/vector-search?q=${encodeURIComponent(data.query)}&topK=${data.topK || 5}`
      ),
  })
}

export function useVectorSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; data: { synced: number; errors: number; total: number } }>(
        '/api/cognitive/vector-sync',
        { method: 'POST' }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vectorCollections'] }),
  })
}

export function useVectorCollections() {
  return useQuery({
    queryKey: ['vectorCollections'],
    queryFn: () =>
      apiFetch<{ success: boolean; data: { vectors: Array<{ id: string; text: string; metadata: Record<string, unknown>; dimensions: number }>; total: number } }>(
        '/api/collections?XTransformPort=3004'
      ),
    refetchInterval: 30000,
  })
}

// ===== Soul Config (SOUL.md) =====
export function useSoulConfig() {
  return useQuery({
    queryKey: ['soulConfig'],
    queryFn: () => apiFetch<{ success: boolean; data: { content: string; name: string; version: number; isDefault: boolean; id?: string; description?: string; updatedAt?: string } }>('/api/cognitive/soul'),
  })
}

export function useUpdateSoulConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { content: string; name?: string; description?: string }) =>
      apiFetch('/api/cognitive/soul', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soulConfig'] }),
  })
}

// ===== Blockchain =====
export function useWalletStatus() {
  return useQuery({
    queryKey: ['walletStatus'],
    queryFn: () => apiFetch<{ success: boolean; data: { connected: boolean; address: string | null; balance: string | null; network: string | null; connectedAt: string | null } }>('/api/blockchain/wallet'),
    refetchInterval: 30000,
  })
}

export function useConnectWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/blockchain/wallet', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['walletStatus'] }),
  })
}

export function useAnchorEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { evidenceId: string; contentHash?: string; metadata?: string }) =>
      apiFetch('/api/blockchain/anchor', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evidences'] })
      qc.invalidateQueries({ queryKey: ['blockchainStatus'] })
    },
  })
}

export function useVerifyEvidence() {
  return useMutation({
    mutationFn: (data: { txHash: string }) =>
      apiFetch('/api/blockchain/verify', { method: 'POST', body: JSON.stringify(data) }),
  })
}

export function useSettlePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { taskId: string; amount?: number; token?: string; recipient?: string; paymentId?: string }) =>
      apiFetch('/api/blockchain/settle', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blockchainStatus'] }),
  })
}

export function useBlockchainStatus() {
  return useQuery({
    queryKey: ['blockchainStatus'],
    queryFn: () => apiFetch<{ success: boolean; data: { network: { network: string; chainId: number; blockHeight: number; gasPrice: string; isSyncing: boolean; pendingTxCount: number } | null; wallet: { connected: boolean; address: string | null; balance: string | null; network: string | null } | null; contracts: { contracts: { name: string; address: string; version: string; network: string }[] } | null; recentTransactions: { id: string; txHash: string; txType: string; status: string; blockNumber: number | null; gasUsed: number | null; entityId: string | null; createdAt: string }[] } }>('/api/blockchain/status'),
    refetchInterval: 15000,
  })
}

// ===== Email Tracking =====
export function useEmailConfig() {
  return useQuery({
    queryKey: ['emailConfig'],
    queryFn: () => apiFetch<{ success: boolean; data: unknown | null }>('/api/email/config'),
  })
}

export function useUpdateEmailConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/email/config', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailConfig'] }),
  })
}

export function useEmailThreads(status?: string, search?: string) {
  return useQuery({
    queryKey: ['emailThreads', status, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      const qs = params.toString()
      return apiFetch<{ success: boolean; data: { threads: unknown[]; stats: { total: number; unread: number; read: number; replied: number; ignored: number; escalated: number; autoReplied: number } } }>(
        `/api/email/threads${qs ? `?${qs}` : ''}`
      )
    },
  })
}

export function useUpdateEmailThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/email/threads/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emailThreads'] }),
  })
}

export function useAutoReplyRules() {
  return useQuery({
    queryKey: ['autoReplyRules'],
    queryFn: () => apiFetch<{ success: boolean; data: unknown[] }>('/api/email/auto-reply/rules'),
  })
}

export function useCreateAutoReplyRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/email/auto-reply/rules', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['autoReplyRules'] }),
  })
}

export function useUpdateAutoReplyRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/email/auto-reply/rules/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['autoReplyRules'] }),
  })
}

export function useDeleteAutoReplyRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/email/auto-reply/rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['autoReplyRules'] }),
  })
}

export function useGenerateAutoReply() {
  return useMutation({
    mutationFn: (data: { threadId: string; customPrompt?: string }) =>
      apiFetch<{ success: boolean; data: { reply: string; threadId: string; subject: string; soulInjected: boolean } }>(
        '/api/email/auto-reply/generate',
        { method: 'POST', body: JSON.stringify(data) }
      ),
  })
}

export function useSyncEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data?: { userId?: string }) =>
      apiFetch('/api/email/sync', { method: 'POST', body: JSON.stringify(data || {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emailThreads'] })
      qc.invalidateQueries({ queryKey: ['autoReplyRules'] })
      qc.invalidateQueries({ queryKey: ['emailConfig'] })
    },
  })
}

// ===== Subscription & AFC Token =====
export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  priceAFC: number
  priceUSD: number
  maxClones: number
  maxCyclesPerDay: number
  features: string[]
  isActive: boolean
  subscriberCount?: number
  createdAt: string
  updatedAt: string
}

export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  afcBalance: number
  afcUsed: number
  paymentMethod: string
  walletAddress: string | null
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

export interface AFCTransaction {
  id: string
  userId: string
  type: string
  amount: number
  txHash: string | null
  status: string
  description: string | null
  metadata: string | null
  createdAt: string
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => apiFetch<{ success: boolean; data: { plans: SubscriptionPlan[] } }>('/api/subscription/plans'),
  })
}

export function useCurrentSubscription(userId?: string) {
  return useQuery({
    queryKey: ['currentSubscription', userId],
    queryFn: () => apiFetch<{ success: boolean; data: { subscription: UserSubscription | null; plan: SubscriptionPlan | null; afcBalance: number; afcUsed: number } }>(
      userId ? `/api/subscription/current?userId=${userId}` : '/api/subscription/current'
    ),
    enabled: !!userId,
  })
}

export function useSubscribePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { userId: string; planId: string; paymentMethod?: string; walletAddress?: string }) =>
      apiFetch('/api/subscription/subscribe', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentSubscription'] })
      qc.invalidateQueries({ queryKey: ['subscriptionPlans'] })
      qc.invalidateQueries({ queryKey: ['afcTransactions'] })
    },
  })
}

export function useTopUpAFC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { userId: string; amount: number; paymentMethod?: string }) =>
      apiFetch('/api/subscription/afc/top-up', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentSubscription'] })
      qc.invalidateQueries({ queryKey: ['afcTransactions'] })
    },
  })
}

export function useAFCTransactions(userId?: string) {
  return useQuery({
    queryKey: ['afcTransactions', userId],
    queryFn: () => apiFetch<{ success: boolean; data: { transactions: AFCTransaction[]; total: number; summary: { totalTransactions: number; netAmount: number; topUpTotal: number; spentTotal: number } } }>(
      userId ? `/api/subscription/afc/transactions?userId=${userId}` : '/api/subscription/afc/transactions'
    ),
    enabled: !!userId,
  })
}

// ===== Media Matrix - Verticals =====
export function useMediaVerticals() {
  return useQuery({
    queryKey: ['mediaVerticals'],
    queryFn: () => apiFetch<{ verticals: unknown[] }>('/api/media/verticals'),
  })
}

export function useCreateMediaVertical() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug: string; icon?: string; color?: string; description?: string; status?: string; priority?: number }) =>
      apiFetch('/api/media/verticals', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaVerticals'] }),
  })
}

export function useMediaVertical(id: string) {
  return useQuery({
    queryKey: ['mediaVertical', id],
    queryFn: () => apiFetch<{ vertical: unknown }>(`/api/media/verticals/${id}`),
    enabled: !!id,
  })
}

export function useUpdateMediaVertical() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/media/verticals/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaVerticals'] }),
  })
}

export function useDeleteMediaVertical() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/media/verticals/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaVerticals'] }),
  })
}

// ===== Media Matrix - Channels =====
export function useMediaChannels(verticalId?: string) {
  return useQuery({
    queryKey: ['mediaChannels', verticalId],
    queryFn: () => apiFetch<{ channels: unknown[] }>(
      verticalId ? `/api/media/channels?verticalId=${verticalId}` : '/api/media/channels'
    ),
  })
}

export function useCreateMediaChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { verticalId: string; name: string; platform: string; url?: string; followers?: number; avgReach?: number; postFrequency?: string; status?: string; avatarUrl?: string }) =>
      apiFetch('/api/media/channels', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaChannels'] }),
  })
}

export function useMediaChannel(id: string) {
  return useQuery({
    queryKey: ['mediaChannel', id],
    queryFn: () => apiFetch<{ channel: unknown }>(`/api/media/channels/${id}`),
    enabled: !!id,
  })
}

export function useUpdateMediaChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/media/channels/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaChannels'] }),
  })
}

export function useDeleteMediaChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/media/channels/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaChannels'] }),
  })
}

// ===== Media Matrix - Contents =====
export function useMediaContents(filters?: { verticalId?: string; status?: string; contentType?: string }) {
  return useQuery({
    queryKey: ['mediaContents', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters?.verticalId) params.set('verticalId', filters.verticalId)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.contentType) params.set('contentType', filters.contentType)
      const qs = params.toString()
      return apiFetch<{ contents: unknown[] }>(`/api/media/contents${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useCreateMediaContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { verticalId: string; title: string; channelId?: string; contentType?: string; status?: string; contentData?: string; citationUrl?: string; contentHash?: string; onChainTxId?: string; schemaMarkup?: string; reachCount?: number; citationCount?: number; aiCitationCount?: number; publishedAt?: string }) =>
      apiFetch('/api/media/contents', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaContents'] }),
  })
}

export function useMediaContent(id: string) {
  return useQuery({
    queryKey: ['mediaContent', id],
    queryFn: () => apiFetch<{ content: unknown }>(`/api/media/contents/${id}`),
    enabled: !!id,
  })
}

export function useUpdateMediaContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/media/contents/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaContents'] }),
  })
}

export function useDeleteMediaContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/media/contents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaContents'] }),
  })
}

// ===== Media Matrix - Seed =====
export function useSeedMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/media/seed', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mediaVerticals'] })
      qc.invalidateQueries({ queryKey: ['mediaChannels'] })
      qc.invalidateQueries({ queryKey: ['mediaContents'] })
    },
  })
}

// ===== BD Pipeline - Partners =====
export function useBDPartners(filters?: { verticalId?: string; partnerType?: string; stage?: string; status?: string }) {
  return useQuery({
    queryKey: ['bdPartners', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters?.verticalId) params.set('verticalId', filters.verticalId)
      if (filters?.partnerType) params.set('partnerType', filters.partnerType)
      if (filters?.stage) params.set('stage', filters.stage)
      if (filters?.status) params.set('status', filters.status)
      const qs = params.toString()
      return apiFetch<{ partners: unknown[] }>(`/api/bd/partners${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useCreateBDPartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; verticalId?: string; partnerType?: string; tier?: string; industry?: string; website?: string; contactName?: string; contactEmail?: string; contactWechat?: string; status?: string; stage?: string; valueScore?: number; notes?: string; bdScriptUsed?: string; lastContactAt?: string }) =>
      apiFetch('/api/bd/partners', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bdPartners'] }),
  })
}

export function useBDPartner(id: string) {
  return useQuery({
    queryKey: ['bdPartner', id],
    queryFn: () => apiFetch<{ partner: unknown }>(`/api/bd/partners/${id}`),
    enabled: !!id,
  })
}

export function useUpdateBDPartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/bd/partners/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bdPartners'] }),
  })
}

export function useDeleteBDPartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/bd/partners/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bdPartners'] }),
  })
}

// ===== BD Pipeline - Interactions =====
export function useBDInteractions(partnerId?: string) {
  return useQuery({
    queryKey: ['bdInteractions', partnerId],
    queryFn: () => apiFetch<{ interactions: unknown[] }>(
      partnerId ? `/api/bd/interactions?partnerId=${partnerId}` : '/api/bd/interactions'
    ),
  })
}

export function useCreateBDInteraction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { partnerId: string; type: string; subject: string; content?: string; outcome?: string; nextAction?: string; followUpDate?: string }) =>
      apiFetch('/api/bd/interactions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bdInteractions'] }),
  })
}

export function useBDInteraction(id: string) {
  return useQuery({
    queryKey: ['bdInteraction', id],
    queryFn: () => apiFetch<{ interaction: unknown }>(`/api/bd/interactions/${id}`),
    enabled: !!id,
  })
}

export function useUpdateBDInteraction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/bd/interactions/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bdInteractions'] }),
  })
}

export function useDeleteBDInteraction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/bd/interactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bdInteractions'] }),
  })
}

// ===== BD Pipeline - Seed =====
export function useSeedBD() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/bd/seed', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bdPartners'] })
      qc.invalidateQueries({ queryKey: ['bdInteractions'] })
    },
  })
}

// ===== GEO Optimization - Keywords =====
export function useGEOKeywords(filters?: { verticalId?: string; category?: string; status?: string }) {
  return useQuery({
    queryKey: ['geoKeywords', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters?.verticalId) params.set('verticalId', filters.verticalId)
      if (filters?.category) params.set('category', filters.category)
      if (filters?.status) params.set('status', filters.status)
      const qs = params.toString()
      return apiFetch<{ keywords: unknown[] }>(`/api/geo/keywords${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useCreateGEOKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { keyword: string; verticalId?: string; keywordEn?: string; category?: string; intent?: string; searchVolume?: number; difficulty?: number; currentRank?: number; targetRank?: number; status?: string }) =>
      apiFetch('/api/geo/keywords', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geoKeywords'] }),
  })
}

export function useGEOKeyword(id: string) {
  return useQuery({
    queryKey: ['geoKeyword', id],
    queryFn: () => apiFetch<{ keyword: unknown }>(`/api/geo/keywords/${id}`),
    enabled: !!id,
  })
}

export function useUpdateGEOKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/geo/keywords/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geoKeywords'] }),
  })
}

export function useDeleteGEOKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/geo/keywords/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geoKeywords'] }),
  })
}

// ===== GEO Optimization - Rankings =====
export function useGEORankings(filters?: { keywordId?: string; source?: string }) {
  return useQuery({
    queryKey: ['geoRankings', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters?.keywordId) params.set('keywordId', filters.keywordId)
      if (filters?.source) params.set('source', filters.source)
      const qs = params.toString()
      return apiFetch<{ rankings: unknown[] }>(`/api/geo/rankings${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useCreateGEORanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { keywordId: string; rank: number; aiCitation?: boolean; citationUrl?: string; source?: string; capturedAt?: string }) =>
      apiFetch('/api/geo/rankings', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geoRankings'] })
      qc.invalidateQueries({ queryKey: ['geoKeywords'] })
    },
  })
}

// ===== GEO Optimization - Seed =====
export function useSeedGEO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/geo/seed', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geoKeywords'] })
      qc.invalidateQueries({ queryKey: ['geoRankings'] })
    },
  })
}

// ===== Agent API Management - Endpoints =====
export function useAgentAPIEndpoints() {
  return useQuery({
    queryKey: ['agentAPIEndpoints'],
    queryFn: () => apiFetch<{ endpoints: unknown[] }>('/api/agent-api/endpoints'),
  })
}

export function useCreateAgentAPIEndpoint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; path: string; method: string; description?: string; requestSchema?: string; responseSchema?: string; authRequired?: boolean; rateLimit?: number; status?: string }) =>
      apiFetch('/api/agent-api/endpoints', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentAPIEndpoints'] }),
  })
}

export function useAgentAPIEndpoint(id: string) {
  return useQuery({
    queryKey: ['agentAPIEndpoint', id],
    queryFn: () => apiFetch<{ endpoint: unknown }>(`/api/agent-api/endpoints/${id}`),
    enabled: !!id,
  })
}

export function useUpdateAgentAPIEndpoint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      apiFetch(`/api/agent-api/endpoints/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentAPIEndpoints'] }),
  })
}

export function useDeleteAgentAPIEndpoint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/agent-api/endpoints/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentAPIEndpoints'] }),
  })
}

// ===== Agent API Management - Seed =====
export function useSeedAgentAPI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/agent-api/seed', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agentAPIEndpoints'] }),
  })
}

// ===== Memory Palace =====
export function useMemoryPalace(cloneId?: string) {
  return useQuery({
    queryKey: ['memory-palace', cloneId],
    queryFn: async () => {
      const res = await fetch('/api/memory/palace')
      return res.json()
    },
  })
}

export function useMemoryDrawers(filters?: { roomId?: string; wingId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['memory-drawers', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.roomId) params.set('roomId', filters.roomId)
      if (filters?.wingId) params.set('wingId', filters.wingId)
      if (filters?.limit) params.set('limit', String(filters.limit))
      const res = await fetch(`/api/memory/drawers?${params}`)
      return res.json()
    },
  })
}

export function useCreateDrawer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { roomId: string; content: string; sourceType: string; importance?: number; tags?: string[] }) => {
      const res = await fetch('/api/memory/drawers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory-drawers'] })
      qc.invalidateQueries({ queryKey: ['memory-palace'] })
    },
  })
}

export function useUpdateDrawer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/memory/drawers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory-drawers'] })
      qc.invalidateQueries({ queryKey: ['memory-palace'] })
    },
  })
}

export function useMemoryTunnels() {
  return useQuery({
    queryKey: ['memory-tunnels'],
    queryFn: async () => {
      const res = await fetch('/api/memory/tunnels')
      return res.json()
    },
  })
}

export function useMemoryWake(cloneId?: string) {
  return useQuery({
    queryKey: ['memory-wake', cloneId],
    queryFn: async () => {
      const res = await fetch('/api/memory/wake')
      return res.json()
    },
  })
}

export function useKGEntities(entityType?: string) {
  return useQuery({
    queryKey: ['kg-entities', entityType],
    queryFn: async () => {
      const params = entityType ? `?entityType=${entityType}` : ''
      const res = await fetch(`/api/memory/kg/entities${params}`)
      return res.json()
    },
  })
}

export function useKGTriples(entityName?: string) {
  return useQuery({
    queryKey: ['kg-triples', entityName],
    queryFn: async () => {
      const params = entityName ? `?subject=${encodeURIComponent(entityName)}` : ''
      const res = await fetch(`/api/memory/kg${params}`)
      return res.json()
    },
  })
}

export function useAddKGTriple() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { subjectName: string; predicate: string; objectName: string; confidence?: number }) => {
      const res = await fetch('/api/memory/kg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kg-triples'] })
      qc.invalidateQueries({ queryKey: ['kg-entities'] })
    },
  })
}

export function useDiscoverTunnels() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/memory/tunnels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autoDiscover: true }) })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memory-tunnels'] }),
  })
}

// ===== Stripe Payment =====
export function useCreateStripeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { planId?: string; userId?: string; amount: number; currency?: string; paymentMethod?: string; successUrl?: string; cancelUrl?: string }) =>
      apiFetch<{ ok: boolean; data: { sessionId: string; url: string; amount: number; currency: string; paymentMethodTypes: string[]; mode: string; expiresAt: string; stripeMode: string } }>(
        '/api/payments/stripe/create-session',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentSubscription'] })
      qc.invalidateQueries({ queryKey: ['afcTransactions'] })
    },
  })
}

export function useVerifyStripePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { sessionId: string }) =>
      apiFetch<{ ok: boolean; data: { sessionId: string; status: string; amount: number; currency: string; paymentMethod: string; paidAt?: string } }>(
        '/api/payments/stripe/verify',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentSubscription'] })
      qc.invalidateQueries({ queryKey: ['afcTransactions'] })
      qc.invalidateQueries({ queryKey: ['subscriptionPlans'] })
    },
  })
}

export function useStripeLinkStatus(userId?: string) {
  return useQuery({
    queryKey: ['stripeLinkStatus', userId],
    queryFn: () => apiFetch<{ ok: boolean; data: { linkAvailable: boolean; linkEnabled: boolean; stripeMode: string; email: string | null; savedPaymentMethods: Array<{ id: string; type: string; last4?: string; brand?: string; email?: string; isDefault: boolean }>; phone: string | null; country: string } }>(
      userId ? `/api/payments/stripe/link-status?userId=${userId}` : '/api/payments/stripe/link-status'
    ),
    enabled: !!userId,
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => apiFetch<{ ok: boolean; data: { methods: Array<{ id: string; name: string; description: string; icon: string; available: boolean; badge?: string; badgeColor?: string; oneClick: boolean; processingTime: string }>; defaultMethod: string; stripeMode: string } }>(
      '/api/payments/methods'
    ),
  })
}

// ===== Swarm Coordinator =====
export function useSwarmStatus() {
  return useQuery({
    queryKey: ['swarmStatus'],
    queryFn: () => apiFetch<{ ok: boolean; data: { initialized: boolean; topologyType: string; agentCount: number; activeAgents: number; taskStats: { pending: number; assigned: number; inProgress: number; completed: number }; avgWorkload: number; messageCount: number; lastActivity: string } }>('/api/swarm/status'),
    refetchInterval: 10000,
  })
}

export function useSwarmAgents() {
  return useQuery({
    queryKey: ['swarmAgents'],
    queryFn: () => apiFetch<{ ok: boolean; data: { agents: Array<{ id: string; name: string; role: string; status: string; workload: number; capabilities: string[]; domain: string; avatar: string; level: number; experience: number; lastActiveAt: string }> } }>('/api/swarm/agents'),
    refetchInterval: 8000,
  })
}

export function useRegisterSwarmAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; role: string; capabilities?: string[]; domain?: string }) =>
      apiFetch('/api/swarm/agents', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['swarmAgents'] }),
  })
}

export function useSwarmTasks() {
  return useQuery({
    queryKey: ['swarmTasks'],
    queryFn: () => apiFetch<{ ok: boolean; data: { tasks: Array<{ id: string; title: string; description: string; priority: number; taskType: string; status: string; assignedTo: string | null; assignedAgentName: string | null; createdAt: string; updatedAt: string; completedAt: string | null; distributionReason: string | null }> } }>('/api/swarm/tasks'),
    refetchInterval: 8000,
  })
}

export function useCreateSwarmTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: number; taskType?: string }) =>
      apiFetch('/api/swarm/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['swarmTasks'] }),
  })
}

export function useInitSwarm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { topologyType: string }) =>
      apiFetch('/api/swarm/init', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['swarmStatus'] })
      qc.invalidateQueries({ queryKey: ['swarmTopology'] })
    },
  })
}

export function useDistributeTasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch('/api/swarm/distribute', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['swarmTasks'] })
      qc.invalidateQueries({ queryKey: ['swarmAgents'] })
      qc.invalidateQueries({ queryKey: ['swarmMessages'] })
      qc.invalidateQueries({ queryKey: ['swarmStatus'] })
    },
  })
}

export function useSwarmTopology() {
  return useQuery({
    queryKey: ['swarmTopology'],
    queryFn: () => apiFetch<{ ok: boolean; data: { topology: { type: string; agents: string[]; connections: [string, string][]; createdAt: string } | null; agents: Array<{ id: string; name: string; role: string; status: string }> } }>('/api/swarm/topology'),
    refetchInterval: 15000,
  })
}

export function useSwarmMessages() {
  return useQuery({
    queryKey: ['swarmMessages'],
    queryFn: () => apiFetch<{ ok: boolean; data: { messages: Array<{ id: string; from: string; fromName: string; to: string; toName: string; type: string; content: string; timestamp: string }>; total: number } }>('/api/swarm/messages'),
    refetchInterval: 5000,
  })
}

export function useSendSwarmMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { from: string; to: string; type: string; content: string }) =>
      apiFetch('/api/swarm/messages', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['swarmMessages'] }),
  })
}
