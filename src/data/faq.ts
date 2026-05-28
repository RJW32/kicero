export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: ReadonlyArray<FaqItem> = [
  {
    question: 'How much does a small business website cost in the UK?',
    answer:
      'It varies, but most small businesses do not need to spend more than about £2,000 for a five-page brochure site. With Kicero you pay £41 when the site goes live (£16 for your first month plus a £25 one-off setup fee), then £16 per month after that, which covers hosting, domain management, basic SEO, the contact form and small updates. Domain registration is passed through at setup if we register one for you.',
  },
  {
    question: 'Do I have to pay before my website is live?',
    answer:
      'No. We do not invoice anything until your website is published and you are happy with it. The first payment — your first month (£16) plus a £25 setup fee — is only due once the site is live, with £16 per month starting one month later.',
  },
  {
    question: 'Can I use my own domain name?',
    answer:
      'Yes. Most customers use a custom domain — that is included in the standard £16/month plan, with domain management built in. If you do not own a domain we can register one for you and pass the registration cost through at setup. Alternatively, you can use a kicero.workers.dev subdomain for £14/month, but that option does not include SEO work.',
  },
  {
    question: 'Do you build websites for businesses outside Scotland?',
    answer:
      'Yes. Kicero is based in Scotland but we work with small businesses, startups and individuals across the United Kingdom. The whole process can be done over email and video — no need to be local.',
  },
  {
    question: 'How long does it take to build a Kicero website?',
    answer:
      'Most simple business websites are designed and built within 2–4 weeks from the initial brief, depending on how quickly content and feedback come back from you. That estimated timeframe can vary depending on Kicero workload at the time, which is why we give you a more accurate estimate when we begin your project. Larger projects are quoted with a longer timeline.',
  },
  {
    question: 'What is included in the £16 per month?',
    answer:
      'Hosting on enterprise-grade infrastructure (Cloudflare), custom domain management, basic SEO setup, a working contact form, security and SSL, and up to 30 minutes of small updates per month at no extra cost. Larger pieces of work are quoted separately. The £14/month subdomain option includes hosting and updates but not SEO.',
  },
  {
    question: 'What if I need to make a small update to my website?',
    answer:
      'You can email Kicero and ask for any small update to the website — as long as it takes under 30 minutes for Kicero to complete, there is no charge for the update. Kicero will let you know before they begin the work if they think it will take more than 30 minutes.',
  },
  {
    question: 'What if I want to cancel?',
    answer:
      'You can cancel any time with 30 days notice. We will help you migrate the site or hand over the relevant files where reasonably possible — your business should never be locked in.',
  },
];
