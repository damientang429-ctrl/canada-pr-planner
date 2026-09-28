import { useEffect, useRef } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { X, Plus, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { CONFIG } from './config';

export function Progress({ value, max, label, tone = '' }: { value: number; max: number; label: string; tone?: string }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
  return <div className={`progress ${tone}`} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={Math.max(max, value)}><span style={{ width: `${percent}%` }} /></div>;
}
export function Panel({ title, eyebrow, action, children, className = '' }: { title?: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{(title || action) && <div className="panel-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</div>}{children}</section>;
}
export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="text-button" onClick={onClick}>{children}<ArrowUpRight size={15} /></button>; }
export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="button primary" onClick={onClick}><Plus size={17} />{children}</button>; }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Amount({ name, value = 0, min = 0, max = CONFIG.validation.maxAmount, step = '0.01', ...props }: { name: string; value?: number; min?: number; max?: number; step?: string; required?: boolean }) { return <input name={name} type="number" min={min} max={max} step={step} defaultValue={value} required {...props} />; }
export function Empty({ icon, children, action }: { icon?: ReactNode; children: ReactNode; action?: ReactNode }) { return <div className="empty">{icon}<p>{children}</p>{action}</div>; }
export function EditActions({ name, onEdit, onDelete }: { name: string; onEdit?: () => void; onDelete: () => void }) { return <div className="row-actions">{onEdit && <button className="icon-button" title={`编辑${name}`} aria-label={`编辑${name}`} onClick={onEdit}><Pencil size={16} /></button>}<button className="icon-button danger-text" title={`删除${name}`} aria-label={`删除${name}`} onClick={onDelete}><Trash2 size={16} /></button></div>; }
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current!; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭弹窗"><X size={20} /></button></div>{children}</dialog>;
}
export function Form({ children, onSubmit, onCancel, submit = '保存记录' }: { children: ReactNode; onSubmit: (data: FormData) => void; onCancel: () => void; submit?: string }) {
  function handle(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }
  return <form onSubmit={handle}>{children}<div className="form-actions"><button type="button" className="button" onClick={onCancel}>取消</button><button className="button primary" type="submit">{submit}</button></div></form>;
}
export const str = (data: FormData, name: string) => String(data.get(name) ?? '').trim();
export const num = (data: FormData, name: string) => Number(data.get(name) || 0);
