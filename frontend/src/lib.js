import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export const AREAS = [
  { name: 'Работа', color: 'var(--a-work)' },
  { name: 'Blesni', color: 'var(--a-blesni)' },
  { name: 'Кариера', color: 'var(--a-career)' },
  { name: 'Личен развој', color: 'var(--a-growth)' },
  { name: 'Финансии', color: 'var(--a-money)' },
  { name: 'Личен живот', color: 'var(--a-life)' },
];
export const areaColor = name => AREAS.find(a => a.name === name)?.color || 'var(--muted)';

export const PRIORITIES = [
  { value: 0, label: 'Низок' },
  { value: 1, label: 'Среден' },
  { value: 2, label: 'Висок' },
];

export const MOODS = [
  { value: 1, label: 'Тешко', face: '◔' },
  { value: 2, label: 'Уморно', face: '◑' },
  { value: 3, label: 'Во ред', face: '◕' },
  { value: 4, label: 'Добро', face: '●' },
  { value: 5, label: 'Одлично', face: '✦' },
];

export const HABIT_COLORS = ['sage', 'clay', 'sky', 'plum', 'gold'];

// Датуми: секогаш локален ден во формат yyyy-mm-dd
export const iso = d => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const todayIso = () => iso(new Date());
export const addDays = (isoStr, n) => { const d = new Date(isoStr + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
export const weekStartOf = isoStr => { const d = new Date(isoStr + 'T12:00:00'); const dow = (d.getDay() + 6) % 7; return addDays(isoStr, -dow); };

// Сопствени македонски имиња, бидејќи некои прелистувачи немаат mk-MK локализација.
const MONTHS = ['јануари', 'февруари', 'март', 'април', 'мај', 'јуни', 'јули', 'август', 'септември', 'октомври', 'ноември', 'декември'];
const MONTHS_SHORT = ['јан', 'фев', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'ное', 'дек'];
const WEEKDAYS = ['недела', 'понеделник', 'вторник', 'среда', 'четврток', 'петок', 'сабота'];
const WEEKDAYS_SHORT = ['нед', 'пон', 'вто', 'сре', 'чет', 'пет', 'саб'];
const D = s => new Date(s + 'T12:00:00');
export const fmtDay = s => `${D(s).getDate()} ${MONTHS[D(s).getMonth()]}`;
export const fmtDayShort = s => `${D(s).getDate()} ${MONTHS_SHORT[D(s).getMonth()]}`;
export const fmtWeekday = s => WEEKDAYS_SHORT[D(s).getDay()];
export const fmtLong = s => `${WEEKDAYS[D(s).getDay()]}, ${fmtDay(s)}`;
export const fmtFull = s => `${fmtDay(s)} ${D(s).getFullYear()}`;

export function dueLabel(due) {
  if (!due) return null;
  const diff = daysBetween(todayIso(), due);
  if (diff < 0) return { text: diff === -1 ? 'Вчера' : `Задоцнето ${-diff} дена`, tone: 'late' };
  if (diff === 0) return { text: 'Денес', tone: 'today' };
  if (diff === 1) return { text: 'Утре', tone: 'soon' };
  if (diff < 7) return { text: fmtWeekday(due), tone: 'soon' };
  return { text: fmtDayShort(due), tone: '' };
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Добра ноќ';
  if (h < 12) return 'Добро утро';
  if (h < 18) return 'Добар ден';
  return 'Добра вечер';
}

const QUOTES = [
  'Малите чекори секој ден создаваат големи промени.',
  'Не мора да е совршено. Доволно е да продолжиш.',
  'Фокусот е да кажеш „не“ на добрите идеи за да кажеш „да“ на најдобрите.',
  'Дисциплината е да се сетиш што сакаш.',
  'Напредок, не совршенство.',
  'Едно нешто во исто време, направено добро.',
  'Ова што денес ти изгледа мало, за една година ќе биде основа.',
];
export const dailyQuote = () => QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

// Едноставен hook за вчитување податоци од API-то.
export function useData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api.get(path).then(d => { setData(d); setError(''); }).catch(e => setError(e.message)), [path]);
  useEffect(() => { load(); }, [load]);
  return [data, load, setData, error];
}
