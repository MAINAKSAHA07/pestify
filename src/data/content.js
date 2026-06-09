import SERVICES_DATA from './services_custom.json'

export const ANNOUNCEMENT =
  'Get 20% OFF on prepaid bookings + a FREE Pestyfi Home Protection Kit worth ₹1,499 with your first service.'


export const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Services', href: '#services' },
  { label: 'Why Pestyfi', href: '#why-us' },
  { label: 'About Us', href: '#about' },
  { label: 'FAQs', href: '#faq' },
  { label: 'Book Now', href: '#book', cta: true },
  // { label: 'Talk to Expert', href: '#book', expert: true },
]

export const HERO = {
  headline: 'Keep your family & home safe from pests',
  subheadline:
    "Mumbai's most trusted pest control specialists helping families eliminate cockroaches, termites, rodents, bed bugs and more with odourless & eco friendly treatments designed for modern homes.",
  cta1: 'Book Now & Get 20% OFF',
  cta2: 'Talk to a Pest Expert',
  trust: [
    { title: '5 Lakh+ Customers', text: 'Homes and families protected across years of service.', icon: '/hero/hero icons/5 lakh.webp' },
    { title: '30 Years Of Excellence', text: 'Proven pest management experience you can trust.', icon: '/hero/hero icons/30 years.webp' },
    { title: 'Safe For Kids & Pets', text: 'Family-first treatment designed for modern homes.', icon: '/hero/hero icons/safe for kids.webp' },
    { title: '100% ecofriendly & herbal products', text: 'Safe, natural pest control that protects your home and the planet.', icon: '/hero/hero icons/ecofriendly.webp' },
    { title: 'Odourless Treatments', text: 'No harsh smell, no discomfort, just clean protection.', icon: '/hero/hero icons/odourless.webp' },
    { title: '365-Day Service Support', text: 'We do not disappear after one visit.', icon: '/hero/hero icons/365 day support.webp' },
  ],
}

export const TRUSTED_LOGOS = [
  'Taj Hotels', 'ITC Hotels', 'Marriott', 'Hilton', 'Oberoi', 'Radisson',
  'Reliance Retail', 'DMart', 'Big Bazaar', 'More Supermarket', 'Nature\'s Basket',
  'Apollo Hospitals', 'Fortis', 'Lilavati', 'Kokilaben', 'Hiranandani',
  'Lodha', 'Godrej Properties', 'Prestige', 'Mahindra Lifespaces',
  'TCS', 'Infosys', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'McDonald\'s', 'Starbucks', 'Cafe Coffee Day', 'Dominos', 'Pizza Hut',
]

export const WHY_CARDS = [
  { title: '100% Herbal & Eco-Friendly Treatments', text: 'Environmentally responsible solutions safe for children, pets, and sensitive environments.', image: '/hero/why pestyfi - sec 6/1.webp', icon: '/hero/hero icons/ecofriendly.webp' },
  { title: 'Safe for Kids & Pets', text: 'Formulations designed keeping your family\'s comfort and safety in mind.', image: '/hero/why pestyfi - sec 6/2.webp', icon: '/hero/hero icons/safe for kids.webp' },
  { title: 'No disruption to your life', text: 'No need to vacate your home, move your furniture or remove utensils. Your day does not need to stop because pests showed up. We make pest control convenient, practical, and home-friendly.', image: '/hero/why pestyfi - sec 6/3.webp', icon: '/hero/hero icons/odourless.webp' },
  { title: '100% Odourless & Eco-Friendly Treatment', text: 'No harsh smell. No chemical discomfort. No awkward post-service stress.', image: '/hero/why pestyfi - sec 6/4.webp', icon: '/hero/hero icons/odourless.webp' },
  { title: '365-day service guarantee', text: 'Our year round guarantee means we stand by our work. If pests return, so do we - at no extra cost.', image: '/hero/why pestyfi - sec 6/5.webp', icon: '/hero/hero icons/365 day support.webp' },
  { title: '30 years of expertise', text: 'Our trained technicians have extensive hands-on experience handling all types of pest infestations using modern pest management techniques.', image: '/hero/why pestyfi - sec 6/6.webp', icon: '/hero/hero icons/30 years.webp' },
  { title: 'Affordable Customized Plans', text: 'Every property is different. That\'s why we offer customized treatment plans designed to meet your specific pest control needs and budget.', image: '/hero/why pestyfi - sec 6/7.webp', icon: '/hero/hero icons/5 lakh.webp' },
  { title: 'Advanced Pest Control Technology', text: 'We utilize modern equipment, scientifically proven treatment methods, and industry-approved products for maximum effectiveness.', image: '/hero/why pestyfi - sec 6/8.webp', icon: '/hero/hero icons/ecofriendly.webp' },
  { title: 'Long-Term Protection', text: 'Our treatments focus not only on eliminating pests but also on preventing future infestations through monitoring and preventive measures.', image: '/hero/why pestyfi - sec 6/9.webp', icon: '/hero/hero icons/30 years.webp' },
]

