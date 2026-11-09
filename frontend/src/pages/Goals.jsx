import React, { useState } from 'react';
import { Plus, Trash2, Archive, Pencil, Check, X } from 'lucide-react';
import { api } from '../api.js';
import { AREAS, useData, todayIso, daysBetween, fmtFull } from '../lib.js';
import { PageHead, Ring, AreaTag, Modal, Chips, Empty, Check3 } from '../ui.jsx';

export default function Goals() {
  const [archived, setArchived] = useState(false);
  const [goals, load, setGoals] = useData(`/goals?archived=${archived}`);
  const [modal, setModal] = useState(null);
  const replace = g => setGoals(gs => gs.map(x => x.id === g.id ? g : x));

  return <div className="page">
    <PageHead kicker="Размислувај големо, почни мало" title="Цели">
      <button className="primary" onClick={() => setModal('new')}><Plus size={16} />Нова цел</button>
    </PageHead>
    <Chips options={[{ value: false, label: 'Активни' }, { value: true, label: 'Архива' }]} value={archived} onChange={setArchived} />

    {goals === null ? <div className="card"><div className="skeleton" /></div>
      : goals.length === 0 ? <div className="card"><Empty title={archived ? 'Архивата е празна.' : 'Уште немаш цели.'} text={archived ? '' : 'Една цел, поделена на 3 до 5 чекори, е доволна за почеток.'} /></div>
        : <div className="goal-grid">{goals.map(g => <GoalCard key={g.id} goal={g} onChange={replace} onEdit={() => setModal(g)} onGone={() => setGoals(gs => gs.filter(x => x.id !== g.id))} />)}</div>}

    {modal && <GoalModal goal={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={load} />}
  </div>;
}

function GoalCard({ goal: g, onChange, onEdit, onGone }) {
  const [step, setStep] = useState('');
  const left = g.targetDate ? daysBetween(todayIso(), g.targetDate) : null;
  const addStep = async e => {
    e.preventDefault(); if (!step.trim()) return;
    onChange(await api.post(`/goals/${g.id}/steps`, { title: step })); setStep('');
  };
  const setManual = async v => onChange(await api.put(`/goals/${g.id}`, { title: g.title, why: g.why, area: g.area, targetDate: g.targetDate, manualProgress: Number(v) }));

  return <article className="card goal">
    <div className="goal-top">
      <Ring value={g.progress} size={68} stroke={7} />
      <div className="grow">
        <AreaTag area={g.area} />
        <h3>{g.title}</h3>
        {g.targetDate && <span className={`goal-date ${left < 0 ? 'late' : left < 14 ? 'soon' : ''}`}>
          {left < 0 ? `Рокот помина (${fmtFull(g.targetDate)})` : left === 0 ? 'Рокот е денес' : `Уште ${left} дена · ${fmtFull(g.targetDate)}`}</span>}
      </div>
      <div className="goal-tools">
        <button className="icon" onClick={onEdit} aria-label="Уреди"><Pencil size={15} /></button>
        <button className="icon" onClick={async () => { await api.patch(`/goals/${g.id}/archive`); onGone(); }} aria-label={g.isArchived ? 'Врати' : 'Архивирај'} title={g.isArchived ? 'Врати' : 'Архивирај'}><Archive size={15} /></button>
      </div>
    </div>
    {g.why && <p className="goal-why">„{g.why}“</p>}

    <div className="steps">
      {g.steps.map(s => <div key={s.id} className={`step ${s.isDone ? 'is-done' : ''}`}>
        <Check3 done={s.isDone} onClick={async () => onChange(await api.patch(`/goals/${g.id}/steps/${s.id}/toggle`))} label={s.title} />
        <span className="grow">{s.title}</span>
        <button className="icon hover-only danger" onClick={async () => onChange(await api.del(`/goals/${g.id}/steps/${s.id}`))} aria-label="Избриши чекор"><X size={14} /></button>
      </div>)}
      <form onSubmit={addStep} className="step-add"><Plus size={15} /><input value={step} onChange={e => setStep(e.target.value)} placeholder="Додај чекор..." aria-label="Нов чекор" /></form>
    </div>

    {g.steps.length === 0 && <label className="manual">Рачен напредок: {g.manualProgress}%
      <input type="range" min="0" max="100" step="5" defaultValue={g.manualProgress} onMouseUp={e => setManual(e.target.value)} onTouchEnd={e => setManual(e.target.value)} onKeyUp={e => setManual(e.target.value)} />
    </label>}
  </article>;
}

function GoalModal({ goal, onClose, onSaved }) {
  const [f, setF] = useState(() => goal ? { ...goal, targetDate: goal.targetDate || '', stepsText: '' } : { title: '', why: '', area: 'Личен развој', targetDate: '', manualProgress: 0, stepsText: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async e => {
    e.preventDefault();
    const body = { title: f.title, why: f.why || null, area: f.area, targetDate: f.targetDate || null, manualProgress: Number(f.manualProgress || 0), steps: f.stepsText.split('\n').map(s => s.trim()).filter(Boolean) };
    try { goal ? await api.put(`/goals/${goal.id}`, body) : await api.post('/goals', body); onSaved(); onClose(); }
    catch (x) { setErr(x.message); }
  };
  const remove = async () => { if (!confirm('Да ја избришам целта со сите чекори?')) return; await api.del(`/goals/${goal.id}`); onSaved(); onClose(); };
  return <Modal title={goal ? 'Уреди цел' : 'Нова цел'} onClose={onClose}>
    <form className="form" onSubmit={save}>
      <input className="big-input" autoFocus required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Што сакаш да постигнеш?" />
      <label>Зошто ти е важно?<input value={f.why || ''} onChange={e => set('why', e.target.value)} placeholder="Ова ќе ти го покажувам кога ќе ти треба мотивација." /></label>
      <label>Област<Chips options={AREAS.map(a => a.name)} value={f.area} onChange={v => set('area', v)} /></label>
      <label>Рок<input type="date" value={f.targetDate} onChange={e => set('targetDate', e.target.value)} /></label>
      {!goal && <label>Чекори (по еден во ред)<textarea rows={4} value={f.stepsText} onChange={e => set('stepsText', e.target.value)} placeholder={'Истражи опции\nНаправи план\nПрв чекор оваа недела'} /></label>}
      {err && <div className="error">{err}</div>}
      <div className="modal-actions">
        {goal && <button type="button" className="ghost danger" onClick={remove}><Trash2 size={15} />Избриши</button>}
        <span className="grow" />
        <button type="button" className="ghost" onClick={onClose}>Откажи</button>
        <button className="primary"><Check size={16} />Зачувај</button>
      </div>
    </form>
  </Modal>;
}
