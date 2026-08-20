/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const localeLoaders = {
  'ar-YE': () => import('@fullcalendar/react/locales/ar'),
  'bg-BG': () => import('@fullcalendar/react/locales/bg'),
  'ca-ES': () => import('@fullcalendar/react/locales/ca'),
  'cs-CZ': () => import('@fullcalendar/react/locales/cs'),
  'da-DK': () => import('@fullcalendar/react/locales/da'),
  'de-DE': () => import('@fullcalendar/react/locales/de'),
  'el-GR': () => import('@fullcalendar/react/locales/el'),
  'en-GB': () => import('@fullcalendar/react/locales/en-gb'),
  'es-ES': () => import('@fullcalendar/react/locales/es'),
  'et-EE': () => import('@fullcalendar/react/locales/et'),
  'fa-IR': () => import('@fullcalendar/react/locales/fa'),
  'fi-FI': () => import('@fullcalendar/react/locales/fi'),
  'fr-FR': () => import('@fullcalendar/react/locales/fr'),
  'hu-HU': () => import('@fullcalendar/react/locales/hu'),
  'id-ID': () => import('@fullcalendar/react/locales/id'),
  'it-IT': () => import('@fullcalendar/react/locales/it'),
  'ja-JP': () => import('@fullcalendar/react/locales/ja'),
  'ko-KR': () => import('@fullcalendar/react/locales/ko'),
  'nl-NL': () => import('@fullcalendar/react/locales/nl'),
  'pl-PL': () => import('@fullcalendar/react/locales/pl'),
  'pt-BR': () => import('@fullcalendar/react/locales/pt-br'),
  'pt-PT': () => import('@fullcalendar/react/locales/pt'),
  'ro-RO': () => import('@fullcalendar/react/locales/ro'),
  'ru-RU': () => import('@fullcalendar/react/locales/ru'),
  'sk-SK': () => import('@fullcalendar/react/locales/sk'),
  'sr-Cyrl-RS': () => import('@fullcalendar/react/locales/sr-cyrl'),
  'sr-Latn-RS': () => import('@fullcalendar/react/locales/sr'),
  'sv-SE': () => import('@fullcalendar/react/locales/sv'),
  'tr-TR': () => import('@fullcalendar/react/locales/tr'),
  'uk-UA': () => import('@fullcalendar/react/locales/uk'),
  'uz-UZ': () => import('@fullcalendar/react/locales/uz'),
  'vi-VN': () => import('@fullcalendar/react/locales/vi'),
  'zh-CN': () => import('@fullcalendar/react/locales/zh-cn'),
  'zh-TW': () => import('@fullcalendar/react/locales/zh-tw'),
};

export const getFullCalendarLocaleCode = (language) => {
  if (!language || language === 'en-US') {
    return 'en';
  }

  return localeLoaders[language] ? language : 'en';
};

export const loadFullCalendarLocale = async (language) => {
  const localeCode = getFullCalendarLocaleCode(language);

  if (localeCode === 'en') {
    return 'en';
  }

  try {
    const { default: locale } = await localeLoaders[localeCode]();
    return locale;
  } catch {
    return 'en';
  }
};
