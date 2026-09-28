import { useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Check, ChevronDown, Download, Flag, LayoutDashboard, Languages, Leaf, LockKeyhole, Settings2, Upload, Wallet } from 'lucide-react';
import { CONFIG, STAGES } from './config';
import { PlannerContext } from './context';
import type { Page } from './context';
import type { AppData, StageId } from './types';
import { todayISO } from './lib';
import { downloadJSON, loadData, parseBackup } from './storage';
import { Field, Form, Modal, str } from './components';
import Dashboard from './Dashboard';
import Milestones from './Milestones';
import Finance from './Finance';
import Language from './Language';
import Jobs from './Jobs';
import { usePlannerTools } from './webmcp';

const PAGES = [
  { id: 'dashboard', name: '总览', icon: LayoutDashboard, english: 'Overview' },
  { id: 'milestones', name: '里程碑', icon: Flag, english: 'Milestones' },
  { id: 'finance', name: '财务', icon: Wallet, english: 'Finances' },
  { id: 'language', name: '语言', icon: Languages, english: 'Languages' },
  { id: 'jobs', name: '求职', icon: BriefcaseBusiness, english: 'Career' },
] as const;
function readPage(): Page { const page = location.hash.replace('#', ''); return PAGES.some(p => p.id === page) ? page as Page : 'dashboard'; }

