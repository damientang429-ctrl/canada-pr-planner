import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppData } from './types';
export type Page = 'dashboard' | 'milestones' | 'finance' | 'language' | 'jobs';
export const PlannerContext = createContext<{ data: AppData; setData: Dispatch<SetStateAction<AppData>>; today: string; navigate: (page: Page) => void; notify: (message: string) => void } | null>(null);
export function usePlanner() { const context = useContext(PlannerContext); if (!context) throw new Error('缺少应用上下文'); return context; }
