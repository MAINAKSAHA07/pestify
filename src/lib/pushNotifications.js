import { getApiBaseUrl, parseApiResponse } from './api'
import { pb } from './pocketbase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    return { ok: false, error: 'Push notifications are not supported on this device or browser.' }
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }

  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission was denied.' }
  }

  const API_BASE = getApiBaseUrl()
  const keyRes = await fetch(`${API_BASE}/push/vapid-public-key`)
  const keyData = await parseApiResponse(keyRes)

  if (!keyRes.ok || !keyData.publicKey) {
    return { ok: false, error: 'Push notifications are not configured on the server yet.' }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    })
  }

  const res = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })

  const data = await parseApiResponse(res)
  if (!res.ok) {
    return { ok: false, error: data.error || 'Failed to register for push notifications.' }
  }

  return { ok: true }
}

export async function syncPushSubscriptionIfGranted() {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return { ok: false, skipped: true }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      return enablePushNotifications()
    }

    const API_BASE = getApiBaseUrl()
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    })
    const data = await parseApiResponse(res)
    if (!res.ok) {
      return { ok: false, error: data.error || 'Failed to sync push subscription.' }
    }
    return { ok: true, synced: true }
  } catch (err) {
    console.warn('[Push sync]', err.message)
    return { ok: false, error: err.message }
  }
}
