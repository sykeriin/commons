import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X, Inbox as InboxIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/** Inline style that feeds a colour to the .hue / .hue-bar / .hue-text / .hue-chip classes. */
export const hue = (c?: string) => ({ '--c': c ?? 'var(--primary)' }) as React.CSSProperties;

/* ---------- Button ---------- */
type BtnVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; busy?: boolean; block?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(({ variant = 'primary', size = 'md', busy, block, className, children, disabled, onClick, ...p }, ref) => {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-primary text-on-primary border-ink brut-sm',
    secondary: 'bg-secondary text-on-secondary border-ink brut-sm',
    accent: 'bg-tertiary-container text-on-tertiary-container border-ink brut-sm',
    outline: 'bg-surface-container-lowest text-on-surface border-line hover:border-ink',
    ghost: 'bg-transparent text-on-surface border-transparent hover:bg-surface-container',
    danger: 'bg-surface-container-lowest text-bad border-bad hover:bg-bad hover:text-on-bad',
  };
  const s = { sm: 'min-h-9 px-3.5 text-xs', md: 'min-h-11 px-5 text-sm', lg: 'min-h-13 px-7 text-base' }[size];
  const raised = variant === 'primary' || variant === 'secondary' || variant === 'accent';
  return (
    <button ref={ref} disabled={disabled || busy} onClick={onClick}
      className={cn('inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 font-headline font-extrabold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50',
        raised && 'hover:translate-x-px hover:translate-y-px hover:shadow-[1.5px_1.5px_0_0_var(--shadow)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        v[variant], s, block && 'w-full', className)} {...p}>
      {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}{children}
    </button>
  );
});
Button.displayName = 'Button';

/* ---------- Surfaces ---------- */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }> = ({ className, hover, ...p }) =>
  <div className={cn('card p-4 md:p-5', hover && 'card-hover cursor-pointer', className)} {...p} />;

