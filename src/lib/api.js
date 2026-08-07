/**
 * Backend API base URL.
 * Express (WhatsApp OTP, bookings) runs on pestyfi.com — not on Netlify.
 */
export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_WHATSAPP_API_URL
  if (configured) {
    return String(configured).replace(/\/$/, '')
  }

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'pestyfi.com' || host === 'www.pestyfi.com') {
      return '/api'
    }
    return 'https://pestyfi.com/api'
  }

  return '/api'
}

export async function parseApiResponse(res) {
  const text = await res.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(
        'Could not reach the login server. If this keeps happening, open pestyfi.com and try again.',
      )
    }
    throw new Error(text.slice(0, 180) || 'Unexpected server response')
  }
}
