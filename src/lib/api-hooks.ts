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
export function useMemories() {
  return useQuery({
    queryKey: ['memories'],
    queryFn: () => apiFetch<{ memories: unknown[]; total: number; continuity: number }>('/api/cognitive/memory'),
  })
}
