import { forwardRef, useEffect, useState } from 'react';
import { cx, getBadgeClass, getButtonClass, ui } from '../designSystem.js';
import { getCharacterIcon } from '../art/characters/index.js';

export function Button({ variant = 'default', size = 'sm', selected = false, className = '', children, ...props }) {
  return (
    <button className={getButtonClass({ variant, size, selected, className })} {...props}>
      {children}
    </button>
  );
}

export function Badge({ variant = 'neutral', className = '', children }) {
  return <span className={getBadgeClass({ variant, className })}>{children}</span>;
}

export const Panel = forwardRef(function Panel({ variant = 'card', className = '', children, ...props }, ref) {
  const variantClass = ui.surface[variant] ?? ui.surface.card;
  return (
    <div ref={ref} className={cx(variantClass, className)} {...props}>
      {children}
    </div>
  );
});

export function SectionHeading({ className = '', children }) {
  return <div className={cx(ui.text.sectionHeading, className)}>{children}</div>;
}

export function Field({ label, className = '', children }) {
  return (
    <label className={cx(ui.form.field, className)}>
      {label}
      {children}
    </label>
  );
}

export function TextInput({ strong = false, className = '', ...props }) {
  return <input className={cx(strong ? ui.form.strongControl : ui.form.control, className)} {...props} />;
}

export function TextareaInput({ mono = false, className = '', ...props }) {
  return <textarea className={cx(mono ? ui.form.monoControl : ui.form.control, className)} {...props} />;
}

export function SelectInput({ className = '', children, ...props }) {
  return (
    <select className={cx(ui.form.strongControl, className)} {...props}>
      {children}
    </select>
  );
}

// Character art stays owned by its producer; UI never duplicates an asset URL.
export function CharacterIcon({ artId, label, className = '' }) {
  const icon = getCharacterIcon(artId);
  const [failedSrc, setFailedSrc] = useState(null);
  if (!icon || failedSrc === icon.src) {
    return <span data-art-missing={artId || 'unspecified'} className={cx('flex items-center justify-center text-center text-xs font-semibold', className)}>{label}</span>;
  }
  return <img src={icon.src} alt={icon.alt || label} width={icon.width} height={icon.height} draggable={false} onError={() => setFailedSrc(icon.src)} data-art-id={artId} className={cx('object-contain', className)} />;
}

export function StickerSymbol({ kind, className = '' }) {
  const paths = {
    heart: <path d="M32 55C-6 31 10 3 26 13L32 19 38 13C54 3 70 31 32 55Z" fill="#F4ADA0" />,
    gem: <><path d="M32 5 58 32 32 59 6 32Z" fill="#A8D8BC" /><path d="m32 5-9 27 9 27M6 32h52" opacity=".2" fill="none" /></>,
    blueprint: <><rect x="12" y="8" width="40" height="49" rx="5" fill="#C7E4F4" /><path d="M22 19h20M22 46h20M32 40V26m-8 8 8-8 8 8" fill="none" /></>,
    clock: <><circle cx="32" cy="32" r="24" fill="#FFF9EF" /><path d="M32 17v16l12 7" fill="none" /></>,
    pause: <><path d="M23 16v32M41 16v32" strokeWidth="7" /></>,
    sound: <><path d="M9 25h11l14-12v38L20 39H9Z" fill="#F8DDAA" /><path d="M42 22q14 10 0 20M47 14q24 18 0 36" fill="none" /></>,
    muted: <><path d="M9 25h11l14-12v38L20 39H9Z" fill="#F8DDAA" /><path d="m42 25 14 14m0-14L42 39" fill="none" /></>,
    close: <path d="m18 18 28 28m0-28L18 46" fill="none" />,
  };
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={cx('shrink-0', className)} stroke="#4B281C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">{paths[kind] ?? paths.blueprint}</svg>;
}

export function useModalFocus(ref, visible) {
  useEffect(() => {
    if (!visible || !ref.current) return;
    const previous = document.activeElement;
    const dialog = ref.current;
    const controls = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]')];
    controls()[0]?.focus({ preventScroll: true });
    const keepFocus = event => {
      if (event.key !== 'Tab') return;
      const items = controls();
      if (!items.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    dialog.addEventListener('keydown', keepFocus);
    return () => {
      dialog.removeEventListener('keydown', keepFocus);
      if (previous?.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [ref, visible]);
}
