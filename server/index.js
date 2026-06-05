import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { authenticateWithPhone } from './pocketbaseAuth.js'
import { formatDisplayPhone, normalizePhone, sendLoginOtp } from './whatsapp.js'

const app = express()
const PORT = process.env.WHATSAPP_SERVER_PORT || 3001
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'pestyfi_webhook_verify'

// In-memory OTP store (use Redis in production)
const otpStore = new Map()
const OTP_TTL_MS = 10 * 60 * 1000
const OTP_COOLDOWN_MS = 60 * 1000

app.use(cors({ origin: true }))
app.use(express.json())

function generateOtp() {
  return String(crypto.randomInt(100000, 999999))
}

function cleanExpiredOtps() {
  const now = Date.now()
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key)
  }
}

/** Health check */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  })
})

/** Send OTP to phone via WhatsApp */
app.post('/api/whatsapp/send-otp', async (req, res) => {
  try {
    cleanExpiredOtps()
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'Phone number is required' })

    const normalized = normalizePhone(phone)
    if (normalized.length < 10) {
      return res.status(400).json({ error: 'Enter a valid phone number with country code' })
    }

    const existing = otpStore.get(normalized)
    if (existing && Date.now() - existing.sentAt < OTP_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000)
      return res.status(429).json({ error: `Please wait ${wait}s before requesting another code` })
    }

    const code = generateOtp()
    await sendLoginOtp(normalized, code)

    otpStore.set(normalized, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
      sentAt: Date.now(),
      attempts: 0,
    })

    res.json({
      ok: true,
      phone: formatDisplayPhone(normalized),
      message: 'OTP sent to your WhatsApp',
    })
  } catch (err) {
    console.error('[send-otp]', err.message)
    res.status(500).json({
      error: err.message || 'Failed to send OTP',
      hint: 'In Meta test mode, add your phone as a test recipient in the WhatsApp API dashboard.',
    })
  }
})

/** Verify OTP and return PocketBase auth */
app.post('/api/whatsapp/verify-otp', async (req, res) => {
  try {
    cleanExpiredOtps()
    const { phone, code } = req.body
    if (!phone || !code) return res.status(400).json({ error: 'Phone and OTP code are required' })

    const normalized = normalizePhone(phone)
    const record = otpStore.get(normalized)

    if (!record) {
      return res.status(400).json({ error: 'No OTP found. Request a new code.' })
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalized)
      return res.status(400).json({ error: 'OTP expired. Request a new code.' })
    }
    if (record.attempts >= 5) {
      otpStore.delete(normalized)
      return res.status(429).json({ error: 'Too many attempts. Request a new code.' })
    }

    record.attempts += 1
    if (String(code).trim() !== record.code) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' })
    }

    otpStore.delete(normalized)
    const auth = await authenticateWithPhone(normalized)

    res.json({
      ok: true,
      token: auth.token,
      record: auth.record,
    })
  } catch (err) {
    console.error('[verify-otp]', err.message)
    res.status(500).json({ error: err.message || 'Verification failed' })
  }
})

/** Meta webhook verification (GET) */
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[webhook] Verified')
    return res.status(200).send(challenge)
  }
  return res.sendStatus(403)
})

/** Meta webhook events (POST) */
app.post('/api/whatsapp/webhook', (req, res) => {
  const body = req.body
  console.log('[webhook]', JSON.stringify(body, null, 2))

  // Acknowledge immediately — process async in production
  if (body?.object === 'whatsapp_business_account') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const messages = change.value?.messages || []
          for (const msg of messages) {
            console.log(`[webhook] Message from ${msg.from}: ${msg.text?.body || msg.type}`)
          }
        }
      }
    }
  }

  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`WhatsApp API server running on http://localhost:${PORT}`)
  console.log(`Webhook URL: http://localhost:${PORT}/api/whatsapp/webhook`)
  console.log(`Verify token: ${VERIFY_TOKEN}`)
})
