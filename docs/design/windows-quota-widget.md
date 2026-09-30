# Windows 桌面限额组件：调研与设计提案

日期：2026-09-27。状态：Windows 首版已实现。下文保留初始调研与设计推演；同目录 `windows-quota-widget.html` 是初稿，不能代表最终尺寸。

## 实现结果

按用户后续要求收紧为极简样式：收起 320 × 76 DIP，展开 320 × 310 DIP。圆环、等宽数字与细进度条组成主要视觉，不采用大面积玻璃效果。两个关注周期可来自相同或不同服务。

生产入口为 `dashboard/quota.html`，由 `QuotaWidgetWindow.cs` 承载。托盘右键菜单中的“桌面限额”启用或隐藏组件；默认关闭，启用状态、物理屏幕坐标与关注周期持久保存。共享现有限额轮询，不随主窗口关闭或桌宠隐藏停止。支持应用深浅主题、中文文案、Esc 收起、拖动、窗口工作区约束、全屏隐藏与数据失效提示。

使用逐像素透明 WPF + WebView2 Composition，内容绘制纯色圆角面，原生圆角区域排除透明边角的点击区域。没有将 CSS 模糊误当作桌面 Acrylic。

本地验证：Windows 构建零警告；36 项 .NET 测试、5 项新前端测试、31 项发布/窗口相关 Node 测试通过；前端类型检查、lint、文案及架构检查通过。临时原生验证程序实际加载 WPF/WebView2，验证 React 消息握手、两种窗口尺寸、失败时保留数据、隐藏恢复和退出。浏览器检查使用生产组件与明确标注的示例数据。原有代理测试首次受测试进程继承的代理环境影响，清理该测试子进程的代理变量后全部通过；未改用户代理配置。

尚未完成多屏热插拔、所有缩放组合及游戏全屏的完整人工验证；没有进行性能基准，也未发布安装包。初始提案中的悬停自动展开、顶部专用停靠、快捷键不是本次首版功能。

## 1. 当前判断

Windows 可以实现常驻限额组件，现有架构已经具备主要基础。当前平台差异来自独立实现与功能开关，并非 Windows 不支持悬浮窗口。不能仅凭代码推断当初开发者的优先级或历史决策。

- macOS：`DynamicIslandController.swift` 管理 NSPanel、展开收起、屏幕位置及全屏行为；SwiftUI 负责界面。这段实现不能直接在 Windows 上运行。
- Windows：`TrayApplicationContext.cs` 明确返回 `dynamicIslandSupported = false`、`widgetsSupported = false`，因此设置页不显示对应入口。
- `PetWindow.cs` 已采用 WPF 无边框、置顶、不主动抢焦点的透明窗口，内部使用 `WebView2CompositionControl`。
- `UsagePoller.cs` 已每 60 秒读取本地服务，包含独立限额请求和 `LimitsUpdated` 事件；目前 `IncludeLimits` 随桌宠可见性开关。主窗口关闭并不是获取数据的必要条件。
- `DashboardWindow.cs` 已有 DWM 圆角和 Acrylic 配置；`NativeTheme.cs` 已有深浅主题读取能力。

因此应在 Windows 客户端内增加桌面限额组件，复用现有服务和更新机制。用户无需额外安装 Rainmeter、Zebar 或新的桌面环境。程序仍需在托盘后台运行，退出进程后组件关闭。

## 2. 参考项目与取舍

以下为仓库或官方文档调研，未安装运行这些第三方程序；流畅度、功耗和兼容性未作实机评价。

