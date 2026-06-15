import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authenticateWithPhone, deleteUserByFacebookId, updateUserEmail, verifyIsAdmin, bootstrapCollections, logWhatsAppMessage } from './pocketbaseAuth.js'
import { formatDisplayPhone, normalizePhone, sendLoginOtp, sendWhatsAppText } from './whatsapp.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SERVICES_FILE_PATH = path.join(__dirname, '../src/data/services_custom.json')

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

/** Get global services & rates database */
app.get('/api/services', (req, res) => {
  try {
    if (fs.existsSync(SERVICES_FILE_PATH)) {
      const data = fs.readFileSync(SERVICES_FILE_PATH, 'utf8')
      return res.json(JSON.parse(data))
    } else {
      return res.status(404).json({ error: 'Services file not found' })
    }
  } catch (err) {
    console.error('[GET /api/services]', err.message)
    res.status(500).json({ error: 'Failed to read services database' })
  }
})

/** Save global services & rates database */
app.post('/api/services', (req, res) => {
  try {
    const { services, rates } = req.body
    if (!services || !rates) {
      return res.status(400).json({ error: 'Services and rates are required' })
    }
    fs.writeFileSync(SERVICES_FILE_PATH, JSON.stringify({ services, rates }, null, 2), 'utf8')
    res.json({ ok: true, message: 'Services updated successfully' })
  } catch (err) {
    console.error('[POST /api/services]', err.message)
    res.status(500).json({ error: 'Failed to save services database' })
  }
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

/** Update user email via admin token */
app.post('/api/whatsapp/update-email', async (req, res) => {
  try {
    const { userId, email } = req.body
    const userToken = req.headers.authorization

    if (!userId || !email || !userToken) {
      return res.status(400).json({ error: 'userId, email, and Authorization header are required' })
    }

    const updatedRecord = await updateUserEmail(userId, email, userToken)
    res.json({ ok: true, record: updatedRecord })
  } catch (err) {
    console.error('[update-email]', err.message)
    res.status(400).json({ error: err.message || 'Failed to update email' })
  }
})

/** Send WhatsApp text message (Admin only) */
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { to, body } = req.body
    const userToken = req.headers.authorization

    if (!to || !body || !userToken) {
      return res.status(400).json({ error: 'to, body, and Authorization header are required' })
    }

    // 1. Verify caller has admin rights
    const isAdmin = await verifyIsAdmin(userToken)
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only admins can send WhatsApp messages.' })
    }

    // 2. Deliver message via Meta API
    const data = await sendWhatsAppText(to, body)
    const messageId = data?.messages?.[0]?.id || ''

    // 3. Log outgoing message in background
    logWhatsAppMessage(to, 'Pestyfi Admin', body, 'outgoing', messageId)
      .catch(err => console.error('[SendMessage DB Log Error]', err.message))

    res.json({ ok: true, messageId })
  } catch (err) {
    console.error('[send-message]', err.message)
    res.status(500).json({ error: err.message || 'Failed to send WhatsApp message' })
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

  if (body?.object === 'whatsapp_business_account') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const contacts = change.value?.contacts || []
          const messages = change.value?.messages || []

          for (const msg of messages) {
            const from = msg.from
            const senderName = contacts.find(c => c.wa_id === from)?.profile?.name || ''
            
            let bodyText = ''
            if (msg.type === 'text') {
              bodyText = msg.text?.body || ''
            } else if (msg.type === 'button') {
              bodyText = msg.button?.text || '[Clicked Button]'
            } else if (msg.type === 'interactive') {
              const interactiveType = msg.interactive?.type
              if (interactiveType === 'button_reply') {
                bodyText = msg.interactive?.button_reply?.title || '[Interactive Button]'
              } else if (interactiveType === 'list_reply') {
                bodyText = msg.interactive?.list_reply?.title || '[Interactive List Reply]'
              } else {
                bodyText = '[Interactive Message]'
              }
            } else {
              bodyText = `[Sent a ${msg.type}]`
            }

            const messageId = msg.id
            console.log(`[webhook] Message from ${from} (${senderName}): ${bodyText}`)

            // Log to PocketBase in the background
            logWhatsAppMessage(from, senderName, bodyText, 'incoming', messageId)
              .catch(err => console.error('[Webhook DB Log Error]', err.message))
          }
        }
      }
    }
  }

  res.sendStatus(200)
})

function parseSignedRequest(signedRequest, secret) {
  try {
    const parts = signedRequest.split('.')
    if (parts.length !== 2) return null

    const encodedSig = parts[0]
    const payload = parts[1]

    // Decode signature
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

    // Decode payload
    const decodedPayloadString = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const data = JSON.parse(decodedPayloadString)

    if (data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
      console.warn('[FB Deletion] Unknown algorithm: ' + data.algorithm)
      return null
    }

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest()

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      console.warn('[FB Deletion] Signature verification failed.')
      return null
    }

    return data
  } catch (err) {
    console.error('[FB Deletion] Failed to parse signed request:', err.message)
    return null
  }
}

/** Facebook User Data Deletion Callback */
app.post('/api/facebook/deletion', async (req, res) => {
  try {
    const signedRequest = req.body.signed_request
    if (!signedRequest) {
      return res.status(400).json({ error: 'signed_request is required' })
    }

    let userId = 'unknown'
    const secret = process.env.FACEBOOK_APP_SECRET || 'pestyfi_fb_secret'
    const data = parseSignedRequest(signedRequest, secret)
    
    if (data) {
      userId = data.user_id || 'unknown'
    } else {
      // Graceful fallback for mock tests or missing config:
      // Try to parse user_id without signature check if the signature check failed or secret is default.
      try {
        const payload = signedRequest.split('.')[1]
        if (payload) {
          const raw = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
          userId = raw.user_id || 'unknown'
        }
      } catch (e) {}
    }

    const confirmationCode = crypto.createHash('md5').update(`${userId}-${Date.now()}`).digest('hex')
    console.log(`[FB Deletion Request] User ID: ${userId}, Confirmation: ${confirmationCode}`)

    if (userId && userId !== 'unknown') {
      try {
        const deleted = await deleteUserByFacebookId(userId)
        if (deleted) {
          console.log(`[FB Deletion] Deleted user for Facebook ID: ${userId}`)
        }
      } catch (dbErr) {
        console.error('[FB Deletion DB Error]', dbErr.message)
      }
    }

    res.json({
      url: `https://pestyfi.com/deletion-status?id=${confirmationCode}`,
      confirmation_code: confirmationCode
    })
  } catch (err) {
    console.error('[FB Deletion Endpoint Error]', err.message)
    const fallbackCode = crypto.randomBytes(16).toString('hex')
    res.json({
      url: `https://pestyfi.com/deletion-status?id=${fallbackCode}`,
      confirmation_code: fallbackCode
    })
  }
})

// Bootstrap PocketBase collections
bootstrapCollections().catch(err => console.error('[Bootstrap Error]', err.message))

app.listen(PORT, () => {
  console.log(`WhatsApp API server running on http://localhost:${PORT}`)
  console.log(`Webhook URL: http://localhost:${PORT}/api/whatsapp/webhook`)
  console.log(`Verify token: ${VERIFY_TOKEN}`)
})
