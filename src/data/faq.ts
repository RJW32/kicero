export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: ReadonlyArray<FaqItem> = [
  {
    question: 'How much does a small business website cost in the UK?',
    answer:
      'It varies, but most small businesses do not need to spend more than about £2,000 for a five-page brochure site. With Kicero you pay £40 when the site goes live and £20 per month after that, which covers hosting, the contact form and small updates.',
  },
  {
    question: 'Do I have to pay before my website is live?',
    answer:
      'No. We do not invoice anything until your website is published and you are happy with it. The first £40 (equivalent to two months of hosting) is only due once the site is live, with £20 per month starting one month later.',
  },
  {
    question: 'Can I use my own domain name?',
    answer:
      'Yes. You can use a kicero.workers.dev subdomain free of charge, or a custom domain. If you do not own a domain we can register one for you, with the registration cost passed through, plus £2/month for domain management.',
  },
  {
    question: 'Do you build websites for businesses outside Scotland?',
    answer:
      'Yes. Kicero is based in Scotland but we work with small businesses, startups and individuals across the United Kingdom. The whole process can be done over email and video — no need to be local.',
  },
  {
    question: 'How long does it take to build a Kicero website?',
    answer:
      'Most simple business websites are designed and built within 2–4 weeks from the initial brief, depending on how quickly content and feedback come back from you. Larger projects are quoted with a longer timeline.',
  },
  {
    question: 'What is included in the £20 per month?',
    answer:
      'Hosting on enterprise-grade infrastructure (Cloudflare), a working contact form, security and SSL, and up to 30 minutes of small updates per month at no extra cost. Larger pieces of work are quoted separately.',
  },
  {
    question: 'Can I update the website myself?',
    answer:
      'Most small businesses prefer to send small edits and let us handle them — that is what the included 30 minutes per month is for. If you want a full self-edit content system we can scope that as a custom add-on.',
  },
  {
    question: 'What if I want to cancel?',
    answer:
      'You can cancel any time with 30 days notice. We will help you migrate the site or hand over the relevant files where reasonably possible — your business should never be locked in.',
  },
];
