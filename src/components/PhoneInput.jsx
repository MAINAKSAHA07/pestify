import { PHONE_COUNTRIES, getCountryById, sanitizeLocalPhoneInput } from '../lib/phone'

const THEME_STYLES = {
  light: {
    wrap: 'rounded-xl border border-black/10 bg-cream/30 focus-within:border-eco focus-within:ring-2 focus-within:ring-eco/20',
    select: 'border-r border-black/10 bg-cream/50 text-ink',
    input: 'bg-transparent text-ink placeholder:text-ink/40',
  },
  dark: {
    wrap: 'rounded-xl bg-white/10 ring-1 ring-white/15 focus-within:ring-2 focus-within:ring-amber',
    select: 'border-r border-white/15 bg-white/5 text-cream',
    input: 'bg-transparent text-cream placeholder:text-cream/50',
  },
  profile: {
    wrap: 'rounded-lg border border-black/10 bg-white focus-within:ring-1 focus-within:ring-forest',
    select: 'border-r border-black/10 bg-cream/30 text-ink',
    input: 'bg-transparent text-ink placeholder:text-ink/40',
  },
}

export default function PhoneInput({
  countryId,
  localNumber,
  onCountryChange,
  onLocalNumberChange,
  theme = 'light',
  required = false,
  id,
  className = '',
}) {
  const styles = THEME_STYLES[theme] || THEME_STYLES.light
  const country = getCountryById(countryId)

  return (
    <div className={`flex h-11 w-full overflow-hidden ${styles.wrap} ${className}`}>
      <select
        id={id ? `${id}-country` : undefined}
        value={countryId}
        onChange={(e) => onCountryChange(e.target.value)}
        aria-label="Country code"
        className={`h-full shrink-0 cursor-pointer px-2.5 text-sm font-semibold outline-none ${styles.select}`}
      >
        {PHONE_COUNTRIES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.flag} +{option.dialCode}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        placeholder={country.placeholder}
        value={localNumber}
        onChange={(e) => onLocalNumberChange(sanitizeLocalPhoneInput(e.target.value))}
        className={`min-w-0 flex-1 px-3 text-sm outline-none ${styles.input}`}
      />
    </div>
  )
}
