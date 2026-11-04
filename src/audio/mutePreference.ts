export const MUTE_STORAGE_KEY = 'showroom-sfx-muted';

/** Storage can be missing or throw (private mode, blocked cookies); sound then defaults to on. */
export function readMuted(storage: Pick<Storage, 'getItem'> | undefined = safeLocalStorage()): boolean {
  try {
    return storage?.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeMuted(muted: boolean, storage: Pick<Storage, 'setItem'> | undefined = safeLocalStorage()): void {
  try {
    storage?.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // preference is best-effort
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
