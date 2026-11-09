import React, { useEffect, useState } from 'react';
import { Sun, ListChecks, Target, Repeat2, NotebookPen, ChartColumn, CalendarCheck, LogOut, Ellipsis, Moon, X } from 'lucide-react';
import { api, auth, setUnauthorizedHandler } from './api.js';
import { dailyQuote } from './lib.js';
import AuthScreen from './pages/AuthScreen.jsx';
import Today from './pages/Today.jsx';
import Tasks from './pages/Tasks.jsx';
import Goals from './pages/Goals.jsx';
import Habits from './pages/Habits.jsx';
import Journal from './pages/Journal.jsx';
import Progress from './pages/Progress.jsx';
import Review from './pages/Review.jsx';

const PAGES = [
  { id: 'today', label: 'Денес', icon: Sun, el: Today },
  { id: 'tasks', label: 'Задачи', icon: ListChecks, el: Tasks },
  { id: 'goals', label: 'Цели', icon: Target, el: Goals },
  { id: 'habits', label: 'Навики', icon: Repeat2, el: Habits },
  { id: 'journal', label: 'Дневник', icon: NotebookPen, el: Journal },
  { id: 'progress', label: 'Напредок', icon: ChartColumn, el: Progress },
  { id: 'review', label: 'Неделен преглед', icon: CalendarCheck, el: Review },
];
const MOBILE_MAIN = ['today', 'tasks', 'habits', 'journal'];

const pageFromHash = () => {
  const id = location.hash.replace('#/', '');
  return PAGES.some(p => p.id === id) ? id : 'today';
};

function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('myspace.theme') || ''; } catch { return ''; } });
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('myspace.theme', theme); } catch { /* */ }
  }, [theme]);
  const isDark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  return [isDark, () => setTheme(isDark ? 'light' : 'dark')];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!auth.token);
  const [page, setPage] = useState(pageFromHash);
  const [more, setMore] = useState(false);
  const [isDark, toggleTheme] = useTheme();

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    if (auth.token) api.get('/auth/me').then(setUser).catch(() => auth.clear()).finally(() => setChecking(false));
    const onHash = () => setPage(pageFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const go = id => { location.hash = `/${id}`; setMore(false); window.scrollTo({ top: 0 }); };
  const logout = () => { auth.clear(); setUser(null); };

  if (checking) return <div className="boot"><span className="brand-dot" /></div>;
  if (!user) return <AuthScreen onAuth={(u, token) => { auth.set(token); setUser(u); }} />;

  const Current = PAGES.find(p => p.id === page).el;

  return <div className="shell">
    <aside className="side">
      <div className="brand"><span className="brand-dot" /><span>My Space</span></div>
      <nav className="side-nav">
        {PAGES.map(p => <button key={p.id} className={page === p.id ? 'on' : ''} onClick={() => go(p.id)}>
          <p.icon size={18} strokeWidth={1.8} /><span>{p.label}</span>
        </button>)}
      </nav>
      <div className="side-foot">
        <p className="side-quote">{dailyQuote()}</p>
        <div className="me">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
        </div>
        <div className="side-actions">
          <button className="ghost sm" onClick={toggleTheme}>{isDark ? <Sun size={15} /> : <Moon size={15} />}{isDark ? 'Светла' : 'Темна'}</button>
          <button className="ghost sm" onClick={logout}><LogOut size={15} />Одјава</button>
        </div>
      </div>
    </aside>

    <main className="main">
      <Current user={user} go={go} />
    </main>

    <nav className="tabbar">
      {PAGES.filter(p => MOBILE_MAIN.includes(p.id)).map(p => <button key={p.id} className={page === p.id ? 'on' : ''} onClick={() => go(p.id)}>
        <p.icon size={21} strokeWidth={1.8} /><span>{p.label}</span>
      </button>)}
      <button className={!MOBILE_MAIN.includes(page) ? 'on' : ''} onClick={() => setMore(true)}><Ellipsis size={21} /><span>Повеќе</span></button>
    </nav>

    {more && <div className="sheet-backdrop" onClick={() => setMore(false)}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-head"><strong>Повеќе</strong><button className="icon" onClick={() => setMore(false)} aria-label="Затвори"><X size={18} /></button></div>
        {PAGES.filter(p => !MOBILE_MAIN.includes(p.id)).map(p => <button key={p.id} className="sheet-item" onClick={() => go(p.id)}><p.icon size={19} />{p.label}</button>)}
        <button className="sheet-item" onClick={toggleTheme}>{isDark ? <Sun size={19} /> : <Moon size={19} />}{isDark ? 'Светла тема' : 'Темна тема'}</button>
        <button className="sheet-item" onClick={logout}><LogOut size={19} />Одјава ({user.name})</button>
      </div>
    </div>}
  </div>;
}
