export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';
export type TestKind = 'ielts' | 'tef';
export type Scores = Record<Skill, number>;
export type ExpenseKind = 'rent' | 'food' | 'phone' | 'transport' | 'other';
export type AccountId = 'reserve' | 'fixed' | 'living';
export type StageId = 1 | 2 | 3 | 4;
export interface Task { id: string; stage: StageId; title: string; due: string; done: boolean }
export interface MonthRecord {
  id: string; month: string; account: AccountId; partTime: number; fullTime: number;
  expenses: Record<ExpenseKind, number>; note: string;
}
export interface Exam { id: string; kind: TestKind; date: string; scores: Scores }
export interface StudyLog { id: string; date: string; hours: number; note: string }
export interface Application {
  id: string; company: string; position: string; city: string; noc: string; teer: number;
  date: string; status: 'applied' | 'interview' | 'offer' | 'rejected'; custom: boolean; note: string;
}
export interface Contact { id: string; date: string; name: string; note: string }
export interface WorkLog { id: string; week: string; hours: number; teer: number; eligible: boolean; note: string }
export interface AppData {
  version: number;
  settings: {
    graduationDate: string; employmentDate: string; stageOverride: StageId | null;
    weeklyStudyGoals: Record<StageId, number>; monthlyLivingCost: number;
    initialBalances: Record<AccountId, number>;
  };
  tasks: Task[]; months: MonthRecord[]; exams: Exam[]; studyLogs: StudyLog[];
  applications: Application[]; contacts: Contact[]; workLogs: WorkLog[];
  savings: { emergency: number; french: number; pr: number };
}
