import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSoftSfx, type AudioContextFactory } from '../audio/sfx';
import { readMuted, writeMuted } from '../audio/mutePreference';
import type { GameStore } from '../game';

export interface SoundControls {
  readonly muted: boolean;
  readonly toggleMute: () => void;
}

export function useSound(store: GameStore, factory?: AudioContextFactory): SoundControls {
  const [muted, setMuted] = useState(() => readMuted());
  const sfx = useMemo(() => createSoftSfx(factory, muted), [factory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unlock = (): void => sfx.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    const off = store.subscribeEvents((events) => {
      for (const e of events) {
        if (e.type === 'chime') sfx.chime();
        else if (e.type === 'whoosh') sfx.whoosh();
        else if (e.type === 'coins') sfx.coins();
        else if (e.type === 'humStart') sfx.humStart();
        else if (e.type === 'humStop' || e.type === 'roundEnded') sfx.humStop();
      }
    });
    return () => {
      off();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      sfx.dispose();
    };
  }, [store, sfx]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    sfx.setMuted(next);
    writeMuted(next);
  }, [muted, sfx]);

  return { muted, toggleMute };
}
