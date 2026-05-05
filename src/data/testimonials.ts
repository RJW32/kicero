export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  location: string;
}

export const testimonials: ReadonlyArray<Testimonial> = [
  {
    quote:
      'Kicero turned my small business idea into a site that actually looked like a real brand. Quick, simple, and a fraction of what I was quoted elsewhere.',
    name: 'Eilidh M.',
    role: 'Independent Practitioner',
    location: 'Edinburgh',
  },
  {
    quote:
      'I have used Wix for years. Switching to Kicero made the site noticeably faster and the monthly cost is the same. Worth it.',
    name: 'Callum R.',
    role: 'Cafe Owner',
    location: 'Glasgow',
  },
  {
    quote:
      'They built our community project a website over a weekend. No fluff, no upsells, just a fast and clean result that actually gets used.',
    name: 'Project Lead',
    role: 'One Step',
    location: 'Scotland',
  },
];
