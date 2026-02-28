import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { ElevenLabsClient } from 'elevenlabs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Serve static fallback page when someone visits the backend directly
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'))
})

app.get('/api', (req, res) => {
  res.json({ ok: true, message: 'Situation Sim API' })
})

// ElevenLabs text-to-speech for the Narrator component
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // default voice

app.post('/api/narrate', async (req, res) => {
  const { text } = req.body || {}
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Voice not configured. Add ELEVENLABS_API_KEY to backend/.env' })
  }

  try {
    const client = new ElevenLabsClient({ apiKey })
    const audioStream = await client.textToSpeech.convert(VOICE_ID, {
      text: text.trim().slice(0, 5000),
      model_id: 'eleven_multilingual_v2',
    })
    res.setHeader('Content-Type', 'audio/mpeg')
    audioStream.pipe(res)
  } catch (err) {
    console.error('ElevenLabs error:', err.message)
    res.status(500).json({ error: 'Voice generation failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
