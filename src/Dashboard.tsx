import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronRight, CircleCheck, Clock3, GraduationCap, Languages, Wallet, ArrowUpRight } from 'lucide-react';
import { usePlanner } from './context';
import { CONFIG, STAGES } from './config';
import { currentStage, daysBetween, examStatus, getBalanceAlert, inWeek, latestExam, levelLabel, money, overallLevel, shortDate, totalBalance, workProgress } from './lib';
import { LinkButton, Panel, Progress } from './components';

export default function Dashboard() {
  const { data, setData, today, navigate } = usePlanner();
  const stage = currentStage(data, today);
  const tasks = data.tasks.filter(t => t.stage === stage.id);
  const completed = tasks.filter(t => t.done).length;
  const balance = totalBalance(data, today);
  const alert = getBalanceAlert(balance, today, data.settings.graduationDate, totalBalance(data, CONFIG.finance.checkpointDate));
  const studyHours = data.studyLogs.filter(l => inWeek(l.date, today)).reduce((sum, l) => sum + l.hours, 0);
  const goal = data.settings.weeklyStudyGoals[stage.id];
  const work = workProgress(data, today);
  const graduationDays = daysBetween(today, data.settings.graduationDate);
  const nextTasks = data.tasks.filter(t => !t.done && t.stage === stage.id).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 4);
  const applications = data.applications.filter(a => a.custom && inWeek(a.date, today)).length;
  const contacts = new Set(data.contacts.filter(c => inWeek(c.date, today)).map(c => c.name.trim().toLocaleLowerCase())).size;
  return <>
    <div className="page-title"><div><div className="eyebrow">2026 — 2029 · 我的长期计划</div><h1>计划总览<span className="heading-dot">.</span></h1><p>把长远的计划，变成每周的小进展。</p></div><span className="date-chip"><CalendarDays size={16} />{new Date(`${today}T12:00:00`).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span></div>
    <div className="overview-top">
      <section className="journey-card">
        <div className="flex-between"><span className="light-label"><span className="live-dot" />当前阶段 · 0{stage.id}</span><span className="journey-period">{stage.period}</span></div>
        <h2>{stage.name}</h2><p>{stage.focus}</p>
        <div className="journey-progress"><span>本阶段完成度</span><strong>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}<small>%</small></strong></div>
        <Progress value={completed} max={tasks.length} label="本阶段完成度" tone="light" />
        <div className="flex-between journey-bottom"><span>{completed} / {tasks.length} 项任务已完成</span><button onClick={() => navigate('milestones')}>继续我的计划<ArrowRight size={16} /></button></div>
      </section>
      <section className="countdown-card panel"><div className="countdown-icon"><GraduationCap size={23} /></div><div><div className="muted">{graduationDays < 0 ? '毕业已经' : graduationDays === 0 ? '今天毕业' : '距离毕业还有'}</div><div className="countdown-value">{Math.abs(graduationDays)}<span>天</span></div><div className="small muted">{shortDate(data.settings.graduationDate)}</div></div><div className="countdown-footer"><BriefcaseBusiness size={17} /><div><strong>{work.anniversary ? (today >= work.anniversary ? '入职时长已满一年' : `${daysBetween(today, work.anniversary)} 天后入职满一年`) : '下一站，第一份技术类工作'}</strong><button className="text-button" onClick={() => navigate('jobs')}>{work.anniversary ? `预计 ${shortDate(work.anniversary)}` : '设置入职日期'}<ChevronRight size={14} /></button></div></div></section>
    </div>
    <div className="stat-grid">
      <button className="stat-card" onClick={() => navigate('finance')}><div className="stat-title"><span><Wallet size={17} />当前总余额</span><ArrowUpRight size={16} /></div><div className="stat-value">{money(balance)}<span>CAD</span></div><div className={`badge ${alert.level}`}>{alert.title}</div><span className="small muted stat-note">毕业目标 {money(CONFIG.finance.graduationTarget)}</span></button>
      {(['ielts', 'tef'] as const).map(kind => { const exam = latestExam(data, kind, today); const status = exam && examStatus(exam, today); return <button className="stat-card" key={kind} onClick={() => navigate('language')}><div className="stat-title"><span><Languages size={17} />{kind === 'ielts' ? '英语 · IELTS General' : '法语 · TEF Canada'}</span><ArrowUpRight size={16} /></div><div className="stat-value">{exam ? levelLabel(overallLevel(kind, exam.scores)) : '—'}<span>{kind === 'ielts' ? 'CLB' : 'NCLC'}</span></div><div className="stat-note"><span className="small muted">目标 {kind === 'ielts' ? `CLB ${CONFIG.language.englishTarget}` : `NCLC ${CONFIG.language.frenchTarget}`}</span><span className={`small ${status && status.status !== 'valid' ? 'danger-text' : 'muted'}`}>{!exam ? '待录入成绩' : status?.status === 'expired' ? '成绩已到期' : status?.status === 'soon' ? `${status.days} 天后到期` : '按四项最低等级'}</span></div></button>; })}
    </div>
    {alert.level !== 'green' && <div className={`notice ${alert.level}`} role="alert"><Wallet size={19} /><div><strong>{alert.title}</strong><p>{alert.detail}</p></div></div>}
    <div className="dashboard-columns">
      <Panel title="接下来，专注这些" eyebrow="下一步" action={<LinkButton onClick={() => navigate('milestones')}>全部里程碑</LinkButton>}>
        {nextTasks.length ? <div className="task-list">{nextTasks.map(task => <div className="task-row" key={task.id}><input aria-label={`完成：${task.title}`} type="checkbox" checked={task.done} onChange={() => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) }))} /><div><span className="task-name">{task.title}</span><div className={`small task-date ${task.due && task.due < today ? 'danger-text' : 'muted'}`}>{task.due ? `${shortDate(task.due)} 截止${task.due < today ? ' · 已逾期' : ''}` : '收到邀请后设置截止日期'}</div></div><span className="task-stage">阶段 {task.stage}</span></div>)}</div> : <div className="completed-state"><CircleCheck size={32} /><h3>这一程的任务都完成了</h3><p>到里程碑页查看下一步。</p></div>}
      </Panel>
      <Panel title="这一周的小目标" eyebrow="本周进展" action={<span className="week-chip">周一 — 周日</span>}>
        <div className="weekly-item"><div className="flex-between"><span><Clock3 size={17} />法语学习</span><strong>{Number(studyHours.toFixed(1))}<span> / {goal} 小时</span></strong></div><Progress value={studyHours} max={goal} label="本周法语学习" /><button className="text-button" onClick={() => navigate('language')}>记录今天的学习<ArrowRight size={14} /></button></div>
        <div className="weekly-item"><div className="flex-between"><span><BriefcaseBusiness size={17} />定制申请</span><strong>{applications}<span> / {CONFIG.jobs.weeklyApplications} 份</span></strong></div><Progress value={applications} max={CONFIG.jobs.weeklyApplications} label="本周定制申请" /></div>
        <div className="flex-between contacts-summary"><span>联系行业人士</span><strong>{contacts}<span> / {CONFIG.jobs.weeklyContacts} 位</span></strong></div>
      </Panel>
    </div>
    <Panel title="我的 PR 路线" action={<span className="small muted">2026 — 2029</span>} className="roadmap-panel"><div className="roadmap">{STAGES.map(s => <button className={`roadmap-stop ${s.id === stage.id ? 'active' : ''}`} key={s.id} onClick={() => navigate('milestones')}><span className="roadmap-number">{data.tasks.some(t => t.stage === s.id) && data.tasks.filter(t => t.stage === s.id).every(t => t.done) ? <CircleCheck size={19} /> : `0${s.id}`}</span><span><strong>{s.name}</strong><small>{s.period}</small></span>{s.id === stage.id && <span className="current-tag">进行中</span>}</button>)}</div></Panel>
  </>;
}
