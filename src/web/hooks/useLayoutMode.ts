import { useEffect, useState } from 'react';

export type LayoutMode = 'desktop' | 'mobile';

const PORTRAIT_QUERY = '(orientation: portrait)';

function getInitialMode(): LayoutMode {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia(PORTRAIT_QUERY).matches ? 'mobile' : 'desktop';
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(getInitialMode);

  useEffect(() => {
    const mql = window.matchMedia(PORTRAIT_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'mobile' : 'desktop');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return mode;
}
