/**
 * StorageService — Real IPFS (Pinata) + Arweave integration with SHA256 fallback
 *
 * Config from env:
 *   PINATA_JWT           — Pinata JWT token (preferred)
 *   PINATA_API_KEY        — Pinata API key
 *   PINATA_SECRET_KEY     — Pinata secret key
 *   ARWEAVE_WALLET_PATH   — Path to Arweave JWK keyfile
 *   ARWEAVE_KEY_BASE64    — Base64-encoded Arweave JWK key
 *   IPFS_GATEWAY          — IPFS gateway URL (default: https://gateway.pinata.cloud)
 *   ARWEAVE_GATEWAY       — Arweave gateway URL (default: https://arweave.net)
 */

import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { existsSync } from 'fs'
import { writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import type ArweaveType from 'arweave'

// ── Config ──────────────────────────────────────────────────────────────

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud'
const ARWEAVE_GATEWAY = process.env.ARWEAVE_GATEWAY || 'https://arweave.net'
const FALLBACK_DIR = join(process.cwd(), '.fallback-storage')

// ── Interfaces ──────────────────────────────────────────────────────────

export interface IPFSUploadResult {
  cid: string
  url: string
}

export interface ArweaveUploadResult {
  txId: string
  url: string
}

export interface DualUploadResult {
  ipfs: IPFSUploadResult
  arweave: ArweaveUploadResult
}

// ── Pinata Client ───────────────────────────────────────────────────────

let pinataClient: any = null

function getPinataClient(): any {
  if (pinataClient) return pinataClient

  const jwt = process.env.PINATA_JWT
  const apiKey = process.env.PINATA_API_KEY
  const secretKey = process.env.PINATA_SECRET_KEY

  if (!jwt && (!apiKey || !secretKey)) return null

  try {
    // Dynamically require @pinata/sdk (avoids build issues when not installed)
    const PinataSDK = require('@pinata/sdk')

    if (jwt) {
      pinataClient = new PinataSDK({ pinataJWTKey: jwt })
    } else {
      pinataClient = new PinataSDK({
        pinataApiKey: apiKey,
        pinataSecretApiKey: secretKey,
      })
    }
    return pinataClient
  } catch {
    console.warn('[Storage] @pinata/sdk not available')
    return null
  }
}

// ── Arweave Client ──────────────────────────────────────────────────────

let arweaveClient: ArweaveType | null = null

async function getArweaveClient(): Promise<ArweaveType | null> {
  if (arweaveClient) return arweaveClient

  const walletPath = process.env.ARWEAVE_WALLET_PATH
  const keyBase64 = process.env.ARWEAVE_KEY_BASE64

  if (!walletPath && !keyBase64) return null

  try {
    const Arweave = require('arweave')
    arweaveClient = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    })
    return arweaveClient
  } catch {
    console.warn('[Storage] arweave package not available')
    return null
  }
}

function getArweaveWallet(): any | null {
  const walletPath = process.env.ARWEAVE_WALLET_PATH
  const keyBase64 = process.env.ARWEAVE_KEY_BASE64

  if (walletPath && existsSync(walletPath)) {
    try {
      return JSON.parse(readFileSync(walletPath, 'utf-8'))
    } catch {
      console.warn('[Storage] Failed to parse Arweave wallet file')
      return null
    }
  }

  if (keyBase64) {
    try {
      return JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'))
    } catch {
      console.warn('[Storage] Failed to parse ARWEAVE_KEY_BASE64')
      return null
    }
  }

  return null
}

// ── SHA256 Helper ───────────────────────────────────────────────────────

function sha256(content: Buffer | string): string {
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
  return createHash('sha256').update(buffer).digest('hex')
}

// ── Fallback Filesystem Storage ─────────────────────────────────────────

function ensureFallbackDir(): string {
  if (!existsSync(FALLBACK_DIR)) {
    mkdirSync(FALLBACK_DIR, { recursive: true })
  }
  return FALLBACK_DIR
}

function getFallbackPath(filename: string): string {
  ensureFallbackDir()
  return join(FALLBACK_DIR, filename)
}

// ── StorageService ──────────────────────────────────────────────────────

export class StorageService {
  /**
   * Upload to IPFS via Pinata (or fallback to filesystem if no keys)
   */
  static async uploadToIPFS(
    buffer: Buffer,
    name: string,
  ): Promise<IPFSUploadResult> {
    const hash = sha256(buffer)
    const client = getPinataClient()

    if (client) {
      try {
        // Pinata expects FormData — use Node FormData
        const FormData = require('form-data')
        const formData = new FormData()
        formData.append('file', buffer, { filename: name })

        const result = await client.pinFileToIPFS(formData, {
          pinataMetadata: { name },
        })

        const cid = result.IpfsHash
        return {
          cid,
          url: `${IPFS_GATEWAY}/ipfs/${cid}`,
        }
      } catch (err: any) {
        console.error('[Storage] Pinata IPFS upload failed:', err.message)
        // Fall through to fallback
      }
    }

    // Fallback: filesystem + SHA256 hash as "CID"
    const filename = `ipfs-${hash}-${name}`
    const filepath = getFallbackPath(filename)
    writeFileSync(filepath, buffer)

    return {
      cid: `sha256:${hash}`,
      url: `/api/storage/download?cid=sha256:${hash}`,
    }
  }

