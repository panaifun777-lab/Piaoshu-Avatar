# MemPalace Architecture Analysis Report
## For Piaoshu Avatar OS Memory System Integration

**Task ID:** 2  
**Date:** 2026-03-04  
**Analyst:** Task 2 Agent  

---

## 1. MemPalace Architecture Deep Dive

### 1.1 Core Architecture: The Memory Palace Metaphor

MemPalace organizes memory using a spatial hierarchy inspired by the ancient Greek "method of loci":

| Level | Analogy | Implementation | Purpose |
|-------|---------|---------------|---------|
| **Wing** | Building wing | Project/person/topic domain | Top-level scoping (e.g., "my_app", "Alice", "emotions") |
| **Room** | Room in wing | Topic category within a wing | Sub-topic classification (e.g., "auth", "billing", "deploy") |
| **Hall** | Corridor | Memory type shared across wings | Type classification: facts, events, discoveries, preferences, advice |
| **Drawer** | Drawer | Verbatim text chunk (800 chars, 100 overlap) | Lossless original content storage |
| **Closet** | Closet | AAAK-compressed summary (~30x smaller) | Quick-scan compressed representation |
| **Tunnel** | Tunnel | Cross-wing connection | Auto-discovery of related topics across domains |

**Key insight:** Structure alone delivers a **34% accuracy boost** over flat vector search (60.9% → 94.8% R@10) without any algorithm improvement.

### 1.2 AAAK Compression Format

MemPalace's most innovative feature — a 30x compression format natively readable by any LLM:

```
TEAM: PRI(lead) | KAI(backend,3yr) SOR(frontend) MAY(infra) LEO(junior,new)
PROJ: DRIFTWOOD(saas.analytics) | SPRINT: auth.migration→clerk
DECISION: KAI.rec:clerk>auth0(pricing+dx) | ★★★★
```

**How it works:**
- Removes 100+ English stop words
- Extracts topics via word frequency (boosts proper nouns/technical terms)
- Selects most decision-relevant sentence under 80 chars as key quote
- Encodes entities as 3-letter uppercase codes (Alice = ALC)
- Maps emotions to 29 abbreviated codes (vul, joy, fear, trust, etc.)
- Tags with 7 semantic flags: ORIGIN, CORE, SENSITIVE, PIVOT, GENESIS, DECISION, TECHNICAL
- Cross-references: `T:0<->3|shared_theme`
- Emotional arcs: `ARC:fear->trust`

**No decoder needed** — any LLM reads AAAK natively. The LLM acts as a "free decompressor."

### 1.3 Layered Memory Loading (4 Levels)

| Layer | Content | Size | When Loaded |
|-------|---------|------|-------------|
| **L0** | Identity (who is this AI) | ~50-100 tokens | Always |
| **L1** | Critical facts (team, projects, preferences) | ~120-800 tokens (AAAK) | Always |
| **L2** | Room recall (recent sessions) | ~200-500 tokens | On-demand (topic surfaces) |
| **L3** | Deep search (semantic across all closets) | Unlimited | On-demand (explicit request) |

**Startup cost: L0+L1 = ~170-900 tokens** vs. naive approach of millions of tokens.

**Cost comparison (annual, 5 conversations/day):**
- Paste everything: Impossible
- LLM summaries: ~$507/year
- MemPalace wake-up: ~$0.70/year
- MemPalace + 5 searches/day: ~$10/year

### 1.4 Temporal Knowledge Graph

MemPalace maintains a **temporal entity-relationship graph** in SQLite:

**Schema:**
- `entities`: id, name, type (person/project/animal), JSON properties
- `triples`: RDF-style subject-predicate-object with `valid_from` and `valid_to`

**Key features:**
- Every fact has a **validity window** (valid_from → valid_to)
- Invalidation marks end dates **without deletion** (preserves history)
- Historical queries: "What was true on June 15, 2025?"
- **Contradiction detection** via deduplication before insert
- Auto-detects stale assignments, tenure mismatches, outdated sprint dates

### 1.5 Room Detection (No LLM Required)

