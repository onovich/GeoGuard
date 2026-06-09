import { forwardRef } from 'react';
import { cx, getBadgeClass, getButtonClass, ui } from '../designSystem.js';

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
