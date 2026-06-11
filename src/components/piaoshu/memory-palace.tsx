'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Brain, DoorOpen, Archive, Link2, Sparkles, Star, Eye,
  Plus, GitBranch, Zap, ChevronRight, Network, Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemoryPalace, useMemoryDrawers, useMemoryWake, useMemoryTunnels, useKGEntities, useCreateDrawer, useDiscoverTunnels } from '@/lib/api-hooks'
import { useToast } from '@/hooks/use-toast'

const WING_COLORS: Record<string, string> = {
  '个人身份': 'violet', '战略决策': 'amber', '工程架构': 'cyan',
  '增长运营': 'emerald', '人脉关系': 'rose',
}
const WING_ICONS: Record<string, string> = {
  '个人身份': '🧬', '战略决策': '🎯', '工程架构': '⚙️',
  '增长运营': '📈', '人脉关系': '🤝',
}
const HALL_BADGES: Record<string, string> = {
  facts: '📋 事实', events: '📅 事件', discoveries: '💡 发现',
  preferences: '❤️ 偏好', advice: '🎓 建议', decisions: '⚡ 决策',
}

export function MemoryPalace() {
  const { toast } = useToast()
  const [selectedWing, setSelectedWing] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [drawerFilter, setDrawerFilter] = useState<{ roomId?: string }>({})

  const { data: palaceData, isLoading: palaceLoading } = useMemoryPalace()
  const { data: wakeData } = useMemoryWake()
  const { data: drawersData, isLoading: drawersLoading } = useMemoryDrawers(drawerFilter)
  const { data: tunnelsData } = useMemoryTunnels()
  const { data: kgEntities } = useKGEntities()
  const createDrawer = useCreateDrawer()
  const discoverTunnels = useDiscoverTunnels()

  const palace = palaceData?.data
  const wings = palace?.wings || []
  const stats = palace?.stats || { totalWings: 0, totalRooms: 0, totalDrawers: 0, tunnelCount: 0 }
  const wake = wakeData?.data
  const drawers = drawersData?.data?.drawers || []
  const tunnels = tunnelsData?.data?.tunnels || []
  const entities = kgEntities?.data?.entities || []

  const handleCreateDrawer = async () => {
    if (!newContent.trim() || !selectedRoom) return
    try {
      await createDrawer.mutateAsync({ roomId: selectedRoom, content: newContent, sourceType: 'manual', importance: 3 })
      setNewContent('')
      setShowAddDrawer(false)
      toast({ title: '记忆已添加' })
    } catch { toast({ title: '添加失败', variant: 'destructive' }) }
  }

  const handleDiscover = async () => {
    try { await discoverTunnels.mutateAsync(); toast({ title: '隧道发现完成' }) }
    catch { toast({ title: '发现失败', variant: 'destructive' }) }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-teal-500" /> 记忆宫殿
            <Badge variant="outline" className="text-xs">Memory Palace</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">层次化记忆系统 · 结构优于搜索</p>
        </div>
        <div className="flex items-center gap-3">
          {wake && <Badge variant="secondary" className="gap-1"><Layers className="h-3 w-3" /> L0+L1</Badge>}
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{stats.totalWings}翼</span><span>{stats.totalRooms}房</span>
            <span>{stats.totalDrawers}记忆</span><span>{stats.tunnelCount}隧道</span>
          </div>
        </div>
      </div>

      {/* Palace Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {palaceLoading ? Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>
        )) : wings.map((wing: any) => {
          const isSelected = selectedWing === wing.id
          return (
            <motion.div key={wing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-teal-500/50' : ''}`}
                onClick={() => { setSelectedWing(isSelected ? null : wing.id); setSelectedRoom(null) }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{WING_ICONS[wing.name] || '🏛️'}</span> {wing.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">P{wing.priority}</Badge>
                      <Progress value={wing.priority * 10} className="w-12 h-1.5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{wing.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="space-y-1.5 pt-2">
                          {wing.rooms?.map((room: any) => (
                            <div key={room.id}
                              className={`flex items-center justify-between p-2 rounded-md text-sm cursor-pointer transition-colors
                                ${selectedRoom === room.id ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'hover:bg-muted'}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedRoom(room.id); setDrawerFilter({ roomId: room.id }) }}>
                              <div className="flex items-center gap-2">
                                <DoorOpen className="h-3.5 w-3.5" />
                                <span>{room.name}</span>
                                <Badge variant="secondary" className="text-[10px]">{HALL_BADGES[room.hallType] || room.hallType}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{room._count?.drawers || 0}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isSelected && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3" /> {wing.rooms?.length || 0} 房间
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Drawer Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Archive className="h-4 w-4 text-teal-500" /> 记忆抽屉
            </CardTitle>
            <Dialog open={showAddDrawer} onOpenChange={setShowAddDrawer}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" disabled={!selectedRoom}><Plus className="h-3 w-3" /> 添加</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>添加记忆</DialogTitle></DialogHeader>
                <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="输入记忆内容..." rows={4} />
                <Button onClick={handleCreateDrawer} disabled={createDrawer.isPending}>
                  {createDrawer.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            {drawersLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : drawers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">选择房间查看记忆</p>
              </div>
            ) : (
              <div className="space-y-2">
                {drawers.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{d.content}</p>
                        {d.aaaakSummary && (
                          <p className="text-xs mt-1 p-1.5 bg-amber-500/5 border border-amber-500/10 rounded font-mono text-amber-700 dark:text-amber-400">
                            AAAK: {d.aaaakSummary}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-2.5 w-2.5 ${i < Math.round(d.importance || 3) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${d.validTo ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span className="text-[10px] text-muted-foreground">{d.validTo ? '过期' : '有效'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px]">{d.sourceType}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5" /> {d.accessCount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* KG + Tunnels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-violet-500" /> 知识图谱
              <Badge variant="secondary" className="text-xs">{entities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              {entities.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Network className="h-6 w-6 mx-auto mb-1 opacity-30" />Agent周期运行后自动构建
                </div>
              ) : (
                <div className="space-y-1.5">
                  {entities.slice(0, 15).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{e.entityType}</Badge>
                        <span>{e.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-cyan-500" /> 跨域隧道
                <Badge variant="secondary" className="text-xs">{tunnels.length}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={handleDiscover} disabled={discoverTunnels.isPending}>
                <Sparkles className="h-3 w-3" /> 发现
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              {tunnels.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Link2 className="h-6 w-6 mx-auto mb-1 opacity-30" />点击"发现"检测跨翼关联
                </div>
              ) : (
                <div className="space-y-1.5">
                  {tunnels.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{t.roomA?.name || '...'}</span>
                        <Link2 className="h-3 w-3 text-cyan-500" />
                        <span>{t.roomB?.name || '...'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{t.sharedTheme}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Memory Wake */}
      {wake && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> 记忆唤醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wake.layers ? wake.layers.map((layer: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={i === 0 ? 'default' : 'secondary'} className="text-xs">L{layer.layer}</Badge>
                    <span className="text-xs text-muted-foreground">~{layer.tokens} tokens</span>
                  </div>
                  <p className="text-xs font-mono line-clamp-3">{layer.content}</p>
                </div>
              )) : wake.wakeUp && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-mono line-clamp-5">{wake.wakeUp}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
