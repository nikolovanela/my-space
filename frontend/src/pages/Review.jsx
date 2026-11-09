import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Trophy, Lightbulb, CalendarClock, CircleCheck, Target } from 'lucide-react';
import { api } from '../api.js';
import { useData, todayIso, addDays, weekStartOf, fmtDay, fmtFull, MOODS } from '../lib.js';
import { PageHead, Bar, Empty, AreaTag } from '../ui.jsx';

export default function Review() {
  const [ws, setWs] = useState(() => weekStartOf(todayIso()));
  const [r] = useData(`/reviews/${ws}`);
  const [f, setF] = useState({ wentWell: '', toImprove: '', nextFocus: '', rating: null });
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (r) setF({ wentWell: r.review?.wentWell || '', toImprove: r.review?.toImprove || '', nextFocus: r.review?.nextFocus || '', rating: r.review?.rating ?? null }); }, [r]);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async e => {
    e.preventDefault();
    await api.put(`/reviews/${ws}`, { ...f, wentWell: f.wentWell || null, toImprove: f.toImprove || null, nextFocus: f.nextFocus || null });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  const isCurrent = ws === weekStartOf(todayIso());
  const mood = r?.avgMood ? MOODS.find(m => m.value === Math.round(r.avgMood)) : null;

  return <div className="page">
    <PageHead kicker="Секоја недела, 5 минути" title="Неделен преглед">
      <div className="week-nav">
        <button className="icon" onClick={() => setWs(addDays(ws, -7))} aria-label="Претходна недела"><ChevronLeft size={18} /></button>
        <span>{fmtDay(ws)} до {fmtFull(addDays(ws, 6))}</span>
        <button className="icon" disabled={isCurrent} onClick={() => setWs(addDays(ws, 7))} aria-label="Следна недела"><ChevronRight size={18} /></button>
      </div>
    </PageHead>

    {!r ? <div className="card"><div className="skeleton" /></div> : <>
      <section className="kpis">
        <div className="card kpi"><CircleCheck size={18} /><strong>{r.completed.length}</strong><span>завршени задачи</span></div>
        <div className="card kpi"><CalendarClock size={18} /><strong>{r.postponed.length}</strong><span>одложени / задоцнети</span></div>
        <div className="card kpi"><Target size={18} /><strong>{r.habitRate}%</strong><span>исполнети навики</span></div>
        <div className="card kpi"><Trophy size={18} /><strong>{mood ? mood.label : '·'}</strong><span>{r.journalCount} записи во дневник</span></div>
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card-head"><h2>Што заврши</h2><span className="count">{r.completed.length}</span></div>
          {r.completed.length === 0 ? <Empty title="Нема завршени задачи оваа недела." />
            : <ul className="plain">{r.completed.map(t => <li key={t.id}><Check size={14} className="ok" />{t.title}<AreaTag area={t.area} /></li>)}</ul>}
          {r.goalSteps.length > 0 && <>
            <div className="sub-head">Чекори кон целите</div>
            <ul className="plain">{r.goalSteps.map((s, i) => <li key={i}><Target size={14} className="ok" />{s.step}<span className="muted small">{s.goal}</span></li>)}</ul>
          </>}
        </section>
        <section className="card">
          <div className="card-head"><h2>Што одложи</h2><span className="count">{r.postponed.length}</span></div>
          {r.postponed.length === 0 ? <Empty title="Ништо не е одложено." text="Сè што имаше рок е завршено." />
            : <ul className="plain">{r.postponed.map(t => <li key={t.id}><CalendarClock size={14} className="late" />{t.title}<span className="muted small">{fmtDay(t.dueDate)}</span></li>)}</ul>}
          <div className="sub-head">Навики</div>
          {r.habits.length === 0 ? <p className="muted small">Нема навики.</p> : r.habits.map(h => <div key={h.id} className="area-row">
            <div className="row-between"><span>{h.title}</span><span className="muted">{h.done}/{h.possible}</span></div>
            <Bar value={h.possible ? 100 * h.done / h.possible : 0} tone="var(--clay)" />
          </div>)}
        </section>
      </div>

      {(r.wins.length > 0 || r.lessons.length > 0) && <section className="card">
        <div className="card-head"><h2>Од дневникот</h2></div>
        <div className="two-col tight">
          <ul className="plain">{r.wins.map((w, i) => <li key={i}><Trophy size={14} className="ok" />{w.text}</li>)}</ul>
          <ul className="plain">{r.lessons.map((w, i) => <li key={i}><Lightbulb size={14} className="gold" />{w.text}</li>)}</ul>
        </div>
      </section>}

      <form className="card reflect" onSubmit={save}>
        <div className="card-head"><h2>Твоја рефлексија</h2></div>
        <label>Што помина добро?<textarea rows={3} value={f.wentWell} onChange={e => set('wentWell', e.target.value)} /></label>
        <label>Што треба да подобрам?<textarea rows={3} value={f.toImprove} onChange={e => set('toImprove', e.target.value)} /></label>
        <label>Фокус за следната недела<textarea rows={2} value={f.nextFocus} onChange={e => set('nextFocus', e.target.value)} placeholder="Една до три работи што се најважни." /></label>
        <label>Оценка на неделата
          <div className="rating">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button type="button" key={n} className={f.rating === n ? 'on' : f.rating > n ? 'below' : ''} onClick={() => set('rating', f.rating === n ? null : n)}>{n}</button>)}</div>
        </label>
        <div className="modal-actions">{saved && <span className="saved"><Check size={14} />Зачувано</span>}<span className="grow" /><button className="primary"><Check size={16} />Зачувај преглед</button></div>
      </form>
    </>}
  </div>;
}
