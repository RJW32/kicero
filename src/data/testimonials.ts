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
      "Kicero has actually been so helpful in the whole process of making us a website. Super cheap, super simple, really easy. Don't really know what else to say other than they were great. Thanks again!",
    name: 'Project Lead',
    role: 'One Step',
    location: 'Scotland',
  },
];
