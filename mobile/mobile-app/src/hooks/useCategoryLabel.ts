import { useEffect, useState } from 'react';
import i18n from '../i18n';
import api from '../services/api';

// In-flight request tracker to avoid duplicate translate calls
const inflight: Record<string, Promise<string>> = {};

// Single label hook (kept for any future single-use scenarios)
export function useCategoryLabel(raw?: string) {
  const labels = useCategoryLabels(raw ? [raw] : []);
  return raw ? (labels[raw] || raw) : '';
}

// Batch hook: translate a list of raw category names without violating the Rules of Hooks
export function useCategoryLabels(raws: (string | undefined)[]) {
  const lang = i18n.language;
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!raws || raws.length === 0) return;
    raws.forEach(raw => {
      if (!raw) return;
      // Already translated & cached in state
      if (map[raw]) return;
      const key = raw.trim().toLowerCase();
      // English baseline just echoes
      if (lang.startsWith('en')) {
        setMap(prev => (prev[raw] ? prev : { ...prev, [raw]: raw }));
        return;
      }
      const existing = i18n.getResource(lang, 'translation', `categoriesMap.${key}`) as string | undefined;
      if (existing) {
        setMap(prev => (prev[raw] === existing ? prev : { ...prev, [raw]: existing }));
        return;
      }
      // Kick off remote translation if not already in-flight
      const flightKey = `${lang}|${key}`;
      if (!inflight[flightKey]) {
        inflight[flightKey] = api.post('/api/translate', { text: raw, to: lang, from: 'en' })
          .then(r => {
            const translated = r?.data?.text || raw;
            try { i18n.addResource(lang, 'translation', `categoriesMap.${key}`, translated); } catch {}
            return translated;
          })
          .catch(() => raw);
      }
      inflight[flightKey].then(t => {
        setMap(prev => (prev[raw] === t ? prev : { ...prev, [raw]: t }));
      });
    });
    // We intentionally do not include map in deps to avoid re-trigger loops; we update map incrementally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, JSON.stringify(raws)]);

  return map;
}
