import crypto from 'crypto'

const PB_URL = (process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD
const OTP_SECRET = process.env.WHATSAPP_OTP_SECRET || 'change-me-in-production'

function phoneEmail(phone) {
  return `wa_${phone}@pestyfi.local`
}

function phonePassword(phone) {
  return crypto.createHmac('sha256', OTP_SECRET).update(phone).digest('hex').slice(0, 32)
}

async function adminAuth() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null

  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.token
}

async function findUserByPhone(adminToken, phone) {
  const filter = encodeURIComponent(`phone="${phone}"`)
  const res = await fetch(`${PB_URL}/api/collections/users/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: adminToken },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}

async function createUser(adminToken, phone) {
  const email = phoneEmail(phone)
  const password = phonePassword(phone)

  const res = await fetch(`${PB_URL}/api/collections/users/records`, {
    method: 'POST',
    headers: {
      Authorization: adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      passwordConfirm: password,
      name: `WhatsApp ${phone.slice(-4)}`,
      emailVisibility: false,
      ...(phone ? { phone } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Failed to create user')
  }
  return res.json()
}

export async function authenticateWithPhone(phone) {
  const email = phoneEmail(phone)
  const password = phonePassword(phone)

  // Try direct login first (user may already exist)
  let res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })

  if (res.ok) return res.json()

  // Create user via admin, then login
  const adminToken = await adminAuth()
  if (!adminToken) {
    throw new Error(
      'PocketBase admin credentials not configured. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env',
    )
  }

  const existing = await findUserByPhone(adminToken, phone)
  if (!existing) {
    await createUser(adminToken, phone)
  }

  res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Authentication failed after OTP verification')
  }

  return res.json()
}