**For project files:** 60 keyword-to-room mappings, 4-priority cascade:
1. Folder path match (file in `/auth/` → "auth" room)
2. Filename match
3. Keyword scoring of content
4. Interactive approval saved to `mempalace.yaml`

**For conversations:** Score each chunk against 5 keyword sets:
- Technical: 13 keywords (code, python, api, bug)
- Architecture: 10 keywords
- Planning: 10 keywords
- Decisions: 10 keywords
- Problems: 10 keywords

Highest score wins; default is "general".

### 1.6 Ingestion Pipeline

Three mining modes:
1. **Project mining**: Walk directory tree, 20 recognized extensions, 800-char chunks with 100-char overlap, MD5 dedup, store in ChromaDB
2. **Conversation mining**: Normalize Claude/ChatGPT/Slack exports, "exchange" mode chunking (user Q + AI response = 1 chunk)
3. **General extraction**: 5 memory types via regex (decisions: 20 patterns, preferences: 16, milestones: 33, problems: 18, emotional: 29). Resolved problems reclassified as milestones.

### 1.7 Navigation Graph (palace_graph.py)

- **Graph construction**: Iterates all ChromaDB docs in batches of 1000, extracts metadata, identifies edges where rooms span multiple wings
- **BFS traversal**: Starting from a room, finds related rooms up to 2 hops, sorted by (distance, -drawer_count)
- **Tunnel detection**: Any room in 2+ wings becomes a tunnel, sorted by drawer count
- **Fuzzy matching**: Substring matching for room names, top 5 suggestions

### 1.8 MCP Integration

29 MCP tools via JSON-RPC 2.0 over stdin/stdout:
- 11 read tools: status, list wings/rooms, taxonomy, search, duplicate check, graph traversal, tunnel finder, graph stats, KG query, AAAK spec
- 3 write tools: add drawer (auto-dedup), delete drawer, add KG triple
- 3 KG tools: invalidate facts, timeline, stats
- 2 diary tools: write/read per-agent timestamped entries
- "Know before speaking" protocol: injects reminder to check memory before answering

### 1.9 Specialist Agents

Each agent gets its own wing and AAAK diary:
```json
~/.mempalace/agents/
├── reviewer.json    // code review patterns, bug records
├── architect.json   // design decisions, trade-offs
└── ops.json         // deploys, incidents, infrastructure
```

Agents accumulate domain expertise across sessions independently.

### 1.10 Auto-Save Hooks

- **Save hook**: Fires every 15 messages, auto-extracts topics, decisions, code changes
- **PreCompact hook**: Fires before context compression, emergency-saves current memory
- No manual "remember this" needed

---

## 2. Our Current Memory System Analysis

### 2.1 MemoryEntry Prisma Model

