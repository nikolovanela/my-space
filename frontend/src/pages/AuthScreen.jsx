import React, { useState } from 'react';
import { api } from '../api.js';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = mode === 'login'
        ? await api.post('/auth/login', { email: f.email, password: f.password })
        : await api.post('/auth/register', f);
      onAuth(r.user, r.token);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return <div className="auth">
    <div className="auth-art">
      <div className="brand"><span className="brand-dot" /><span>My Space</span></div>
      <h1>Едно место за<br /><em>сè што градиш.</em></h1>
      <p>Задачи, цели, навики и дневник, со дневен и неделен преглед на тоа колку напредуваш.</p>
      <ul>
        <li>Што треба да завршиш денес</li>
        <li>Колку си блиску до целите</li>
        <li>Кои навики ги држиш</li>
        <li>Што научи оваа недела</li>
      </ul>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Добредојде назад' : 'Направи сметка'}</h2>
      <p className="muted">{mode === 'login' ? 'Најави се во твојот простор.' : 'Сметката ти ги синхронизира податоците меѓу компјутер и телефон.'}</p>
      {mode === 'register' && <label>Име<input required value={f.name} onChange={e => set('name', e.target.value)} autoComplete="given-name" /></label>}
      <label>Е-пошта<input required type="email" value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></label>
      <label>Лозинка<input required type="password" minLength={mode === 'register' ? 8 : undefined} value={f.password} onChange={e => set('password', e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {err && <div className="error">{err}</div>}
      <button className="primary block" disabled={busy}>{busy ? 'Момент...' : mode === 'login' ? 'Најави се' : 'Креирај сметка'}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
        {mode === 'login' ? 'Немаш сметка? Регистрирај се' : 'Веќе имаш сметка? Најави се'}
      </button>
    </form>
  </div>;
}
