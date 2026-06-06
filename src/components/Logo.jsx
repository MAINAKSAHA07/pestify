export default function Logo({ className = '', size = 'md', onDark = false }) {
  const heights = { sm: 'h-7', md: 'h-8', lg: 'h-10' }

  return (
    <a href="#top" className={`inline-flex shrink-0 items-center ${className}`} aria-label="Pestyfi home">
      <img
        src="/logo.webp"
        alt="Pestyfi Eco Solutions"
        className={`${heights[size]} w-auto max-w-[130px] object-contain object-left sm:max-w-[150px] ${
          onDark ? 'rounded-lg bg-white px-2 py-1' : ''
        }`}
        width={150}
        height={40}
        loading="eager"
        decoding="async"
      />
    </a>
  )
}
