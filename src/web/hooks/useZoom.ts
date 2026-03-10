import { useCallback, useState } from 'react';

type UseZoomOptions = {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
};

const DEFAULT_MIN = 0.25;
const DEFAULT_MAX = 4.0;
const DEFAULT_STEP = 0.1;

export function useZoom(options?: UseZoomOptions) {
  const min = options?.min ?? DEFAULT_MIN;
  const max = options?.max ?? DEFAULT_MAX;
  const step = options?.step ?? DEFAULT_STEP;

  const [scale, setScale] = useState(1.0);

  const handleWheel = useCallback(
    (e: WheelEvent | React.WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -step : step;
      setScale((prev) => Math.min(max, Math.max(min, Math.round((prev + delta) * 100) / 100)));
    },
    [min, max, step],
  );

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  return { scale, handleWheel, resetZoom } as const;
}