```prisma
model MemoryEntry {
  id             String   @id @default(cuid())
  sourceType     String   // simulation, chat, decision, manual, evidence, external
  sourceId       String?
  content        String   // Memory content summary
  embedding      String?  // Vector embedding (JSON array string)
  tags           String?  // Comma-separated tags
  relevanceScore Float    @default(0.0)
  accessCount    Int      @default(0)
  lastAccessed   DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Strengths:**
- Simple, easy to understand
- Has accessCount and lastAccessed for usage tracking
- sourceType/sourceId for provenance

**Weaknesses:**
- **Flat structure** — no hierarchy, no wings/rooms/halls
- **No temporal validity** — no concept of facts expiring or becoming outdated
- **Tags as comma-separated string** — no structured classification (no room/hall type)
- **No compression** — full content stored, no AAAK equivalent
- **No agentId field** — agent filtering done via hacky tag search (`tags.contains(agentId)`)
- **No layering** — all memories loaded equally, no L0/L1/L2/L3 distinction
- **No cross-domain links** — no tunnels, no navigation graph
- **embedding as JSON string** — inefficient, not queried at DB level

### 2.2 Vector Search Service (Port 3004)

**Implementation:**
- 64-dim semantic hash embedding (character n-grams 1-4, word-level features, word-pair co-occurrence)
- In-memory vector store (Map<string, VectorEntry>)
- Cosine similarity search
- Manual sync from MemoryEntry DB

**Strengths:**
- Zero-dependency, runs locally
- Fast for small datasets
- Basic semantic search works

**Weaknesses:**
- **64 dimensions is very low** — MemPalace uses ChromaDB with 384+ dim embeddings (all-MiniLM-L6-v2 or embeddinggemma-300m)
- **Hash embeddings are lossy** — n-gram hashing loses semantic nuance vs. proper neural embeddings
- **In-memory only** — no persistence across restarts
- **No structured search** — cannot filter by wing/room/hall during search
- **No scoped search** — always searches all vectors, no "search within wing X" capability
- **No hybrid search** — pure vector similarity, no keyword boosting, no temporal proximity boosting
- **Manual sync required** — no auto-embedding on memory creation

### 2.3 Memory Continuity Scoring

**Current implementation:**
- Time continuity: average gap hours between consecutive memories (shorter = better)
- Cross-reference continuity: shared tags between consecutive memories
- Relevance continuity: average relevance score
- Combined: 30% time + 30% cross-ref + 20% relevance + 20% volume bonus

**Strengths:**
- Multi-dimensional scoring
- Agent-specific memory chains
- Source-type grouping

**Weaknesses:**
- **Tag-based agent filtering** — fragile, relies on exact tag matching
- **No knowledge graph** — relationships between entities not tracked
- **No temporal validity** — cannot tell if a fact is still current
- **No decay mechanism** — old memories weighted same as new
- **Linear scoring** — doesn't capture non-linear memory importance (pivotal moments vs. routine)

### 2.4 SharedKnowledge Model

```prisma
model SharedKnowledge {
  id           String
  domain       String   // marketing, code, growth, strategy, engineering
  insight      String   // anonymized insight
  sourceType   String
  confidence   Float
  appliedCount Int
  createdAt    DateTime
}
```

**This is our closest equivalent to MemPalace's knowledge graph**, but it's much simpler:
- No entity-relationship structure (just flat insights)
- No temporal validity
- No cross-domain tunnels
- No contradiction detection

---

## 3. Feature-by-Feature Comparison

| Feature | MemPalace | Piaoshu Current | Gap |
|---------|-----------|-----------------|-----|
| **Memory Hierarchy** | Wing→Room→Hall→Drawer/Closet | Flat MemoryEntry | 🔴 Critical |
| **Compression** | AAAK 30x, LLM-native | None | 🔴 Critical |
| **Layered Loading** | L0/L1/L2/L3 progressive | All-or-nothing | 🔴 Critical |
| **Temporal Knowledge Graph** | RDF triples with valid_from/valid_to | Flat SharedKnowledge | 🟡 Major |
| **Vector Embedding** | 384+ dim neural (MiniLM/Gemma) | 64-dim hash | 🟡 Major |
| **Scoped Search** | Filter by wing+room+hall | Flat search only | 🟡 Major |
| **Cross-Domain Discovery** | Tunnels + BFS navigation graph | None | 🟡 Major |
| **Auto-Classification** | Regex heuristics (5 categories) | Manual sourceType | 🟢 Moderate |
| **Auto-Save** | Hook-based (15 msg + PreCompact) | Manual/implicit | 🟢 Moderate |
| **Agent-Specific Memory** | Per-agent wings + diaries | Tag-based filtering | 🟢 Moderate |
| **Fact Expiry** | valid_from/valid_to + invalidation | None | 🟡 Major |
| **Contradiction Detection** | Dedup before insert | None | 🟢 Moderate |
| **Persistence** | ChromaDB + SQLite KG | In-memory Map + SQLite Prisma | 🟡 Major |
| **MCP Integration** | 29 tools | None (REST API only) | 🟢 Moderate |

---

## 4. Key Features to Adopt (Priority Ranked)

### Priority 1: CRITICAL — Memory Hierarchy + Layered Loading

**Why:** Our flat MemoryEntry is the single biggest gap. Without hierarchy, we can't do scoped search, progressive loading, or meaningful organization. This alone accounts for MemPalace's 34% accuracy boost.

**Implementation Plan:**

#### 4.1.1 Enhanced Prisma Schema

```prisma
// Memory Palace Hierarchy
model MemoryWing {
  id          String   @id @default(cuid())
  cloneId     String   // Which avatar clone owns this wing
  name        String   // e.g., "product", "engineering", "relationships", "identity"
  wingType    String   @default("topic") // topic, person, project, agent
  description String?
  priority    Int      @default(5)  // 1-10, determines L1 inclusion
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  clone   AvatarClone @relation(fields: [cloneId], references: [id])
  rooms   MemoryRoom[]
}

