interface Props {
  readonly muted: boolean;
  readonly onToggleMute: () => void;
}

export function BrandBar({ muted, onToggleMute }: Props) {
  return (
    <div className="brand-bar">
      <span>LONDON PAINT SHOWROOM</span>
      <div className="status-group">
        <div>
          <span className={muted ? 'pwr-led pwr-led-muted' : 'pwr-led'} aria-hidden="true" data-testid="pwr-led" />
          PWR
        </div>
        <button type="button" className="mute-toggle-btn" aria-pressed={muted} onClick={onToggleMute}>
          {muted ? '\u{1F507} SFX: OFF' : '\u{1F50A} SFX: ON'}
        </button>
      </div>
    </div>
  );
}
