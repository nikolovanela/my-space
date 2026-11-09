import React, { useState } from 'react';
import { Plus, Flame, Trophy, Trash2, Check } from 'lucide-react';
import { api } from '../api.js';
import { AREAS, HABIT_COLORS, useData, todayIso, addDays, fmtWeekday, fmtDayShort } from '../lib.js';
import { PageHead, Modal, Chips, Empty, Ring } from '../ui.jsx';


export default function Habits() {
  const [habits, load, setHabits] = useData('/habits');
  const [modal, setModal] = useState(null);
  const today = todayIso();
  // На телефон последните 7 дена, на компјутер 14.
  const span = matchMedia('(max-width: 860px)').matches ? 7 : 14;
  const days = Array.from({ length: span }, (_, i) => addDays(today, i - span + 1));

  const toggle = async (h, date) => {
    const u = await api.post(`/habits/${h.id}/toggle`, { date });
    setHabits(hs => hs.map(x => x.id === h.id ? u : x));
  };
  const doneToday = (habits || []).filter(h => h.days.includes(today)).length;
  const total = habits?.length || 0;

  return <div className="page">
    <PageHead kicker="Градиш рутина" title="Навики">
      <button className="primary" onClick={() => setModal('new')}><Plus size={16} />Нова навика</button>
    </PageHead>

    {total > 0 && <section className="card habit-summary">
      <Ring value={total ? 100 * doneToday / total : 0} size={76} stroke={8} tone="var(--clay)" />
      <div><div className="kicker">Денес</div><h2>{doneToday} од {total} навики</h2>
        <p className="muted">{doneToday === total ? 'Сè е исполнето. Браво!' : 'Кликни на денешното квадратче, или на кој било претходен ден што си го пропуштила да го означиш.'}</p></div>
    </section>}

    {habits === null ? <div className="card"><div className="skeleton" /></div>
      : total === 0 ? <div className="card"><Empty title="Уште немаш навики." text="Малите работи што ги повторуваш секој ден се тие што те менуваат." /></div>
        : <section className="card habit-table">
          <div className="ht-row ht-head">
            <span />
            <div className="ht-days" style={{ '--n': span }}>{days.map(d => <span key={d} className={d === today ? 'is-today' : ''}>{fmtWeekday(d)}<b>{d.slice(8)}</b></span>)}</div>
            <span />
          </div>
          {habits.map(h => <div key={h.id} className={`ht-row c-${h.color}`}>
            <button className="ht-name" onClick={() => setModal(h)}>
              <strong>{h.title}</strong>
              <small>{h.currentStreak > 0 && <><Flame size={12} />{h.currentStreak} </>}<Trophy size={12} />{h.bestStreak} · вкупно {h.totalDays}</small>
            </button>
            <div className="ht-days" style={{ '--n': span }}>{days.map(d => {
              const on = h.days.includes(d);
              return <button key={d} className={`hcell ${on ? 'on' : ''} ${d === today ? 'is-today' : ''}`} onClick={() => toggle(h, d)}
                aria-label={`${h.title}, ${fmtDayShort(d)}`} aria-pressed={on}>{on && <Check size={13} strokeWidth={3} />}</button>;
            })}</div>
            <span />
          </div>)}
        </section>}

    {modal && <HabitModal habit={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={load} />}
  </div>;
}

function HabitModal({ habit, onClose, onSaved }) {
  const [f, setF] = useState(habit || { title: '', area: 'Личен живот', color: 'sage' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async e => {
    e.preventDefault();
    const body = { title: f.title, area: f.area, color: f.color };
    habit ? await api.put(`/habits/${habit.id}`, body) : await api.post('/habits', body);
    onSaved(); onClose();
  };
  const remove = async () => { if (!confirm('Да ја избришам навиката и целата историја?')) return; await api.del(`/habits/${habit.id}`); onSaved(); onClose(); };
  return <Modal title={habit ? 'Уреди навика' : 'Нова навика'} onClose={onClose}>
    <form className="form" onSubmit={save}>
      <input className="big-input" autoFocus required value={f.title} onChange={e => set('title', e.target.value)} placeholder="На пример: 20 минути англиски" />
      <label>Област<Chips options={AREAS.map(a => a.name)} value={f.area} onChange={v => set('area', v)} /></label>
      <label>Боја<div className="swatches">{HABIT_COLORS.map(c => <button type="button" key={c} className={`swatch c-${c} ${f.color === c ? 'on' : ''}`} onClick={() => set('color', c)} aria-label={c} />)}</div></label>
      <div className="modal-actions">
        {habit && <button type="button" className="ghost danger" onClick={remove}><Trash2 size={15} />Избриши</button>}
        <span className="grow" />
        <button type="button" className="ghost" onClick={onClose}>Откажи</button>
        <button className="primary"><Check size={16} />Зачувај</button>
      </div>
    </form>
  </Modal>;
}
