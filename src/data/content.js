export const ANNOUNCEMENT =
  'Get 20% OFF on prepaid bookings + a Pestyfi Home Protection Kit worth ₹1,499 FREE with your first service.'

export const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Services', href: '#services' },
  { label: 'Why Pestyfi', href: '#why-us' },
  { label: 'About Us', href: '#about' },
  { label: 'FAQs', href: '#faq' },
  { label: 'Book Now', href: '#book', cta: true },
  { label: 'Talk to Expert', href: '#book', expert: true },
]

export const HERO = {
  headline: 'Keep your family & home safe from pests',
  subheadline:
    "Mumbai's most trusted pest control specialists helping families eliminate cockroaches, termites, rodents, bed bugs and more with odourless & eco friendly treatments designed for modern homes.",
  cta1: 'Book Now & Get 20% OFF',
  cta2: 'Talk to a Pest Expert',
  trust: [
    { title: '5 Lakh+ Customers', text: 'Homes and families protected across years of service.' },
    { title: '30 Years Of Excellence', text: 'Proven pest management experience you can trust.' },
    { title: 'Safe For Kids & Pets', text: 'Family-first treatment designed for modern homes.' },
    { title: '100% ecofriendly & herbal products', text: '' },
    { title: 'Odourless Treatments', text: '' },
    { title: '365-Day Service Support', text: 'We do not disappear after one visit.' },
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
  { title: '100% Herbal & Eco-Friendly Treatments', text: 'Environmentally responsible solutions safe for children, pets, and sensitive environments.' },
  { title: 'Safe for Kids & Pets', text: 'Formulations designed keeping your family\'s comfort and safety in mind.' },
  { title: 'No disruption to your life', text: 'No need to vacate, move furniture or remove utensils. Your day does not need to stop.' },
  { title: '100% Odourless Treatment', text: 'No harsh smell. No chemical discomfort. No awkward post-service stress.' },
  { title: '365-day service guarantee', text: 'If pests return, so do we — at no extra cost.' },
  { title: '30 years of expertise', text: 'Trained technicians with extensive hands-on experience using modern techniques.' },
  { title: 'Affordable Customized Plans', text: 'Treatment plans designed for your specific needs and budget.' },
  { title: 'Advanced Pest Control Technology', text: 'Modern equipment, proven methods, and industry-approved products.' },
  { title: 'Long-Term Protection', text: 'Elimination plus prevention through monitoring and preventive measures.' },
]

export const SERVICES = [
  {
    id: 'general',
    title: 'General Pest Control',
    text: 'Eliminates common household pests including cockroaches, ants, spiders, silverfish, and crawling insects with long-term protection.',
  },
  {
    id: 'herbal',
    title: 'Herbal Pest Control',
    text: 'Natural, eco-friendly formulations that minimize chemical exposure while delivering excellent results.',
  },
  {
    id: 'cockroach',
    title: 'Cockroach Pest Control',
    featured: true,
    text: 'Advanced cockroach control targeting hidden colonies with gel baiting, spray treatment, and preventive support — safe, odourless, no vacating required.',
    plans: ['Advanced Cockroach Control', 'Standard Cockroach Control', 'Cockroach + Ant Control'],
    amc: [
      { name: '1 Year Protection', detail: '3 services in 12 months — every 4 months' },
      { name: '2 Year Protection', detail: '6 services in 24 months — long-term hygiene' },
      { name: 'Single Service', detail: 'Early-stage infestation or preventive treatment' },
    ],
    steps: [
      { n: '1', title: 'Block the Hideouts', text: 'Gel baiting, crack-and-crevice treatment in kitchen, drains, cabinets, and bathroom corners.' },
      { n: '2', title: 'Cut the Food Source', text: 'Drain-zone treatment, kitchen hygiene guidance, and food-source reduction.' },
      { n: '3', title: 'Destroy the Colony', text: 'Gel baiting and targeted spray for visible cockroaches and hidden colonies.' },
      { n: '4', title: 'Monitor and Protect', text: 'Scheduled follow-ups, service tracking, and warranty-backed AMC support.' },
    ],
    benefits: [
      'Safe for kids and pets', 'No need to vacate', 'No need to empty kitchen',
      'Odourless & eco-conscious', 'Targets hidden colonies', '365-day support',
    ],
  },
  { id: 'termite', title: 'Termite Pest Control', text: 'Advanced anti-termite treatments for homes, offices, shops, warehouses, and industrial facilities.' },
  { id: 'bedbug', title: 'Bed Bug Pest Control', text: 'Complete elimination of adult bed bugs and eggs for healthier, peaceful sleep.' },
  { id: 'mosquito', title: 'Mosquito Pest Control', text: 'Indoor and outdoor mosquito management to protect families from mosquito-borne diseases.' },
  { id: 'rodent', title: 'Rodent Pest Control', text: 'Inspection, trapping, exclusion, and preventive solutions to keep your property rodent-free.' },
  { id: 'ant', title: 'Ant Control', text: 'Colony-focused treatment that eliminates infestations at the source.' },
  { id: 'tick', title: 'Tick Pest Control', text: 'Specialized treatment for homes with pets, gardens, and family spaces.' },
]

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
