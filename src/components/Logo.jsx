export default function Logo({ className = '', size = 'md', onDark = false }) {
  const heights = { sm: 'h-7', md: 'h-8', lg: 'h-10' }

  return (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault()
        if (window.location.pathname !== '/' || window.location.hash) {
          window.history.pushState({}, '', '/')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="Pestyfi home"
    >
      <img
        src="/logo.webp"
        alt="Pestyfi Eco Solutions"
        className={`${heights[size]} w-auto max-w-[110px] object-contain object-left sm:max-w-[150px] ${
          onDark ? 'rounded-md bg-white px-1.5 py-0.5' : ''
        }`}
        width={150}
        height={40}
        loading="eager"
        decoding="async"
      />
    </a>
  )
}
