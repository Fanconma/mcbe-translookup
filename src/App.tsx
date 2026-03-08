import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import {
  Search, Globe, Key, X, Copy, Check,
  ChevronDown, ChevronUp, BookOpen, Filter, Pickaxe,
  Sun, Moon, Settings2, Loader2,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from './utils/cn';
import { loadAllLangs, LANG_FLAGS, type LangFile } from './data/langLoader';
import { t, detectLocale, UI_LOCALE_NAMES, UI_LOCALE_FLAGS, UI_LOCALE_TO_LANG, type UILocale } from './i18n';
import SearchWorkerClass from './workers/searchWorker?worker&inline';

// ── Types ──
type SearchMode = 'all' | 'key' | 'value';

// ── Constants ──
const MAX_PINNED = 5;
const DEBOUNCE_MS = 300;

const CATEGORY_I18N_KEYS: Record<string, string> = {
  tile: 'catTile', item: 'catItem', entity: 'catEntity', biome: 'catBiome',
  gui: 'catGui', menu: 'catMenu', enchantment: 'catEnchantment', potion: 'catPotion',
  gameMode: 'catGameMode', difficulty: 'catDifficulty', death: 'catDeath', commands: 'catCommands',
};

function getCategory(key: string): string {
  const dot = key.indexOf('.');
  return dot > 0 ? key.substring(0, dot) : 'other';
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.substring(0, idx)}
      <mark>{text.substring(idx, idx + query.length)}</mark>
      {text.substring(idx + query.length)}
    </>
  );
}

// ── Load lang files once (this is fast — just reading bundled strings) ──
const allLangFiles = loadAllLangs();

// ══════════════════════════════════════
// Debounce hook
// ══════════════════════════════════════
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ══════════════════════════════════════
// Web Worker hook
// ══════════════════════════════════════
function useSearchWorker(
  langFiles: LangFile[],
  query: string,
  mode: SearchMode,
  category: string | null,
) {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [resultKeys, setResultKeys] = useState<string[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  // Create worker & send data
  useEffect(() => {
    const worker = new SearchWorkerClass();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === 'ready') {
        setIsReady(true);
        setCategories(payload.categories);
        setTotalKeys(payload.totalKeys);
        // Trigger initial empty search
        requestIdRef.current++;
        worker.postMessage({
          type: 'search',
          payload: { query: '', mode: 'all', category: null, requestId: requestIdRef.current },
        });
      }

      if (type === 'results') {
        if (payload.requestId === requestIdRef.current) {
          setResultKeys(payload.keys);
          setTotalResults(payload.total);
          setIsSearching(false);
        }
      }
    };

    // Send lang data to worker for index building
    const langData: Record<string, Record<string, string>> = {};
    for (const lf of langFiles) {
      langData[lf.code] = lf.entries;
    }
    worker.postMessage({ type: 'init', payload: { langData } });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [langFiles]);

  // Send search queries to worker
  useEffect(() => {
    if (!isReady || !workerRef.current) return;
    requestIdRef.current++;
    setIsSearching(true);
    workerRef.current.postMessage({
      type: 'search',
      payload: { query, mode, category, requestId: requestIdRef.current },
    });
  }, [query, mode, category, isReady]);

  return { isReady, isSearching, resultKeys, totalResults, totalKeys, categories };
}

