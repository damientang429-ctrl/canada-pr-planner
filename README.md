# 加拿大 PR 规划追踪

简体中文、纯前端的个人规划工作台。React + Vite + TypeScript，Recharts 图表，Vitest 单元测试。没有登录、后端、远程数据库、分析追踪或外部字体请求。明暗主题随系统自动切换，手机使用底部导航，电脑使用侧栏。

## 本地运行

使用 Node.js 22 LTS（建议 22.12 或更新版本），以及 pnpm 11.19.0。项目附带 `pnpm-lock.yaml`，使用它可以复现已验证的依赖版本。

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

打开终端显示的地址，通常为 `http://127.0.0.1:5173/`。

```sh
pnpm test        # 运行全部单元测试
pnpm test:watch  # 开发时监听测试
pnpm build       # TypeScript 检查并构建，输出 dist/
pnpm preview     # 本地预览生产构建
```

也可以用 `npm install`、`npm run dev`、`npm test`、`npm run build`；npm 不使用已有的 pnpm 锁文件。推荐日常固定使用一种包管理器。

若要用同一 Wi-Fi 下的手机测试：运行 `pnpm dev --host 0.0.0.0`，用手机访问终端显示的 Network 地址。手机与电脑各自保存独立数据。

## 部署到 GitHub Pages

项目已经提供 `.github/workflows/deploy.yml`。只会发布 `dist/` 静态文件，不会上传你在浏览器中填写的记录。

1. 在 GitHub 建立仓库，将项目文件（包括锁文件和 `.github`）推送到 `main` 分支。不要提交 `node_modules`、`dist` 或个人 JSON 备份。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions** 页面运行 `Test and deploy to GitHub Pages`，或向 `main` 推送一次修改。工作流会安装依赖、运行测试、构建并部署。
4. 部署成功后，在该工作流的部署记录或 Settings → Pages 中打开站点地址，通常为 `https://你的用户名.github.io/仓库名/`。
5. 如果默认分支不是 `main`，修改工作流中的 `branches`。

Vite 的 `base: './'` 使用相对资源路径；页面采用 `#dashboard`、`#milestones` 等 Hash 路由，兼容项目仓库子路径和刷新，无需服务器重写或 404 回退。不要直接双击 `dist/index.html`，请通过 HTTP 预览或部署访问。

