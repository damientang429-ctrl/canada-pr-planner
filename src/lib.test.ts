import { describe, expect, it } from 'vitest';
import { CONFIG, IELTS_TO_CLB, SKILLS, TEF_TO_NCLC } from './config';
import { accountBalances, addDays, addMonths, convertScore, currentStage, daysBetween, examStatus, getBalanceAlert, inWeek, monthlySummary, overallLevel, totalBalance, weekStart, workProgress } from './lib';
import { freshData } from './storage';
import type { Exam, MonthRecord, TestKind } from './types';

describe('官方表分段阈值', () => {
  for (const kind of ['ielts', 'tef'] as TestKind[]) {
    const table = kind === 'ielts' ? IELTS_TO_CLB : TEF_TO_NCLC;
    for (const skill of SKILLS) for (let i = 0; i < table[skill.key].length; i++) {
      const [level, score] = table[skill.key][i];
      it(`${kind} ${skill.key} ${score} 恰好达到 ${level}`, () => expect(convertScore(kind, skill.key, score)).toBe(level));
      it(`${kind} ${skill.key} ${score} 以下一个步长归入下一档`, () => expect(convertScore(kind, skill.key, score - CONFIG.language.scoreSteps[kind])).toBe(table[skill.key][i + 1]?.[0] ?? 0));
    }
    it(`${kind} 拒绝超范围、非法步长及非有限值`, () => {
      for (const skill of SKILLS) {
        for (const score of [null, NaN, Infinity, -Infinity, -1, CONFIG.language.maxScores[kind][skill.key] + 1, 1.1]) expect(convertScore(kind, skill.key, score)).toBeNull();
        expect(convertScore(kind, skill.key, CONFIG.language.maxScores[kind][skill.key])).toBe(10);
        expect(convertScore(kind, skill.key, 0)).toBe(0);
      }
    });
  }
  it('英语四项 CLB 8，整体取最弱项而不是平均', () => {
    expect(overallLevel('ielts', { listening: 7.5, reading: 6.5, writing: 6.5, speaking: 6.5 })).toBe(8);
    expect(overallLevel('ielts', { listening: 9, reading: 8, writing: 7.5, speaking: 6 })).toBe(7);
  });
  it('TEF 旧分数四项 NCLC 7；拒绝 699 分制数值', () => {
    expect(overallLevel('tef', { listening: 249, reading: 207, writing: 310, speaking: 310 })).toBe(7);
    expect(convertScore('tef', 'listening', 699)).toBeNull();
  });
});

describe('余额预警：严格小于、时间边界、优先级', () => {
  it.each([
    [5999.99, '2026-11-01', 'critical'], [6000, '2026-11-01', 'red'],
    [7999.99, '2026-11-01', 'red'], [8000, '2026-11-01', 'green'],
    [10499.99, '2027-01-30', 'green'], [10499.99, '2027-01-31', 'yellow'],
    [10500, '2027-01-31', 'green'], [7999, '2027-01-31', 'red'],
    [5999, '2027-01-31', 'critical'], [-100, '2027-05-01', 'critical'],
    [6000, '2027-05-01', 'green'], [13000, '2026-10-01', 'green'],
  ] as const)('%s CAD on %s → %s', (balance, date, level) => expect(getBalanceAlert(balance, date).level).toBe(level));
  it('检查点使用历史快照：当前改善后仍提示历史未达标', () => {
    expect(getBalanceAlert(12000, '2027-02-01', CONFIG.graduationDate, 10000).level).toBe('yellow');
    expect(getBalanceAlert(10000, '2027-02-01', CONFIG.graduationDate, 11000).level).toBe('green');
    expect(getBalanceAlert(12000, '2027-05-01', CONFIG.graduationDate, 10000).level).toBe('green');
  });
  it('毕业当日不套用毕业前红线，但检查毕业目标', () => {
    expect(getBalanceAlert(8999, '2027-04-30', CONFIG.graduationDate, 11000).level).toBe('yellow');
    expect(getBalanceAlert(9000, '2027-04-30', CONFIG.graduationDate, 11000).level).toBe('green');
    expect(getBalanceAlert(7999, '2027-04-29', CONFIG.graduationDate, 11000).level).toBe('red');
  });
  it('使用自定义毕业日期', () => expect(getBalanceAlert(7999, '2027-07-01', '2027-08-30', 11000).level).toBe('red'));
  it('无效数据不能悄悄变绿', () => {
    expect(() => getBalanceAlert(NaN, '2027-01-01')).toThrow();
    expect(() => getBalanceAlert(13000, '2027-02-30')).toThrow();
  });
});

