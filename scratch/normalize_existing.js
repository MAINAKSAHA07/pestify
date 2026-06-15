import PocketBase from 'pocketbase'
import 'dotenv/config'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD

function normalizePhone(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

async function run() {
  const pb = new PocketBase(PB_URL)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('Authenticated as admin.')

  // 1. Normalize user phones
  const users = await pb.collection('users').getFullList()
  console.log(`Checking ${users.length} users...`)
  for (const user of users) {
    if (user.phone) {
      const normalized = normalizePhone(user.phone)
      if (normalized !== user.phone) {
        console.log(`Normalizing user ${user.id} phone: ${user.phone} -> ${normalized}`)
        try {
          await pb.collection('users').update(user.id, { phone: normalized })
        } catch (err) {
          console.error(`Failed to update user ${user.id}:`, err.message)
        }
      }
    }
  }

  // 2. Normalize booking phones
  const bookings = await pb.collection('bookings').getFullList()
  console.log(`Checking ${bookings.length} bookings...`)
  for (const booking of bookings) {
    if (booking.phone) {
      const normalized = normalizePhone(booking.phone)
      if (normalized !== booking.phone) {
        console.log(`Normalizing booking ${booking.id} phone: ${booking.phone} -> ${normalized}`)
        try {
          await pb.collection('bookings').update(booking.id, { phone: normalized })
        } catch (err) {
          console.error(`Failed to update booking ${booking.id}:`, err.message)
        }
      }
    }
  }

  console.log('Normalization complete.')
}

run().catch(console.error)