  /**
   * Upload to Arweave (or fallback to filesystem if no wallet)
   */
  static async uploadToArweave(
    buffer: Buffer,
    tags: { name: string; value: string }[] = [],
  ): Promise<ArweaveUploadResult> {
    const hash = sha256(buffer)
    const arweave = await getArweaveClient()
    const wallet = getArweaveWallet()

    if (arweave && wallet) {
      try {
        // Create and sign a transaction
        const tx = await arweave.createTransaction(
          { data: buffer },
          wallet,
        )

        // Add tags
        for (const tag of tags) {
          tx.addTag(tag.name, tag.value)
        }
        tx.addTag('Content-Type', 'application/octet-stream')
        tx.addTag('Content-Hash', hash)

        // Sign and post
        await arweave.transactions.sign(tx, wallet)
        const response = await arweave.transactions.post(tx)

        if (response.status === 200 || response.status === 202) {
          return {
            txId: tx.id,
            url: `${ARWEAVE_GATEWAY}/${tx.id}`,
          }
        }

        throw new Error(`Arweave post returned status ${response.status}`)
      } catch (err: any) {
        console.error('[Storage] Arweave upload failed:', err.message)
        // Fall through to fallback
      }
    }

    // Fallback: filesystem + SHA256 hash
    const filename = `arweave-${hash}-${Buffer.from('arweave-' + hash).toString('hex').substring(0, 12)}`
    const filepath = getFallbackPath(filename)
    writeFileSync(filepath, buffer)

    return {
      txId: `sha256:${hash}`,
      url: `/api/storage/download?txId=sha256:${hash}`,
    }
  }

  /**
   * Upload to both IPFS and Arweave
   */
  static async uploadToBoth(
    buffer: Buffer,
    name: string,
    tags: { name: string; value: string }[] = [],
  ): Promise<DualUploadResult> {
    const [ipfs, arweave] = await Promise.all([
      this.uploadToIPFS(buffer, name),
      this.uploadToArweave(buffer, tags),
    ])

    return { ipfs, arweave }
  }

  /**
   * Download from IPFS gateway by CID
   */
  static async downloadFromIPFS(cid: string): Promise<Buffer | null> {
    // Check if fallback CID
    if (cid.startsWith('sha256:')) {
      const hash = cid.replace('sha256:', '')
      const files = readdirSync(ensureFallbackDir())
      const match = files.find((f) => f.includes(hash))
      if (match) {
        return readFileSync(getFallbackPath(match))
      }
      return null
    }

    try {
      const url = `${IPFS_GATEWAY}/ipfs/${cid}`
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (err: any) {
      console.error('[Storage] IPFS download failed:', err.message)
      return null
    }
  }

  /**
   * Download from Arweave by txId
   */
  static async downloadFromArweave(txId: string): Promise<Buffer | null> {
    // Check if fallback
    if (txId.startsWith('sha256:')) {
      const hash = txId.replace('sha256:', '')
      const files = readdirSync(ensureFallbackDir())
      const match = files.find((f) => f.includes(hash))
      if (match) {
        return readFileSync(getFallbackPath(match))
      }
      return null
    }

    try {
      const url = `${ARWEAVE_GATEWAY}/${txId}`
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (err: any) {
      console.error('[Storage] Arweave download failed:', err.message)
      return null
    }
  }

  /**
   * Check if IPFS is configured
   */
  static isIPFSConfigured(): boolean {
    return getPinataClient() !== null
  }

  /**
   * Check if Arweave is configured
   */
  static isArweaveConfigured(): boolean {
    return getArweaveWallet() !== null
  }

  /**
   * Get a real content hash (always works, no config needed)
   */
  static contentHash(content: Buffer | string): string {
    return sha256(content)
  }

  /**
   * Get status of storage backends
   */
  static async getStatus(): Promise<{
    ipfs: { configured: boolean; gateway: string }
    arweave: { configured: boolean; gateway: string }
    fallback: { active: boolean; dir: string; files: number }
  }> {
    let fallbackFiles = 0
    if (existsSync(FALLBACK_DIR)) {
      fallbackFiles = readdirSync(FALLBACK_DIR).length
    }

    return {
      ipfs: {
        configured: this.isIPFSConfigured(),
        gateway: IPFS_GATEWAY,
      },
      arweave: {
        configured: this.isArweaveConfigured(),
        gateway: ARWEAVE_GATEWAY,
      },
      fallback: {
        active: !this.isIPFSConfigured() || !this.isArweaveConfigured(),
        dir: FALLBACK_DIR,
        files: fallbackFiles,
      },
    }
  }
}

export default StorageService
