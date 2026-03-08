export type UILocale = 'en' | 'zh_CN' | 'zh_TW' | 'ja' | 'es';

export const UI_LOCALE_NAMES: Record<UILocale, string> = {
  en: 'English',
  zh_CN: '简体中文',
  zh_TW: '繁體中文',
  ja: '日本語',
  es: 'Español',
};

export const UI_LOCALE_FLAGS: Record<UILocale, string> = {
  en: '🇺🇸',
  zh_CN: '🇨🇳',
  zh_TW: '🇭🇰',
  ja: '🇯🇵',
  es: '🇪🇸',
};

export const UI_LOCALE_TO_LANG: Record<UILocale, string> = {
  en: 'en_US',
  zh_CN: 'zh_CN',
  zh_TW: 'zh_TW',
  ja: 'ja_JP',
  es: 'es_ES',
};

type TranslationStrings = {
  siteTitle: string;
  siteSubtitle: string;
  searchPlaceholder: string;
  searchModeAll: string;
  searchModeKey: string;
  searchModeValue: string;
  allCategories: string;
  noResults: string;
  noResultsHint: string;
  showingResults: string;
  showingCapped: string;
  refineSearch: string;
  moreLangs: string;
  footerLine1: string;
  footerLine2: string;
  darkMode: string;
  lightMode: string;
  pinnedLanguages: string;
  pinnedLanguagesDesc: string;
  uiLanguage: string;
  theme: string;
  showAllLangs: string;
  hideExtraLangs: string;
  catTile: string;
  catItem: string;
  catEntity: string;
  catBiome: string;
  catGui: string;
  catMenu: string;
  catEnchantment: string;
  catPotion: string;
  catGameMode: string;
  catDifficulty: string;
  catDeath: string;
  catCommands: string;
  settings: string;
  searching: string;
  buildingIndex: string;
  buildingIndexDesc: string;
};