export const SERVICES = SERVICES_DATA.services


export const SPACES = [
  {
    title: 'Residential',
    items: ['Apartments', 'Villas', 'Bungalows', 'Societies', 'Kitchens', 'Bedrooms', 'Balconies & Gardens'],
  },
  {
    title: 'Commercial',
    items: ['Restaurants & Cafes', 'Hotels', 'Offices', 'Retail Stores', 'Schools', 'Hospitals', 'Warehouses'],
  },
  {
    title: 'Industrial',
    items: ['Factories', 'Warehouses', 'Manufacturing Units', 'Logistics Hubs', 'Processing Facilities'],
  },
]

export const REVIEWS = [
  { q: 'Very professional team. The cockroach issue in our kitchen was handled without smell or mess. We did not even need to leave the house.', n: 'Priya M.', l: 'Mumbai' },
  { q: 'We booked termite treatment for our office. The inspection was clear, pricing was transparent, and the team completed the work on time.', n: 'Rahul S.', l: 'Thane' },
  { q: 'Good doorstep service and polite technicians. The mosquito problem reduced noticeably after the treatment.', n: 'Amit K.', l: 'Navi Mumbai' },
  { q: 'Finally a pest control service that doesn\'t feel scary. No smell, no chaos, and the team explained everything clearly.', n: 'Sneha R.', l: 'Andheri' },
  { q: 'The AMC plan gives real peace of mind. Follow-up visits are on time and the cockroaches haven\'t returned.', n: 'Vikram P.', l: 'Navi Mumbai' },
]

export const FAQS = [
  { q: 'Is Pestyfi safe for kids and pets?', a: 'Yes. Our treatments are designed to be safe for homes with children and pets when standard service instructions are followed.' },
  { q: 'Do I need to vacate my home?', a: 'No. In most cases, you do not need to vacate your home during the service.' },
  { q: 'Do I need to remove utensils or furniture?', a: 'No. Our process reduces unnecessary preparation. Experts will guide you only if something specific needs to be moved.' },
  { q: 'Will there be a strong chemical smell?', a: 'No. Our treatments are 100% odourless and eco-friendly.' },
  { q: 'How long does the treatment take?', a: 'Most home services can be completed quickly depending on property size and pest type.' },
  { q: 'Do you offer a guarantee?', a: 'Yes. Pestyfi offers 365-day assured service support depending on the service plan selected.' },
  { q: 'Can I book online?', a: 'Yes. Book online and get 20% off on prepaid bookings.' },
  { q: 'What is included in the free Pestyfi Home Kit?', a: 'The Pestyfi Home Kit worth ₹1,499 is included free with eligible prepaid bookings for everyday home hygiene and pest prevention.' },
  { q: 'Which areas do you serve?', a: 'Mumbai, Navi Mumbai, Thane, and nearby areas including Kalyan, Dombivli, Panvel, Mira Bhayandar, Bhiwandi, Ambernath, and Badlapur.' },
]

export const SERVICE_RATES = SERVICES_DATA.rates

