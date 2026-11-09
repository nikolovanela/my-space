import React, { useState } from 'react';
import { Flame, ArrowRight, NotebookPen, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../api.js';
import { useData, greeting, fmtLong, todayIso, dailyQuote, fmtWeekday, weekStartOf, addDays } from '../lib.js';
import { Ring, Bar, TaskRow, TaskModal, QuickAdd, Empty, Check3 } from '../ui.jsx';

export default function Today({ user, go }) {
  const today = todayIso();
  const [stats, loadStats] = useData('/stats/overview');
  const [tasks, loadTasks] = useData('/tasks?status=open');
  const [habits, loadHabits, setHabits] = useData('/habits');
  const [goals] = useData('/goals');
  const [doneToday, loadDone] = useData('/tasks?status=done');
  const [edit, setEdit] = useState(null);

  const refresh = () => { loadStats(); loadTasks(); loadDone(); };
  const toggleTask = async t => { await api.patch(`/tasks/${t.id}/toggle`); refresh(); };
  const toggleHabit = async h => {
    const updated = await api.post(`/habits/${h.id}/toggle`, { date: today });
    setHabits(hs => hs.map(x => x.id === h.id ? updated : x)); loadStats();
  };

  const focus = (tasks || []).filter(t => t.dueDate && t.dueDate <= today);
  const noDate = (tasks || []).filter(t => !t.dueDate);
  const finishedToday = (doneToday || []).filter(t => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString());
  const s = stats?.today, w = stats?.week;
  const taskPct = s ? (s.tasksCompleted + s.tasksDue ? 100 * s.tasksCompleted / (s.tasksCompleted + s.tasksDue) : 0) : 0;
  const habitPct = s?.habitsTotal ? 100 * s.habitsDone / s.habitsTotal : 0;
  const ws = weekStartOf(today);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const dayMap = Object.fromEntries((stats?.days || []).map(d => [d.date, d]));
  const maxDay = Math.max(1, ...weekDays.map(d => dayMap[d]?.tasksCompleted || 0));
  const isWeekend = [0, 6].includes(new Date().getDay());
  const trend = w ? w.tasksCompleted - w.lastWeekTasksCompleted : 0;

  return <div className="page">
    <header className="hero">
      <div>
        <div className="kicker">{fmtLong(today)}</div>
        <h1>{greeting()}, <em>{user.name.split(' ')[0]}</em>.</h1>
        <p className="hero-quote">{dailyQuote()}</p>
      </div>
      {stats?.activityStreak > 0 && <div className="streak"><Flame size={18} /><strong>{stats.activityStreak}</strong><span>{stats.activityStreak === 1 ? 'ден' : 'дена'} по ред</span></div>}
    </header>

    <QuickAdd defaultDue={today} placeholder="Што треба да направиш денес? (Enter, „!“ за висок приоритет)" onAdded={refresh} />

    <section className="pulse">
      <div className="pulse-card">
        <Ring value={taskPct} label={s ? `${s.tasksCompleted}` : '·'} />
        <div><strong>Задачи денес</strong><span>{s ? `${s.tasksCompleted} завршени, ${s.tasksDue} остануваат` : '...'}</span></div>
      </div>
      <div className="pulse-card">
        <Ring value={habitPct} tone="var(--clay)" label={s ? `${s.habitsDone}/${s.habitsTotal}` : '·'} />
        <div><strong>Навики</strong><span>{s?.habitsTotal ? `${Math.round(habitPct)}% исполнети денес` : 'Додај прва навика'}</span></div>
      </div>
      <div className="pulse-card">
        <div className="pulse-num">{w?.tasksCompleted ?? '·'}</div>
        <div><strong>Оваа недела</strong><span className={trend >= 0 ? 'up' : 'down'}>
          {w && (trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
          {w ? `${trend >= 0 ? '+' : ''}${trend} во однос на минатата` : '...'}</span></div>
      </div>
      <button className="pulse-card clickable" onClick={() => go('journal')}>
        <div className={`pulse-icon ${s?.journal ? 'ok' : ''}`}><NotebookPen size={20} /></div>
        <div><strong>Дневник</strong><span>{s?.journal ? 'Денес веќе запиша' : 'Како помина денот?'}</span></div>
      </button>
    </section>

    <div className="today-grid">
      <section className="card">
        <div className="card-head"><h2>Фокус за денес</h2><button className="link" onClick={() => go('tasks')}>Сите задачи <ArrowRight size={14} /></button></div>
        {tasks === null ? <div className="skeleton" /> : focus.length === 0
          ? <Empty title="Денес е чисто." text={noDate.length ? `Имаш ${noDate.length} задачи без рок. Избери една и стави ја за денес.` : 'Додај задача погоре.'} />
          : focus.map(t => <TaskRow key={t.id} task={t} compact onToggle={() => toggleTask(t)} onEdit={() => setEdit(t)} />)}
        {finishedToday.length > 0 && <>
          <div className="sub-head">Завршено денес · {finishedToday.length}</div>
          {finishedToday.map(t => <TaskRow key={t.id} task={t} compact onToggle={() => toggleTask(t)} />)}
        </>}
      </section>

      <div className="stack">
        <section className="card">
          <div className="card-head"><h2>Навики</h2><button className="link" onClick={() => go('habits')}>Уреди <ArrowRight size={14} /></button></div>
          {habits === null ? <div className="skeleton" /> : habits.length === 0
            ? <Empty title="Уште немаш навики." text="Почни со една мала, на пример 10 минути читање."><button className="ghost sm" onClick={() => go('habits')}>Додај навика</button></Empty>
            : habits.map(h => {
              const done = h.days.includes(today);
              return <div key={h.id} className={`habit-line ${done ? 'is-done' : ''}`}>
                <Check3 done={done} onClick={() => toggleHabit(h)} label={h.title} />
                <span className="grow">{h.title}</span>
                {h.currentStreak > 1 && <span className="mini-streak"><Flame size={12} />{h.currentStreak}</span>}
              </div>;
            })}
        </section>

        <section className="card">
          <div className="card-head"><h2>Оваа недела</h2><button className="link" onClick={() => go('progress')}>Напредок <ArrowRight size={14} /></button></div>
          <div className="week-strip">
            {weekDays.map(d => {
              const row = dayMap[d], future = d > today;
              const hp = row?.habitsTotal ? row.habitsDone / row.habitsTotal : 0;
              return <div key={d} className={`wday ${d === today ? 'is-today' : ''} ${future ? 'future' : ''}`} title={row ? `${row.tasksCompleted} задачи, ${row.habitsDone}/${row.habitsTotal} навики` : ''}>
                <div className="wbar"><i style={{ height: `${future ? 0 : Math.max(4, 100 * (row?.tasksCompleted || 0) / maxDay)}%` }} /></div>
                <div className="wdot" style={{ opacity: future ? .15 : .25 + hp * .75 }} />
                <span>{fmtWeekday(d)}</span>
              </div>;
            })}
          </div>
          <div className="legend"><span><i className="lg-bar" />завршени задачи</span><span><i className="lg-dot" />навики</span></div>
        </section>

        {goals?.length > 0 && <section className="card">
          <div className="card-head"><h2>Цели</h2><button className="link" onClick={() => go('goals')}>Сите <ArrowRight size={14} /></button></div>
          {goals.slice(0, 3).map(g => <div key={g.id} className="goal-mini">
            <div className="row-between"><span>{g.title}</span><strong>{g.progress}%</strong></div>
            <Bar value={g.progress} />
          </div>)}
        </section>}

        {isWeekend && <button className="card review-cta" onClick={() => go('review')}>
          <CalendarCheck size={22} /><div><strong>Време за неделен преглед</strong><span>5 минути: што помина добро, што да подобриш.</span></div><ArrowRight size={18} />
        </button>}
      </div>
    </div>

    {edit && <TaskModal task={edit} goals={goals} onClose={() => setEdit(null)} onSaved={() => { refresh(); }} />}
  </div>;
}