const translations: Record<UILocale, TranslationStrings> = {
  en: {
    siteTitle: 'MCBE TransLookup',
    siteSubtitle: 'Minecraft Translation Cross-Reference',
    searchPlaceholder: 'Search keys or translations... (Ctrl+K)',
    searchModeAll: 'All',
    searchModeKey: 'Key',
    searchModeValue: 'Value',
    allCategories: 'All',
    noResults: 'No matching translations found',
    noResultsHint: 'No results for "{query}", try different keywords',
    showingResults: '{shown} / {total} results',
    showingCapped: 'Showing {shown} of {total} results',
    refineSearch: 'Refine your search to see more',
    moreLangs: '+{count} more',
    footerLine1: '© 2026 PixelLingual · For Minecraft creators',
    footerLine2: 'Not affiliated with Mojang AB',
    darkMode: 'Dark',
    lightMode: 'Light',
    pinnedLanguages: 'Pinned Languages',
    pinnedLanguagesDesc: 'Select up to 5 languages to pin at the top (collapsed preview & expanded view)',
    uiLanguage: 'Interface Language',
    theme: 'Theme',
    showAllLangs: 'Show all {count} languages',
    hideExtraLangs: 'Collapse',
    catTile: '🧱 Blocks',
    catItem: '⚔️ Items',
    catEntity: '🐾 Entities',
    catBiome: '🌍 Biomes',
    catGui: '🖥️ GUI',
    catMenu: '📋 Menu',
    catEnchantment: '✨ Enchantments',
    catPotion: '🧪 Potions',
    catGameMode: '🎮 Game Modes',
    catDifficulty: '💀 Difficulty',
    catDeath: '☠️ Death Messages',
    catCommands: '⌨️ Commands',
    settings: 'Settings',
    searching: 'Searching...',
    buildingIndex: 'Building search index...',
    buildingIndexDesc: 'This may take a moment for large datasets',
  },
  zh_CN: {
    siteTitle: 'MCBE TransLookup',
    siteSubtitle: 'Minecraft 翻译对照查询',
    searchPlaceholder: '搜索键名或翻译内容... (Ctrl+K)',
    searchModeAll: '全部',
    searchModeKey: '键名',
    searchModeValue: '译文',
    allCategories: '全部',
    noResults: '未找到匹配的翻译',
    noResultsHint: '没有找到与 "{query}" 匹配的结果，请尝试其他关键词',
    showingResults: '{shown} / {total} 条结果',
    showingCapped: '显示 {shown} / {total} 条结果',
    refineSearch: '请细化搜索以查看更多',
    moreLangs: '+{count} 种语言',
    footerLine1: '© 2026 PixelLingual · 为 Minecraft 创作者打造',
    footerLine2: '与 Mojang AB 无关联',
    darkMode: '深色',
    lightMode: '浅色',
    pinnedLanguages: '置顶语言',
    pinnedLanguagesDesc: '选择最多 5 种语言置顶显示（折叠预览及展开视图顶部）',
    uiLanguage: '界面语言',
    theme: '主题',
    showAllLangs: '展开全部 {count} 种语言',
    hideExtraLangs: '收起',
    catTile: '🧱 方块',
    catItem: '⚔️ 物品',
    catEntity: '🐾 实体',
    catBiome: '🌍 生物群系',
    catGui: '🖥️ 界面',
    catMenu: '📋 菜单',
    catEnchantment: '✨ 附魔',
    catPotion: '🧪 药水',
    catGameMode: '🎮 游戏模式',
    catDifficulty: '💀 难度',
    catDeath: '☠️ 死亡消息',
    catCommands: '⌨️ 命令',
    settings: '设置',
    searching: '搜索中...',
    buildingIndex: '正在构建搜索索引...',
    buildingIndexDesc: '数据较多时可能需要几秒钟',
  },
  zh_TW: {
    siteTitle: 'MCBE TransLookup',
    siteSubtitle: 'Minecraft 翻譯對照查詢',
    searchPlaceholder: '搜尋鍵名或翻譯內容... (Ctrl+K)',
    searchModeAll: '全部',
    searchModeKey: '鍵名',
    searchModeValue: '譯文',
    allCategories: '全部',
    noResults: '未找到匹配的翻譯',
    noResultsHint: '沒有找到與 "{query}" 匹配的結果，請嘗試其他關鍵詞',
    showingResults: '{shown} / {total} 條結果',
    showingCapped: '顯示 {shown} / {total} 條結果',
    refineSearch: '請細化搜尋以查看更多',
    moreLangs: '+{count} 種語言',
    footerLine1: '© 2026 PixelLingual · 為 Minecraft 創作者打造',
    footerLine2: '與 Mojang AB 无关联',
    darkMode: '深色',
    lightMode: '淺色',
    pinnedLanguages: '置頂語言',
    pinnedLanguagesDesc: '選擇最多 5 種語言置頂顯示（摺疊預覽及展開視圖頂部）',
    uiLanguage: '介面語言',
    theme: '主題',
    showAllLangs: '展開全部 {count} 種語言',
    hideExtraLangs: '收起',
    catTile: '🧱 方塊',
    catItem: '⚔️ 物品',
    catEntity: '🐾 實體',
    catBiome: '🌍 生態域',
    catGui: '🖥️ 介面',
    catMenu: '📋 選單',
    catEnchantment: '✨ 附魔',
    catPotion: '🧪 藥水',
    catGameMode: '🎮 遊戲模式',
    catDifficulty: '💀 難度',
    catDeath: '☠️ 死亡訊息',
    catCommands: '⌨️ 命令',
    settings: '設定',
    searching: '搜尋中...',
    buildingIndex: '正在構建搜尋索引...',
    buildingIndexDesc: '資料較多時可能需要幾秒鐘',
  },
  ja: {
    siteTitle: 'MCBE TransLookup',
    siteSubtitle: 'Minecraft 翻訳クロスリファレンス',
    searchPlaceholder: 'キー名または翻訳を検索... (Ctrl+K)',
    searchModeAll: 'すべて',
    searchModeKey: 'キー',
    searchModeValue: '翻訳',
    allCategories: 'すべて',
    noResults: '一致する翻訳が見つかりません',
    noResultsHint: '「{query}」に一致する結果がありません。別のキーワードをお試しください',
    showingResults: '{shown} / {total} 件表示中',
    showingCapped: '{shown} / {total} 件を表示中',
    refineSearch: '検索を絞り込んでください',
    moreLangs: '+{count} 言語',
    footerLine1: '© 2026 PixelLingual · Minecraftクリエイター向け',
    footerLine2: 'Not affiliated with Mojang AB',
    darkMode: 'ダーク',
    lightMode: 'ライト',
    pinnedLanguages: 'ピン留め言語',
    pinnedLanguagesDesc: '最大5つの言語をピン留め表示（折りたたみ時・展開時の上部）',
    uiLanguage: '言語',
    theme: 'テーマ',
    showAllLangs: 'すべての {count} 言語を表示',
    hideExtraLangs: '折りたたむ',
    catTile: '🧱 ブロック',
    catItem: '⚔️ アイテム',
    catEntity: '🐾 エンティティ',
    catBiome: '🌍 バイオーム',
    catGui: '🖥️ GUI',
    catMenu: '📋 メニュー',
    catEnchantment: '✨ エンチャント',
    catPotion: '🧪 ポーション',
    catGameMode: '🎮 ゲームモード',
    catDifficulty: '💀 難易度',
    catDeath: '☠️ 死亡メッセージ',
    catCommands: '⌨️ コマンド',
    settings: '設定',
    searching: '検索中...',
    buildingIndex: '検索インデックスを構築中...',
    buildingIndexDesc: '大きなデータセットの場合、少し時間がかかることがあります',
  },
  es: {
    siteTitle: 'MCBE TransLookup',
    siteSubtitle: 'Referencia cruzada de traducciones de Minecraft',
    searchPlaceholder: 'Buscar claves o traducciones... (Ctrl+K)',
    searchModeAll: 'Todo',
    searchModeKey: 'Clave',
    searchModeValue: 'Valor',
    allCategories: 'Todo',
    noResults: 'No se encontraron traducciones',
    noResultsHint: 'No hay resultados para "{query}", intenta con otras palabras',
    showingResults: '{shown} / {total} resultados',
    showingCapped: 'Mostrando {shown} de {total} resultados',
    refineSearch: 'Refina tu búsqueda para ver más',
    moreLangs: '+{count} más',
    footerLine1: '© 2026 PixelLingual · Para creadores de Minecraft',
    footerLine2: 'Not affiliated with Mojang AB',
    darkMode: 'Oscuro',
    lightMode: 'Claro',
    pinnedLanguages: 'Idiomas fijados',
    pinnedLanguagesDesc: 'Selecciona hasta 5 idiomas para fijar arriba (vista compacta y expandida)',
    uiLanguage: 'Idioma de interfaz',
    theme: 'Tema',
    showAllLangs: 'Mostrar los {count} idiomas',
    hideExtraLangs: 'Ocultar',
    catTile: '🧱 Bloques',
    catItem: '⚔️ Objetos',
    catEntity: '🐾 Entidades',
    catBiome: '🌍 Biomas',
    catGui: '🖥️ GUI',
    catMenu: '📋 Menú',
    catEnchantment: '✨ Encantamientos',
    catPotion: '🧪 Pociones',
    catGameMode: '🎮 Modos de juego',
    catDifficulty: '💀 Dificultad',
    catDeath: '☠️ Mensajes de muerte',
    catCommands: '⌨️ Comandos',
    settings: 'Configuración',
    searching: 'Buscando...',
    buildingIndex: 'Construyendo índice de búsqueda...',
    buildingIndexDesc: 'Esto puede tardar un momento para conjuntos de datos grandes',
  },
};

export function t(locale: UILocale, key: keyof TranslationStrings, params?: Record<string, string | number>): string {
  let str = translations[locale]?.[key] || translations.en[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}

export function detectLocale(): UILocale {
  const nav = navigator.language || 'en';
  if (nav.startsWith('zh')) {
    if (nav.includes('TW') || nav.includes('HK') || nav.includes('Hant')) return 'zh_TW';
    return 'zh_CN';
  }
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('es')) return 'es';
  return 'en';
}
