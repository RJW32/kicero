export type QuestionType = 'text' | 'textarea' | 'email' | 'radio' | 'checkbox' | 'files';

export interface BaseQuestion {
  id: string;
  section: string;
  label: string;
  /** Shown below the label (e.g. upload instructions). */
  description?: string;
  optional?: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text' | 'textarea' | 'email';
  placeholder?: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'radio' | 'checkbox';
  options: string[];
}

export interface FileQuestion extends BaseQuestion {
  type: 'files';
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

export type QuestionnaireQuestion = TextQuestion | ChoiceQuestion | FileQuestion;

export const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    id: 'businessName',
    section: 'Business Basics',
    label: 'Business name',
    type: 'text',
    optional: true,
  },
  {
    id: 'businessSummary',
    section: 'Business Basics',
    label: 'What do you do?',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'customerType',
    section: 'Business Basics',
    label: 'Who are your typical customers?',
    type: 'text',
    optional: true,
  },
  {
    id: 'mainGoal',
    section: 'Business Basics',
    label: 'Main goal for the website',
    type: 'text',
    optional: true,
  },
  {
    id: 'logoReady',
    section: 'Brand & Style',
    label: 'Do you already have a logo?',
    type: 'radio',
    options: ['Yes', 'No'],
    optional: true,
  },
  {
    id: 'stylePreference',
    section: 'Brand & Style',
    label: 'Preferred style',
    type: 'checkbox',
    options: ['Modern / Minimal', 'Professional / Corporate', 'Friendly / Casual', 'Bold / Creative'],
    optional: true,
  },
  {
    id: 'inspirationSites',
    section: 'Brand & Style',
    label: 'Websites you like (links)',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'preferredColours',
    section: 'Colour Preferences',
    label: 'Preferred main colours',
    type: 'text',
    optional: true,
  },
  {
    id: 'avoidColours',
    section: 'Colour Preferences',
    label: 'Colours to avoid',
    type: 'text',
    optional: true,
  },
  {
    id: 'fontPreference',
    section: 'Fonts',
    label: 'Any font preferences?',
    type: 'text',
    optional: true,
  },
  {
    id: 'pagesWanted',
    section: 'Pages',
    label: 'Pages you would like',
    type: 'checkbox',
    options: ['Home', 'About', 'Services', 'Pricing', 'Portfolio / Gallery', 'Testimonials', 'FAQ', 'Contact'],
    optional: true,
  },
  {
    id: 'homepageNeeds',
    section: 'User Experience Preferences',
    label: 'Must-have homepage sections',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'mustAndAvoid',
    section: 'User Experience Preferences',
    label: 'Anything you definitely want or do not want?',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'mobilePriority',
    section: 'User Experience Preferences',
    label: 'Is mobile-friendly design important?',
    type: 'radio',
    options: ['Important', 'Not important'],
    optional: true,
  },
  {
    id: 'feelWords',
    section: 'Final Notes',
    label: '3 words for how you want the website to feel',
    type: 'text',
    optional: true,
  },
  {
    id: 'extraNotes',
    section: 'Final Notes',
    label: 'Anything else you want included?',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'hasPhotos',
    section: 'Images & Visuals',
    label: 'Do you have your own photos?',
    type: 'radio',
    options: ['Yes', 'No', 'Some'],
    optional: true,
  },
  {
    id: 'brandAssets',
    section: 'Images & Visuals',
    label: 'Images and videos for your website',
    description: [
      'Upload images and video you would like used on your site.',
      'Naming: where placement matters, use a clear filename (for example, AboutLeadershipPhoto.jpg).',
      'Priority: prefix must-have files with 1 so they stand out (for example, 1HomeHero.mp4).',
    ].join('\n'),
    type: 'files',
    optional: true,
    accept: 'image/*,video/*,.pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx',
    maxFiles: 100,
    maxSizeMB: 500,
  },
];

export const questionnaireQuestionMap = new Map(
  questionnaireQuestions.map((question) => [question.id, question]),
);

/** Ordered wizard steps — each entry is section key(s); Colour + Fonts stay on one step. */
export const questionnaireStepSections: string[][] = [
  ['Business Basics'],
  ['Brand & Style'],
  ['Colour Preferences', 'Fonts'],
  ['Pages'],
  ['User Experience Preferences'],
  ['Final Notes'],
  ['Images & Visuals'],
];
