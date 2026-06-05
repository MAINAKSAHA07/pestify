const API_BASE = import.meta.env.VITE_WHATSAPP_API_URL || '/api'

export async function sendWhatsAppOtp(phone) {
  const res = await fetch(`${API_BASE}/whatsapp/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
  return data
}

export async function verifyWhatsAppOtp(phone, code) {
  const res = await fetch(`${API_BASE}/whatsapp/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Verification failed')
  return data
}
