import { forwardRef, useEffect, useState } from 'react';
import { cx, getBadgeClass, getButtonClass, playerUi, ui } from '../designSystem.js';
import { getCharacterIcon } from '../art/characters/index.js';
import {ensureUiSource,reportUiSourceFailure,getUiSourceFailures,subscribeUiSourceFailures} from '../art/integration/uiSourceAssets.js';

const originalSymbols = new Set(['leafLogo', 'shattered', 'wave', 'check', 'warning', 'arrowUp', 'arrowLeft', 'arrowDown', 'arrowRight', 'upgradeBlueprint', 'heart', 'gem', 'blueprint', 'close']);
const originalButtons = { stickerSage: ['button-sage', 29], stickerCoral: ['button-coral', 29], stickerBlue: ['button-blue', 26], stickerHoney: ['button-honey', 26], stickerQuiet: ['card', 16] };
export function originalSkin(id, slice, width = 16) {
  const source=`${import.meta.env.BASE_URL}art/original/v1/${id}.png`;if(typeof Image!=='undefined')void ensureUiSource(source);
  return { background: 'transparent', boxShadow: 'none', borderColor: 'transparent', borderImageSource: `url(${import.meta.env.BASE_URL}art/original/v1/${id}.png)`, borderImageSlice: `${slice} fill`, borderImageWidth: width, borderImageRepeat: 'stretch' };
}

export function OriginalArt({ id, className = '', style, ...props }) {
  return <img src={`${import.meta.env.BASE_URL}art/original/v1/${id}.png`} alt="" aria-hidden="true" draggable={false} data-original-art={id} className={className} style={style} {...props} onError={event=>{reportUiSourceFailure(event.currentTarget.currentSrc||event.currentTarget.src);props.onError?.(event)}} />;
}

export function OriginalKeycap({ children, className = '' }) {
  return <kbd className={cx('inline-flex items-center justify-center px-1.5 py-0.5 font-bold', className)} style={{ borderStyle: 'solid', borderWidth: 1, ...originalSkin('keycap', 9, 6) }} data-original-art="keycap">{children}</kbd>;
}

export function Button({ variant = 'default', size = 'sm', selected = false, className = '', style, children, ...props }) {
  const skin = originalButtons[variant];
  return (
    <button data-original-art={skin?.[0]} className={getButtonClass({ variant, size, selected, className })} style={{ ...style, ...playerUi.buttonType[size], ...(skin ? originalSkin(...skin) : {}) }} {...props}>
      {children}
    </button>
  );
}

export function Badge({ variant = 'neutral', className = '', children }) {
  return <span className={getBadgeClass({ variant, className })}>{children}</span>;
}

export const Panel = forwardRef(function Panel({ variant = 'card', className = '', style, children, ...props }, ref) {
  const variantClass = ui.surface[variant] ?? ui.surface.card;
  const skin = variant.startsWith('sticker') ? (variant === 'stickerCard' ? 'card' : 'panel') : null;
  return (
    <div ref={ref} data-original-art={skin || undefined} className={cx(variantClass, className)} style={{ ...style, ...(skin ? originalSkin(skin, 16) : {}) }} {...props}>
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
    if(!icon)queueMicrotask(()=>reportUiSourceFailure('character-icon:'+artId,'Missing original icon binding'));
    return <span data-art-missing={artId || 'unspecified'} className={cx('flex items-center justify-center text-center text-xs font-semibold', className)}>{label}</span>;
  }
  return <img src={icon.src} alt={icon.alt || label} width={icon.width} height={icon.height} draggable={false} onError={() => {setFailedSrc(icon.src);reportUiSourceFailure(icon.src)}} data-art-id={artId} className={cx('object-contain', className)} />;
}

export function StickerSymbol({ kind, className = '' }) {
  if(originalSymbols.has(kind))return <OriginalArt id={kind} className={cx('shrink-0 object-contain',className)}/>;
  const supplements = new Set(['clock', 'boss', 'phase', 'pause', 'sound', 'muted']);
  if(supplements.has(kind))return <OriginalArt id={'supplement/'+kind} className={cx('shrink-0 object-contain',className)}/>;
  queueMicrotask(()=>reportUiSourceFailure('symbol:'+kind,'Missing original symbol binding'));
  return <span aria-hidden="true" data-art-missing={kind} className={className} />;
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

// Plain failure text is intentional diagnostic UI; it never substitutes program-authored artwork.
export function OriginalAssetNotice(){const[failures,setFailures]=useState(getUiSourceFailures);useEffect(()=>subscribeUiSourceFailures(setFailures),[]);if(!failures.length)return null;return <div role="alert" className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#FFF9EF] p-6 text-center text-base text-[#4B281C]"><p>美术资源不完整，游戏已暂停，请刷新重试</p><p className="mt-3 break-all">{failures.map(f=>f.url).join('、')}</p></div>}