model MemoryRoom {
  id          String   @id @default(cuid())
  wingId      String
  name        String   // e.g., "auth", "billing", "deploy", "general"
  hallType    String   @default("facts") // facts, events, discoveries, preferences, advice
  drawerCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  wing     MemoryWing   @relation(fields: [wingId], references: [id])
  drawers  MemoryDrawer[]
  tunnels  MemoryTunnel[]
}

model MemoryDrawer {
  id           String   @id @default(cuid())
  roomId       String
  content      String   // Verbatim original text
  aaaakSummary String?  // AAAK-compressed summary
  chunkIndex   Int      @default(0)
  sourceType   String   // simulation, chat, decision, manual, evidence, external
  sourceId     String?
  importance   Float    @default(3.0)  // 1-5, determines L1 loading
  emotionalWeight Float @default(0.0)
  contentHash  String?  // MD5 for dedup
  accessCount  Int      @default(0)
  lastAccessed DateTime?
  validFrom    DateTime @default(now())
  validTo      DateTime?  // NULL = still valid
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  room    MemoryRoom   @relation(fields: [roomId], references: [id])
  tags    DrawerTag[]
}

model DrawerTag {
  id       String @id @default(cuid())
  drawerId String
  tag      String
  createdAt DateTime @default(now())

  drawer MemoryDrawer @relation(fields: [drawerId], references: [id])
}

// Cross-wing tunnels
model MemoryTunnel {
  id         String   @id @default(cuid())
  roomAId    String
  roomBId    String
  sharedTheme String // e.g., "authentication", "deployment"
  strength   Int      @default(1) // Number of cross-references
  createdAt  DateTime @default(now())

  roomA MemoryRoom @relation("TunnelA", fields: [roomAId], references: [id])
  roomB MemoryRoom @relation("TunnelB", fields: [roomBId], references: [id])
}
```

#### 4.1.2 Layered Loading Service

```typescript
// /src/lib/memory-loader.ts

interface MemoryLayer {
  layer: 'L0' | 'L1' | 'L2' | 'L3'
  tokens: number
  content: string
}

export class MemoryLoader {
  // L0: Identity (always loaded, ~50 tokens)
  async loadL0(cloneId: string): Promise<MemoryLayer> {
    const clone = await db.avatarClone.findUnique({ where: { id: cloneId } })
    return {
      layer: 'L0',
      tokens: 50,
      content: `I am ${clone.name}, ${clone.persona.substring(0, 200)}`
    }
  }

  // L1: Essential facts (always loaded, ~500-800 tokens)
  async loadL1(cloneId: string): Promise<MemoryLayer> {
    const wings = await db.memoryWing.findMany({
      where: { cloneId, priority: { gte: 7 } },
      include: { rooms: { include: { drawers: { 
        where: { importance: { gte: 4 }, validTo: null },
        orderBy: { importance: 'desc' },
        take: 3 
      }}}}
    })
    // Build AAAK summary from top drawers
    const summaries = wings.flatMap(w => 
      w.rooms.flatMap(r => 
        r.drawers.map(d => d.aaaakSummary || d.content.substring(0, 200))
      )
    ).slice(0, 15)
    
    return { layer: 'L1', tokens: 500, content: summaries.join('\n') }
  }

  // L2: Room-specific recall (on-demand, ~200-500 tokens)
  async loadL2(roomId: string): Promise<MemoryLayer> {
    const drawers = await db.memoryDrawer.findMany({
      where: { roomId, validTo: null },
      orderBy: { importance: 'desc' },
      take: 10
    })
    return { layer: 'L2', tokens: 300, content: drawers.map(d => d.content.substring(0, 300)).join('\n---\n') }
  }

