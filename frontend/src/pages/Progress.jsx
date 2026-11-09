import React from 'react';
import { Flame, CheckCheck, Repeat2, NotebookPen } from 'lucide-react';
import { useData, fmtDayShort, fmtWeekday, MOODS, areaColor } from '../lib.js';
import { PageHead, Bar, Empty } from '../ui.jsx';

export default function Progress() {
  const [s] = useData('/stats/overview');
  if (!s) return <div className="page"><PageHead kicker="Погледни колку далеку стигна" title="Напредок" /><div className="card"><div className="skeleton" /></div></div>;

  const last14 = s.days.slice(-14);
  const max14 = Math.max(1, ...last14.map(d => d.tasksCompleted));
  const maxWeek = Math.max(1, ...s.weeks.map(w => w.tasksCompleted));
  const totals = s.days.reduce((a, d) => ({ t: a.t + d.tasksCompleted, h: a.h + d.habitsDone, j: a.j + (d.journal ? 1 : 0) }), { t: 0, h: 0, j: 0 });
  const moodDays = s.days.slice(-28).filter(d => d.mood);
  // Heatmap: колони = недели, редови = понеделник до недела
  const first = s.days[0].date;
  const offset = (new Date(first + 'T12:00:00').getDay() + 6) % 7;
  const cells = [...Array(offset).fill(null), ...s.days];
  const score = d => d ? d.tasksCompleted + d.habitsDone + (d.journal ? 1 : 0) : -1;
  const maxScore = Math.max(1, ...s.days.map(score));

  return <div className="page">
    <PageHead kicker="Погледни колку далеку стигна" title="Напредок" />

    <section className="kpis">
      <div className="card kpi"><Flame size={18} /><strong>{s.activityStreak}</strong><span>дена активност по ред</span></div>
      <div className="card kpi"><CheckCheck size={18} /><strong>{totals.t}</strong><span>завршени задачи (12 недели)</span></div>
      <div className="card kpi"><Repeat2 size={18} /><strong>{s.week.habitRate}%</strong><span>навики оваа недела</span></div>
      <div className="card kpi"><NotebookPen size={18} /><strong>{totals.j}</strong><span>дена со запис во дневник</span></div>
    </section>

    <div className="two-col">
      <section className="card">
        <div className="card-head"><h2>Дневно · последни 14 дена</h2></div>
        <div className="chart">
          {last14.map(d => <div key={d.date} className="col" title={`${fmtDayShort(d.date)}: ${d.tasksCompleted} задачи, ${d.habitsDone}/${d.habitsTotal} навики`}>
            <span className="col-val">{d.tasksCompleted || ''}</span>
            <div className="col-bar"><i style={{ height: `${100 * d.tasksCompleted / max14}%` }} /></div>
            <div className="col-habit" style={{ opacity: d.habitsTotal ? .2 + .8 * d.habitsDone / d.habitsTotal : .1 }} />
            <span className="col-lbl">{fmtWeekday(d.date)}</span>
          </div>)}
        </div>
        <div className="legend"><span><i className="lg-bar" />задачи</span><span><i className="lg-dot" />навики (потемно = повеќе)</span></div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Неделно · последни 8 недели</h2></div>
        <div className="chart">
          {s.weeks.map((w, i) => <div key={w.weekStart} className={`col ${i === s.weeks.length - 1 ? 'is-now' : ''}`} title={`Недела од ${fmtDayShort(w.weekStart)}: ${w.tasksCompleted} задачи, ${w.habitRate}% навики`}>
            <span className="col-val">{w.tasksCompleted || ''}</span>
            <div className="col-bar"><i style={{ height: `${100 * w.tasksCompleted / maxWeek}%` }} /></div>
            <span className="col-sub">{w.habitRate}%</span>
            <span className="col-lbl">{fmtDayShort(w.weekStart)}</span>
          </div>)}
        </div>
        <div className="legend"><span><i className="lg-bar" />задачи</span><span>% = исполнети навики</span></div>
      </section>
    </div>

    <section className="card">
      <div className="card-head"><h2>Активност · 12 недели</h2><span className="muted small">задачи + навики + дневник по ден</span></div>
      <div className="heat">
        <div className="heat-days">{['По', 'Вт', 'Ср', 'Че', 'Пе', 'Са', 'Не'].map(d => <span key={d}>{d}</span>)}</div>
        <div className="heat-grid">{cells.map((d, i) => <i key={i} className={!d ? 'blank' : ''}
          style={d ? { '--lvl': score(d) === 0 ? 0 : .2 + .8 * score(d) / maxScore } : undefined}
          title={d ? `${fmtDayShort(d.date)}: ${d.tasksCompleted} задачи, ${d.habitsDone} навики${d.journal ? ', дневник' : ''}` : ''} />)}</div>
      </div>
    </section>

    <div className="two-col">
      <section className="card">
        <div className="card-head"><h2>Области</h2><span className="muted small">отворени · завршени оваа недела</span></div>
        {s.areas.length === 0 ? <Empty title="Уште нема податоци." /> : s.areas.map(a => <div key={a.area} className="area-row">
          <div className="row-between"><span><i className="dot" style={{ background: areaColor(a.area) }} />{a.area}</span><span className="muted">{a.open} · <strong>{a.doneThisWeek}</strong></span></div>
          <Bar value={a.open + a.doneThisWeek ? 100 * a.doneThisWeek / (a.open + a.doneThisWeek) : 0} tone={areaColor(a.area)} />
        </div>)}
      </section>

      <section className="card">
        <div className="card-head"><h2>Расположение · 4 недели</h2></div>
        {moodDays.length === 0 ? <Empty title="Нема оценки за расположение." text="Додај расположение кога пишуваш во дневникот." />
          : <div className="mood-chart">{s.days.slice(-28).map(d => <div key={d.date} className="mood-col" title={d.mood ? `${fmtDayShort(d.date)}: ${MOODS.find(m => m.value === Math.round(d.mood))?.label}` : fmtDayShort(d.date)}>
            {d.mood && <i className={`m${Math.round(d.mood)}`} style={{ height: `${d.mood * 20}%` }} />}
          </div>)}</div>}
      </section>
    </div>
  </div>;
}