// ══════════════════════════════════════
// CopyableText Component
// ══════════════════════════════════════
const CopyableText = memo(function CopyableText({
  text,
  children,
  className,
  iconSize = 'sm',
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
  iconSize?: 'sm' | 'xs';
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  const iconClass = iconSize === 'sm' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  return (
    <span
      onClick={handleCopy}
      className={cn(
        'group/copy inline-flex items-center gap-1.5 cursor-pointer rounded-md transition-colors',
        'hover:bg-emerald-500/10 active:bg-emerald-500/20 px-1.5 py-0.5 -mx-1.5 -my-0.5',
        className
      )}
      title={copied ? '✓' : 'Click to copy'}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <span className={cn(
        'shrink-0 transition-all duration-200',
        copied
          ? 'opacity-100 text-emerald-500'
          : 'opacity-0 group-hover/copy:opacity-60 text-current'
      )}>
        {copied ? <Check className={iconClass} /> : <Copy className={iconClass} />}
      </span>
    </span>
  );
});

// ══════════════════════════════════════
// LangRow Component
// ══════════════════════════════════════
const LangRow = memo(function LangRow({
  langFile,
  translationKey,
  searchQuery,
  shouldHighlight,
  isPinned,
}: {
  langFile: LangFile;
  translationKey: string;
  searchQuery: string;
  shouldHighlight: boolean;
  isPinned: boolean;
}) {
  const value = langFile.entries[translationKey] || '';
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-2.5 transition bg-themed-hover',
        isPinned && 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]'
      )}
      style={{ borderColor: 'color-mix(in srgb, var(--mc-border) 50%, transparent)' }}
    >
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <span className="text-base leading-none">{LANG_FLAGS[langFile.code] || '🌐'}</span>
        <div className="min-w-[80px]">
          <span className="text-xs font-semibold text-themed-dim">{langFile.code}</span>
          <p className="text-[10px] text-themed-muted leading-tight">{langFile.name}</p>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <CopyableText text={value} iconSize="xs">
          <span className="text-sm text-themed break-all">
            {shouldHighlight && value ? highlightMatch(value, searchQuery) : value}
          </span>
        </CopyableText>
      </div>
    </div>
  );
});

// ══════════════════════════════════════
// TranslationCard Component
// ══════════════════════════════════════
interface TranslationCardProps {
  translationKey: string;
  langFiles: LangFile[];
  searchQuery: string;
  searchMode: SearchMode;
  isExpanded: boolean;
  onToggle: () => void;
  pinnedLangs: string[];
  uiLocale: UILocale;
}