参考：[Vite 静态部署说明](https://vite.dev/guide/static-deploy.html#github-pages)、[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。工作流通过测试后发布静态应用；个人浏览器中的记录不参与部署。

## 五个页面

- **总览**：毕业与入职满一年倒计时、当前阶段完成度、余额预警、英语 CLB、法语 NCLC，以及本周学习/求职目标。没有考试成绩时显示“待录入”，不会伪造个人记录。
- **里程碑**：14 条初始任务，分为四个阶段。可以勾选、添加、编辑和删除任务；可修改所属阶段与截止日。阶段 4 的具体日期默认留空，收到邀请后按实际邀请函填写。
- **财务**：三个账户初始余额 6000 / 1000 / 6000 CAD；分月分账户收支、分类预算、月末余额、Recharts 折线图，以及毕业后专项储蓄。
- **语言**：IELTS General 与 TEF Canada 旧分数即时换算、各单项分数和等级差距、考试历史、两年有效期和提前 90 天提醒。法语学习日志可增删改，按周汇总，四个阶段的周目标可独立设置。
- **求职**：公司、职位、城市、NOC、TEER、日期、状态、备注和定制申请标记；行业联系人日志；入职日期与每周工时。

## 数据与备份

- 所有个人数据存储于当前浏览器的 `localStorage`，键为 `canada-pr-planner-v1`。日期按用户设备当地日期取值；日期差使用 UTC 日期计算以避开夏令时偏差。
- 每次更改自动保存。清理浏览器数据、切换浏览器/设备/域名或使用无痕模式，可能导致数据不可见或丢失。**请定期导出 JSON。** 本地开发地址与 GitHub Pages 是不同的存储空间，首次上线需要导入备份。
- 顶栏 **导出 JSON** 下载完整备份；**导入 JSON** 先校验版本、结构、日期、分数、金额、记录 ID 和重复月/周记录，再显示摘要，点击“导入并替换”后才替换数据。上限 5 MB。导入不是合并，可在确认框中先导出现有数据。
- 损坏或旧版本存档不会被初始数据静默覆盖。页面暂停自动保存，可下载原始存档，再选择恢复初始数据或导入有效备份。
- 存储不可用或空间不足时会显示“尚未保存”，仍可导出当前内存中的数据。
- 没有跨设备自动同步和后台通知；到期提醒在打开应用时显示。请避免同时在多个标签页修改同一份数据。

## 计算口径

### 财务

每个账户每月一条记录，本条收入和支出归入所选账户。多个账户同月记录会合并为月度账本与支出预算。收入分兼职/全职，支出分房租/食品/手机/交通/其他。

`账户余额 = 初始金额 + 该账户截至所选月份的收入 − 支出`。`月末总余额 = 三个账户余额之和`。尚未记录的月份不会自动产生生活费。当前月显示的是目前已录入的累计结果，未来月份不计入当前余额。专项储蓄只是资金用途标记，不重复加到总余额中。

预警按以下顺序判定，所有比较都为严格小于：

1. 任何时候低于 6000：最高级红色预警。
2. 毕业日期之前低于 8000：红色紧急模式。
3. 2027-01-31 的历史检查点余额低于 10500：从检查点当天至毕业当天保留黄色提醒。检查点使用该月及此前已录入的账目；补录历史账目会重新计算。
4. 毕业当天低于 9000：黄色毕业目标提醒。
5. 其他情况为绿色。毕业目标进度始终单独显示。

每月食品/手机/交通/其他上限分别为 300/40/60/100 CAD，房租单独记录但不参与这四项预算。应急储备目标是“每月生活费估算（含房租）×3”，初始估算 1500 CAD 可以在界面或配置中修改。1200 CAD 法语考试和 2000 CAD PR 申请费是个人储蓄目标，不代表实时官方收费。

### 语言

换算表采用需求中提供的最低分表，集中在 `src/config.ts`，注释标明“请对照IRCC官网核实”。每项取达到的最高等级；最低档以下显示“低于 4”，10 显示“10+”。总览取最近一次考试的四项最低等级，不平均分、不拼接不同考试。过期成绩保留显示并明确标记。

IELTS 必须是 General Training；TEF 必须填 **Équivalence ancien score**，不是 699 分制。目标英语 CLB 8、法语 NCLC 7。日期加两个自然年作为到期日，提前 90 天开始提醒，到期当日即标为过期；闰日按目标月最后一天处理。

官方参考：[IRCC 语言考试与换算](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html)。

### 工作经验与周目标

本周按周一至周日计算。定制申请只有勾选“这是一份定制申请”才计入每周 5 份目标；行业联系每周按姓名去重，目标 2 位。未来日期的记录不计入本周实际完成。

工时每周一条，可填写实际小时数，但计入经验的上限为每周 30 小时。多份工作应在同一条中汇总符合条件的工时。记录需要满足 TEER 0–3 且用户明确确认合资格；入职前、未来周、未确认、TEER 4/5，以及近 3 年以外的周不计入。边界周按周一筛选，入职周只应填写实际入职后的工时；回看窗口边界周保守排除。

**只有累计达到 1560 个可计入小时，且从入职到当天已满 12 个自然月，才显示“满12个月技术类经验”。** 仅加班凑满 1560 小时不会提前标为满一年。该提示是个人记录结果，不代表自动确认 CEC 或其他项目资格；中断工作、在读状态等需据实记录。

官方参考：[IRCC 加拿大经验类工作经验要求](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html)。里程碑是个人计划，不保证未来邀请时间或省提名项目开放状态。

## 配置与目录

所有业务阈值、换算表、阶段定义、账户初始金额和初始任务都在 **`src/config.ts`**。UI 中修改过的设置保存在 localStorage；修改 `INITIAL_DATA` 只影响首次打开的新存档，不会覆盖已有数据。修改阈值或换算表则会立即影响计算。

```text
src/config.ts             集中业务配置、初始数据、官方参考链接
src/types.ts              数据模型
src/lib.ts                换算、预警、日期、财务与经验计算
src/storage.ts            JSON 校验、读写辅助与备份下载
src/App.tsx               导航、自动保存、导入与计划设置
src/Dashboard.tsx         总览
src/Milestones.tsx        里程碑
src/Finance.tsx           财务
src/Language.tsx          语言与学习日志
src/Jobs.tsx              求职与工时
src/components.tsx        表单、弹窗、进度条等通用组件
src/styles.css            全局布局、总览、明暗主题
src/pages.css             其他页面与响应式布局
src/lib.test.ts            换算边界、预警、日期、账本、经验测试
src/storage.test.ts        备份格式与错误输入测试
.github/workflows/deploy.yml  GitHub Pages 自动测试与部署
```

测试覆盖了两套换算表每个单项的所有等级临界分、低于阈值、无效分数，余额 6000/8000/9000/10500 边界与优先级，以及日期跨年、闰日、考试到期、工作满一年限制、账户对账、备份往返与损坏输入。