describe('日期与有效期', () => {
  it('自然月计算与闰日钳制', () => {
    expect(addMonths('2024-02-29', 24)).toBe('2026-02-28');
    expect(addMonths('2027-05-15', 12)).toBe('2028-05-15');
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
  });
  it('日期差不受夏令时影响', () => expect(daysBetween('2027-03-13', '2027-03-15')).toBe(2));
  it('周一到周日，跨年仍归同一周；排除未来记录', () => {
    expect(weekStart('2027-01-03')).toBe('2026-12-28');
    expect(inWeek('2026-12-31', '2027-01-03')).toBe(true);
    expect(inWeek('2027-01-04', '2027-01-03')).toBe(false);
    expect(inWeek('2027-01-03', '2027-01-01')).toBe(false);
  });
  it('考试到期前 90 天开始提醒，到期当日过期', () => {
    const exam: Exam = { id: 'exam', kind: 'ielts', date: '2025-05-01', scores: { listening: 7, reading: 7, writing: 7, speaking: 7 } };
    expect(examStatus(exam, addDays('2027-05-01', -91)).status).toBe('valid');
    expect(examStatus(exam, addDays('2027-05-01', -90)).status).toBe('soon');
    expect(examStatus(exam, '2027-05-01').status).toBe('expired');
  });
  it('阶段边界及人工覆盖', () => {
    const data = freshData();
    expect(currentStage(data, '2026-09-01').id).toBe(1);
    expect(currentStage(data, '2027-05-01').id).toBe(2);
    expect(currentStage(data, '2028-06-01').id).toBe(3);
    expect(currentStage(data, '2029-01-01').id).toBe(4);
    data.settings.stageOverride = 2;
    expect(currentStage(data, '2029-01-01').id).toBe(2);
  });
});

describe('账本与账户对账', () => {
  const record = (partial: Partial<MonthRecord>): MonthRecord => ({ id: 'r1', month: '2026-10', account: 'living', partTime: 500, fullTime: 0, expenses: { rent: 800, food: 300, phone: 40, transport: 60, other: 100 }, note: '', ...partial });
  it('初始总额 13000，分账户扣款、历史余额与月度分类正确', () => {
    const data = freshData();
    expect(totalBalance(data)).toBe(13000);
    data.months = [record({}), record({ id: 'r2', month: '2026-11', account: 'fixed', partTime: 0 }), record({ id: 'r3', account: 'reserve', fullTime: 1000, partTime: 0, expenses: { rent: 0, food: 50, phone: 0, transport: 0, other: 0 } })];
    expect(accountBalances(data, '2026-10-31')).toEqual({ reserve: 6950, fixed: 1000, living: 5200 });
    expect(totalBalance(data, '2026-10-31')).toBe(13150);
    expect(monthlySummary(data)[0].expenses.food).toBe(350);
    expect(monthlySummary(data)[1].balance).toBe(11850);
  });
  it('小数金额四舍五入至分，储蓄标记不重复计入余额', () => {
    const data = freshData(); data.months = [record({ partTime: 0.1, fullTime: 0.2, expenses: { rent: 0, food: 0, phone: 0, transport: 0, other: 0 } })]; data.savings.pr = 2000;
    expect(totalBalance(data)).toBe(13000.3);
  });
});

describe('经验累计必须同时满足时长与工时', () => {
  it('按周最多 30 小时，排除 TEER 4/5、未确认、入职前、未来及超期记录', () => {
    const data = freshData(); data.settings.employmentDate = '2027-05-03';
    data.workLogs = [
      { id: '1', week: '2027-05-03', hours: 40, teer: 2, eligible: true, note: '' },
      { id: '2', week: '2027-05-10', hours: 30, teer: 4, eligible: true, note: '' },
      { id: '3', week: '2027-05-17', hours: 30, teer: 0, eligible: false, note: '' },
      { id: '4', week: '2027-04-26', hours: 30, teer: 0, eligible: true, note: '' },
      { id: '5', week: '2027-08-02', hours: 30, teer: 0, eligible: true, note: '' },
    ];
    expect(workProgress(data, '2027-06-01').hours).toBe(30);
    expect(workProgress(data, '2031-06-01').hours).toBe(0);
    data.settings.employmentDate = '';
    expect(workProgress(data, '2027-06-01').hours).toBe(0);
  });
  it('1560 小时也不能提前宣称满 12 个月', () => {
    const data = freshData(); data.settings.employmentDate = '2027-05-03';
    data.workLogs = Array.from({ length: 52 }, (_, i) => ({ id: `${i}`, week: addDays('2027-05-03', i * 7), hours: 40, teer: 1, eligible: true, note: '' }));
    expect(workProgress(data, '2028-05-02')).toMatchObject({ hours: 1560, completed: false });
    expect(workProgress(data, '2028-05-03')).toMatchObject({ hours: 1560, completed: true });
    data.workLogs.pop();
    expect(workProgress(data, '2028-05-03').completed).toBe(false);
  });
});
