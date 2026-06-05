import PocketBase from 'pocketbase'

// Use local address by default. Can be overridden using an environment variable if needed.
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(POCKETBASE_URL)
