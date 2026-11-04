import type { ActionButtons as Derived } from '../game';

interface Props {
  readonly buttons: Derived;
  readonly onAdvice: () => void;
  readonly onMix: () => void;
}

export function ActionButtons({ buttons, onAdvice, onMix }: Props) {
  const { advice, mix } = buttons;
  return (
    <div className="action-grid">
      <button type="button" className="act-btn btn-advice" disabled={!advice.enabled} onClick={onAdvice}>
        <span>{advice.title}</span>
        <span className="act-sub">{advice.subtitle}</span>
      </button>
      <button
        type="button"
        className={`act-btn ${mix.variant === 'hub' ? 'btn-hub' : 'btn-mix'}`}
        disabled={!mix.enabled}
        onClick={onMix}
      >
        <span>{mix.title}</span>
        <span className="act-sub">{mix.subtitle}</span>
      </button>
    </div>
  );
}
