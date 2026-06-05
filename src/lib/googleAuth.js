import { pb, POCKETBASE_URL } from './pocketbase'

export const OAUTH_CALLBACK_PATH = '/oauth-callback.html'
export const GOOGLE_REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}${OAUTH_CALLBACK_PATH}`
    : `${POCKETBASE_URL}/api/oauth2-redirect`

const STORAGE = {
  provider: 'pestyfi_oauth_provider',
  redirect: 'pestyfi_oauth_redirect',
  pbUrl: 'pestyfi_pb_url',
}

export function parseAuthError(err) {
  const providerMsg = err?.response?.data?.provider?.message
  if (providerMsg) return providerMsg

  const msg = err?.message || ''
  if (msg.includes('redirect_uri_mismatch')) {
    return `Google redirect URI mismatch. Add this EXACT URI in Google Cloud Console → Credentials → Authorized redirect URIs:\n${GOOGLE_REDIRECT_URI}`
  }

  if (err?.status === 0) {
    return 'Could not reach PocketBase. Check VITE_POCKETBASE_URL and that the server is running.'
  }

  return msg || 'Authentication failed.'
}

export async function getAuthMethods() {
  return pb.collection('users').listAuthMethods()
}

export function isGoogleAuthEnabled(authMethods) {
  const providers = authMethods?.authProviders ?? authMethods?.oauth2?.providers ?? []
  return providers.some((p) => p.name === 'google')
}

function buildOAuthUrl(providerAuthUrl, redirectUri) {
  const params = new URLSearchParams(providerAuthUrl.split('?')[1] || '')
  params.set('redirect_uri', redirectUri)
  return `${providerAuthUrl.split('?')[0]}?${params.toString()}`
}

/**
 * Full-page Google OAuth redirect (reliable; redirect URI = your frontend origin).
 * Register {origin}/oauth-callback.html in Google Cloud Console.
 */
export async function startGoogleRedirectLogin() {
  const methods = await getAuthMethods()
  const providers = methods.authProviders ?? methods.oauth2?.providers ?? []
  const provider = providers.find((p) => p.name === 'google')

  if (!provider) {
    throw new Error('Google login is not enabled in PocketBase Admin → Settings → Auth providers.')
  }

  const redirectURL = `${window.location.origin}${OAUTH_CALLBACK_PATH}`

  localStorage.setItem(STORAGE.pbUrl, pb.baseUrl)
  localStorage.setItem(STORAGE.provider, JSON.stringify(provider))
  localStorage.setItem(STORAGE.redirect, redirectURL)

  window.location.href = buildOAuthUrl(provider.authUrl, redirectURL)
}

/** Called from oauth-callback.html after Google redirects back */
export async function completeGoogleRedirectLogin() {
  const params = new URLSearchParams(window.location.search)
  const error = params.get('error')
  if (error) {
    throw new Error(params.get('error_description') || error)
  }

  const code = params.get('code')
  const state = params.get('state')
  if (!code) throw new Error('Missing OAuth code from Google.')

  const providerRaw = localStorage.getItem(STORAGE.provider)
  const redirectURL = localStorage.getItem(STORAGE.redirect)
  if (!providerRaw || !redirectURL) {
    throw new Error('OAuth session expired. Go back and try logging in again.')
  }

  const provider = JSON.parse(providerRaw)
  if (provider.state && state && provider.state !== state) {
    throw new Error('OAuth state mismatch. Please try again.')
  }

  const authData = await pb.collection('users').authWithOAuth2Code(
    provider.name,
    code,
    provider.codeVerifier,
    redirectURL,
    { emailVisibility: false },
  )

  localStorage.removeItem(STORAGE.provider)
  localStorage.removeItem(STORAGE.redirect)
  localStorage.removeItem(STORAGE.pbUrl)

  return authData
}

/** @deprecated Use startGoogleRedirectLogin — kept for compatibility */
export function loginWithGoogle() {
  return startGoogleRedirectLogin()
}
