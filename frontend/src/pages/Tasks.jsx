import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../api.js';
import { AREAS, useData, todayIso, addDays, weekStartOf } from '../lib.js';
import { PageHead, TaskRow, TaskModal, QuickAdd, Chips, Empty } from '../ui.jsx';

const GROUPS = [
  ['late', 'Задоцнети'], ['today', 'Денес'], ['tomorrow', 'Утре'], ['week', 'Оваа недела'], ['later', 'Подоцна'], ['none', 'Без рок'],
];

function groupOf(t, today) {
  if (!t.dueDate) return 'none';
  if (t.dueDate < today) return 'late';
  if (t.dueDate === today) return 'today';
  if (t.dueDate === addDays(today, 1)) return 'tomorrow';
  if (t.dueDate <= addDays(weekStartOf(today), 6)) return 'week';
  return 'later';
}

export default function Tasks() {
  const [status, setStatus] = useState('open');
  const [tasks, load, setTasks] = useData(`/tasks?status=${status}`);
  const [goals] = useData('/goals');
  const [area, setArea] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | task
  const today = todayIso();

  const filtered = useMemo(() => (tasks || []).filter(t =>
    (!area || t.area === area) && (!q || (t.title + ' ' + (t.notes || '')).toLowerCase().includes(q.toLowerCase()))), [tasks, area, q]);

  const toggle = async t => {
    const u = await api.patch(`/tasks/${t.id}/toggle`);
    setTasks(ts => status === 'all' ? ts.map(x => x.id === t.id ? u : x) : ts.filter(x => x.id !== t.id));
  };
  const remove = async t => { await api.del(`/tasks/${t.id}`); setTasks(ts => ts.filter(x => x.id !== t.id)); };

  const groups = status === 'open'
    ? GROUPS.map(([id, label]) => [id, label, filtered.filter(t => groupOf(t, today) === id)]).filter(g => g[2].length)
    : [['all', status === 'done' ? 'Завршени' : 'Сите', filtered]];

  return <div className="page">
    <PageHead kicker="Организирај се" title="Задачи">
      <button className="primary" onClick={() => setModal('new')}><Plus size={16} />Нова задача</button>
    </PageHead>

    <QuickAdd onAdded={t => setTasks(ts => status === 'done' ? ts : [t, ...ts])} placeholder="Брз внес без рок... (Enter)" />

    <div className="toolbar">
      <Chips options={[{ value: 'open', label: 'Отворени' }, { value: 'done', label: 'Завршени' }, { value: 'all', label: 'Сите' }]} value={status} onChange={setStatus} />
      <div className="search"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Пребарај..." aria-label="Пребарај задачи" /></div>
    </div>
    <Chips options={AREAS.map(a => a.name)} value={area} onChange={setArea} all="Сите области" />

    {tasks === null ? <div className="card"><div className="skeleton" /></div>
      : filtered.length === 0 ? <div className="card"><Empty title={status === 'open' ? 'Нема отворени задачи.' : 'Ништо за прикажување.'} text={q || area ? 'Пробај друг филтер.' : 'Додај нешто со брзиот внес погоре.'} /></div>
        : groups.map(([id, label, items]) => <section key={id} className="card">
          <div className="card-head"><h2 className={id === 'late' ? 'late' : ''}>{label}</h2><span className="count">{items.length}</span></div>
          {items.map(t => <TaskRow key={t.id} task={t} onToggle={() => toggle(t)} onEdit={() => setModal(t)} onDelete={() => remove(t)} />)}
        </section>)}

    {modal && <TaskModal task={modal === 'new' ? null : modal} goals={goals} onClose={() => setModal(null)} onSaved={() => load()} />}
  </div>;
}
