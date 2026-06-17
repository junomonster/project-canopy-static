export const PRESS_LINKS = {
  ko: 'https://theori.io/ko/news/edf0f3cb-b95b-4f2a-801b-f0f83806ad40',
  en: 'https://theori.io/news/edf0f3cb-b95b-4f2a-801b-f0f83806ad40',
} as const;

export type PressLocale = keyof typeof PRESS_LINKS;
