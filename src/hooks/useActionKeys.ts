import { useEffect } from 'react';

interface Handlers {
  readonly active: boolean;
  readonly onAdvice: () => void;
  readonly onMix: () => void;
}

/** 1 serves advice; 2 or Space processes the mix. Only while a shift runs. */
export function useActionKeys({ active, onAdvice, onMix }: Handlers): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '1') {
        e.preventDefault();
        onAdvice();
      } else if (e.key === '2' || e.code === 'Space' || e.key === ' ') {
        // Space on a focused button would also click it; preventDefault stops the double dispatch and the page scroll.
        e.preventDefault();
        onMix();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, onAdvice, onMix]);
}
