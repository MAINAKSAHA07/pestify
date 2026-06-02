/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#1A3A2A',
        green: '#2D6A4F',
        eco: '#52B788',
        lime: '#B7E4C7',
        cream: '#F5F0E8',
        ink: '#0D1F17',
        amber: '#E9C46A',
        urgent: '#C84B00',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium:
          '0 18px 40px -22px rgba(13, 31, 23, 0.35), 0 10px 18px -14px rgba(13, 31, 23, 0.28)',
        lift: '0 14px 32px -22px rgba(13, 31, 23, 0.45)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        grain:
          "radial-gradient(1200px 600px at 20% 20%, rgba(82,183,136,0.20), transparent 60%), radial-gradient(900px 520px at 80% 10%, rgba(233,196,106,0.18), transparent 55%), radial-gradient(900px 520px at 75% 80%, rgba(183,228,199,0.25), transparent 60%)",
        city:
          "radial-gradient(900px 460px at 20% 25%, rgba(82,183,136,0.20), transparent 60%), linear-gradient(90deg, rgba(13,31,23,0.06) 1px, transparent 1px), linear-gradient(rgba(13,31,23,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        city: 'auto, 40px 40px, 40px 40px',
      },
    },
  },
  plugins: [],
}

