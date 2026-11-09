import React, { useState } from 'react';
import { Search, Trash2, Pencil, Trophy, Lightbulb, Check } from 'lucide-react';
import { api } from '../api.js';
import { MOODS, useData, todayIso, fmtLong } from '../lib.js';
import { PageHead, Empty } from '../ui.jsx';

const PROMPTS = [
  'Што те направи горда денес?',
  'Што би направила поинаку?',
  'За што си благодарна денес?',
  'Што те мотивираше, а што ти одзеде енергија?',
  'Која е една работа што ја научи?',
  'Што е најважното за утре?',
];
const prompt = () => PROMPTS[new Date().getDate() % PROMPTS.length];
const blank = () => ({ date: todayIso(), title: '', body: '', mood: null, win: '', lesson: '' });

export default function Journal() {
  const [q, setQ] = useState('');
  const [entries, load] = useData(`/journal${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const save = async e => {
    e.preventDefault();
    const body = { date: f.date, title: f.title || null, body: f.body, mood: f.mood, win: f.win || null, lesson: f.lesson || null };
    editing ? await api.put(`/journal/${editing}`, body) : await api.post('/journal', body);
    setF(blank()); setEditing(null); setSaved(true); setTimeout(() => setSaved(false), 2000); load();
  };
  const edit = j => { setEditing(j.id); setF({ ...j, title: j.title || '', win: j.win || '', lesson: j.lesson || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const remove = async j => { if (!confirm('Да го избришам записот?')) return; await api.del(`/journal/${j.id}`); load(); };

  return <div className="page narrow">
    <PageHead kicker="Простор за твоите мисли" title="Дневник" />

    <form className="card compose" onSubmit={save}>
      <div className="compose-top">
        <input type="date" value={f.date} max={todayIso()} onChange={e => set('date', e.target.value)} aria-label="Датум" />
        <div className="moods" role="radiogroup" aria-label="Расположение">
          {MOODS.map(m => <button type="button" key={m.value} role="radio" aria-checked={f.mood === m.value}
            className={`mood m${m.value} ${f.mood === m.value ? 'on' : ''}`} onClick={() => set('mood', f.mood === m.value ? null : m.value)}>{m.label}</button>)}
        </div>
      </div>
      <input className="title-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Наслов (по желба)" />
      <textarea required rows={5} value={f.body} onChange={e => set('body', e.target.value)} placeholder={prompt()} />
      <div className="row2">
        <label className="with-icon"><Trophy size={15} /><input value={f.win} onChange={e => set('win', e.target.value)} placeholder="Мала победа денес" /></label>
        <label className="with-icon"><Lightbulb size={15} /><input value={f.lesson} onChange={e => set('lesson', e.target.value)} placeholder="Што научив" /></label>
      </div>
      <div className="modal-actions">
        {saved && <span className="saved"><Check size={14} />Зачувано</span>}
        <span className="grow" />
        {editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setF(blank()); }}>Откажи</button>}
        <button className="primary">{editing ? 'Зачувај промени' : 'Запиши'}</button>
      </div>
    </form>

    <div className="toolbar"><div className="search wide"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Пребарај во дневникот..." aria-label="Пребарај дневник" /></div></div>

    {entries === null ? <div className="card"><div className="skeleton" /></div>
      : entries.length === 0 ? <div className="card"><Empty title={q ? 'Ништо не најдов.' : 'Дневникот е празен.'} text={q ? '' : 'Една реченица е доволна за почеток.'} /></div>
        : <div className="entries">{entries.map(j => {
          const mood = MOODS.find(m => m.value === j.mood);
          return <article key={j.id} className="card entry">
            <div className="entry-head">
              <span className="entry-date">{fmtLong(j.date)}</span>
              {mood && <span className={`mood-pill m${mood.value}`}>{mood.label}</span>}
              <span className="grow" />
              <button className="icon hover-only" onClick={() => edit(j)} aria-label="Уреди"><Pencil size={15} /></button>
              <button className="icon hover-only danger" onClick={() => remove(j)} aria-label="Избриши"><Trash2 size={15} /></button>
            </div>
            {j.title && <h3>{j.title}</h3>}
            <p className="entry-body">{j.body}</p>
            {(j.win || j.lesson) && <div className="entry-extras">
              {j.win && <span><Trophy size={13} />{j.win}</span>}
              {j.lesson && <span><Lightbulb size={13} />{j.lesson}</span>}
            </div>}
          </article>;
        })}</div>}
  </div>;
}