export const Badge: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'blue' | 'lime' | 'brand'; color?: string; className?: string }> = ({ children, tone = 'neutral', color, className }) => {
  const t = { neutral: 'bg-surface-container text-on-surface-variant', ok: 'bg-ok/15 text-ok', warn: 'bg-warn/15 text-warn', bad: 'bg-bad/15 text-bad',
    blue: 'bg-secondary-container text-on-secondary-container', lime: 'bg-tertiary-container text-on-tertiary-container', brand: 'bg-primary text-on-primary' }[tone];
  return <span style={color ? hue(color) : undefined} className={cn(color && 'hue-chip', 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-headline text-[11px] font-bold tracking-wide', !color && t, className)}>{children}</span>;
};

export const Avatar: React.FC<{ name: string; size?: number; color?: string; className?: string }> = ({ name, size = 40, color, className }) => {
  const initials = name.replace(/^(Dr|Prof)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return <span aria-hidden style={{ width: size, height: size, fontSize: size * 0.38, ...hue(color ?? `hsl(${h} 70% 45%)`) }}
    className={cn('hue on-hue inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-headline font-black', className)}>{initials}</span>;
};

export const PageHeader: React.FC<{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: () => void; eyebrow?: string }> = ({ title, subtitle, actions, eyebrow }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1 font-headline text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
      <h1 className="h-page">{title}</h1>{subtitle && <div className="muted mt-1">{subtitle}</div>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export const Section: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className }) => (
  <section className={cn('mb-8', className)}>
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="h-sec">{title}</h2>{action}</div>{children}
  </section>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode; hint?: string; tone?: string }> = ({ label, value, hint, tone }) => (
  <div className="card p-4">
    <p className="label !mb-1">{label}</p>
    <p className="font-headline text-3xl font-black leading-none" style={tone ? { color: tone } : undefined}>{value}</p>
    {hint && <p className="muted mt-1.5 !text-xs">{hint}</p>}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({ title, hint, action, icon }) => (
  <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-line px-6 py-10 text-center">
    <div className="mb-3 text-on-surface-variant">{icon ?? <InboxIcon size={30} />}</div>
    <p className="font-headline text-base font-extrabold">{title}</p>
    {hint && <p className="muted mt-1 max-w-sm">{hint}</p>}{action && <div className="mt-4">{action}</div>}
  </div>
);

/* ---------- Form ---------- */
export const Field: React.FC<{ label: string; hint?: string; children: React.ReactElement<any> }> = ({ label, hint, children }) => {
  const auto = React.useId(); const id = children.props?.id ?? auto;
  return (
    <div><label htmlFor={id} className="label">{label}</label>
      {React.cloneElement(children, { id, 'aria-describedby': hint ? `${id}-hint` : undefined })}
      {hint && <p id={`${id}-hint`} className="muted mt-1 !text-xs">{hint}</p>}</div>
  );
};
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, r) => <input ref={r} className={cn('field', className)} {...p} />);
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, r) => <textarea ref={r} rows={4} className={cn('field', className)} {...p} />);
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, r) => <select ref={r} className={cn('field appearance-auto', className)} {...p} />);
Input.displayName = 'Input'; Textarea.displayName = 'Textarea'; Select.displayName = 'Select';

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: NoInfer<T>) => void; options: { value: NoInfer<T>; label: React.ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('scroll-hide inline-flex max-w-full gap-1 overflow-x-auto rounded-full border-2 border-line bg-surface-container-low p-1', className)}>
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('min-h-9 whitespace-nowrap rounded-full px-4 font-headline text-xs font-extrabold tracking-wide transition-colors',
            value === o.value ? 'bg-on-surface text-background' : 'text-on-surface-variant hover:text-on-surface')}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- Sheet (modal on desktop, bottom sheet on mobile) ---------- */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  useEffect(() => { if (!open) return; const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
          <motion.div role="dialog" aria-modal aria-label={title} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="brut max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-lg md:rounded-3xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="h-sec !text-xl">{title}</h2>
              <button aria-label="Close" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"><X size={20} /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>, document.body);
};

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(msg: string, tone?: 'ok' | 'bad') => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<{ id: number; msg: string; tone: 'ok' | 'bad' }[]>([]);
  const push = useCallback((msg: string, tone: 'ok' | 'bad' = 'ok') => {
    const id = Date.now() + Math.random(); setItems(x => [...x, { id, msg, tone }]); setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>{children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        <AnimatePresence>{items.map(t => (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={cn('brut-sm pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold', t.tone === 'ok' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-bad text-on-bad')}>
            {t.tone === 'ok' ? <Check size={16} /> : <X size={16} />}{t.msg}</motion.div>))}</AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
};

/** Wrap an async action with toast feedback. */
export function useAction() {
  const toast = useToast();
  return useCallback(async <T,>(fn: () => Promise<T>, okMsg?: string): Promise<T | undefined> => {
    try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e: any) { toast(e?.message ?? 'Something went wrong', 'bad'); return undefined; }
  }, [toast]);
}

/* ---------- Simple bar chart (no deps) ---------- */
export const BarList: React.FC<{ items: { label: string; value: number; color?: string }[]; unit?: string }> = ({ items, unit = '' }) => {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <ul className="space-y-2.5">{items.map(i => (
      <li key={i.label} className="grid grid-cols-[9.5rem_1fr_3rem] items-center gap-3 text-sm">
        <span className="truncate font-semibold">{i.label}</span>
        <span className="h-3 overflow-hidden rounded-full bg-surface-container"><span className={cn('block h-full rounded-full', i.color ? 'hue-bar' : 'bg-secondary')} style={{ width: `${(i.value / max) * 100}%`, ...(i.color ? hue(i.color) : {}) }} /></span>
        <span className="text-right font-headline font-bold tabular-nums">{i.value}{unit}</span>
      </li>))}</ul>
  );
};
