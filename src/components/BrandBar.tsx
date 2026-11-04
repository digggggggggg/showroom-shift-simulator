export function BrandBar() {
  return (
    <div className="brand-bar">
      <span>LONDON PAINT SHOWROOM</span>
      <div className="status-group">
        <div>
          <span className="pwr-led" aria-hidden="true" />
          PWR
        </div>
        <button type="button" className="mute-toggle-btn" disabled>
          {'\u{1F50A}'} SFX: ON
        </button>
      </div>
    </div>
  );
}
