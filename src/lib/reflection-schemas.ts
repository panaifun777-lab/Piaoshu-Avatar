import { z } from 'zod'

// ===== ExpressionDNA =====
// Captures shifts in linguistic identity: new slang adoptions, forbidden phrases, tone adjustments
export const ExpressionDNASchema = z.object({
  new_slangs: z.array(z.string()).describe('New slang, catchphrases, or verbal tics adopted from conversation'),
  forbidden_phrases: z.array(z.string()).describe('Phrases the user explicitly rejects or wants to stop using'),
  tone_adjustments: z.string().describe('Summary of tonal shifts observed: more/less assertive, playful, formal, etc.'),
})

export type ExpressionDNA = z.infer<typeof ExpressionDNASchema>

// ===== MentalModelUpdate =====
// Represents an update to a core mental model or decision heuristic
export const MentalModelUpdateSchema = z.object({
  heuristics: z.string().describe('The core heuristic or principle, as a concise rule'),
  decision_rules: z.array(z.string()).describe('Specific decision rules derived from this heuristic'),
  domain: z.string().describe('Domain this applies to: engineering, product, business, philosophy, identity'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1 for this model update'),
})

export type MentalModelUpdate = z.infer<typeof MentalModelUpdateSchema>

// ===== KnowledgeNode =====
// A discrete fact/entity/relationship extracted from conversation
export const KnowledgeNodeSchema = z.object({
  entity: z.string().describe('The entity, concept, or fact discovered'),
  relation: z.string().describe('How this relates to existing knowledge or the user identity'),
  notes: z.string().describe('Additional context, source, or implications'),
})

export type KnowledgeNode = z.infer<typeof KnowledgeNodeSchema>

// ===== ReflectionOutput =====
// The complete structured output from a conversation reflection pass
export const ReflectionOutputSchema = z.object({
  expression_dna_updates: ExpressionDNASchema.describe('Changes to linguistic expression patterns'),
  mental_model_updates: z.array(MentalModelUpdateSchema).describe('Updates to core mental models and decision rules'),
  knowledge_nodes: z.array(KnowledgeNodeSchema).describe('New facts, entities, or relationships discovered'),
  mood_summary: z.string().describe('A concise summary of the user mood/emotional state detected in conversation'),
  shadow_score: z.number().min(0).max(1).describe('Shadow score 0-1: degree of unacknowledged tension, contradiction, or repression detected'),
})

export type ReflectionOutput = z.infer<typeof ReflectionOutputSchema>

// ===== Helper: JSON Schema for LLM system prompt =====
// Generates a human-readable description of the expected JSON schema
export function getReflectionSchemaDescription(): string {
  return `{
  "expression_dna_updates": {
    "new_slangs": ["string array - new adopted phrases/slang"],
    "forbidden_phrases": ["string array - phrases user rejects"],
    "tone_adjustments": "string - summary of tonal shifts"
  },
  "mental_model_updates": [
    {
      "heuristics": "string - core principle as a concise rule",
      "decision_rules": ["string array - specific decision rules"],
      "domain": "string - domain: engineering, product, business, philosophy, identity",
      "confidence": "number 0-1 - how confident you are in this update"
    }
  ],
  "knowledge_nodes": [
    {
      "entity": "string - the entity/concept/fact discovered",
      "relation": "string - how it relates to existing knowledge",
      "notes": "string - additional context"
    }
  ],
  "mood_summary": "string - concise mood/emotional state summary",
  "shadow_score": "number 0-1 - degree of unacknowledged tension/contradiction"
}`
}
