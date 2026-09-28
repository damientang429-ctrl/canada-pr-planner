import { useState } from 'react';
import { Flag, Plus } from 'lucide-react';
import { STAGES } from './config';
import { usePlanner } from './context';
import { currentStage, shortDate, uid } from './lib';
import { AddButton, EditActions, Field, Form, Modal, Progress, str } from './components';
import type { StageId, Task } from './types';

export default function Milestones() {
  const { data, setData, today, notify } = usePlanner();
  const current = currentStage(data, today);
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const [error, setError] = useState('');
  function save(form: FormData) {
    const title = str(form, 'title');
    if (!title) { setError('请输入任务名称。'); return; }
    const task: Task = { id: editing?.id ?? uid(), title, stage: Number(str(form, 'stage')) as StageId, due: str(form, 'due'), done: editing?.done ?? false };
    setData(d => ({ ...d, tasks: editing?.id ? d.tasks.map(t => t.id === task.id ? task : t) : [...d.tasks, task] }));
    setEditing(null); notify('里程碑已保存');
  }
  return <><div className="page-title"><div><div className="eyebrow">一条清晰的路线</div><h1>里程碑<span className="heading-dot">.</span></h1><p>四个阶段，一条清晰的前行路线。</p></div><AddButton onClick={() => { setError(''); setEditing({ stage: current.id }); }}>添加任务</AddButton></div>
    <div className="milestone-layout">{STAGES.map(stage => { const tasks = data.tasks.filter(t => t.stage === stage.id); const done = tasks.filter(t => t.done).length; return <section key={stage.id} className={`stage-panel panel ${current.id === stage.id ? 'current' : ''}`}><div className="stage-header"><div className="stage-number">0{stage.id}</div><div className="stage-heading"><div className="flex-between"><h2>{stage.name}</h2>{current.id === stage.id && <span className="badge green">当前阶段</span>}</div><p>{stage.period}</p></div></div><p className="stage-focus">{stage.focus}</p><div className="stage-completion"><Progress value={done} max={tasks.length} label={`${stage.name}完成度`} /><span>{done} / {tasks.length}</span></div><div className="milestone-tasks">{tasks.length === 0 && <p className="empty">这个阶段还没有任务，添加第一项吧。</p>}{tasks.map(task => <div className={`task-row ${task.done ? 'done' : ''}`} key={task.id}><input type="checkbox" aria-label={`完成：${task.title}`} checked={task.done} onChange={e => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, done: e.target.checked } : t) }))} /><div><span className="task-name">{task.title}</span><div className={`task-date ${task.due && task.due < today && !task.done ? 'danger-text' : 'muted'}`}>{shortDate(task.due)}{task.due && task.due < today && !task.done ? ' · 已逾期' : ''}</div></div><EditActions name={task.title} onEdit={() => { setError(''); setEditing(task); }} onDelete={() => { if (confirm(`删除任务「${task.title}」？`)) setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== task.id) })); }} /></div>)}</div><button className="add-task" onClick={() => { setError(''); setEditing({ stage: stage.id }); }}><Plus size={16} />为此阶段添加任务</button></section>; })}</div>
    <div className="subtle-note"><Flag size={16} /><p>任务日期是个人计划，可随时调整。阶段 4 的递交截止日，请在收到邀请后按邀请函更新。</p></div>
    {editing && <Modal title={editing.id ? '编辑里程碑' : '添加里程碑'} onClose={() => setEditing(null)}><Form onSubmit={save} onCancel={() => setEditing(null)}><div className="form-grid"><div className="full"><Field label="任务名称"><input name="title" required maxLength={300} defaultValue={editing.title ?? ''} autoFocus placeholder="这一阶段要完成什么？" /></Field></div><Field label="所属阶段"><select name="stage" defaultValue={editing.stage}>{STAGES.map(s => <option key={s.id} value={s.id}>阶段 {s.id} · {s.name}</option>)}</select></Field><Field label="截止日期" hint="待确定时可以留空"><input type="date" name="due" defaultValue={editing.due ?? ''} /></Field></div>{error && <p className="form-error" role="alert">{error}</p>}</Form></Modal>}
  </>;
}
