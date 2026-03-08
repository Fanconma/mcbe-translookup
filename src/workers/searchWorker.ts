/**
 * Search Web Worker — offloads ALL heavy computation off the main thread.
 *
 * Responsibilities:
 *   1. Build a pre-indexed search structure from raw lang data
 *   2. Filter/search with early-exit optimisation
 *   3. Return capped results (max 200 keys) to avoid flooding the UI
 */

// ── Types ──
interface IndexEntry {
  key: string;
  keyLower: string;
  category: string;
  /** langCode → lowercase value */
  vals: Record<string, string>;
}

// ── State ──
let index: IndexEntry[] = [];

const CATEGORY_ORDER = [
  'tile', 'item', 'entity', 'biome',
  'gui', 'menu', 'enchantment', 'potion',
  'gameMode', 'difficulty', 'death', 'commands',
];

const MAX_RESULTS = 200;

function getCategory(key: string): string {
  const dot = key.indexOf('.');
  return dot > 0 ? key.substring(0, dot) : 'other';
}

// ── Message handler ──
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    // ────────────────────────────────────
    // INIT: receive raw lang data, build index
    // ────────────────────────────────────
    case 'init': {
      const langData: Record<string, Record<string, string>> = payload.langData;
      const langCodes = Object.keys(langData);

      // Collect all unique keys
      const keySet = new Set<string>();
      for (const code of langCodes) {
        const entries = langData[code];
        for (const k in entries) keySet.add(k);
      }

      const sortedKeys = Array.from(keySet).sort();

      // Build index with pre-lowercased strings
      index = new Array(sortedKeys.length);
      for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i];
        const vals: Record<string, string> = {};
        for (const code of langCodes) {
          const v = langData[code][key];
          if (v) vals[code] = v.toLowerCase();
        }
        index[i] = {
          key,
          keyLower: key.toLowerCase(),
          category: getCategory(key),
          vals,
        };
      }

      // Build ordered categories
      const catSet = new Set<string>();
      for (const e of index) catSet.add(e.category);
      const ordered = CATEGORY_ORDER.filter(c => catSet.has(c));
      const remaining = Array.from(catSet)
        .filter(c => !CATEGORY_ORDER.includes(c))
        .sort();

      self.postMessage({
        type: 'ready',
        payload: {
          categories: [...ordered, ...remaining],
          totalKeys: index.length,
        },
      });
      break;
    }

    // ────────────────────────────────────
    // SEARCH: filter index, return capped keys
    // ────────────────────────────────────
    case 'search': {
      const { query, mode, category, requestId } = payload;

      // Step 1: category pre-filter (fast, simple comparison)
      let source = index;
      if (category) {
        source = [];
        for (let i = 0; i < index.length; i++) {
          if (index[i].category === category) source.push(index[i]);
        }
      }

      // Step 2: text search
      let total: number;
      const keys: string[] = [];

      if (!query) {
        total = source.length;
        const limit = Math.min(total, MAX_RESULTS);
        for (let i = 0; i < limit; i++) keys.push(source[i].key);
      } else {
        const q = (query as string).toLowerCase();
        total = 0;

        for (let i = 0; i < source.length; i++) {
          const entry = source[i];
          let matched = false;

          // Check key (unless value-only mode)
          if (mode !== 'value') {
            if (entry.keyLower.indexOf(q) !== -1) matched = true;
          }

          // Check values (unless key-only mode)
          if (!matched && mode !== 'key') {
            const vals = entry.vals;
            for (const code in vals) {
              if (vals[code].indexOf(q) !== -1) {
                matched = true;
                break; // found in one language, no need to check more
              }
            }
          }

          if (matched) {
            total++;
            if (keys.length < MAX_RESULTS) keys.push(entry.key);
            // Continue counting for total, but don't push more keys
          }
        }
      }

      self.postMessage({
        type: 'results',
        payload: { keys, total, requestId },
      });
      break;
    }
  }
};