  // L3: Deep semantic search (unlimited, on-demand)
  async loadL3(query: string, wingId?: string): Promise<MemoryLayer> {
    // Use vector service with optional wing/room scoping
    const results = await vectorSearch(query, { topK: 5, wingId })
    return { layer: 'L3', tokens: 0, content: results.map(r => r.text).join('\n---\n') }
  }

  // Wake-up: L0 + L1 only
  async wakeUp(cloneId: string): Promise<string> {
    const l0 = await this.loadL0(cloneId)
    const l1 = await this.loadL1(cloneId)
    return `[IDENTITY]\n${l0.content}\n\n[ESSENTIAL]\n${l1.content}`
  }
}
```

### Priority 2: HIGH — Temporal Knowledge Graph

**Why:** For an AI clone system, facts change constantly. A person's role changes, project status evolves, preferences shift. Without temporal validity, the clone will confidently state outdated information.

**Implementation Plan:**

```prisma
// Knowledge Graph with Temporal Validity
model KGEntity {
  id         String   @id @default(cuid())
  cloneId    String
  name       String
  entityType String   // person, project, technology, concept, organization
  properties String?  // JSON blob
  createdAt  DateTime @default(now())

  clone      AvatarClone @relation(fields: [cloneId], references: [id])
  subjectTriples KGTriple[] @relation("Subject")
  objectTriples  KGTriple[] @relation("Object")
}

model KGTriple {
  id          String    @id @default(cuid())
  cloneId     String
  subjectId   String
  predicate   String    // works_on, reports_to, prefers, decided, owns, etc.
  objectId    String
  validFrom   DateTime  @default(now())
  validTo     DateTime? // NULL = currently valid
  confidence  Float     @default(1.0)
  sourceDrawerId String? // Provenance
  createdAt   DateTime  @default(now())

  subject KGEntity @relation("Subject", fields: [subjectId], references: [id])
  object  KGEntity @relation("Object", fields: [objectId], references: [id])
}

// Query: Get all current facts about entity
// SELECT * FROM KGTriple WHERE subjectId = ? AND validTo IS NULL
// Historical: WHERE subjectId = ? AND validFrom <= ? AND (validTo IS NULL OR validTo >= ?)
```

```typescript
// /src/lib/knowledge-graph.ts

export class KnowledgeGraph {
  async addTriple(subjectName: string, predicate: string, objectName: string, opts?: {
    validFrom?: Date, confidence?: number, sourceDrawerId?: string
  }) {
    // Get or create subject entity
    // Get or create object entity
    // Check for existing unexpired triple with same S+P+O (dedup)
    // If exists and different, invalidate old (set validTo = now)
    // Insert new triple
  }

  async invalidate(subjectName: string, predicate: string, objectName: string, endedAt?: Date) {
    // Find matching triple with validTo = NULL
    // Set validTo = endedAt || now()
  }

  async queryEntity(entityName: string, asOf?: Date) {
    // If asOf provided: historical query
    // Else: current facts only (validTo = NULL)
    // Returns array of { predicate, objectName, validFrom, validTo, isCurrent }
  }

  async detectContradictions() {
    // Find triples with same subject+predicate but conflicting objects
    // where both are currently valid
  }
}
```

### Priority 3: HIGH — AAAK Compression for Avatar Memories

**Why:** Token economy is critical for an AI clone that runs daily cycles. Each agent cycle loads memory context. With AAAK, 30x compression means 10K tokens of memory fits in ~330 tokens, leaving 95%+ context for actual work.

**Implementation Plan:**

```typescript
// /src/lib/aaak-compressor.ts

const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on',
  'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'that', 'this', 'these', 'those', 'it', 'its',
  'he', 'she', 'they', 'them', 'their', 'his', 'her', 'we', 'our', 'you', 'your'])

const EMOTION_CODES: Record<string, string> = {
  vulnerable: 'vul', joyful: 'joy', fearful: 'fear', trusting: 'trust',
  grieving: 'grief', wondering: 'wond', angry: 'angr', surprised: 'surp',
  disgusted: 'disg', proud: 'prid', ashamed: 'sham', excited: 'exc',
  peaceful: 'peac', anxious: 'anx', hopeful: 'hope', grateful: 'grat',
  lonely: 'lone', confused: 'conf', relieved: 'rel', nostalgic: 'nost',
  determined: 'det', curious: 'cur', content: 'cont', embarrassed: 'emba',
  jealous: 'jeal', resentful: 'rese', compassionate: 'comp', inspired: 'insp'
}

