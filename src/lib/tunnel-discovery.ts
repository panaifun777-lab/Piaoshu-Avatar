// Tunnel Discovery — Auto-discover cross-wing connections (MemPalace-inspired)
// Rooms with matching names or tags across wings become tunnels

import { db } from '@/lib/db'

interface TunnelCandidate {
  roomAId: string
  roomBId: string
  sharedTheme: string
  strength: number
  wingA: string
  wingB: string
}

/**
 * Discover tunnels between rooms with matching names or tags across different wings
 * Tunnel strength = sum of drawer counts of connected rooms
 */
export async function discoverTunnels(cloneId: string): Promise<TunnelCandidate[]> {
  // Get all rooms for this clone with wing info
  const rooms = await db.memoryRoom.findMany({
    where: {
      wing: { cloneId },
    },
    include: {
      wing: true,
      drawers: {
        where: { validTo: null },
        select: { id: true },
      },
    },
  })

  // Group rooms by name (for same-name tunnels)
  const roomByName = new Map<string, typeof rooms>()
  for (const room of rooms) {
    const existing = roomByName.get(room.name) || []
    existing.push(room)
    roomByName.set(room.name, existing)
  }

  // Also collect tag-based connections
  const roomTags = new Map<string, Set<string>>()
  for (const room of rooms) {
    const tags = new Set<string>()
    for (const drawer of room.drawers) {
      // We need to fetch tags for each drawer separately
    }
    roomTags.set(room.id, tags)
  }

  // Fetch drawer tags for tag-based tunnel discovery
  const drawerTags = await db.drawerTag.findMany({
    where: {
      drawer: {
        room: {
          wing: { cloneId },
        },
        validTo: null,
      },
    },
    include: {
      drawer: {
        select: { roomId: true },
      },
    },
  })

  // Build room → tag set mapping
  const roomTagMap = new Map<string, Set<string>>()
  for (const dt of drawerTags) {
    const roomId = dt.drawer.roomId
    if (!roomTagMap.has(roomId)) {
      roomTagMap.set(roomId, new Set())
    }
    roomTagMap.get(roomId)!.add(dt.tag)
  }

  const tunnels: TunnelCandidate[] = []
  const seenPairs = new Set<string>()

  function addTunnel(roomA: typeof rooms[0], roomB: typeof rooms[0], theme: string) {
    if (roomA.wingId === roomB.wingId) return // Only cross-wing tunnels

    const pairKey = [roomA.id, roomB.id].sort().join('::')
    if (seenPairs.has(pairKey)) return
    seenPairs.add(pairKey)

    const strength = roomA.drawerCount + roomB.drawerCount
    tunnels.push({
      roomAId: roomA.id,
      roomBId: roomB.id,
      sharedTheme: theme,
      strength: Math.max(1, strength),
      wingA: roomA.wing.name,
      wingB: roomB.wing.name,
    })
  }

  // 1. Same-name tunnels across different wings
  for (const [name, matchingRooms] of roomByName) {
    if (matchingRooms.length >= 2) {
      for (let i = 0; i < matchingRooms.length; i++) {
        for (let j = i + 1; j < matchingRooms.length; j++) {
          addTunnel(matchingRooms[i], matchingRooms[j], name)
        }
      }
    }
  }

  // 2. Tag-based tunnels (rooms sharing ≥2 tags across different wings)
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (rooms[i].wingId === rooms[j].wingId) continue

      const tagsA = roomTagMap.get(rooms[i].id)
      const tagsB = roomTagMap.get(rooms[j].id)
      if (!tagsA || !tagsB) continue

      const shared = [...tagsA].filter(t => tagsB.has(t))
      if (shared.length >= 2) {
        addTunnel(rooms[i], rooms[j], shared.slice(0, 3).join('+'))
      }
    }
  }

  return tunnels
}

/**
 * Persist discovered tunnels to database (upsert)
 * Also updates tunnel strengths based on current drawer counts
 */
export async function persistTunnels(cloneId: string): Promise<number> {
  const candidates = await discoverTunnels(cloneId)

  // Get existing tunnels
  const existing = await db.memoryTunnel.findMany({
    where: {
      OR: [
        { roomA: { wing: { cloneId } } },
        { roomB: { wing: { cloneId } } },
      ],
    },
  })

  const existingKeys = new Set(
    existing.map(t => [t.roomAId, t.roomBId].sort().join('::'))
  )

  let created = 0

  for (const candidate of candidates) {
    const key = [candidate.roomAId, candidate.roomBId].sort().join('::')

    if (existingKeys.has(key)) {
      // Update strength
      await db.memoryTunnel.updateMany({
        where: {
          OR: [
            { roomAId: candidate.roomAId, roomBId: candidate.roomBId },
            { roomAId: candidate.roomBId, roomBId: candidate.roomAId },
          ],
        },
        data: { strength: candidate.strength },
      })
    } else {
      // Create new tunnel
      await db.memoryTunnel.create({
        data: {
          roomAId: candidate.roomAId,
          roomBId: candidate.roomBId,
          sharedTheme: candidate.sharedTheme,
          strength: candidate.strength,
        },
      })
      created++
    }
  }

  return created
}
