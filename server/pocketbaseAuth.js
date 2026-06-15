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

let cachedAdminToken = null
let tokenExpiryTime = 0

async function adminAuth() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null

  if (cachedAdminToken && Date.now() < tokenExpiryTime) {
    return cachedAdminToken
  }

  try {
    const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    })

    if (!res.ok) {
      cachedAdminToken = null
      return null
    }
    const data = await res.json()
    cachedAdminToken = data.token
    tokenExpiryTime = Date.now() + 6 * 60 * 60 * 1000 // Cache for 6 hours
    return cachedAdminToken
  } catch (err) {
    console.error('[adminAuth error]', err.message)
    cachedAdminToken = null
    return null
  }
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

async function updateUserPassword(adminToken, userId, password) {
  const res = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: password,
      passwordConfirm: password,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Failed to update user password')
  }
  return res.json()
}

export async function authenticateWithPhone(phone) {
  const password = phonePassword(phone)

  // 1. Get admin token first to check user database record
  const adminToken = await adminAuth()
  if (!adminToken) {
    throw new Error(
      'PocketBase admin credentials not configured. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env',
    )
  }

  const existing = await findUserByPhone(adminToken, phone)
  let identity = phoneEmail(phone)

  if (existing) {
    identity = existing.email || existing.username || phoneEmail(phone)
  } else {
    const newUser = await createUser(adminToken, phone)
    identity = newUser.email || phoneEmail(phone)
  }

  // 2. Attempt login
  let res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity, password }),
  })

  // 3. Self-healing: If login fails and user already existed, update password to the current hash
  if (!res.ok && existing) {
    console.log(`[pocketbaseAuth] Password mismatch for existing user ${existing.id}. Updating password to current OTP_SECRET hash...`)
    try {
      await updateUserPassword(adminToken, existing.id, password)
      
      // Retry authentication after updating password
      res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, password }),
      })
    } catch (updateErr) {
      console.error('[pocketbaseAuth] Failed to self-heal password:', updateErr.message)
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Authentication failed after OTP verification')
  }

  return res.json()
}

export async function deleteUserByFacebookId(facebookId) {
  if (!facebookId) return false

  const adminToken = await adminAuth()
  if (!adminToken) {
    throw new Error('PocketBase admin credentials not configured.')
  }

  // Find user by facebookId
  const filter = encodeURIComponent(`facebookId="${facebookId}"`)
  const searchRes = await fetch(`${PB_URL}/api/collections/users/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: adminToken },
  })
  if (!searchRes.ok) return false
  const searchData = await searchRes.json()
  const user = searchData.items?.[0]
  if (!user) return false

  // Delete user record
  const deleteRes = await fetch(`${PB_URL}/api/collections/users/records/${user.id}`, {
    method: 'DELETE',
    headers: { Authorization: adminToken },
  })

  return deleteRes.ok
}

export async function updateUserEmail(userId, email, userToken) {
  if (!userId || !email || !userToken) {
    throw new Error('userId, email, and userToken are required')
  }

  // 1. Verify user token
  const verifyRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
    headers: { Authorization: userToken },
  })
  if (!verifyRes.ok) {
    throw new Error('Verification of client token failed. Unauthorized.')
  }

  // 2. Authenticate as admin
  const adminToken = await adminAuth()
  if (!adminToken) {
    throw new Error('PocketBase admin credentials not configured on backend.')
  }

  // 3. Update email
  const updateRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}))
    throw new Error(err?.message || 'Failed to update email in database')
  }

  return updateRes.json()
}

export async function verifyIsAdmin(userToken) {
  try {
    const res = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: userToken }
    })
    if (!res.ok) return false
    const data = await res.json()
    const role = data.record?.role
    return role === 'admin' || role === 'superadmin'
  } catch (e) {
    console.error('[verifyIsAdmin Error]', e.message)
    return false
  }
}

export async function bootstrapCollections() {
  try {
    const adminToken = await adminAuth()
    if (!adminToken) {
      console.warn('[Bootstrap] PocketBase admin credentials not set. Cannot bootstrap collections.')
      return
    }

    const checkRes = await fetch(`${PB_URL}/api/collections/whatsapp_messages`, {
      headers: { Authorization: adminToken }
    })

    const whatsappSchema = {
      name: 'whatsapp_messages',
      type: 'base',
      schema: [
        { name: 'phone', type: 'text', required: true },
        { name: 'senderName', type: 'text' },
        { name: 'body', type: 'editor', options: { convertUrls: true } },
        { name: 'direction', type: 'text', required: true },
        { name: 'messageId', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'read', type: 'bool' }
      ],
      listRule: 'phone = @request.auth.phone || @request.auth.role = "admin" || @request.auth.role = "employee" || @request.auth.role = "superadmin"',
      viewRule: 'phone = @request.auth.phone || @request.auth.role = "admin" || @request.auth.role = "employee" || @request.auth.role = "superadmin"',
      createRule: null,
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "employee" || @request.auth.role = "superadmin"',
      deleteRule: null
    }

    if (checkRes.status === 404) {
      console.log('[Bootstrap] Creating whatsapp_messages collection...')
      const createRes = await fetch(`${PB_URL}/api/collections`, {
        method: 'POST',
        headers: {
          Authorization: adminToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(whatsappSchema)
      })

      if (createRes.ok) {
        console.log('[Bootstrap] Successfully created whatsapp_messages collection!')
      } else {
        console.error('[Bootstrap] Failed to create whatsapp_messages collection:', await createRes.text())
      }
    } else {
      console.log('[Bootstrap] whatsapp_messages collection exists. Syncing rules...')
      await fetch(`${PB_URL}/api/collections/whatsapp_messages`, {
        method: 'PATCH',
        headers: {
          Authorization: adminToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schema: whatsappSchema.schema,
          listRule: whatsappSchema.listRule,
          viewRule: whatsappSchema.viewRule,
          updateRule: whatsappSchema.updateRule
        })
      })
    }

    // Update bookings collection rules
    console.log('[Bootstrap] Syncing bookings collection rules...')
    await fetch(`${PB_URL}/api/collections/bookings`, {
      method: 'PATCH',
      headers: {
        Authorization: adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        listRule: 'phone = @request.auth.phone || email = @request.auth.email || @request.auth.role = "admin" || @request.auth.role = "employee" || @request.auth.role = "superadmin"',
        viewRule: 'phone = @request.auth.phone || email = @request.auth.email || @request.auth.role = "admin" || @request.auth.role = "employee" || @request.auth.role = "superadmin"',
        createRule: 'true'
      })
    })

  } catch (err) {
    console.error('[Bootstrap Error]', err.message)
  }
}

export async function logWhatsAppMessage(phone, senderName, body, direction, messageId = '', status = 'sent') {
  try {
    const adminToken = await adminAuth()
    if (!adminToken) {
      throw new Error('PocketBase admin credentials not configured on backend.')
    }

    // Clean phone number
    const cleanPhone = String(phone).replace(/\D/g, '')

    const res = await fetch(`${PB_URL}/api/collections/whatsapp_messages/records`, {
      method: 'POST',
      headers: {
        Authorization: adminToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: cleanPhone,
        senderName,
        body,
        direction,
        messageId,
        status,
        read: direction === 'outgoing'
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[logWhatsAppMessage Error]', errText)
      throw new Error(`Failed to log message in DB: ${errText}`)
    }

    return await res.json()
  } catch (err) {
    console.error('[logWhatsAppMessage catch]', err.message)
    throw err
  }
}