export default function App() {
  const [loaded] = useState(loadData);
  const [data, setData] = useState<AppData>(loaded.data);
  const [page, setPage] = useState<Page>(readPage);
  const [today, setToday] = useState(todayISO);
  const [saveError, setSaveError] = useState(loaded.error);
  const [blocked, setBlocked] = useState(!!loaded.error);
  const [toast, setToast] = useState('');
  const [settings, setSettings] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  usePlannerTools(data, setData, today);
  useEffect(() => {
    if (blocked) return;
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(data)); setSaveError(''); }
    catch { setSaveError('本次更改尚未保存：浏览器存储不可用或已满，请导出 JSON 备份。'); }
  }, [data, blocked]);
  useEffect(() => { const changed = () => { setPage(readPage()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', changed); const timer = setInterval(() => setToday(todayISO()), 60000); return () => { window.removeEventListener('hashchange', changed); clearInterval(timer); }; }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);
  const navigate = (next: Page) => { location.hash = next; setPage(next); window.scrollTo(0, 0); };
  return <PlannerContext.Provider value={{ data, setData, today, navigate, notify: setToast }}><div className="app-shell">
    <aside className="sidebar"><a href="#dashboard" className="brand"><span className="brand-mark"><Leaf size={25} strokeWidth={1.6} /></span><span>加拿大 PR<small>规划追踪</small></span></a><div className="sidebar-caption">我的工作台</div><nav aria-label="主导航">{PAGES.map(p => <a key={p.id} href={`#${p.id}`} className={`nav-link ${page === p.id ? 'active' : ''}`} aria-current={page === p.id ? 'page' : undefined}><p.icon size={20} /><span>{p.name}</span>{page === p.id && <span className="nav-indicator" />}</a>)}</nav><div className="sidebar-bottom"><div className="plan-note"><span className="small">一份属于自己的长期计划</span><strong>2026 <span>——</span> 2029</strong><div className="plan-note-line" /></div><button className="nav-link settings-link" onClick={() => setSettings(true)}><Settings2 size={19} /><span>计划设置</span></button><div className="local-label"><LockKeyhole size={13} />仅保存在当前浏览器</div></div></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">我的 PR 计划<span>/</span><strong>{PAGES.find(p => p.id === page)?.name}</strong></div><div className="topbar-actions"><span className={`save-status ${saveError ? 'danger-text' : ''}`}><span className="status-dot" />{saveError ? '尚未保存' : '已自动保存'}</span><button className="button compact" onClick={() => { downloadJSON(data, `canada-pr-${today}.json`); setToast('JSON 备份已导出'); }}><Download size={16} /><span>导出 JSON</span></button><button className="button compact import-button" aria-label="导入 JSON" onClick={() => importRef.current?.click()}><Upload size={16} /><span>导入 JSON</span></button><input ref={importRef} type="file" accept=".json,application/json" hidden onChange={async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; try { if (file.size > CONFIG.validation.maxImportBytes) throw new Error('备份文件不能超过 5 MB。'); setPendingImport(parseBackup(await file.text())); setImportError(''); } catch (e) { setImportError(e instanceof Error ? e.message : '无法读取此文件。'); } }} /><button className="mobile-settings icon-button" aria-label="计划设置" onClick={() => setSettings(true)}><Settings2 size={20} /></button></div></header>
      <main id="main-content">{saveError && <div className="notice red" role="alert"><div><strong>{blocked ? '原存档暂时无法读取，已暂停自动保存' : '数据未保存'}</strong><p>{saveError}</p>{blocked && <div className="inline-actions">{loaded.raw && <button className="button" onClick={() => downloadJSON(loaded.raw!, 'canada-pr-unreadable-backup.json')}>下载原始存档</button>}<button className="button" onClick={() => { if (confirm('确认使用初始数据？请先下载需要保留的原始存档。')) setBlocked(false); }}>使用初始数据</button></div>}</div></div>}
      {page === 'dashboard' && <Dashboard />}{page === 'milestones' && <Milestones />}{page === 'finance' && <Finance />}{page === 'language' && <Language />}{page === 'jobs' && <Jobs />}
      <footer className="page-footer"><span><Leaf size={13} />加拿大 PR · 个人规划追踪</span><span>一步一步，按自己的节奏。</span></footer></main>
    </div>
    <nav className="mobile-nav" aria-label="手机导航">{PAGES.map(p => <a key={p.id} href={`#${p.id}`} className={page === p.id ? 'active' : ''} aria-current={page === p.id ? 'page' : undefined}><p.icon size={20} /><span>{p.name}</span></a>)}</nav>
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    {importError && <Modal title="导入未完成" onClose={() => setImportError('')}><p role="alert">{importError}</p><p className="form-hint">当前数据没有改变。</p><div className="form-actions"><button className="button primary" onClick={() => setImportError('')}>知道了</button></div></Modal>}
    {pendingImport && <Modal title="确认导入备份" onClose={() => setPendingImport(null)}><p>文件校验通过。导入后将替换当前浏览器中的全部规划数据。</p><div className="import-summary"><span><b>{pendingImport.tasks.length}</b> 个里程碑</span><span><b>{pendingImport.months.length}</b> 条收支</span><span><b>{pendingImport.exams.length}</b> 次考试</span><span><b>{pendingImport.studyLogs.length}</b> 条学习日志</span><span><b>{pendingImport.applications.length}</b> 份申请</span><span><b>{pendingImport.workLogs.length}</b> 周工时</span></div><button className="text-button" onClick={() => downloadJSON(data, `canada-pr-before-import-${today}.json`)}>先导出当前数据<Download size={15} /></button><div className="form-actions"><button className="button" onClick={() => setPendingImport(null)}>取消</button><button className="button primary" onClick={() => { setData(pendingImport); setBlocked(false); setPendingImport(null); setToast('备份已导入'); }}>导入并替换</button></div></Modal>}
    {settings && <Modal title="计划设置" onClose={() => setSettings(false)}><Form onCancel={() => setSettings(false)} onSubmit={form => { setData(d => ({ ...d, settings: { ...d.settings, graduationDate: str(form, 'graduationDate'), employmentDate: str(form, 'employmentDate'), stageOverride: str(form, 'stage') ? Number(str(form, 'stage')) as StageId : null } })); setSettings(false); setToast('计划设置已保存'); }}><div className="form-grid"><Field label="预计毕业日期"><input type="date" name="graduationDate" required defaultValue={data.settings.graduationDate} /></Field><Field label="技术类工作入职日期" hint="尚未入职可以留空"><input type="date" name="employmentDate" defaultValue={data.settings.employmentDate} /></Field><Field label="当前阶段" hint="自动模式按计划阶段日期切换"><div className="select-wrap"><select name="stage" defaultValue={data.settings.stageOverride ?? ''}><option value="">按日期自动判断</option>{STAGES.map(s => <option key={s.id} value={s.id}>阶段 {s.id} · {s.name}</option>)}</select><ChevronDown size={16} /></div></Field></div></Form></Modal>}
  </div></PlannerContext.Provider>;
}