| 参考 | 可借鉴之处 | 本项目取舍 |
| --- | --- | --- |
| [WinIsland](https://github.com/WinIslandProject/WinIsland) | Windows 上独立的 Dynamic Island 项目，Rust 实现 | 借鉴紧凑与展开两种状态，不引入 Rust 渲染栈 |
| [dynamic-island-on-windows](https://github.com/sadeeshasathsara/dynamic-island-on-windows) | WPF / .NET 的 Windows 悬浮交互实现 | 与现有宿主接近，可进一步研究窗口与动画处理；不采用其宣传性能作为实测结论 |
| [Zebar](https://github.com/glzr-io/zebar) | 原生 WebView 承载 HTML/CSS 桌面组件 | 支持沿用 WPF + WebView2 的方案，界面与窗口管理分工 |
| [Seelen UI](https://github.com/eythaann/Seelen-UI) | 可定制工具栏、主题和桌面组件；[工具栏配置](https://github.com/eythaann/Seelen-UI/blob/master/libs/core/src/state/settings/mod.rs)包括位置及悬停延迟 | 借鉴贴边、延迟展开与主题配置，不替换 Windows Shell |
| [Droptop Four](https://github.com/Droptop-Four/Droptop-Four) | Rainmeter 菜单栏与下拉入口 | 可作为未来可选集成，不作为客户端首版依赖 |

## 3. 推荐体验

产品名称使用“桌面限额”，不要把 Windows 功能命名成刘海适配。

默认形态为右侧可拖动的紧凑卡片，用户也能选择顶部胶囊。Windows 顶部通常是浏览器标签、标题栏和窗口按钮所在区域，因此顶部不是默认位置。首次位置选在主屏工作区右侧中部，距边缘 16 DIP，允许调整并保存屏幕及位置。

### 信息层级

1. 紧凑状态：最多两个用户固定的 provider，显示名称、明确的“剩余”比例及周期。推荐约 224 × 92 DIP，单 provider 可更矮。不自动轮播，以便用户建立固定阅读位置。
2. 点击展开：宽约 324 DIP；显示固定 provider 的多个周期、余量、重置倒计时与更新时间。超过可用高度时内部滚动，不挤小文字。
3. 悬停约 250 ms 可临时展开；离开后约 500 ms 收起。点击固定展开后，只有明确收起或 Esc 才关闭。键盘和触摸无需悬停也能操作。
4. 顶部胶囊：约 320 × 44 DIP，只展示两个已选周期；点击展开相同详情。宽度随文本与缩放增长，原型中的尺寸是起点。
5. 用户可关闭置顶，仅留桌面可见；默认置顶，检测当前屏幕前台全屏应用时隐藏，退出全屏后恢复。托盘菜单始终能找回组件。

### 视觉规范

- 深色炭灰与暖白两套表面，跟随现有应用主题；中性文字保持对比度。
- 紧凑卡片使用 18 DIP 圆角，详情 22 DIP，胶囊使用半高圆角。1 DIP 细边框、轻柔阴影，不使用彩色外发光。
- 百分比采用等宽数字；重要数字约 20–24 DIP，正文约 13 DIP。中文使用系统字体回退。
- 常态只用少量绿色，余量不足采用琥珀色和明确文字；错误同时显示状态说明，不只换颜色。
- 进度条统一表达剩余比例。原有“已使用”值必须先归一化转换，不能直接套上“剩余”文案。
- 常驻表面偏不透明，展开详情可适度使用 Acrylic；透明度关闭、高对比度或不支持材质时使用可靠的纯色底。
- 展开收起建议 180–220 ms；不循环呼吸、不弹跳、不自动切换内容，遵循减少动画偏好。

HTML 原型模拟深浅色、紧凑/展开、顶部/右侧、余量不足/离线状态。浏览器中的材质只是设计表达，不能证明原生桌面模糊效果、焦点、置顶、穿透或 DPI 行为。

## 4. 数据与异常行为

- 紧凑状态固定 provider + window，由用户选择；首次仅从已有有效数据中初始化。不擅自把不同 provider 的额度相加，也不对百分比取平均。
- 详情优先展示用户固定的周期；未知或未支持的数据标为“暂不可用”。未登录显示连接入口；未配置任何 provider 时给出简短空态。
- 复用 `usage-limits-provider-specs.js` 的 provider/周期定义、现有 display preferences 和 `limit-pace.js`。展示安全用量标记时沿用既有算法与测试，不能在原生端另算一套。
- 余额、credits、请求次数与百分比保持各自单位；不得把没有分母的余额强行画成百分比。
- 收到响应的时刻和 provider 数据采集时刻必须区分。只拿到缓存响应不能把它标成刚更新。
- 获取失败保留最后一次有效值并标明数据时间和更新失败；不得回落成 0% 或 100%。重置倒计时归零后等待新快照，不自行补满额度。
- 不新增 provider 登录或认证逻辑；请求遵循现有限额开关，尤其保留 Devin 等 opt-in 行为。

## 5. 工程方案

首选现有 WPF + WebView2CompositionControl。相比重写 WinUI 3 或再引入 Electron，可复用窗口启动、打包、服务发现及前端限额定义。

数据路径：现有本地服务 → UsagePoller → TrayApplicationContext → 新 QuotaWidgetWindow → 专用轻量限额入口。

| 位置 | 预期修改 |
| --- | --- |
| 新 `TokenTrackerWin/QuotaWidgetWindow.cs` | 窗口、工作区约束、DPI、拖动、全屏退让、生命周期、受限消息桥 |
| `TrayApplicationContext.cs` | 托盘入口、启动恢复、快照分发；统一计算 `IncludeLimits = petVisible || quotaWidgetEnabled`，避免关闭桌宠时误停额度更新 |
| `UsagePoller.cs` | 继续共享单次轮询；补充限额读取失败/时间状态；不能只在成功时发事件而让旧值长期伪装成最新值 |
| 新前端限额入口，参照 `dashboard/src/pet.jsx` | 专用小型界面，不挂载完整 Dashboard；复用 provider specs、显示偏好、进度条和图标 |
| `dashboard/vite.config.js` | 增加构建入口并确认打包产物随嵌入服务配送 |
| `NativeTheme.cs` / 本地设置 | 保存启用状态、provider/周期选择、停靠位置、屏幕、置顶偏好；整合现有设置保存流程 |
| 原生设置桥及 `LabsSection.jsx` | 增加独立 `desktopQuotaSupported` / `desktopQuotaEnabled` 能力，不能只把 macOS 的 `dynamicIslandSupported` 改为 true |
| `copy.csv` / 原生本地化 | 正式 UI 文案使用项目现有多语言机制；原型文案不作为生产代码 |

原生负责屏幕和窗口，前端负责信息与动画。拖动与窗口尺寸请求必须校验范围；限制导航到本地预期页面，拒绝任意命令/URL 消息；快照经 JSON 消息传输，不能拼接为可执行脚本。

### 必须先验证的材质分支

现有桌宠使用 `AllowsTransparency=true` 的逐像素透明窗口，主窗口采用 DWM backdrop；二者不能未经验证直接组合。微软明确指出，逐像素 alpha 分层窗口不适用系统圆角。

先制作原生窗口验证：常规 DWM 窗口 + WebView2 composition + 系统圆角/材质；若精确胶囊形状要求使用分层透明窗口，则由内容绘制圆角并使用纯色/半透明底，不承诺 DWM Acrylic。CSS `backdrop-filter` 也不能当作已经能模糊窗口后桌面的证明。

参考：[系统圆角限制](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/ui/apply-rounded-corners)、[材质使用建议](https://learn.microsoft.com/en-us/windows/apps/get-started/best-practices)。

## 6. 交付顺序与验收

1. 当前阶段：调研、交互原型与本方案。未改生产功能，未进行版本发布。
2. 原生验证：同屏测试两种透明窗口方式、文字清晰度、不抢焦点、屏幕边界及窗口尺寸动画，确定材质实现。
3. 首版：紧凑卡片、详情、provider/周期选择、主窗口关闭后后台更新、托盘开关、位置恢复、深浅色、失效状态。
4. 完善：顶部胶囊、贴边收起及快捷键；在主窗口和组件共享设置一致后再加入提醒。

必要验证：

- 真实快照与主界面逐周期核对，包括 0、100、缺失值、无重置时间、服务失败与过期缓存。
- 桌宠开关与组件开关的四种组合；关闭桌宠不影响组件数据；关闭主窗口仍更新；退出进程清理窗口和轮询。
- 100/125/150/200% 缩放、不同 DPI 的双屏、负坐标屏幕、热拔插、工作区变动与睡眠唤醒。
- 全屏游戏/视频退让、关闭全屏恢复；展开不抢输入焦点，明确点击后键盘可用；透明边缘不能挡住底层窗口操作。
- 明暗/复杂壁纸下可读性、高对比度、减少动画、Tab/Esc、屏幕阅读器名称。
- 记录开启前后进程树内存、CPU 与 GPU 增量；未测量前不宣称“零占用”。静止时不持续渲染动画，沿用 60 秒网络轮询，避免双重请求。
- 生产接入后运行 Windows 构建、相关前端测试、文案与架构检查；发布阶段遵循 CLAUDE.md 的多平台版本与发布流程。
