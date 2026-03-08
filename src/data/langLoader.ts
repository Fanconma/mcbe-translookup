/**
 * Lang file loader using Vite's import.meta.glob
 * 
 * To add a new language, simply place a .lang file in the src/data/langs/ folder.
 * The file name (without extension) will be used as the language code.
 * Example: en_US.lang, zh_CN.lang, ja_JP.lang
 * 
 * Then rebuild the project - the new language will be automatically detected.
 */

export interface LangFile {
  code: string;
  name: string;
  entries: Record<string, string>;
}

const LANG_DISPLAY_NAMES: Record<string, string> = {
  en_US: 'English (US)',
  en_GB: 'English (UK)',
  zh_CN: '简体中文',
  zh_TW: '繁體中文',
  ja_JP: '日本語',
  ko_KR: '한국어',
  de_DE: 'Deutsch',
  fr_FR: 'Français',
  fr_CA: 'Français (CA)',
  es_ES: 'Español',
  es_MX: 'Español (MX)',
  pt_BR: 'Português (BR)',
  pt_PT: 'Português (PT)',
  ru_RU: 'Русский',
  it_IT: 'Italiano',
  nl_NL: 'Nederlands',
  pl_PL: 'Polski',
  uk_UA: 'Українська',
  vi_VN: 'Tiếng Việt',
  th_TH: 'ไทย',
  tr_TR: 'Türkçe',
  ar_SA: 'العربية',
  he_IL: 'עברית',
  id_ID: 'Bahasa Indonesia',
  cs_CZ: 'Čeština',
  el_GR: 'Ελληνικά',
  bg_BG: 'Български',
  da_DK: 'Dansk',
  fi_FI: 'Suomi',
  hu_HU: 'Magyar',
  nb_NO: 'Norsk',
  ro_RO: 'Română',
  sk_SK: 'Slovenčina',
  sv_SE: 'Svenska',
};

export const LANG_FLAGS: Record<string, string> = {
  en_US: '🇺🇸', en_GB: '🇬🇧', zh_CN: '🇨🇳', zh_TW: '🇭🇰',
  ja_JP: '🇯🇵', ko_KR: '🇰🇷', de_DE: '🇩🇪', fr_FR: '🇫🇷',
  fr_CA: '🇨🇦', es_ES: '🇪🇸', es_MX: '🇲🇽', pt_BR: '🇧🇷',
  pt_PT: '🇵🇹', ru_RU: '🇷🇺', it_IT: '🇮🇹', nl_NL: '🇳🇱',
  pl_PL: '🇵🇱', uk_UA: '🇺🇦', vi_VN: '🇻🇳', th_TH: '🇹🇭',
  tr_TR: '🇹🇷', ar_SA: '🇸🇦', he_IL: '🇮🇱', id_ID: '🇮🇩',
  cs_CZ: '🇨🇿', el_GR: '🇬🇷', bg_BG: '🇧🇬', da_DK: '🇩🇰',
  fi_FI: '🇫🇮', hu_HU: '🇭🇺', nb_NO: '🇳🇴', ro_RO: '🇷🇴',
  sk_SK: '🇸🇰', sv_SE: '🇸🇪',
};

function parseLangContent(content: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      entries[trimmed.substring(0, eqIndex)] = trimmed.substring(eqIndex + 1);
    }
  }
  return entries;
}

export function getLangName(code: string): string {
  return LANG_DISPLAY_NAMES[code] || code;
}

/**
 * Load all .lang files from the langs/ folder at build time.
 * Uses Vite's import.meta.glob with eager mode and ?raw query.
 */
export function loadAllLangs(): LangFile[] {
  const modules = import.meta.glob('./langs/*.lang', { eager: true, query: '?raw', import: 'default' });

  const langFiles: LangFile[] = [];

  for (const [path, content] of Object.entries(modules)) {
    // path looks like "./langs/en_US.lang"
    const match = path.match(/\.\/langs\/(.+)\.lang$/);
    if (!match) continue;
    const code = match[1];
    langFiles.push({
      code,
      name: getLangName(code),
      entries: parseLangContent(content as string),
    });
  }

  // Sort: en_US first, then alphabetically
  langFiles.sort((a, b) => {
    if (a.code === 'en_US') return -1;
    if (b.code === 'en_US') return 1;
    return a.code.localeCompare(b.code);
  });

  return langFiles;
}
