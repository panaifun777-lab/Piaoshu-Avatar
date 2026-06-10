# Task: Rewrite Cognitive Simulation API and Chat API with Real AI

## Summary
Rewrote both the cognitive simulation API and chat API to use `z-ai-web-dev-sdk` for real AI-powered analysis, added SOUL.md personality injection, chat message persistence, and memory entry creation.

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Consolidated duplicate models (ChatMessage, MemoryEntry, AuditLog, SoulConfig) into single unified definitions
- Added `SoulConfig` model with `@unique` name field, `isActive`, `version`, `description`
- Added `ChatMessage` model with `sessionId`, `module`, `modelUsed`, `tokenCount`, `metadata` fields
- Added `MemoryEntry` model with `embedding`, `accessCount`, `lastAccessed`, `updatedAt` fields
- Added `AuditLog` model with `performedBy` defaulting to "system"
- Added `Notification` model
- Pushed schema to database successfully

### 2. Cognitive Simulation API (`src/app/api/cognitive/simulations/route.ts`)
- **Replaced hardcoded mock outputs** with real AI calls via `z-ai-web-dev-sdk`
- **Red Team call**: Uses a ruthless red-team attacker system prompt that demands at least 3 vulnerabilities (致命/高危/中危), outputs strict JSON
- **Blue Team call**: Uses a strategic defender system prompt that provides defense strategies for each vulnerability, outputs strict JSON
- **Verdict call**: Third AI call that generates a one-sentence final verdict based on red+blue results
- **SOUL.md injection**: Reads active SoulConfig from DB and appends personality context to all AI prompts
- **Real confidence scores**: Parses AI JSON output for confidence, falls back to risk-level-based heuristic
- **Shard resolution**: Gracefully handles missing shard IDs by creating a default CognitiveShard
- **Audit logging**: Creates AuditLog entry for each simulation
- **Memory entries**: Creates MemoryEntry summarizing the simulation result
- **GET endpoint**: Returns last 50 simulations with shard relations

### 3. Chat API (`src/app/api/chat/route.ts`)
- **SOUL.md injection**: Reads active SoulConfig from DB and appends personality context to system prompt
- **Chat message persistence**: Saves both user messages and AI responses to `ChatMessage` model
- **Session history**: Loads last 10 messages for a given sessionId to provide conversation continuity
- **Memory entries**: Creates MemoryEntry for strategically significant conversations (contains keywords like 决策, 战略, 风险, 分析, 评估)
- **Audit logging**: Creates AuditLog entry for each chat interaction
- **GET endpoint**: New GET handler to retrieve chat history by sessionId
- **Metadata**: Returns `soulInjected` flag and `sessionId` in response metadata

## Lint Result
✅ `bun run lint` passed with no errors

## Dev Server
✅ Running successfully on port 3000