const SEMANTIC_FLAGS = ['ORIGIN', 'CORE', 'SENSITIVE', 'PIVOT', 'GENESIS', 'DECISION', 'TECHNICAL']

export class AAAKCompressor {
  compress(content: string, metadata: {
    entities?: string[], topic?: string, importance?: number,
    emotions?: string[], flags?: string[]
  }): string {
    // 1. Extract key entities → 3-letter codes
    const entityCodes = (metadata.entities || []).map(e => 
      e.substring(0, 3).toUpperCase()
    )
    
    // 2. Remove stop words, keep meaningful tokens
    const words = content.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()))
    
    // 3. Select key quote (most decision-relevant sentence < 80 chars)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const keyQuote = sentences.find(s => 
      s.trim().length < 80 && (
        s.includes('decided') || s.includes('because') || s.includes('switched') ||
        s.includes('prefer') || s.includes('recommend')
      )
    )?.trim() || sentences[0]?.trim().substring(0, 80)
    
    // 4. Build AAAK line
    const parts: string[] = []
    if (entityCodes.length) parts.push(entityCodes.join('+'))
    if (metadata.topic) parts.push(metadata.topic.replace(/\s+/g, '_'))
    if (keyQuote) parts.push(`"${keyQuote}"`)
    parts.push(String(metadata.importance || 3))
    if (metadata.emotions?.length) {
      parts.push(metadata.emotions.map(e => EMOTION_CODES[e] || e).join('+'))
    }
    if (metadata.flags?.length) parts.push(metadata.flags.join('+'))
    
    return parts.join(' | ')
  }
  
  // LLM-native: no decompressor needed, any LLM reads this format
}
```

### Priority 4: MEDIUM — Scoped Vector Search + Hybrid Retrieval

**Why:** Our current vector search is flat. Adding wing/room scoping enables the 34% accuracy boost MemPalace demonstrated. Hybrid search (vector + keyword + temporal) gets us to 98.4%.

**Implementation Plan:**

```typescript
// Enhanced vector service with scoped search
interface SearchOptions {
  query: string
  topK?: number
  threshold?: number
  wingId?: string    // Scope to specific wing
  roomId?: string    // Scope to specific room
  hallType?: string  // Scope to specific hall type
  temporalBoost?: boolean  // Boost recent memories
  keywordBoost?: boolean  // Boost keyword matches
}

// In the vector service, add metadata filtering:
async function scopedSearch(opts: SearchOptions) {
  const queryVector = generateEmbedding(opts.query)
  
  let candidates = Array.from(vectorStore.values())
  
  // Scope filtering (pre-search)
  if (opts.wingId) {
    candidates = candidates.filter(v => v.metadata.wingId === opts.wingId)
  }
  if (opts.roomId) {
    candidates = candidates.filter(v => v.metadata.roomId === opts.roomId)
  }
  
  // Vector similarity
  const results = candidates.map(entry => ({
    ...entry,
    similarity: cosineSimilarity(queryVector, entry.vector)
  })).filter(r => r.similarity >= (opts.threshold || 0.3))
  
  // Temporal proximity boost
  if (opts.temporalBoost) {
    results.forEach(r => {
      const age = Date.now() - new Date(r.metadata.createdAt).getTime()
      const ageDays = age / (1000 * 60 * 60 * 24)
      r.similarity *= (1 + Math.max(0, (30 - ageDays) / 30) * 0.2) // 20% boost for recent
    })
  }
  
  // Keyword overlap boost
  if (opts.keywordBoost) {
    const queryWords = new Set(opts.query.toLowerCase().split(/\s+/))
    results.forEach(r => {
      const textWords = new Set(r.text.toLowerCase().split(/\s+/))
      const overlap = [...queryWords].filter(w => textWords.has(w)).length
      r.similarity *= (1 + (overlap / queryWords.size) * 0.15) // 15% boost for keyword match
    })
  }
  
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, opts.topK || 5)
}
```

### Priority 5: MEDIUM — Cross-Domain Tunnel Discovery

**Why:** Our avatar agents work across domains (CEO deals with strategy+growth, CTO deals with engineering+architecture). Tunnels auto-discover connections, enabling the CEO agent to find relevant engineering insights.

**Implementation Plan:**

```typescript
// /src/lib/tunnel-discovery.ts