const TranslationCard = memo(function TranslationCard({
  translationKey,
  langFiles,
  searchQuery,
  searchMode,
  isExpanded,
  onToggle,
  pinnedLangs,
  uiLocale,
}: TranslationCardProps) {
  const [showAllExpanded, setShowAllExpanded] = useState(false);
  const category = getCategory(translationKey);

  const relevantLangs = useMemo(
    () => langFiles.filter(lf => lf.entries[translationKey]),
    [langFiles, translationKey]
  );

  const { pinned, unpinned } = useMemo(() => {
    const pin = pinnedLangs
      .map(code => relevantLangs.find(lf => lf.code === code))
      .filter(Boolean) as LangFile[];
    const unpin = relevantLangs.filter(lf => !pinnedLangs.includes(lf.code));
    return { pinned: pin, unpinned: unpin };
  }, [relevantLangs, pinnedLangs]);

  const shouldHighlightKey = searchQuery && (searchMode === 'all' || searchMode === 'key');
  const shouldHighlightValue = searchQuery && (searchMode === 'all' || searchMode === 'value');

  const tt = useCallback(
    (key: Parameters<typeof t>[1], params?: Parameters<typeof t>[2]) => t(uiLocale, key, params),
    [uiLocale]
  );

  return (
    <div
      className="rounded-xl ring-1 ring-themed transition-all border-themed-hover"
      style={{ backgroundColor: 'var(--mc-card)' }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none" onClick={onToggle}>
        <span className="shrink-0 rounded-md bg-themed-badge px-2 py-0.5 text-xs text-themed-muted ring-1 ring-themed">
          {category}
        </span>
        <div className="min-w-0 flex-1">
          <CopyableText text={translationKey} iconSize="sm">
            <span className="block truncate font-mc-key text-sm key-text font-semibold">
              {shouldHighlightKey ? highlightMatch(translationKey, searchQuery) : translationKey}
            </span>
          </CopyableText>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-md bg-themed-badge px-2 py-1 text-xs text-themed-muted">
            <Globe className="h-3 w-3" />
            {relevantLangs.length}
          </div>
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-themed-muted" />
            : <ChevronDown className="h-4 w-4 text-themed-muted" />}
        </div>
      </div>

      {/* Collapsed Preview */}
      {!isExpanded && pinned.length > 0 && (
        <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--mc-border)' }}>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1.5">
            {pinned.map(lf => (
              <div key={lf.code} className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-xs shrink-0">{LANG_FLAGS[lf.code] || '🌐'}</span>
                <span className="text-themed-muted text-xs font-medium min-w-[42px] shrink-0">{lf.code}</span>
                <CopyableText text={lf.entries[translationKey] || ''} iconSize="xs" className="min-w-0">
                  <span className="text-themed-dim truncate">
                    {shouldHighlightValue && lf.entries[translationKey]
                      ? highlightMatch(lf.entries[translationKey], searchQuery)
                      : lf.entries[translationKey]}
                  </span>
                </CopyableText>
              </div>
            ))}
            {unpinned.length > 0 && (
              <span className="text-xs text-themed-muted">
                {tt('moreLangs', { count: unpinned.length })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t overflow-hidden" style={{ borderColor: 'var(--mc-border)' }}>
          <div className="divide-y" style={{ borderColor: 'var(--mc-border)' }}>
            {pinned.map(lf => (
              <LangRow
                key={lf.code}
                langFile={lf}
                translationKey={translationKey}
                searchQuery={searchQuery}
                shouldHighlight={!!shouldHighlightValue}
                isPinned
              />
            ))}
          </div>
          {unpinned.length > 0 && (
            <>
              {!showAllExpanded ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAllExpanded(true); }}
                  className="flex w-full items-center justify-center gap-2 border-t py-2.5 text-xs font-medium text-themed-muted transition hover:text-themed-dim cursor-pointer"
                  style={{ borderColor: 'var(--mc-border)', backgroundColor: 'var(--mc-hover-bg)' }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  {tt('showAllLangs', { count: unpinned.length + pinned.length })}
                </button>
              ) : (
                <>
                  <div className="border-t divide-y" style={{ borderColor: 'var(--mc-border)' }}>
                    {unpinned.map(lf => (
                      <LangRow
                        key={lf.code}
                        langFile={lf}
                        translationKey={translationKey}
                        searchQuery={searchQuery}
                        shouldHighlight={!!shouldHighlightValue}
                        isPinned={false}
                      />
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAllExpanded(false); }}
                    className="flex w-full items-center justify-center gap-2 border-t py-2 text-xs font-medium text-themed-muted transition hover:text-themed-dim cursor-pointer"
                    style={{ borderColor: 'var(--mc-border)', backgroundColor: 'var(--mc-hover-bg)' }}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                    {tt('hideExtraLangs')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════
// App Component
// ══════════════════════════════════════
export default function App() {
  // ── Theme ──
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // ── UI locale ──
  const [uiLocale, setUiLocale] = useState<UILocale>(() => {
    const saved = localStorage.getItem('mc-locale') as UILocale | null;
    return saved && UI_LOCALE_NAMES[saved] ? saved : detectLocale();
  });

  // ── Pinned languages ──
  const [pinnedLangs, setPinnedLangs] = useState<string[]>(() => {
    const saved = localStorage.getItem('mc-pinned-langs');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    const currentLang = UI_LOCALE_TO_LANG[detectLocale()];
    return currentLang === 'en_US' ? ['en_US'] : ['en_US', currentLang];
  });

  // ── Search state ──
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, DEBOUNCE_MS);
  const [searchMode, setSearchMode] = useState<SearchMode>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Worker-based search ──
  const {
    isReady,
    isSearching: workerSearching,
    resultKeys,
    totalResults,
    totalKeys,
    categories: allCategories,
  } = useSearchWorker(allLangFiles, debouncedQuery, searchMode, categoryFilter);

  const langFiles = allLangFiles;
  const isCapped = resultKeys.length < totalResults;

  // Combined searching state: debouncing OR worker processing
  const isSearching = searchInput !== debouncedQuery || workerSearching;

  // ── Effects ──
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('mc-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => { localStorage.setItem('mc-locale', uiLocale); }, [uiLocale]);
  useEffect(() => { localStorage.setItem('mc-pinned-langs', JSON.stringify(pinnedLangs)); }, [pinnedLangs]);

  useEffect(() => {
    const newLang = UI_LOCALE_TO_LANG[uiLocale];
    if (newLang && !pinnedLangs.includes(newLang)) {
      setPinnedLangs(prev => {
        const next = [...prev];
        if (!next.includes('en_US')) next.unshift('en_US');
        if (!next.includes(newLang)) {
          if (next.length >= MAX_PINNED) next.pop();
          next.splice(1, 0, newLang);
        }
        return next;
      });
    }
  }, [uiLocale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll to top when search changes
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
    setExpandedCards(new Set());
  }, [debouncedQuery, searchMode, categoryFilter]);

  // ── Virtualizer ──
  const virtualizer = useVirtualizer({
    count: resultKeys.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 100,
    overscan: 6,
  });

  // ── Callbacks ──
  const toggleCard = useCallback((key: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const togglePinnedLang = useCallback((code: string) => {
    setPinnedLangs(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code);
      if (prev.length >= MAX_PINNED) return prev;
      return [...prev, code];
    });
  }, []);

  // ── i18n helper ──
  const tt = useCallback(
    (key: Parameters<typeof t>[1], params?: Parameters<typeof t>[2]) => t(uiLocale, key, params),
    [uiLocale]
  );

  const getCategoryLabel = useCallback((cat: string) => {
    const i18nKey = CATEGORY_I18N_KEYS[cat];
    if (i18nKey) return tt(i18nKey as Parameters<typeof t>[1]);
    return cat;
  }, [tt]);

  const allLocales = useMemo(() => Object.keys(UI_LOCALE_NAMES) as UILocale[], []);

  // ══════════════════════════════════════
  // Render
  // ══════════════════════════════════════

  // Loading screen while worker builds index
  if (!isReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-themed text-themed transition-colors">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Pickaxe className="h-8 w-8 text-emerald-500" />
            </div>
            <Loader2 className="absolute -top-2 -right-2 h-6 w-6 text-emerald-500 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-themed-dim">{tt('buildingIndex')}</h2>
            <p className="mt-1 text-sm text-themed-muted">{tt('buildingIndexDesc')}</p>
          </div>
          <div className="w-48 h-1 rounded-full bg-themed-badge overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-themed text-themed transition-colors duration-300">
      {/* ═══ Header ═══ */}
      <header className="relative border-b border-themed bg-themed-header shrink-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMjgsMTI4LDEyOCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Pickaxe className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  <span className="bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">
                    {tt('siteTitle')}
                  </span>
                </h1>
                <p className="text-xs text-themed-muted">{tt('siteSubtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="flex items-center justify-center rounded-lg p-2 text-themed-muted ring-1 ring-themed bg-themed-badge transition hover:text-themed cursor-pointer"
                title={isDark ? tt('lightMode') : tt('darkMode')}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(v => !v); }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition cursor-pointer ring-1',
                    showSettings ? 'pill-active' : 'bg-themed-badge ring-themed text-themed-muted hover:text-themed'
                  )}
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{tt('settings')}</span>
                </button>
                {showSettings && (
                  <div
                    className="absolute right-0 top-full z-[100] mt-2 w-80 rounded-xl border border-themed shadow-2xl p-4 space-y-5"
                    style={{ backgroundColor: 'var(--mc-card)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* UI Language */}
                    <div>
                      <h4 className="text-xs font-semibold text-themed-muted uppercase tracking-wider mb-2">
                        {tt('uiLanguage')}
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        {allLocales.map(loc => (
                          <button
                            key={loc}
                            onClick={() => setUiLocale(loc)}
                            className={cn(
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ring-1 text-left',
                              uiLocale === loc ? 'pill-active' : 'bg-themed-badge ring-themed text-themed-dim hover:text-themed'
                            )}
                          >
                            <span className="text-base">{UI_LOCALE_FLAGS[loc]}</span>
                            <span>{UI_LOCALE_NAMES[loc]}</span>
                            {uiLocale === loc && <Check className="ml-auto h-3.5 w-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Pinned Languages */}
                    <div>
                      <h4 className="text-xs font-semibold text-themed-muted uppercase tracking-wider mb-1">
                        {tt('pinnedLanguages')}
                      </h4>
                      <p className="text-[11px] text-themed-muted mb-2.5">
                        {tt('pinnedLanguagesDesc')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {langFiles.map(lf => {
                          const isPinned = pinnedLangs.includes(lf.code);
                          const atMax = pinnedLangs.length >= MAX_PINNED && !isPinned;
                          return (
                            <button
                              key={lf.code}
                              onClick={() => togglePinnedLang(lf.code)}
                              disabled={atMax}
                              className={cn(
                                'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition cursor-pointer ring-1',
                                isPinned ? 'pill-active'
                                  : atMax ? 'bg-themed-badge ring-themed text-themed-muted opacity-40 cursor-not-allowed'
                                    : 'bg-themed-badge ring-themed text-themed-muted hover:text-themed-dim'
                              )}
                            >
                              <span className="text-sm">{LANG_FLAGS[lf.code] || '🌐'}</span>
                              {lf.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Theme */}
                    <div>
                      <h4 className="text-xs font-semibold text-themed-muted uppercase tracking-wider mb-2">
                        {tt('theme')}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsDark(false)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ring-1 flex-1 justify-center',
                            !isDark ? 'pill-active' : 'bg-themed-badge ring-themed text-themed-dim'
                          )}
                        >
                          <Sun className="h-3.5 w-3.5" /> {tt('lightMode')}
                        </button>
                        <button
                          onClick={() => setIsDark(true)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ring-1 flex-1 justify-center',
                            isDark ? 'pill-active' : 'bg-themed-badge ring-themed text-themed-dim'
                          )}
                        >
                          <Moon className="h-3.5 w-3.5" /> {tt('darkMode')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Search + Filters ═══ */}
      <div className="sticky top-0 z-40 border-b border-themed bg-themed/80 glass-effect transition-colors shrink-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors',
                isSearching ? 'text-emerald-500 animate-pulse' : 'text-themed-muted'
              )} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={tt('searchPlaceholder')}
                className="w-full rounded-xl bg-themed-input py-3 pl-10 pr-24 text-sm text-themed placeholder:text-themed-muted ring-1 ring-themed transition focus:bg-themed-input-focus focus:outline-none focus:ring-emerald-500/50"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-16 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-themed-badge cursor-pointer"
                >
                  <X className="h-4 w-4 text-themed-muted" />
                </button>
              )}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <kbd className="rounded-md bg-themed-badge px-2 py-1 text-xs text-themed-muted ring-1 ring-themed">
                  Ctrl+K
                </kbd>
              </div>
            </div>
            {/* Search Mode */}
            <div className="flex rounded-xl bg-themed-input p-1 ring-1 ring-themed">
              {([
                { mode: 'all' as SearchMode, label: tt('searchModeAll'), icon: Globe },
                { mode: 'key' as SearchMode, label: tt('searchModeKey'), icon: Key },
                { mode: 'value' as SearchMode, label: tt('searchModeValue'), icon: BookOpen },
              ]).map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer',
                    searchMode === mode ? 'pill-active' : 'text-themed-muted hover:text-themed-dim'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Category Filter */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <Filter className="h-4 w-4 shrink-0 text-themed-muted" />
            <button
              onClick={() => setCategoryFilter(null)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer ring-1',
                categoryFilter === null ? 'pill-active' : 'bg-themed-badge ring-themed text-themed-muted hover:text-themed-dim'
              )}
            >
              {tt('allCategories')}
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap ring-1',
                  categoryFilter === cat ? 'pill-active' : 'bg-themed-badge ring-themed text-themed-muted hover:text-themed-dim'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Virtualized Results ═══ */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {resultKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            {isSearching ? (
              <>
                <Loader2 className="mb-4 h-12 w-12 text-emerald-500 animate-spin opacity-50" />
                <h3 className="text-lg font-semibold text-themed-dim">{tt('searching')}</h3>
              </>
            ) : (
              <>
                <Search className="mb-4 h-16 w-16 text-themed-muted opacity-30" />
                <h3 className="text-xl font-semibold text-themed-dim">{tt('noResults')}</h3>
                {debouncedQuery && (
                  <p className="mt-2 text-sm text-themed-muted">
                    {tt('noResultsHint', { query: debouncedQuery })}
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Result count bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-themed-muted">
              <span>
                {isCapped
                  ? tt('showingCapped', { shown: resultKeys.length, total: totalResults })
                  : tt('showingResults', { shown: resultKeys.length, total: totalKeys })}
              </span>
              {isCapped && (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                  {tt('refineSearch')}
                </span>
              )}
              {isSearching && (
                <span className="inline-flex items-center gap-1.5 text-emerald-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {tt('searching')}
                </span>
              )}
            </div>

            {/* Virtual list container */}
            <div
              style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map(virtualItem => {
                const key = resultKeys[virtualItem.index];
                return (
                  <div
                    key={key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="pb-3">
                      <TranslationCard
                        translationKey={key}
                        langFiles={langFiles}
                        searchQuery={debouncedQuery}
                        searchMode={searchMode}
                        isExpanded={expandedCards.has(key)}
                        onToggle={() => toggleCard(key)}
                        pinnedLangs={pinnedLangs}
                        uiLocale={uiLocale}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-themed py-6 transition-colors" style={{ backgroundColor: 'var(--mc-surface)' }}>
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-themed-muted sm:px-6 lg:px-8">
            <p>{tt('footerLine1')}</p>
            <p className="mt-1">{tt('footerLine2')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
