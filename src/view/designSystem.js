export const cx = (...classes) =>
  classes
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');

export const ui = {
  surface: {
    glassPanel: 'rounded-xl border border-slate-200 bg-white/92 shadow-lg backdrop-blur-md',
    modalPanel: 'rounded-3xl bg-white/95 shadow-2xl',
    card: 'rounded-lg border border-slate-200 bg-white shadow-sm',
    softCard: 'rounded-xl border border-slate-200 bg-slate-50/80',
    hud: 'rounded-xl bg-white/80 shadow-sm backdrop-blur-sm',
    darkHud: 'rounded-xl bg-slate-900/78 text-white shadow-lg backdrop-blur-sm',
    menu: 'overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl',
  },
  text: {
    sectionHeading: 'text-[11px] font-black uppercase tracking-[0.18em] text-slate-400',
    smallLabel: 'text-[11px] font-bold text-slate-500',
    body: 'text-sm font-semibold text-slate-700',
    muted: 'text-xs font-medium text-slate-500',
  },
  button: {
    base: 'inline-flex items-center justify-center whitespace-nowrap border font-bold transition-all active:translate-y-0',
    size: {
      xs: 'rounded-md px-2 py-1 text-[11px]',
      sm: 'rounded-md px-3 py-1.5 text-xs',
      md: 'rounded-lg px-3 py-2 text-xs',
      lg: 'rounded-xl px-4 py-3 text-base',
    },
    variant: {
      default: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-950',
      accent: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
      danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
      ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
      blue: 'border-blue-500 bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:shadow-xl',
    },
    selected: 'bg-white shadow-sm',
  },
  badge: {
    base: 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em]',
    variant: {
      neutral: 'bg-slate-100 text-slate-600',
      success: 'bg-emerald-100 text-emerald-700',
      info: 'bg-sky-100 text-sky-700',
      warning: 'bg-amber-100 text-amber-700',
      danger: 'bg-rose-100 text-rose-700',
    },
  },
  form: {
    field: 'flex flex-col gap-1 text-[11px] font-bold text-slate-500',
    control: 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700',
    strongControl: 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700',
    monoControl: 'rounded-lg border border-slate-200 bg-white px-3 py-3 font-mono text-[11px] leading-5 text-slate-700',
    checkField: 'flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600',
  },
  segment: {
    group: 'flex rounded-lg bg-slate-100 p-1',
    item: 'rounded-md px-3 py-1 text-xs font-bold text-slate-600 transition-colors hover:bg-white/70',
    active: 'bg-white shadow-sm',
  },
  card: {
    interactive: 'rounded-lg border bg-white shadow-sm transition-all',
    spawn: 'min-w-[152px] cursor-grab rounded-lg border bg-white px-3 py-2 shadow-sm active:cursor-grabbing',
  },
};

export const getButtonClass = ({ variant = 'default', size = 'sm', selected = false, className = '' } = {}) =>
  cx(ui.button.base, ui.button.size[size], ui.button.variant[variant] ?? ui.button.variant.default, selected && ui.button.selected, className);

export const getBadgeClass = ({ variant = 'neutral', className = '' } = {}) =>
  cx(ui.badge.base, ui.badge.variant[variant] ?? ui.badge.variant.neutral, className);
