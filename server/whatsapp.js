/**
 * WhatsApp Cloud API helpers
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v25.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

export function normalizePhone(input) {
  const digits = String(input).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}` // default India
  return digits
}

export function formatDisplayPhone(digits) {
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return `+${digits}`
}

export async function sendWhatsAppText(to, body) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error('WhatsApp API is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.')
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(to),
      type: 'text',
      text: { preview_url: false, body },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText
    throw new Error(msg)
  }
  return data
}

/** Use approved template (works in test/sandbox). Default: hello_world */
export async function sendWhatsAppTemplate(to, templateName = 'hello_world', language = 'en_US') {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error('WhatsApp API is not configured.')
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(to),
      type: 'template',
      template: { name: templateName, language: { code: language } },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText
    throw new Error(msg)
  }
  return data
}

export async function sendLoginOtp(to, code) {
  const body = `Your Pestyfi login code is *${code}*. Valid for 10 minutes. Do not share this code with anyone.`
  return sendWhatsAppText(to, body)
}
