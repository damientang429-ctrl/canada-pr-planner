import { CONFIG, INITIAL_DATA, JOB_STATUSES } from './config';
import { convertScore, validDate, weekStart } from './lib';
import type { AppData, Skill, TestKind } from './types';

export const freshData = (): AppData => structuredClone(INITIAL_DATA);
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 10000;
const numeric = (v: unknown, max: number = CONFIG.validation.maxAmount): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
const account = (v: unknown) => ['reserve', 'fixed', 'living'].includes(String(v));
const stage = (v: unknown) => typeof v === 'number' && [1, 2, 3, 4].includes(v);
const fields = (v: unknown, keys: string[], validate: (value: unknown) => boolean) => object(v) && keys.every(k => validate(v[k]));
const list = (v: unknown, validate: (value: Record<string, unknown>) => boolean) => Array.isArray(v) && v.length <= 10000 && v.every(r => object(r) && text(r.id) && !!r.id && validate(r)) && new Set(v.map(r => r.id)).size === v.length;
const teer = (v: unknown) => numeric(v, CONFIG.jobs.maxTeer) && Number.isInteger(v);

export function parseBackup(raw: string): AppData {
  if (new Blob([raw]).size > CONFIG.validation.maxImportBytes) throw new Error('备份文件不能超过 5 MB。');
  let v: unknown;
  try { v = JSON.parse(raw); } catch { throw new Error('无法读取 JSON，请选择本应用导出的备份文件。'); }
  if (!object(v) || v.version !== CONFIG.schemaVersion) throw new Error('备份版本不兼容，请使用版本 1 的备份。');
  const s = v.settings;
  const valid = object(s) && validDate(s.graduationDate) && (s.employmentDate === '' || validDate(s.employmentDate)) && (s.stageOverride === null || stage(s.stageOverride))
    && fields(s.weeklyStudyGoals, ['1', '2', '3', '4'], n => numeric(n, CONFIG.validation.maxHours))
    && numeric(s.monthlyLivingCost) && fields(s.initialBalances, ['reserve', 'fixed', 'living'], numeric)
    && fields(v.savings, ['emergency', 'french', 'pr'], numeric)
    && list(v.tasks, r => stage(r.stage) && text(r.title) && !!r.title.trim() && (r.due === '' || validDate(r.due)) && typeof r.done === 'boolean')
    && list(v.months, r => typeof r.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(r.month) && account(r.account) && numeric(r.partTime) && numeric(r.fullTime) && fields(r.expenses, ['rent', 'food', 'phone', 'transport', 'other'], numeric) && text(r.note))
    && list(v.exams, r => ['ielts', 'tef'].includes(String(r.kind)) && validDate(r.date) && object(r.scores) && ['listening', 'reading', 'writing', 'speaking'].every(k => typeof (r.scores as Record<string, unknown>)[k] === 'number' && convertScore(r.kind as TestKind, k as Skill, (r.scores as Record<string, number>)[k]) !== null))
    && list(v.studyLogs, r => validDate(r.date) && numeric(r.hours, CONFIG.validation.maxStudyDailyHours) && text(r.note))
    && list(v.applications, r => ['company', 'position', 'city', 'noc', 'note'].every(k => text(r[k])) && !!String(r.company).trim() && !!String(r.position).trim() && (r.noc === '' || /^\d{5}$/.test(String(r.noc))) && teer(r.teer) && validDate(r.date) && JOB_STATUSES.some(s => s.value === r.status) && typeof r.custom === 'boolean')
    && list(v.contacts, r => validDate(r.date) && text(r.name) && !!r.name.trim() && text(r.note))
    && list(v.workLogs, r => validDate(r.week) && weekStart(r.week) === r.week && numeric(r.hours, CONFIG.validation.maxHours) && teer(r.teer) && typeof r.eligible === 'boolean' && text(r.note));
  if (!valid) throw new Error('备份结构或数据不完整：请检查日期、金额、分数及记录字段。原数据没有改变。');
  const data = v as unknown as AppData;
  if (new Set(data.months.map(r => `${r.month}-${r.account}`)).size !== data.months.length) throw new Error('同一账户同一月份不能有重复月记录。');
  if (new Set(data.workLogs.map(r => r.week)).size !== data.workLogs.length) throw new Error('每周工时应合并为一条记录。');
  return data;
}
export function loadData(): { data: AppData; error: string; raw: string | null } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CONFIG.storageKey);
    return { data: raw ? parseBackup(raw) : freshData(), error: '', raw };
  } catch (e) { return { data: freshData(), error: e instanceof Error ? e.message : '浏览器不允许访问本地存储。', raw }; }
}
export function downloadJSON(data: AppData | string, name = 'canada-pr-backup.json') {
  const url = URL.createObjectURL(new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
