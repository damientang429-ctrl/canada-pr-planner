import { CONFIG, IELTS_TO_CLB, STAGES, TEF_TO_NCLC } from './config';
import type { AppData, Exam, MonthRecord, Scores, Skill, TestKind } from './types';

const DAY = 86400000;
export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function dateValue(date: string) { return Date.parse(`${date}T00:00:00Z`); }
export function validDate(date: unknown): date is string {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(dateValue(date)) && new Date(dateValue(date)).toISOString().slice(0, 10) === date;
}
export function addDays(date: string, days: number) { return new Date(dateValue(date) + days * DAY).toISOString().slice(0, 10); }
export function addMonths(date: string, months: number) {
  const original = new Date(dateValue(date));
  const target = new Date(Date.UTC(original.getUTCFullYear(), original.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(original.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string) { return Math.round((dateValue(to) - dateValue(from)) / DAY); }
export function weekStart(date: string) { return addDays(date, -((new Date(dateValue(date)).getUTCDay() + 6) % 7)); }
export function inWeek(date: string, today: string) { return date <= today && weekStart(date) === weekStart(today); }
export const money = (amount: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: CONFIG.currency, maximumFractionDigits: 2 }).format(amount);
export const number = (amount: number) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(amount);
export const shortDate = (date: string) => date ? date.replaceAll('-', '.') : '待安排';
export const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
// Local HTTP previews on a phone may not expose randomUUID (secure contexts only).
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function convertScore(kind: TestKind, skill: Skill, score: number | null): number | null {
  if (score === null || !Number.isFinite(score) || score < 0 || score > CONFIG.language.maxScores[kind][skill] || Math.abs(score / CONFIG.language.scoreSteps[kind] - Math.round(score / CONFIG.language.scoreSteps[kind])) > 1e-8) return null;
  const table = kind === 'ielts' ? IELTS_TO_CLB : TEF_TO_NCLC;
  return [...table[skill]].sort((a, b) => b[0] - a[0]).find(([, minimum]) => score >= minimum)?.[0] ?? 0;
}
export const levelLabel = (level: number | null) => level === null ? '—' : level === 0 ? '低于 4' : level === 10 ? '10+' : String(level);
export function overallLevel(kind: TestKind, scores: Scores) {
  const levels = (Object.keys(scores) as Skill[]).map(skill => convertScore(kind, skill, scores[skill]));
  return levels.some(level => level === null) ? null : Math.min(...levels as number[]);
}
export function targetScore(kind: TestKind, skill: Skill) {
  const target = kind === 'ielts' ? CONFIG.language.englishTarget : CONFIG.language.frenchTarget;
  return (kind === 'ielts' ? IELTS_TO_CLB : TEF_TO_NCLC)[skill].find(([level]) => level === target)![1];
}
export function examStatus(exam: Exam, today: string) {
  const expiry = addMonths(exam.date, CONFIG.language.validYears * 12);
  const days = daysBetween(today, expiry);
  return { expiry, days, status: days <= 0 ? 'expired' : days <= CONFIG.language.reminderDays ? 'soon' : 'valid' } as const;
}
export function latestExam(data: AppData, kind: TestKind, today: string) {
  return data.exams.filter(exam => exam.kind === kind && exam.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0];
}
export function currentStage(data: AppData, today: string) {
  return STAGES.find(s => s.id === data.settings.stageOverride) ?? [...STAGES].reverse().find(s => today >= s.start) ?? STAGES[0];
}
export function monthNet(record: MonthRecord) { return roundMoney(record.partTime + record.fullTime - Object.values(record.expenses).reduce((sum, n) => sum + n, 0)); }
export function accountBalances(data: AppData, asOf = '9999-12-31') {
  const balances = { ...data.settings.initialBalances };
  data.months.filter(row => row.month <= asOf.slice(0, 7)).forEach(row => { balances[row.account] = roundMoney(balances[row.account] + monthNet(row)); });
  return balances;
}
export function totalBalance(data: AppData, asOf = '9999-12-31') { return roundMoney(Object.values(accountBalances(data, asOf)).reduce((sum, n) => sum + n, 0)); }
export function monthlySummary(data: AppData) {
  const months = [...new Set(data.months.map(row => row.month))].sort();
  let balance = Object.values(data.settings.initialBalances).reduce((sum, n) => sum + n, 0);
  return months.map(month => {
    const rows = data.months.filter(r => r.month === month);
    const income = roundMoney(rows.reduce((sum, r) => sum + r.partTime + r.fullTime, 0));
    const expenses = { rent: 0, food: 0, phone: 0, transport: 0, other: 0 };
    rows.forEach(r => (Object.keys(expenses) as (keyof typeof expenses)[]).forEach(key => { expenses[key] = roundMoney(expenses[key] + r.expenses[key]); }));
    const expense = roundMoney(Object.values(expenses).reduce((sum, n) => sum + n, 0));
    balance = roundMoney(balance + income - expense);
    return { month, income, expenses, expense, balance, rows };
  });
}
export type BalanceAlert = { level: 'green' | 'yellow' | 'red' | 'critical'; title: string; detail: string };
export function getBalanceAlert(balance: number, today: string, graduationDate: string = CONFIG.graduationDate, checkpointBalance = balance): BalanceAlert {
  if (!Number.isFinite(balance) || !Number.isFinite(checkpointBalance) || !validDate(today) || !validDate(graduationDate)) throw new Error('余额或日期无效');
  const f = CONFIG.finance;
  if (balance < f.critical) return { level: 'critical', title: '最高级预警', detail: `余额低于 ${money(f.critical)}，立即检查必要支出与收入安排。` };
  if (today < graduationDate && balance < f.preGraduationRed) return { level: 'red', title: '紧急模式', detail: `毕业前余额低于 ${money(f.preGraduationRed)}，暂停非必要支出。` };
  if (today >= f.checkpointDate && today <= graduationDate && checkpointBalance < f.checkpointMinimum) return { level: 'yellow', title: '检查点未达标', detail: `${shortDate(f.checkpointDate)} 检查点余额低于 ${money(f.checkpointMinimum)}。` };
  if (today === graduationDate && balance < f.graduationTarget) return { level: 'yellow', title: '毕业储备不足', detail: `毕业目标为 ${money(f.graduationTarget)}，尚差 ${money(f.graduationTarget - balance)}。` };
  return { level: 'green', title: '余额稳健', detail: '当前未触发余额预警，继续按计划记录收支。' };
}
export function workProgress(data: AppData, today: string) {
  const start = data.settings.employmentDate;
  const anniversary = start ? addMonths(start, CONFIG.jobs.requiredMonths) : '';
  const cutoff = addMonths(today, -CONFIG.jobs.lookbackYears * 12);
  const weeks = new Map<string, number>();
  let rawHours = 0;
  for (const log of data.workLogs) {
    if (!start || log.week < weekStart(start) || log.week > today || log.week < cutoff || !log.eligible || log.teer > CONFIG.jobs.highestSkilledTeer) continue;
    rawHours += log.hours;
    weeks.set(log.week, (weeks.get(log.week) ?? 0) + log.hours);
  }
  const hours = [...weeks.values()].reduce((sum, value) => sum + Math.min(value, CONFIG.jobs.weeklyHourCap), 0);
  return { hours, rawHours, anniversary, completed: !!anniversary && today >= anniversary && hours >= CONFIG.jobs.requiredHours };
}
