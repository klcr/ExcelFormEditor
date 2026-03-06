import type { ExcelParseResult } from '@web/services/parseExcelFile';
import { parseExcelFile } from '@web/services/parseExcelFile';
import { useCallback, useEffect, useState } from 'react';

type ParseState =
  | { readonly status: 'idle' }
  | { readonly status: 'parsing' }
  | { readonly status: 'success'; readonly result: ExcelParseResult }
  | { readonly status: 'error'; readonly error: string };

type UseExcelParseReturn = {
  readonly parseState: ParseState;
  readonly reset: () => void;
};

export function useExcelParse(file: File | null): UseExcelParseReturn {
  const [parseState, setParseState] = useState<ParseState>({ status: 'idle' });

  useEffect(() => {
    if (!file) {
      setParseState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setParseState({ status: 'parsing' });

    parseExcelFile(file)
      .then((result) => {
        if (!cancelled) {
          setParseState({ status: 'success', result });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setParseState({
            status: 'error',
            error: err instanceof Error ? err.message : '不明なエラー',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  const reset = useCallback(() => {
    setParseState({ status: 'idle' });
  }, []);

  return { parseState, reset };
}
