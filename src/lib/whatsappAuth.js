import { getApiBaseUrl, parseApiResponse } from './api'

export async function sendWhatsAppOtp(phone) {
  const res = await fetch(`${getApiBaseUrl()}/whatsapp/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const data = await parseApiResponse(res)
  if (!res.ok) {
    const hint = data.hint ? `\n${data.hint}` : ''
    throw new Error((data.error || 'Failed to send OTP') + hint)
  }
  return data
}

export async function verifyWhatsAppOtp(phone, code) {
  const res = await fetch(`${getApiBaseUrl()}/whatsapp/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  const data = await parseApiResponse(res)
  if (!res.ok) throw new Error(data.error || 'Verification failed')
  return data
}
