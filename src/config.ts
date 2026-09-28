import type { AppData, ExpenseKind, Skill, StageId } from './types';

export const CONFIG = {
  storageKey: 'canada-pr-planner-v1', schemaVersion: 1, currency: 'CAD',
  graduationDate: '2027-04-30',
  finance: {
    checkpointDate: '2027-01-31', checkpointMinimum: 10500,
    preGraduationRed: 8000, critical: 6000, graduationTarget: 9000,
    emergencyMonths: 3, frenchTarget: 1200, prTarget: 2000,
    expenseLimits: { food: 300, phone: 40, transport: 60, other: 100 },
  },
  language: { englishTarget: 8, frenchTarget: 7, validYears: 2, reminderDays: 90,
    maxScores: { ielts: { listening: 9, reading: 9, writing: 9, speaking: 9 },
      tef: { listening: 360, reading: 300, writing: 450, speaking: 450 } },
    scoreSteps: { ielts: 0.5, tef: 1 },
  },
  jobs: { weeklyApplications: 5, weeklyContacts: 2, requiredHours: 1560, weeklyHourCap: 30,
    requiredMonths: 12, highestSkilledTeer: 3, maxTeer: 5, lookbackYears: 3, invitationDays: 60 },
  validation: { maxAmount: 100000000, maxHours: 168, maxStudyDailyHours: 24, maxImportBytes: 5 * 1024 * 1024 },
  links: {
    language: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html',
    experience: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html',
  },
} as const;

export const SKILLS: { key: Skill; label: string; short: string }[] = [
  { key: 'listening', label: '听力', short: 'L' }, { key: 'reading', label: '阅读', short: 'R' },
  { key: 'writing', label: '写作', short: 'W' }, { key: 'speaking', label: '口语', short: 'S' },
];
export const EXPENSES: { key: ExpenseKind; label: string }[] = [
  { key: 'rent', label: '房租' }, { key: 'food', label: '食品' }, { key: 'phone', label: '手机' },
  { key: 'transport', label: '交通' }, { key: 'other', label: '其他' },
];
export const ACCOUNTS = [
  { id: 'reserve', name: '应急与过渡储备', description: '为过渡期留一份底气', initial: 6000 },
  { id: 'fixed', name: '固定大额支出', description: '提前安排，按计划使用', initial: 1000 },
  { id: 'living', name: '生活补贴', description: '日常生活的资金池', initial: 6000 },
] as const;
export const STAGES: { id: StageId; name: string; period: string; start: string; end: string; focus: string; studyHours: number }[] = [
  { id: 1, name: '毕业前', period: '2026.10 — 2027.04', start: '2026-10-01', end: '2027-04-30', focus: '稳住生活，为第一份技术类工作做好准备。', studyHours: 6 },
  { id: 2, name: '工作第 1 年', period: '2027.05 — 2028.05', start: '2027-05-01', end: '2028-05-31', focus: '积累工作经验，让语言学习成为日常。', studyHours: 8 },
  { id: 3, name: '递交与冲刺', period: '2028.06 — 2028.12', start: '2028-06-01', end: '2028-12-31', focus: '完善材料，准备语言成绩与申请资金。', studyHours: 8 },
  { id: 4, name: '拿到身份', period: '2029', start: '2029-01-01', end: '2029-12-31', focus: '收到邀请后，按时完成申请。', studyHours: 8 },
];
export const JOB_STATUSES = [
  { value: 'applied', label: '已投' }, { value: 'interview', label: '面试' },
  { value: 'offer', label: 'Offer' }, { value: 'rejected', label: '拒绝' },
] as const;

// 请对照IRCC官网核实。雅思必须为 General Training；每项取达到的最高等级，10 表示 10 及以上。
// 官方参考：CONFIG.links.language。低于表内最低分返回 0（显示为“低于 4”），不猜测更低等级。
export const IELTS_TO_CLB: Record<Skill, readonly [number, number][]> = {
  listening: [[10, 8.5], [9, 8], [8, 7.5], [7, 6], [6, 5.5], [5, 5], [4, 4.5]],
  reading: [[10, 8], [9, 7], [8, 6.5], [7, 6], [6, 5], [5, 4], [4, 3.5]],
  writing: [[10, 7.5], [9, 7], [8, 6.5], [7, 6], [6, 5.5], [5, 5], [4, 4]],
  speaking: [[10, 7.5], [9, 7], [8, 6.5], [7, 6], [6, 5.5], [5, 5], [4, 4]],
};
// 请对照IRCC官网核实。仅接受 Équivalence ancien score（旧分数），不可填 Score / 699。
export const TEF_TO_NCLC: Record<Skill, readonly [number, number][]> = {
  listening: [[10, 316], [9, 298], [8, 280], [7, 249], [6, 217], [5, 181], [4, 145]],
  reading: [[10, 263], [9, 248], [8, 233], [7, 207], [6, 181], [5, 151], [4, 121]],
  writing: [[10, 393], [9, 371], [8, 349], [7, 310], [6, 271], [5, 226], [4, 181]],
  speaking: [[10, 393], [9, 371], [8, 349], [7, 310], [6, 271], [5, 226], [4, 181]],
};

export const INITIAL_DATA: AppData = {
  version: CONFIG.schemaVersion,
  settings: {
    graduationDate: CONFIG.graduationDate, employmentDate: '', stageOverride: null,
    weeklyStudyGoals: { 1: 6, 2: 8, 3: 8, 4: 8 }, monthlyLivingCost: 1500,
    initialBalances: { reserve: 6000, fixed: 1000, living: 6000 },
  },
  tasks: [
    { id: 'task-1', stage: 1, title: '寻找 TEER 0–3 技术类工作', due: '2027-04-30', done: false },
    { id: 'task-2', stage: 1, title: '找到兼职，补充生活收入', due: '2026-11-30', done: false },
    { id: 'task-3', stage: 1, title: '2027 年 2–3 月参加雅思 G 类考试', due: '2027-03-31', done: false },
    { id: 'task-4', stage: 1, title: '法语学习达到 A2', due: '2027-04-30', done: false },
    { id: 'task-5', stage: 2, title: '递交毕业工签申请', due: '2027-05-31', done: false },
    { id: 'task-6', stage: 2, title: '入职技术类工作', due: '2027-05-31', done: false },
    { id: 'task-7', stage: 2, title: '法语学习达到 B1', due: '2028-05-31', done: false },
    { id: 'task-8', stage: 2, title: '英语补考达到 CLB 8', due: '2028-05-31', done: false },
    { id: 'task-9', stage: 3, title: '创建 Express Entry 档案', due: '2028-06-30', done: false },
    { id: 'task-10', stage: 3, title: '递交新斯科舍省 EOI', due: '2028-07-31', done: false },
    { id: 'task-11', stage: 3, title: 'TEF Canada 达到 NCLC 7', due: '2028-10-31', done: false },
    { id: 'task-12', stage: 3, title: '2028 年重新参加英语考试', due: '2028-11-30', done: false },
    { id: 'task-13', stage: 3, title: '存够 PR 申请费', due: '2028-12-31', done: false },
    { id: 'task-14', stage: 4, title: '拿到邀请后 60 天内递交 PR 申请', due: '', done: false },
  ],
  months: [], exams: [], studyLogs: [], applications: [], contacts: [], workLogs: [],
  savings: { emergency: 0, french: 0, pr: 0 },
};
