export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  location: string;
}

export const testimonials: ReadonlyArray<Testimonial> = [
  {
    quote:
      'First time using a website for my sales, so good, I love all the features and high end specs my website has now. Great price, great for beginner websites aswell.',
    name: 'Finlay',
    role: 'One Step',
    location: 'Scotland',
  },
  {
    quote:
      'Kicero delivers clean, modern, and practical website designs that provide a comfortable and intuitive user experience. This Scottish startup is led by a founder who is fully committed to delivering the best results for every client. I highly recommend Kicero to anyone looking to build their own professional website.',
    name: 'Nodiya A.',
    role: 'One Step',
    location: 'Scotland',
  },
  {
    quote:
      "Kicero has actually been so helpful in the whole process of making us a website. Super cheap, super simple, really easy. Don't really know what else to say other than they were great. Thanks again!",
    name: 'Project Lead',
    role: 'One Step',
    location: 'Scotland',
  },
  {
    quote: 'This could be you!',
    name: 'Your business',
    role: 'Kicero client',
    location: 'Location',
  },
];
