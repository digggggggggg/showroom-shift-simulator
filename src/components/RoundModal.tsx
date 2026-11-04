import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { SimState, Stats } from '../game';

const GBP = '\u00A3';
const BULLET = '\u2022';
const PLAY = '\u25B6';
const REPLAY = '\u21BA';

export type ModalPhase = 'briefing' | 'report' | 'comparison';

/** The modal is up exactly when no shift runs; the stats say which of the three screens it is. */
export function modalPhase(state: SimState): ModalPhase | null {
  if (state.shiftActive) return null;
  if (state.round === 2) return 'comparison';
  return state.round1Stats === null ? 'briefing' : 'report';
}

interface Props {
  readonly state: SimState;
  readonly onAction: () => void;
}

export function RoundModal({ state, onAction }: Props) {
  const phase = modalPhase(state);
  if (phase === null) return null;
  return <ModalDialog key={phase} phase={phase} state={state} onAction={onAction} />;
}

function ModalDialog({ phase, state, onAction }: Props & { readonly phase: ModalPhase }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  // The action button is the only focusable control, so keeping focus on it traps Tab in both directions.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Tab') {
      e.preventDefault();
      buttonRef.current?.focus();
    }
  };

  const { heading, body, action } = content(phase, state);

  return (
    <div className="overlay-modal">
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-header" onKeyDown={onKeyDown}>
        <h2 id="modal-header">{heading}</h2>
        <div className="modal-body">{body}</div>
        <button ref={buttonRef} type="button" className="modal-btn" onClick={onAction}>
          {action}
        </button>
      </div>
    </div>
  );
}

function content(phase: ModalPhase, state: SimState): { heading: string; body: ReactNode; action: string } {
  switch (phase) {
    case 'briefing':
      return {
        heading: 'ROUND 1: IN-STORE BOTTLENECK',
        body: (
          <>
            Experience the 30-second retail bottleneck.
            <br />
            <br />
            {BULLET} All paint mixing is handled <strong>on-site at 1s per tin</strong>.
            <br />
            {BULLET} Leaving the counter unmanned leaves waiting clients stranded.
            <br />
            {BULLET} Impatient clients walk out with lost revenue!
          </>
        ),
        action: `${PLAY} START ROUND 1 (30s)`,
      };
    case 'report':
      return { heading: 'ROUND 1: BOTTLENECK REPORT', body: <BottleneckReport stats={state.stats} />, action: `${PLAY} START ROUND 2 (HUB MODEL)` };
    case 'comparison':
      return {
        heading: 'EXECUTIVE COMPARISON REPORT',
        body: <ComparisonReport round1={state.round1Stats ?? state.stats} round2={state.stats} />,
        action: `${REPLAY} REPLAY SIMULATION`,
      };
  }
}

function BottleneckReport({ stats }: { readonly stats: Stats }) {
  return (
    <>
      <div className="modal-panel">
        <div>
          {BULLET} Revenue Captured: <b className="good">{GBP}{stats.captured}</b>
        </div>
        <div>
          {BULLET} Lost to Walkouts: <b className="bad">{GBP}{stats.lost}</b>
        </div>
        <div>
          {BULLET} Walkouts: <b className="bad">{stats.walkouts} customers</b>
        </div>
        <div>
          {BULLET} Counter Unmanned: <b className="warn">{Math.floor(stats.unmannedSeconds)}s / 30s</b>
        </div>
      </div>
      <strong className="bad">The In-Store Bottleneck:</strong>
      <br />
      Shaking tins locked the associate away from the till. Impatient retail customers walked out!
      <br />
      <br />
      <strong>Ready for Round 2?</strong> In Round 2, orders &gt;5 tins route to the 2-Hour London Hub in 1.5s!
    </>
  );
}

function ComparisonReport({ round1, round2 }: { readonly round1: Stats; readonly round2: Stats }) {
  return (
    <>
      <div className="modal-subhead">
        <b>ROUND 1 (IN-STORE) vs ROUND 2 (HUB)</b>
      </div>
      <div className="modal-panel modal-grid">
        <div>
          R1 Sales: <b className="bad">{GBP}{round1.captured}</b>
        </div>
        <div>
          R2 Sales: <b className="good">{GBP}{round2.captured}</b>
        </div>
        <div>
          R1 Lost: <b className="bad">{GBP}{round1.lost}</b>
        </div>
        <div>
          R2 Lost: <b className="good">{GBP}{round2.lost}</b>
        </div>
        <div>
          R1 Walkouts: <b className="bad">{round1.walkouts}</b>
        </div>
        <div>
          R2 Walkouts: <b className="good">{round2.walkouts}</b>
        </div>
      </div>
      <div className="modal-takeaway">
        <strong className="heading">Key Takeaway:</strong>
        <br />
        Routing &gt;5 tins off-site kept the associate at the counter, capturing high-margin colour consultations and stopping walkouts!
      </div>
    </>
  );
}
