export const PHONE_COUNTRIES = [
  {
    id: 'IN',
    dialCode: '91',
    label: 'India',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    localMin: 10,
    localMax: 10,
  },
  {
    id: 'US',
    dialCode: '1',
    label: 'United States',
    flag: '🇺🇸',
    placeholder: '555 123 4567',
    localMin: 10,
    localMax: 10,
  },
]

export function getCountryById(countryId) {
  return PHONE_COUNTRIES.find((country) => country.id === countryId) || PHONE_COUNTRIES[0]
}

export function parsePhoneNumber(stored) {
  if (!stored) {
    return { countryId: 'IN', localNumber: '' }
  }

  const digits = String(stored).replace(/\D/g, '')
  if (!digits) {
    return { countryId: 'IN', localNumber: '' }
  }

  if (digits.startsWith('1') && digits.length === 11) {
    return { countryId: 'US', localNumber: digits.slice(1) }
  }

  if (digits.startsWith('91') && digits.length === 12) {
    return { countryId: 'IN', localNumber: digits.slice(2) }
  }

  if (digits.length === 10) {
    return { countryId: 'IN', localNumber: digits }
  }

  return { countryId: 'IN', localNumber: digits }
}

export function formatFullPhone(countryId, localNumber) {
  const country = getCountryById(countryId)
  const local = String(localNumber).replace(/\D/g, '')
  if (!local) return ''
  return `${country.dialCode}${local}`
}

export function normalizePhone(input, countryId) {
  if (countryId) {
    return formatFullPhone(countryId, input)
  }

  const digits = String(input).replace(/\D/g, '')
  if (!digits) return ''

  if (digits.length === 11 && digits.startsWith('1')) return digits
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 10) return `91${digits}`

  return digits
}

export function phoneVariants(input) {
  const normalized = normalizePhone(input)
  if (!normalized) return []

  const variants = new Set([normalized, `+${normalized}`])

  if (normalized.startsWith('91') && normalized.length === 12) {
    const local = normalized.slice(2)
    variants.add(local)
    variants.add(`+91${local}`)
  }

  if (normalized.startsWith('1') && normalized.length === 11) {
    const local = normalized.slice(1)
    variants.add(local)
    variants.add(`+1${local}`)
  }

  if (normalized.length === 10) {
    variants.add(`91${normalized}`)
    variants.add(`+91${normalized}`)
    variants.add(`1${normalized}`)
    variants.add(`+1${normalized}`)
  }

  return [...variants]
}

export function formatDisplayPhone(stored) {
  const { countryId, localNumber } = parsePhoneNumber(stored)
  const country = getCountryById(countryId)
  if (!localNumber) return ''

  if (countryId === 'IN' && localNumber.length === 10) {
    return `+${country.dialCode} ${localNumber.slice(0, 5)} ${localNumber.slice(5)}`
  }

  if (countryId === 'US' && localNumber.length === 10) {
    return `+${country.dialCode} (${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`
  }

  return `+${country.dialCode} ${localNumber}`
}

export function isValidLocalPhone(countryId, localNumber) {
  const country = getCountryById(countryId)
  const digits = String(localNumber).replace(/\D/g, '')
  return digits.length >= country.localMin && digits.length <= country.localMax
}

export function sanitizeLocalPhoneInput(value) {
  return String(value).replace(/\D/g, '').slice(0, 10)
}
