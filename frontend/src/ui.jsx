import React, { useEffect, useState } from 'react';
import { Check, X, Trash2, Pencil, CalendarDays, Flag } from 'lucide-react';
import { AREAS, PRIORITIES, areaColor, dueLabel, todayIso } from './lib.js';
import { api } from './api.js';

export function PageHead({ kicker, title, children }) {
  return <header className="page-head">
    <div><div className="kicker">{kicker}</div><h1>{title}</h1></div>
    {children && <div className="page-actions">{children}</div>}
  </header>;
}

export function Ring({ value, size = 56, stroke = 6, label, tone = 'var(--accent)' }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value || 0));
  return <div className="ring" style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .5s ease' }} />
    </svg>
    <span>{label ?? `${Math.round(v)}%`}</span>
  </div>;
}

export function Bar({ value, tone }) {
  return <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, value || 0))}%`, background: tone }} /></div>;
}

export const AreaTag = ({ area }) => <span className="area-tag"><i style={{ background: areaColor(area) }} />{area}</span>;

export function Empty({ title, text, children }) {
  return <div className="empty"><strong>{title}</strong>{text && <p>{text}</p>}{children}</div>;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-label={title} onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><h2>{title}</h2><button className="icon" onClick={onClose} aria-label="Затвори"><X size={18} /></button></div>
      {children}
    </div>
  </div>;
}

export function Check3({ done, onClick, label }) {
  return <button className={`check ${done ? 'done' : ''}`} onClick={onClick} aria-label={label} aria-pressed={done}>
    {done && <Check size={14} strokeWidth={3} />}
  </button>;
}

export function TaskRow({ task, onToggle, onEdit, onDelete, compact }) {
  const due = !task.isDone && dueLabel(task.dueDate);
  return <div className={`task ${task.isDone ? 'is-done' : ''}`}>
    <Check3 done={task.isDone} onClick={onToggle} label={task.isDone ? 'Врати како отворена' : 'Означи како завршена'} />
    <div className="task-body" onClick={onEdit}>
      <div className="task-title">{task.priority === 2 && !task.isDone && <Flag size={13} className="flag" />}{task.title}</div>
      <div className="task-meta">
        <AreaTag area={task.area} />
        {due && <span className={`due ${due.tone}`}><CalendarDays size={12} />{due.text}</span>}
        {!compact && task.notes && <span className="note-dot">{task.notes.slice(0, 60)}</span>}
      </div>
    </div>
    {onEdit && !compact && <button className="icon hover-only" onClick={onEdit} aria-label="Уреди"><Pencil size={15} /></button>}
    {onDelete && <button className="icon hover-only danger" onClick={onDelete} aria-label="Избриши"><Trash2 size={15} /></button>}
  </div>;
}

export function Chips({ options, value, onChange, all }) {
  return <div className="chips">
    {all && <button className={!value ? 'on' : ''} onClick={() => onChange('')}>{all}</button>}
    {options.map(o => {
      const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
      return <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(value === v && all ? '' : v)}>{l}</button>;
    })}
  </div>;
}

// Форма за нова задача или уредување постоечка.
export function TaskModal({ task, goals, onClose, onSaved }) {
  const [f, setF] = useState(() => task ? { ...task, dueDate: task.dueDate || '' } : { title: '', notes: '', area: 'Работа', priority: 1, dueDate: todayIso(), goalId: null });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async e => {
    e.preventDefault();
    const body = { title: f.title, notes: f.notes || null, area: f.area, priority: Number(f.priority), dueDate: f.dueDate || null, goalId: f.goalId ? Number(f.goalId) : null };
    try {
      const saved = task ? await api.put(`/tasks/${task.id}`, body) : await api.post('/tasks', body);
      onSaved(saved); onClose();
    } catch (x) { setErr(x.message); }
  };
  const remove = async () => { await api.del(`/tasks/${task.id}`); onSaved(null); onClose(); };
  return <Modal title={task ? 'Уреди задача' : 'Нова задача'} onClose={onClose}>
    <form onSubmit={save} className="form">
      <input className="big-input" autoFocus required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Што треба да се направи?" />
      <label>Област<Chips options={AREAS.map(a => a.name)} value={f.area} onChange={v => set('area', v)} /></label>
      <div className="row2">
        <label>Приоритет<Chips options={PRIORITIES} value={Number(f.priority)} onChange={v => set('priority', v)} /></label>
        <label>Рок
          <div className="date-row">
            <input type="date" value={f.dueDate} onChange={e => set('dueDate', e.target.value)} />
            {f.dueDate && <button type="button" className="ghost sm" onClick={() => set('dueDate', '')}>Без рок</button>}
          </div>
        </label>
      </div>
      {goals?.length > 0 && <label>Поврзи со цел
        <select value={f.goalId || ''} onChange={e => set('goalId', e.target.value)}>
          <option value="">Не е поврзана</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
      </label>}
      <label>Белешка<textarea rows={3} value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Детали, линкови, идеи..." /></label>
      {err && <div className="error">{err}</div>}
      <div className="modal-actions">
        {task && <button type="button" className="ghost danger" onClick={remove}><Trash2 size={15} />Избриши</button>}
        <span className="grow" />
        <button type="button" className="ghost" onClick={onClose}>Откажи</button>
        <button className="primary" type="submit"><Check size={16} />Зачувај</button>
      </div>
    </form>
  </Modal>;
}

// Брз внес: Enter додава задача. „!“ на крајот = висок приоритет.
export function QuickAdd({ onAdded, defaultDue, placeholder = 'Додај задача и притисни Enter...' }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    let title = v.trim(); if (!title || busy) return;
    const high = title.endsWith('!'); if (high) title = title.replace(/!+$/, '').trim();
    setBusy(true);
    try {
      const t = await api.post('/tasks', { title, area: 'Работа', priority: high ? 2 : 1, dueDate: defaultDue ?? null, notes: null, goalId: null });
      setV(''); onAdded(t);
    } finally { setBusy(false); }
  };
  return <form className="quick" onSubmit={submit}>
    <span className="quick-plus">+</span>
    <input value={v} onChange={e => setV(e.target.value)} placeholder={placeholder} aria-label="Брз внес на задача" />
    {v && <kbd>Enter</kbd>}
  </form>;
}