export async function discoverTunnels(cloneId: string) {
  // Find rooms with same name across different wings
  const rooms = await db.memoryRoom.findMany({
    where: { wing: { cloneId } },
    include: { wing: true }
  })
  
  // Group by name
  const roomByName = new Map<string, typeof rooms>()
  rooms.forEach(room => {
    const existing = roomByName.get(room.name) || []
    existing.push(room)
    roomByName.set(room.name, existing)
  })
  
  // Tunnels = rooms with same name in 2+ wings
  const tunnels: Array<{ roomAId: string; roomBId: string; sharedTheme: string; strength: number }> = []
  
  for (const [name, matchingRooms] of roomByName) {
    if (matchingRooms.length >= 2) {
      for (let i = 0; i < matchingRooms.length; i++) {
        for (let j = i + 1; j < matchingRooms.length; j++) {
          if (matchingRooms[i].wingId !== matchingRooms[j].wingId) {
            tunnels.push({
              roomAId: matchingRooms[i].id,
              roomBId: matchingRooms[j].id,
              sharedTheme: name,
              strength: matchingRooms[i].drawerCount + matchingRooms[j].drawerCount
            })
          }
        }
      }
    }
  }
  
  // Upsert tunnels to DB
  for (const tunnel of tunnels) {
    await db.memoryTunnel.upsert({
      where: { id: /* composite key */ },
      create: tunnel,
      update: { strength: tunnel.strength }
    })
  }
  
  return tunnels
}
```

### Priority 6: LOW-MEDIUM — Auto-Classification + Auto-Save

**Why:** Currently memories are created manually during agent cycles. Auto-classification would improve organization, and auto-save would prevent memory loss during conversations.

**Implementation:**
- Regex-based room detection (adapt MemPalace's keyword sets for our Chinese/English mixed content)
- Chat hook: every 15 messages, auto-extract decisions/preferences/milestones
- Agent cycle hook: after each cycle completes, auto-extract key memories to drawers

---

## 5. What NOT to Adopt (and Why)

### 5.1 ❌ Pure Regex Room Detection (MemPalace's 60-keyword approach)

**Why not:** MemPalace targets English coding conversations. Our system is Chinese-English mixed with domain-specific vocabulary (创业, 认知分片, 红蓝对抗). A static keyword list would miss too much. Instead, use **LLM-assisted classification** with a small set of seed categories, falling back to keyword matching.

### 5.2 ❌ ChromaDB as Vector Backend

**Why not:** We already have a custom vector service on port 3004. ChromaDB adds a heavy Python dependency and ~300MB embedding model. Our system runs in Node.js/TypeScript. Instead, **upgrade our existing vector service** with higher-dim embeddings and scoped search. Consider adding an embedding model option (ONNX runtime for Node.js) later.

### 5.3 ❌ MCP Protocol Integration

**Why not:** MCP is designed for Claude Code / desktop AI tool integration. Our avatar clone system is a web application with REST APIs and WebSocket. MCP adds unnecessary complexity. Instead, expose memory operations through our **existing API routes** and **WebSocket channels**.

### 5.4 ❌ AAAK Emotion Codes for All Memories

**Why not:** MemPalace tracks personal/emotional memories for individual users. Our avatar clone agents are task-oriented (CEO, CTO, Growth, Engineer). Emotional tagging is over-engineering for most agent memories. Instead, **use AAAK for business-critical memories only** (decisions, preferences, milestones) and skip emotional encoding for routine agent outputs.

### 5.5 ❌ Verbatim 800-Char Chunk Storage

**Why not:** MemPalace preserves verbatim text chunks for retrieval accuracy. Our agent outputs are already structured (AgentCycle plan/execution/report, AgentOutput content). Chunking would break our structured data. Instead, **store structured content as-is** and generate AAAK summaries for L1 loading.

### 5.6 ❌ File-Based Mining Pipeline

**Why not:** MemPalace mines local files and chat exports. Our data is already in a relational database with structured models. No need for file walking or chat export parsing.

---

## 6. Concrete Integration Architecture

### 6.1 Phase 1: Enhanced Schema (Week 1)

Add the following models to Prisma schema:
- `MemoryWing` (top-level domains per clone)
- `MemoryRoom` (sub-topics within wings)
- `MemoryDrawer` (replaces/enhances MemoryEntry with hierarchy + AAAK + temporal validity)
- `DrawerTag` (proper many-to-many tags instead of comma-separated string)
- `MemoryTunnel` (cross-wing connections)
- `KGEntity` + `KGTriple` (temporal knowledge graph)

Migration strategy: Keep existing `MemoryEntry` for backward compatibility, add new models alongside. Create migration script to convert existing MemoryEntry records to MemoryDrawer records with default wing/room assignments.

### 6.2 Phase 2: Memory Loader Service (Week 2)

Create `/src/lib/memory-loader.ts` with:
- L0/L1/L2/L3 progressive loading
- AAAK summary generation for L1
- Token budget management
- Integration with agent cycle API (inject L0+L1 into cycle prompts)

### 6.3 Phase 3: Knowledge Graph Service (Week 3)

Create `/src/lib/knowledge-graph.ts` with:
- Entity management (create/find/upsert)
- Triple management (add/invalidate/query with temporal validity)
- Contradiction detection
- Integration with agent cycle API (auto-extract entities/triples from cycle reports)

### 6.4 Phase 4: Enhanced Vector Search (Week 4)

Upgrade vector service with:
- Higher-dimension embeddings (128 or 256 dim with better features)
- Wing/room scoped search
- Temporal proximity boosting
- Keyword overlap boosting
- Auto-embedding on memory creation (replace manual sync)

### 6.5 Phase 5: Tunnel Discovery + Auto-Classification (Week 5)

Create:
- `/src/lib/tunnel-discovery.ts` — periodic tunnel detection
- `/src/lib/memory-classifier.ts` — regex + LLM-assisted room/hall classification
- Auto-save hook integration with agent cycle completion

---

## 7. Expected Impact

| Metric | Current | After Integration | Improvement |
|--------|---------|-------------------|-------------|
| Memory retrieval accuracy (estimated R@5) | ~60% | ~90%+ | +30% |
| Token cost per agent cycle (memory context) | ~2000-5000 | ~170-900 (L0+L1) | 5-15x reduction |
| Memory organization | Flat list | Hierarchical (Wing→Room→Drawer) | Qualitative leap |
| Fact freshness | No expiry tracking | Temporal validity with auto-invalidation | Eliminates stale facts |
| Cross-domain discovery | None | Tunnel auto-detection | New capability |
| Memory persistence | In-memory (lost on restart) | Database-backed | Reliability |

---

## 8. Summary of Recommendations

### Adopt (Priority Order):
1. **Memory Palace Hierarchy** (Wing→Room→Drawer) — The single highest-impact change
2. **Layered Loading** (L0/L1/L2/L3) — Massive token savings
3. **Temporal Knowledge Graph** (entities, triples, valid_from/valid_to) — Critical for clone accuracy
4. **AAAK Compression** (for L1 essential facts) — 30x token reduction
5. **Scoped Vector Search** (wing/room filtering + hybrid boosting) — 34% accuracy gain
6. **Cross-Domain Tunnels** (auto-discovery) — Cross-agent knowledge sharing

### Do NOT Adopt:
1. ❌ ChromaDB (stay with our upgraded vector service)
2. ❌ MCP protocol (use our REST/WebSocket)
3. ❌ Pure regex room detection (use LLM-assisted for Chinese)
4. ❌ Verbatim 800-char chunking (keep structured agent outputs)
5. ❌ File-based mining (data is already in DB)
6. ❌ Full emotion codes (not relevant for task-oriented agents)

### Key Insight from MemPalace:
> **"Structure beats search."** The palace hierarchy alone improves retrieval by 34% — not better embeddings or reranking, just better organization. This is the cheapest, highest-ROI improvement we can make.
