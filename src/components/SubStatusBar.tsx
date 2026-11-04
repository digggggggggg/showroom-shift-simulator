import { shiftSecondsLeft, type SimState } from '../game';

const ROUND_TAGS = { 1: 'ROUND 1: IN-STORE MIXING', 2: 'ROUND 2: 2-HR LONDON HUB' } as const;

export function SubStatusBar({ state }: { readonly state: SimState }) {
  return (
    <div className="sub-status-bar">
      <span>{ROUND_TAGS[state.round]}</span>
      <span>SHIFT: {shiftSecondsLeft(state)}s</span>
    </div>
  );
}
