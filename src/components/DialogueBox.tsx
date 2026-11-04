export function DialogueBox({ text }: { readonly text: string }) {
  return (
    <div className="dialogue-box">
      <div aria-live="polite">{text}</div>
      <div className="cursor-arrow" aria-hidden="true" />
    </div>
  );
}
