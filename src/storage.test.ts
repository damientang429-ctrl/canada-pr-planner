import { describe, expect, it } from 'vitest';
import { freshData, parseBackup } from './storage';
import { CONFIG } from './config';

describe('JSON 备份校验', () => {
  it('默认数据可往返导出导入，初始对象不共享引用', () => {
    const data = freshData(); expect(parseBackup(JSON.stringify(data))).toEqual(data);
    data.tasks[0].done = true; expect(freshData().tasks[0].done).toBe(false);
  });
  it('保留全部真实记录与设置', () => {
    const data = freshData(); data.settings.employmentDate = '2027-05-01'; data.savings.pr = 1200;
    data.exams.push({ id: 'e', kind: 'tef', date: '2026-09-01', scores: { listening: 249, reading: 207, writing: 310, speaking: 310 } });
    expect(parseBackup(JSON.stringify(data))).toEqual(data);
  });
  it.each(['not JSON', '{}', 'null', '[]', '{"version":999}'])('拒绝不兼容或非法 JSON：%s', raw => expect(() => parseBackup(raw)).toThrow());
  it('拒绝缺字段、非法日期、非法等级、重复 ID 和负数金额', () => {
    const invalid = freshData() as unknown as Record<string, unknown>; delete invalid.settings;
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow();
    const data = freshData(); data.tasks[0].due = '2027-02-30'; expect(() => parseBackup(JSON.stringify(data))).toThrow();
    data.tasks[0].due = ''; data.tasks.push(data.tasks[0]); expect(() => parseBackup(JSON.stringify(data))).toThrow();
    const negative = freshData(); negative.settings.initialBalances.reserve = -1; expect(() => parseBackup(JSON.stringify(negative))).toThrow();
  });
  it('拒绝超过 5 MB 的文件', () => expect(() => parseBackup(' '.repeat(CONFIG.validation.maxImportBytes + 1))).toThrow('5 MB'));
  it('拒绝非法 TEF 699 分和字符串数字', () => {
    const data = freshData(); data.exams = [{ id: 'exam', kind: 'tef', date: '2026-09-01', scores: { listening: 699, reading: 207, writing: 310, speaking: 310 } }];
    expect(() => parseBackup(JSON.stringify(data))).toThrow();
    expect(() => parseBackup(JSON.stringify(freshData()).replace('"reserve":6000', '"reserve":"6000"'))).toThrow();
  });
});
