/**
 * POST /api/whisper — Voice transcription proxy
 * Forwards audio to OpenAI Whisper API, or uses a local model if configured.
 * Called by tg-bot-service for voice message transcription.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { audioData, audioUrl } = body as {
      audioData?: string  // base64-encoded OGG/WAV/MP3
      audioUrl?: string   // alternative: URL to audio file
    }

    if (!audioData && !audioUrl) {
      return NextResponse.json(
        { success: false, error: 'audioData (base64) or audioUrl required' },
        { status: 400 }
      )
    }

    const openaiKey = process.env.OPENAI_API_KEY

    if (!openaiKey) {
      // Try local whisper model if available (optional future support)
      // For now, return clear error
      return NextResponse.json(
        {
          success: false,
          error: 'OPENAI_API_KEY not configured. Set it in environment variables.',
          hint: 'Voice transcription requires an OpenAI API key with Whisper access.',
        },
        { status: 400 }
      )
    }

    // Prepare the audio data
    let audioBuffer: Buffer
    let mimeType = 'audio/ogg'

    if (audioData) {
      audioBuffer = Buffer.from(audioData, 'base64')
      // Detect MIME type from magic bytes
      if (audioBuffer.length > 4) {
        if (audioBuffer[0] === 0xFF && audioBuffer[1] === 0xFB) mimeType = 'audio/mpeg'
        else if (audioBuffer[0] === 0x52 && audioBuffer[1] === 0x49) mimeType = 'audio/wav'
        // OGG: 4F 67 67 53
      }
    } else if (audioUrl) {
      const res = await fetch(audioUrl)
      if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`)
      audioBuffer = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('mp3') || contentType.includes('mpeg')) mimeType = 'audio/mpeg'
      else if (contentType.includes('wav')) mimeType = 'audio/wav'
    } else {
      return NextResponse.json(
        { success: false, error: 'No audio source provided' },
        { status: 400 }
      )
    }

    // Call OpenAI Whisper API
    const form = new FormData()
    const blob = new Blob([audioBuffer], { type: mimeType })
    const ext = mimeType === 'audio/mpeg' ? 'mp3' : mimeType === 'audio/wav' ? 'wav' : 'ogg'
    form.append('file', blob, `voice.${ext}`)
    form.append('model', 'whisper-1')
    form.append('language', 'zh') // Prefer Chinese, but model auto-detects

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: form,
    })

    if (!whisperRes.ok) {
      const errText = await whisperRes.text()
      console.error('[Whisper] OpenAI error:', whisperRes.status, errText)
      return NextResponse.json(
        { success: false, error: `Whisper API error: ${whisperRes.status}` },
        { status: 500 }
      )
    }

    const result = await whisperRes.json()
    return NextResponse.json({
      success: true,
      text: result.text || '',
      language: result.language || 'zh',
    })
  } catch (error) {
    console.error('[Whisper] Exception:', error)
    return NextResponse.json(
      { success: false, error: 'Transcription service error' },
      { status: 500 }
    )
  }
}
