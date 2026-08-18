import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { defineTool } from "@deepseek-ai/dsh-tools";
import * as yaml from "js-yaml";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
//#region data/zh-intro.json
var zh_intro_default = {
	"xyTom/coding-tools-mcp": "让任何AI助手直接编写和修改代码，帮你自动完成编程任务。",
	"ccch1mneyyy/dsh-TUI": "为DSH打造的全屏终端界面，支持流式思考、进度条和TPS仪表，让命令行操作更直观高效。",
	"hellowind777/helloagents": "一个自主智能伙伴，能持续分析问题并动手实现，直到验证完成。",
	"AdamPlatin123/awesome-dsh-plugins": "自动扫描并筛选优质的DSH插件，帮你发现和整理好用的扩展工具。",
	"omdsh-dev/DSH-better-sidebar": "把侧边栏变成完整工作台，支持文件编辑、终端、Git和子代理，还能扩展新页面。",
	"awesome-dsh-plugin/awesome-dsh-plugin": "精选DeepSeek Harness插件列表，帮你快速找到实用扩展。",
	"anywhere-labs/deepseek-harness-desktop": "为DeepSeek Harness打造的桌面应用，开箱即用，适配Mac和Windows。",
	"sandbaseai/sandbase-harness": "开源智能体运行时，支持任意模型，提供沙箱会话、审计回放和本地控制台。",
	"yejiming/MuseAI": "创建AI角色并进入故事世界，聊天、冒险、穿书，让互动留下羁绊。",
	"Small-tailqwq/dsh-deep-whale": "给DSH网页换上鲸鱼娘皮肤，来自深海女仆工坊的可爱主题。",
	"mnemon-dev/mnemon": "为AI代理提供持久记忆，跨会话记住知识，支持多种命令行工具。",
	"PM-Shawn/Abu-Cowork": "本地优先的AI代理桌面应用，支持多模型和自进化技能，注重隐私。",
	"linhay/harmony-next.skills": "鸿蒙NEXT开发专家指南，覆盖IDE操作、性能优化、架构设计和自动化测试。",
	"0xsline/awesome-deepseek-harness": "DeepSeek Harness生态资源汇总，收录插件、工具和基础设施。",
	"morluto/rea": "用智能体逆向工程任何东西，从应用行为到原生二进制都能分析。",
	"drewnekota/cetus": "一个 macOS 应用，统一管理 Claude Code、Codex 等所有 AI 编程工具，支持定时运行、快捷键启动和代码审查。",
	"huiliyi37/dsh-tianshu-tui": "为 DeepSeek Harness 提供交互式终端界面，并新增测试驱动开发、证据门等高级工作流。",
	"vlln/whale-girl": "在桌面右下角养一只 QQ 宠物形态的鲸鱼，可拖拽、投喂和玩耍，陪伴你的开发时光。",
	"Sikao-Engine/KimiX": "新一代轻量级 AI 编程助手命令行工具，让写代码更高效。",
	"omdsh-dev/dsh-at-file": "在 DeepSeek Harness 中像 Codex 一样用 @ 提及文件，快速搜索并附加文件内容到对话。",
	"liustack/modsearch": "为 DeepSeek Harness 增加联网搜索能力，可查询网页或 X 平台，返回结构化结果。",
	"pulseaiclub/phi": "一个功能强大的 AI 编程代理，支持多种模型、子代理和权限控制。",
	"wink-run/tokenbank": "本地 AI 网关，智能路由请求到不同模型，节省 Token 费用，还能共享闲置额度赚钱。",
	"labring/sealos-skills": "为 Sealos 提供 AI 技能，一条命令即可部署项目、创建数据库和对象存储。",
	"Nagi-ovo/dsh-visualize": "在 DeepSeek Harness 对话中直接渲染交互式 HTML 卡片，支持图表、表单和 3D 场景。",
	"Lum1104/dsh-browser": "通过 Chrome 侧边栏扩展，让 DeepSeek Harness 直接操控你的浏览器，无需视觉能力。",
	"taxueseek/argo": "专为 AI 代理设计的搜索工具，支持中英文、学术、代码、购物、金融等多种搜索。",
	"Nagi-ovo/dsh-find-plugins": "在 DeepSeek Harness 中快速查找和安装插件，提升工作效率。",
	"Jayden-X-L/forkprobe": "同时运行多个技能处理同一任务，帮你对比结果并选出最佳方案。",
	"omdsh-dev/dsh-genui": "在 DeepSeek Harness 回复中直接渲染交互式 UI 组件，包括图表、表单、测验和 3D 场景。",
	"alaliqing/claude-paper": "跨智能体的论文研究工具包，支持快速摘要、深度学习和本地网页浏览，让论文阅读更高效。",
	"Anionex/dsh-vision-toolkit": "让纯文本模型也能看图问答、识别长截图和还原界面，专为DeepSeek Harness打造。",
	"Nagi-ovo/dsh-ads": "给DSH网页界面添加2005年风格的中文广告，包括侧栏、信息流和弹窗，纯属娱乐。",
	"text2future/flowix": "为你的智能体提供笔记和记忆功能，让AI助手更懂你。",
	"cofy-x/axern": "开源的AI智能体沙箱，安全运行不可信代码，并支持持久化服务。",
	"SepineTam/mcp-for-stata": "将Stata统计软件接入AI智能体的MCP服务器，让AI帮你跑数据分析。",
	"openma-ai/open-managed-agents": "开源实现Claude托管智能体API，可自托管运行，兼容现有接口，支持云端或Node.js部署。",
	"zhoushoujianwork/easyeda-agent": "EasyEDA智能体插件，帮助你在AI辅助下进行电路设计和PCB布局。",
	"TencentCloud/tencentmeeting-cli": "腾讯会议命令行工具，支持会议管理、录制和参会报告，方便自动化操作。",
	"NanmiCoder/dsh-agent-teams": "为DeepSeek Harness提供多智能体协作团队功能的插件。",
	"hust-open-atom-club/oh-dsh": "一站式DeepSeek Harness社区发行版，提供TUI、桌面和网页三种界面，安装简单。",
	"Electricitysheep/dsh-handbook": "DeepSeek Harness深度手册，从安装到优化，含实测案例和对比，中英双语。",
	"zhaoolee/notes": "开源版锤子便签，复刻经典美学，支持私有化部署和多种导出格式。",
	"humblebanana/open-record-replay": "开源macOS操作录制回放工具，捕捉鼠标键盘和界面事件，让AI学习并自动化桌面任务。",
	"Ariestar/sivtr": "为人类和AI智能体打造的统一记忆工作空间，方便管理信息和知识。",
	"nexu-io/open-design": "开源本地优先的桌面设计工具，让AI帮你生成原型、网页、幻灯片和图片视频，替代Claude Design。",
	"deepseek-ai/deepseek-harness": "DeepSeek Harness插件框架，让一切功能都能变成插件，灵活扩展你的AI工作流。",
	"titanwings/colleague-skill": "把冰冷的告别变成温暖的技能，让数字生命延续，开启重生时代。",
	"tt-a1i/archify": "生成美观且可验证的架构图、流程图等，输出带动态效果的HTML文件，方便导出分享。",
	"Devin-AXIS/iPolloWork": "新一代AI工作台，自带进化式运行环境，可编辑代码、设计、演示和视频，是Codex的替代方案。",
	"crafter-station/petdex": "为Codex、Claude Code等AI工具提供动态宠物图库，让你的终端更有趣。",
	"imsai-sh/zhuzhiliao": "竹知了玩具的网页模拟版，零依赖单文件，真实录音采样，手机上好用。",
	"foryourhealth111-pixel/Vibe-Skills": "通用技能插件，自动调度本地技能并智能编排工作流，提升AI协作效率。",
	"whiteguo233/OpenBiliClaw": "本地开源的内容发现Agent，先理解你的喜好，再主动从B站、小红书等平台找内容。",
	"zhu1090093659/dsh-web-ui": "为DeepSeek Harness的Web界面提供皮肤和插件，包括任务面板、Git图、宠物和实时数据。",
	"liustack/modlens": "首个DeepSeek Harness视觉插件，粘贴图片即可提取文字、布局等结构化信息，让纯文本AI也能看图。",
	"paean-ai/deeptide": "专为DeepSeek打造的macOS原生编程助手，Swift开发，流畅高效。",
	"PicGo/PicGo-Core": "强大的图片上传引擎，支持命令行和API调用，轻松搞定图床上传。",
	"nutshellai-tech/mobius": "首个自进化的开源Agent操作系统，连接团队、AI、设备和算力，协同工作。",
	"Anionex/agent-vision-toolkit": "为纯文本AI设计的视觉工具箱，支持多图理解、截图OCR和界面还原，粘贴图片即可用。",
	"wess09/DeepSeekHarnessDesktop": "将DeepSeek Harness打包成桌面应用，方便你直接安装使用。",
	"JustGenius-s/DSH-Desktop": "为DeepSeek Harness提供桌面客户端，让你在电脑上更便捷地使用。",
	"HeiGeAi/deepseek-harness-skin": "给DeepSeek Harness换肤，内置21套皮肤，还能用一张图生成整套配色。",
	"147228/dsh-xiaoyao-skins": "提供夕小瑶风格的DeepSeek Harness皮肤合集，附带安装器和社区创作工具。",
	"william-jin-cmu/dsh-vision": "让DeepSeek Harness支持看图，通过桥接视觉模型实现图像理解。",
	"Anionex/dsh-computer-use": "让DeepSeek Harness控制你的Mac电脑，安全地操作界面和输入。",
	"like-study1/Oh-My-DSH": "DeepSeek Harness插件聚合社区，自动同步精选插件目录，方便你发现和安装。",
	"hellodigua/dsh-share": "一键分享你的DeepSeek Harness对话，生成链接给朋友看。",
	"LoserFox/distill": "自动把对话精华提炼成技能，后台智能反省并更新，提升使用效率。",
	"bugmaker2/dsh-plugin-template": "提供DeepSeek Harness插件开发模板，帮你快速创建新插件。",
	"dqsjqian/Aria": "一个跨平台的C++界面框架，支持响应式数据流和协程，方便开发应用。",
	"unitarylab/quantum-practices": "量子算法最佳实践集合，帮你学习和应用量子计算。",
	"omdsh-dev/dsh-toolkit": "为DeepSeek Harness提供十个常用小工具，如时间、编码、计算等，一键安装。",
	"omdsh-dev/dsh-plugin-check": "检查DeepSeek Harness插件的健康状况，确保它们符合规范且能正常使用。",
	"omdsh-dev/dsh-lark": "让DeepSeek Harness接入飞书，通过聊天控制智能体并接收回复。",
	"yuukiLike/zeromd": "在 iPhone 和 Mac 间零成本同步 Obsidian 笔记，通过 GitHub 自动备份，本地优先，让知识长期积累。",
	"hanelalo/browser-bridge": "让 AI 助手像你一样真实操控浏览器窗口，实现自动化操作。",
	"csyangwen/dsh-memory-evolve": "为 DeepSeek Harness 增加跨会话长期记忆和后台自我进化能力，包括多轨记忆、技能进化、待办管理等功能，即装即用。",
	"omdsh-dev/dsh-annotation": "在 DeepSeek Harness 网页中选中文字即可批注，随消息发送，回复时按批注逐条对照，提升对话效率。",
	"pingfanfan/hello-dsh": "零基础学习 DeepSeek Harness 插件开发，内含 22 个中文技能实例，带你从零上手。",
	"vlln/plugin-registry": "管理 DeepSeek Harness 插件的浏览器控制台，并提供官方插件开发引导，方便扩展生态。",
	"multica-ai/dsh-multica-runtime": "让 DeepSeek Harness 在 Multica 平台上顺畅运行。",
	"alingalingling/ui-status-label": "自定义鲸鱼娘思考时的潜水动画，随心改变成你喜欢的样式。",
	"libukai/awesome-deepseek-harness": "DeepSeek Harness 的终极指南，包含快速入门、资源推荐和精选插件工具。",
	"Dominic789654/awesome-deepseek-harness": "精选 DeepSeek Harness 的插件、技能、MCP 服务器等资源，涵盖可视化、PPT、编程、自动化研究等方向。",
	"zenx0x/allinluna": "为 Codex 和 DeepSeek Harness 提供资源感知的多智能体协调，优化任务分配。",
	"openguardrails/openguardrails": "提供 AI 智能体安全与防护的厂商中立协议，以及中立基准评测。",
	"lhh010/dsh-ui-whale": "为 DSH 网页界面添加一只像素鲸鱼伙伴，会眨眼、摇尾、喷水、冒爱心，陪伴你的工作。",
	"titanwings/dsh-automation": "让编码任务按计划在全新会话中自动运行，并支持用户或 AI 创建和管理定时任务。",
	"Chinesezjc/dsh-interconnect": "实现多个 DeepSeek Harness 实例之间的消息和事件传递，方便协同工作。",
	"bruc3van/awesome-dsh-plugin": "快速找到适合你的 DeepSeek Harness 插件，了解每个插件解决什么问题、适合谁，以及如何开始使用。",
	"ZSeven-W/dsh-openpencil": "为 DeepSeek Harness 提供 OpenPencil 设计预览和编辑功能，让你直接在工具中查看和修改设计。",
	"Ruler4396/dsh-launcher": "为 DeepSeek Harness 打造轻量级 Windows 启动器，开机静默自启，用简洁窗口代替完整浏览器。",
	"icetomoyo/dsh_workflow": "把 DeepSeek Harness 的一次性多智能体调度升级为可保存、可管理、可恢复的工作流，让复杂任务更可控。",
	"Lyn-77/ProMentor": "装上它，你的 AI 编程助手化身导师，带你分析项目、分步学习、手写代码、自动判题并做代码审查。",
	"Alex-Yanggg/awesome-DSH-plugin": "精选 DeepSeek Harness 的实用插件、工具和开发资源，帮你提升效率、扩展功能、调试和自定义开发。",
	"morluto/jacobian": "为 AI 提供纯数学能力：搜索示例和反例、精确计算，并独立验证某个结果是否成立。",
	"btspoony/mstar-harness": "一个以技能驱动的循环工程工作流插件，帮助 DeepSeek Harness 更高效地编排和执行任务。",
	"LaplaceYoung/oh-my-dsh": "为 DeepSeek Harness 提供 700 多个插件，全部通过扩展接缝接入，不修改核心循环，安全又灵活。",
	"omdsh-dev/dsh-open-in-vscode": "直接从网页界面用 VS Code 打开 DeepSeek Harness 的工作目录，方便你编辑和查看代码。",
	"omdsh-dev/dsh-notification": "为 DeepSeek Harness 添加桌面通知，任务完成时提醒你，可按结果类型和关键词过滤。",
	"ChisaAlter/Deepseek-Harness-Desktop": "DeepSeek Harness 的桌面客户端，支持主题和背景图等个性化设置，让你用得更顺手。",
	"Anionex/dsh-turn-rewind": "回退 DeepSeek Harness 的对话和代码状态，借助持久化变更记录，随时撤销到之前的任何一步。",
	"hikariming/dshfind": "学习 DeepSeek Harness 的原理、浏览插件市场和最佳实践，帮你快速上手和进阶。",
	"morluto/flameox": "为 AI 提供运行时证据，帮助追踪、分析和优化应用代码、GPU 内核及推理栈中的性能热点。",
	"omdsh-dev/dsh-custom-tool": "在DeepSeek Harness中创建和管理沙箱JavaScript工具，内置代码编辑器，让模型自动维护工具生命周期。",
	"vibeinging/dsh-work": "本地优先的AI工作台，集成智能体对话、项目文件、数据分析、网页搜索和办公文档，桌面应用一键管理。",
	"ali-meoo/meoo-cli": "秒悟官方命令行工具，让本地AI写完前端后自动接管数据库、登录、存储和部署，一条命令搞定云端工作。",
	"whiteguo233/dsh-openbiliclaw": "本地运行的个性化推荐Agent，持续理解你的兴趣并主动找内容，在DSH界面常驻第四栏，支持对话和画像学习。",
	"huiliyi37/dsh-tianshu-build": "为DeepSeek Harness提供终端界面，让你在命令行中直接操作和管理AI助手。",
	"iuikj/dsh-desktop": "一个精心美化过的DeepSeek Harness客户端，界面更舒适，欢迎插件扩展功能。",
	"bradeGithub/DSH-Plugins-Marketplace": "在DeepSeek Harness网页界面中一键浏览、安装和更新所有GitHub上的DSH插件，省去手动折腾。",
	"bruc3van/dsh-desktop": "第三方桌面客户端，直接加载官方网页界面，自动复用本地实例或内置运行时，无需安装Node.js，开箱即用。",
	"ysr666/dsh-vision-router": "为纯文本AI助手装上眼睛，内置免费视觉识别链和像素级工具，支持问答、截图、OCR和图像处理，一条命令启用。",
	"Nwflower/dsh-chat-import": "从Claude Code、Codex等工具导入历史聊天记录，在DeepSeek Harness中无缝继续之前的对话。",
	"YunTaiHua/illusion-agent": "跨平台AI智能体平台，支持终端、浏览器和各种模型，让幻想照进现实，功能强大又灵活。",
	"ccq1/dsh-side-panel": "给DSH加上侧边栏，集成文件浏览、终端和Git审查，预览文件更方便。",
	"dancingmemory/dskin": "为DeepSeek Harness换上卡通像素皮肤，界面不变但多了会散步、眨眼、跳跃的像素宠物，趣味十足。",
	"Moeblack/dsh-message-edit": "支持分支式消息编辑、重新生成、重试和版本时间线，让你灵活调整AI对话内容。",
	"morluto/leantoken": "为AI智能体提供代码智能，快速定位关键代码，节省上下文窗口和令牌消耗。",
	"omdsh-dev/dsh-gomoku": "在DSH中与AI下五子棋，也能让AI互相对弈，比较棋力高低。",
	"Ychris12138/dsh-usage-stats": "在DSH网页界面查看Token用量热力图、各模型用量和DeepSeek账户余额。",
	"lzszq/dsh-scholar": "为DSH提供学术研究辅助，帮助查找和管理文献资料。",
	"Fisfzy/ego-browser": "把专用浏览器接入DSH，让AI能看网页、点击、填表、截图，实现自动化操作。",
	"LayneChai/superpowers-dsh": "为DSH添加开发技能，支持测试驱动开发、调试、规划和协作。",
	"hellodigua/dsh-emoji": "让AI回复时加入你自定义的表情，聊天更有趣。",
	"Fishquito7/dsh-skill-viewer": "在DSH网页界面中快速启用、禁用、删除或添加技能。",
	"Totoro-qaq/Cobsidian": "帮助AI维护Obsidian知识库，自动整理笔记和链接。",
	"AnacondaKC/dsh-stock-market": "写代码时也能实时查看股票行情，边写边盯盘。",
	"suzike/freestyle-dsh-theme": "为DSH更换主题，支持自定义配色并保存设置。",
	"bobleer/dsh-acp-for-bitfun": "让DSH与BitFun平台对接，实现交互协作。",
	"omdsh-dev/dsh-security-audit": "检查DSH本地配置、插件和网络暴露风险，生成脱敏安全报告。",
	"awesome-dsh-plugin/dsh-find-plugin": "在会话中直接搜索GitHub上的DSH插件，按星标排序发现新工具。",
	"omdsh-dev/dsh-plugin-dev": "提供DSH插件开发的实战经验和文档，避免常见坑。",
	"Ericwong5021/deepseek-plugin-store": "独立的DSH插件商店，可发现、安装和提交经过验证的插件。",
	"lhmd/dsh-promotion-toolkit": "把你的任何想法，一键生成适配各平台的宣传内容，省时省力。",
	"shaokeyibb/dsh-plugin-product-subagents": "为DeepSeek Harness提供基于角色的AI子代理，支持任务延续、会话恢复和权限管理。",
	"gusibi/molibot": "一个以记忆为核心的个人AI助手，随你的工作成长，开源且开箱即用。",
	"LoserFox/dsh-git-identity": "让Git提交自动使用你的环境身份，优先GitHub账号，避免身份混乱。",
	"ayuanwong/deepseek-harness-ux": "长任务不刷屏，关键进度清晰可见，完成后自动折叠，详情随时展开。",
	"vlln/dsh-task-status": "在对话页显示后台任务进度和实时输出，方便跟踪长任务。",
	"lhmd/dsh-director-toolkit": "为3D艺术家和创意程序员提供灵感转化工具，粘贴零散想法即可获得创作方向。",
	"the-beating-light-of-the-nail/dsh-meme-hub": "带你探索DeepSeek Harness的趣味插件，包含小游戏和怀旧主题。",
	"HuanLinOTO/dsh-plugin-mineru": "让模型直接解析PDF、图片等文档，转为结构化文本，方便处理。",
	"LX2000WASD/dsh-web-plugin-manager": "在网页界面一键管理DSH插件，支持安装、卸载、启停和环境配置。",
	"creght-dev/skills": "为Cregh提供Codex和代理技能，增强自动化能力。",
	"oil-oil/dsh-vision": "让DeepSeek Harness具备接近原生的图像理解能力。",
	"lhh010/dsh-paste-input": "增强DSH网页输入，支持粘贴、拖拽文件，自动复制到工作区。",
	"cpj-dev/dsh-plugin-cc": "将DeepSeek Harness接入Claude Code，实现审查、委托和会话导入。",
	"yanglongyun/dsh-ramify": "用树状画布生成、对比和迭代多个创意方案，让灵感分支可视化。",
	"GoalfyAI/goalfydata": "为AI智能体和授权团队提供共享数据后端，方便协作与数据管理。",
	"chyra-moon/deepseek-harness-desktop": "将DeepSeek官方网页界面原样封装成Windows桌面应用，社区出品，使用更便捷。",
	"HsiangNianian/dsh-auto-continue": "自动发送“继续”来恢复因网络等原因中断的对话，智能分类错误并支持通知提醒。",
	"N0zoM1z0/vocaloid-mcp": "面向AI智能体的VOCALOID音乐制作工具，支持作曲、调音、混音等全流程操作。",
	"whyihaveyou/dsh-suite": "精选双语DeepSeek Harness插件目录，每日兼容性检查，并提供插件创建脚手架。",
	"zp-home/dsh-recommend": "透明展示DeepSeek Harness插件生态排名与推荐，每日自动抓取数据并公开评分模型。",
	"modusensus/dsh-mneme": "把记忆主权还给用户：用SQLite和可编辑Markdown双写存储，自动巩固记忆，测试保障。",
	"dingkaihu63/dsh-robotic-harness": "为DeepSeek Harness提供具身智能研究工具，支持机器人资产检查与仿真实验。",
	"N0zoM1z0/th08": "东方永夜抄1.00d版本源码重建项目，供技术研究与学习使用。",
	"william-jin-cmu/dsh-stickers": "为DSH网页界面添加贴纸功能，让用户和智能体双向互动更有趣。",
	"morluto/internalcot": "让AI智能体展示完整思考过程，透明化推理步骤。",
	"omdsh-dev/dsh-session-health": "检查DSH会话文件健康状态，扫描并诊断损坏或空会话，只读且零依赖。",
	"yjh051108/dsh-super-injector": "超级注入器插件，用于向DSH中注入自定义内容或功能。",
	"omdsh-dev/fabric": "类似Minecraft Fabric的钩子处理器，用于扩展DSH功能。",
	"omdsh-dev/dsh-mnemon": "为DSH提供本地记忆系统，支持运行时记忆、可检索档案与受监督记忆体。",
	"SenmuuuuW/dsh-group-photo": "DSH内测收官合影墙，通过GitHub登录和名单校验生成拍立得风格合影，记录你的参与时刻。",
	"bowenliang123/dsh-context": "在DSH网页界面新增上下文面板，直观展示模型上下文窗口的内容构成和变化过程。",
	"vlln/dsh-navbar": "为DSH添加对话节点导航条，快速跳转到用户消息，方便浏览长对话。",
	"DietCokewithSugar/dsh-user-experience": "扫描React和TypeScript源码，自动找出用户体验问题并给出修复建议，提升界面易用性。",
	"phoenixlucky/zerotoken-skill": "ZeroToken插件压缩无效上下文并约束AI行为，节省token的同时让Agent更守纪律、高效完成任务。",
	"shuguang1994/project-blueprint": "一条命令让项目适配AI代理，自动识别技术栈并生成说明文档、CI/CD和测试框架。",
	"Ghost011118/dsh-balance-meter": "在DSH网页界面显示DeepSeek账户余额和会话成本，帮你实时掌握花费。",
	"dsh-tui/dsh-tui": "为DeepSeek Harness提供类似Claude Code的终端界面，操作更高效。",
	"dingyi222666/dsh-focus-chat": "为DSH提供精简的会话视图，聚焦最终结果，让阅读更轻松。",
	"omdsh-dev/dsh-data-agent": "让AI直接连接数据库写SQL并实时调试，通过执行反馈迭代，简化数据操作。",
	"huawolf/news-agent": "AI个人新闻聚合器，自动评分筛选新闻，支持网页查看和推送通知到飞书或Discord。",
	"CanglongCl/dsh-web-review": "在DSH网页界面预览网页并标注元素，让AI根据视觉反馈直接修改前端代码。",
	"lhh010/dsh-minigames": "DSH右侧小游戏面板，内置18款离线游戏，等待回复或修bug时摸鱼解压。",
	"openma-ai/deepseek-harness-tui": "为DeepSeek Harness提供终端界面插件，方便命令行操作。",
	"liyupi/dsh-kun-like-pet": "桌面宠物插件，小坤宠随任务状态切换动作，完成时播放趣味语音。",
	"wangyang10/image-vision": "图像视觉插件，帮你识别和理解图片内容，让AI看懂图像。",
	"chen-001/dsh-grok-tui": "通过终端界面使用dsh工具，让你在命令行里轻松操作。",
	"lhh010/dsh-ui-progress": "在输入框旁常驻显示任务进度，实时了解生成速度和待办提醒。",
	"knqiufan/powercontext-dsh": "连接远程记忆服务器，让AI记住对话、技能和经验，实现跨会话延续。",
	"SnowCrescenter-tech/dsh-milestone": "像Git提交图一样展示对话里程碑，悬停看详情，点击跳转任意消息。",
	"Tyan66666/billion-context-dsh": "智能压缩对话上下文，由AI决定何时压缩，节省资源不丢重点。",
	"ZASENJC/dsh-plugins-store": "自动收集和分类GitHub上的插件，方便你浏览和查找。",
	"omdsh-dev/dsh-deep-research": "深度研究助手，自动规划并执行多步调研，帮你快速获取全面信息。",
	"unknowbug/RE-Framework": "模块化工程框架，辅助AI进行逆向工程和软件开发。",
	"LaplaceYoung/dsh-qq2006": "给DSH换上QQ2006风格皮肤，界面复古又熟悉。",
	"fakechris/dsh-harness-ops": "运维工具箱，自动升级、守护重启、故障自救，省心省力。",
	"gameswu/dsh-plugin-background": "给DSH设置壁纸，美化你的工作界面。",
	"Clizo1209/dsh-playwright-browser": "让AI自动操作浏览器，模拟点击、填写表单等网页任务。",
	"cyijun/surfing-plugin": "集成搜索和网页抓取功能，让AI获取实时网络信息。",
	"whitelonng/dshcode": "桌面版DSH客户端，一键安装，跨平台使用更方便。",
	"omdsh-dev/dsh-plugin-skills": "在智能体会话中快速搭建和测试 DeepSeek Harness 插件，从创建项目到选择测试级别，一站式搞定。",
	"PlutoKeating/dsh-lark-bot": "把 DeepSeek Harness 接入飞书，通过机器人管理项目工作区，随时随地协作。",
	"Sev7een/ds-api-usage": "查看和管理 DeepSeek API 的使用量，帮你掌握调用情况。",
	"ginuim/multi-screen-wireframe": "离线生成多屏线框图，自带演示导航，无需安装 Node 或 npm。",
	"icodesign/orbis": "用手机远程控制 DeepSeek Harness，随时随地进行操作。",
	"KitDoesIt/dsh-compaction-instant": "为 DeepSeek Harness 提供无损压缩引擎，减少数据占用。",
	"Zhenyu98/dsh-context-doctor": "审计 DeepSeek Harness 的上下文注入，统计 token 成本并检测冲突，用图表直观展示。",
	"yyyyukari/dsh-plugin-workshop": "像逛创意工坊一样浏览 DeepSeek Harness 插件，支持中文搜索和双语翻译。",
	"humblebanana/dsh-record-replay": "录制 macOS 桌面操作，自动生成可复用的智能体技能。",
	"PivotStackIntelligence/dsh-github": "在 DeepSeek Harness 中集成 GitHub 功能，方便管理代码仓库。",
	"HuanLinOTO/dsh-plugin-pet-rs": "在桌面养一只鲸鱼宠物，实时推送 DeepSeek Harness 状态，支持透明置顶和托盘。",
	"LoserFox/telegram": "把 DeepSeek Harness 接入 Telegram，支持长轮询和按聊天区分会话。",
	"springbrand-lab/dsh-oauth-mcp-client": "为 DeepSeek Harness 添加 OAuth 2.1 认证的 MCP 客户端，安全连接外部服务。",
	"Yan-Zero/dsh-codex": "用 ChatGPT 订阅账号登录 DeepSeek Harness，复用你的会员权益。",
	"bill9109/dsh-web-ui-notify": "为 DeepSeek Harness 增加桌面通知，重要事件不错过。",
	"keleus/deepseek-pet": "在DeepSeek Harness里养一只大蓝鲸，它会吃白饭，给界面增添趣味。",
	"hyqhyq3/dsh-mcp-manager": "管理MCP服务器的插件，支持OAuth和静态令牌认证，工具自动注册为mcp__名称。",
	"zjl88858/dsh-huadongbianzuqi": "为DeepSeek Harness提供滑动变阻器功能，方便调节参数。",
	"white0dew/awesome-dsh-plugins": "发现和安装DeepSeek Harness插件的公共目录，汇集插件列表和安装命令。",
	"wssfk12138/dsh-wechat-notify": "让AI通过微信主动发通知，任务完成或需决策时提醒你，掉线也会提示。",
	"Small-tailqwq/dsh-deepcel": "把DeepSeek Harness界面变成类似Excel的皮肤，操作更熟悉。",
	"unknowbug/anchorlaw": "为AI编程提供代码验证协议，确保每个声明都有可验证的实践依据。",
	"Fisfzy/zotero-harvest": "从多个学术源检索文献并下载全文，自动入库Zotero并重建索引。",
	"Komeiji-Shiki/graycode-for-dsh": "为DeepSeek Harness提供灰色代码主题，让界面更护眼。",
	"lehhair/dsh-diff-viewer": "替换默认差异视图，以类似IDE的风格展示文件修改，便于审查。",
	"WilliamLIiii/DeepSeek-Harness-billing-plugin": "在会话头部显示账户余额和剩余任务估算，方便管理用量。",
	"moxisuki/dsh-lan": "让DeepSeek Harness通过局域网访问，并修复非安全环境下的崩溃问题。",
	"01Virex/dsh-status-rotator": "将“Deep diving…”状态文字替换为动态彩虹渐变动画，可自定义配置。",
	"lhh010/dsh-bash-encoding": "自动识别bash输出的编码（如UTF-8、GBK），修复中文乱码问题。",
	"william-jin-cmu/dsh-evolve": "让AI在对话中自我进化，动态添加或移除插件能力，重启后自动恢复。",
	"runzhliu/deepseek-harness-docker": "将 DeepSeek Harness 打包成 Docker 和 Kubernetes 应用，提供加固镜像、一键部署、网页界面和命令行工具，方便快速搭建和使用。",
	"YYTbit/dsh-plugin-claude-bridge": "把 Claude Code 的记忆、技能和配置桥接到 DeepSeek Harness，让两者协同工作，增强智能体能力。",
	"jelly-000/dsh-balance-monitor": "在 DeepSeek Harness 侧边栏底部显示账户余额、剩余比例和今日花费，方便随时掌握用量。",
	"1841220388zzzcccxxx-star/dsh-git-graph": "在 DeepSeek Harness 网页界面中嵌入 Git 仓库图谱，直观查看提交历史、分支和文件改动。",
	"xiaohai-78/Top": "为 dsh 外部插件生态提供每日排行榜，按星标排名并归档快照，首页展示最新排名。",
	"DDDFXYqiming/Agent_Extensions": "提供通用智能体技能和 DeepSeek Harness 标准插件，开箱即用，增强 AI Agent 能力。",
	"Lixiaoyiao/deepseek-harness-action": "为 DeepSeek Harness 提供 GitHub Action，实现 AI 代码审查、CI 诊断、自动修复和 Issue 转 PR。",
	"omdsh-dev/plugin-template": "基于官方模板创建的插件仓库模板，方便开发者快速开始编写 DeepSeek Harness 插件。",
	"LAN-TINA-WS/dsh-gui-customization": "给 DeepSeek Harness 网页界面换装，提供多种配色、氛围光和背景图预设，支持中英双语。",
	"opensetk/dsh-xiaohei": "为 DeepSeek Harness 添加罗小黑主题的趣味插件，让界面更可爱。",
	"xingyingyuzhui/dsh-updater-ui": "为 DeepSeek Harness 提供更新界面，方便用户查看和安装更新。",
	"Toukaiteio/dsh-plugin-installer": "通过市场插件快速将 DeepSeek Harness 接入 GitHub 插件生态，方便安装和管理。",
	"wangshunnn/oh-my-dsh": "DeepSeek Harness 社区插件索引与精选，自动更新，帮你发现好用的插件。",
	"Areium/dsh-fail-logger": "自动记录 DeepSeek Harness 中工具失败的原因，去重计数并排序，沉淀到技能维护区，让智能体越用越少出错。",
	"Flyvhidbwo/dsh-vision-proxy": "为 DeepSeek Harness 增加自动识图能力，图片经视觉模型转成文字后交给 DeepSeek 处理。",
	"turtle1999/turtle-ui": "一个基础UI插件，按原样提供，不提供任何保证。",
	"THU-MAIC/dsh-openmaic": "为DeepSeek Harness提供教学工具，支持课堂、幻灯片、交互组件和苏格拉底式教学。",
	"KinGao294/dsh-skin": "为DeepSeek Harness更换皮肤和自定义壁纸，支持透明度、模糊调节，设置自动保存。",
	"gxinxing/deepseek-harness-tui": "在终端里运行DeepSeek Harness的交互界面，让你不用浏览器也能操作。",
	"billLiao/awesome-dsh-plugin": "精选DeepSeek Harness插件列表，帮你发现好用的扩展。",
	"omdsh-dev/dsh-mygo": "为DeepSeek Harness提供MyGo相关功能，具体用途请查看插件详情。",
	"KirschBluteX/engineer-software": "为Codex和DeepSeek Harness提供工程化工作流，注重证据驱动和运行时无关。",
	"octoparse/agent-skills": "收集Octoparse的智能体技能，方便你直接使用。",
	"kejixiaoliang/awesome-dsh-plugins": "DeepSeek Harness插件精选目录，收录280多个社区插件，分类清晰，一键直达。",
	"Void0312Aurora/dsh-desktop-electron": "将DeepSeek Harness封装成桌面应用，支持托盘运行，无需额外安装Node环境。",
	"AngelosZou/graphlint": "用于图数据检查和分析的工具，帮你发现图中的问题。",
	"zibo2025/dsh-orchestrator": "为DeepSeek Harness提供多智能体编排，主智能体分解任务，多个工作智能体协作，可分别指定模型。",
	"AlliotTech/deepseek-harness-docker": "用Docker一键部署DeepSeek Harness，简化安装过程。",
	"JustGenius-s/DSH-Plugs": "收集DeepSeek Harness插件，方便你集中管理。",
	"omdsh-dev/dsh-tool-calculator": "为DeepSeek Harness提供安全计算器，支持复杂数学表达式求值。",
	"Han-1413141/dsh-cost-meter": "实时统计 DeepSeek 会话费用，同步官方价格，帮你掌握当日花费与历史记录。",
	"dqsjqian/agent-guild": "让任何 AI 代理通过读取一个文件加入你的共享记忆，实现跨代理协作。",
	"boxeryao/deepseek-harness-tui": "为 DeepSeek Harness 提供轻量快速的终端界面，直接连接运行时，操作更高效。",
	"nowledge-co/nowledge-mem-deepseek-harness": "为 DeepSeek Harness 集成 Nowledge Mem 社区插件包，扩展记忆管理功能。",
	"sliverp/DeepSeek-harness-qqbot": "通过 QQ 机器人收发文字和图片，让你在聊天中直接使用 DeepSeek Harness。",
	"weijiafu14/pi2dsh": "打通 Pi 与 DeepSeek Harness 生态，让 Pi 扩展无需修改即可作为原生插件运行。",
	"walkinglabs/awesome-deepseek-harness-plugins": "精选 DeepSeek Harness 的可靠插件、工具、设计流程和学习资源，中英双语列表。",
	"shinelon/eyes-for-deepseek": "为 DeepSeek 提供视觉能力，让模型能“看”图片并理解内容。",
	"renat3u/dsh-web-archive": "折叠对话中 Think、Bash 等无用消息，让聊天界面更清爽。",
	"FlashingChen/dsh-worktree": "为 DeepSeek Harness 提供永久 Git 工作树管理，支持创建、列出、删除及聊天命令。",
	"HuanLinOTO/dsh-plugin-d399": "模型生成时弹出小游戏菜单，内含 192 款可扩展的休闲游戏，让等待更有趣。",
	"Thhoho/reSanity": "散户投资认知管理工具，帮助查证、避坑、记忆和复盘，零依赖即用。",
	"tensorlakeai/dsh-tensorlake-sandbox": "集成 TensorLake 沙盒环境，让 DeepSeek Harness 在隔离空间中安全运行代码。",
	"yuezengwu/dsh-explain": "本地优先的学习模式，跨会话跟踪学习进度，按来源讲解并支持压缩与诊断。",
	"NoWint/Oh-My-DSH": "收录 300 多个 DeepSeek Harness 插件的精选集，按 22 大分类整理，方便查找。",
	"dsh-market/dsh-market": "在 DeepSeek Harness 里浏览、搜索并一键安装插件，让功能扩展更简单。",
	"Degurechaff57/dsh-openapi": "安全调用 OpenAPI 接口，自动发现并调用 API，让 DeepSeek Harness 更强大。",
	"1514100951/dsh-usage-footer": "在网页上悬浮显示账户余额、消费估算和 token 统计，帮你随时掌握费用。",
	"congchuanling-dot/DSH-Telegram-Relay": "通过 Telegram 远程和 DeepSeek Harness 对话、收通知，随时随地保持连接。",
	"longyu065/dsh-desktop": "为 DeepSeek Harness 提供桌面外壳，自动安装并支持 macOS 和 Windows 原生体验。",
	"Favio8/dsh-plugin-deepeye": "给 DeepSeek Harness 加上视觉能力，能描述图片、识别文字、回答图像问题。",
	"MuziIsabel/dsh-win-notify": "任务完成时弹出带声音的 Windows 通知，点击即可回到 DeepSeek Harness 页面。",
	"czm15053/dsh-peer-link": "连接 DeepSeek Harness 的多个实例，实现点对点通信，方便协同工作。",
	"sliverp/DeepSeek-harness-wecom": "把 DeepSeek Harness 接入企业微信，支持文字和图片消息，方便团队协作。",
	"happyren/dsh-agent-messaging": "让 DeepSeek Harness 的多个会话之间互相发消息，实现跨会话协作。",
	"orxz/deepseek-harness-themes": "为 DeepSeek Harness 提供多种界面主题，让你随心换肤，美化使用体验。",
	"MaimoryLab/dib": "把 DeepSeek Harness 打包成独立运行环境，并支持制作插件，方便分发。",
	"YYTbit/dsh-plugin-cost-tracker": "追踪 DeepSeek Harness 的 token 消耗和费用，帮你控制成本。",
	"Leeaoyin/dr-agent-skills": "为 AI 编程助手提供结构化、可复用的技能模块，覆盖工程流程和可靠性评估。",
	"omdsh-dev/dsh-sidechain": "在 DeepSeek Harness 中开启侧边会话，临时提问不干扰主对话，保持思路清晰。",
	"fuhefei/dsh-sentinel": "为DeepSeek Harness添加条件唤醒功能，监控文件、命令、网页等变化，自动唤醒智能体并展示全局仪表盘。",
	"BrambleXu/dsh-annotate": "在DeepSeek Harness中标注网页元素，捕获DOM、样式和截图，方便你分析和记录页面细节。",
	"Meredith2328/dsh-sticky-note": "在左下角添加便签，随手记录想法和待办，自动保存并支持清单和归档查看。",
	"omdsh-dev/dsh-advisor": "搭配一个副模型，在每轮对话中自动审查并注入见解，帮你获得更全面的反馈。",
	"huashenglian/dsh-her-eyes": "让AI自动调用多模态模型进行视觉分析，识别图片内容，扩展你的交互能力。",
	"HuanLinOTO/dsh-plugin-yet-another-subagent": "配置多个子代理模板，通过一个工具加参数灵活调用，并支持网页界面查看进度和子代理树。",
	"lhh010/dsh-input-history": "为DSH Web添加输入历史功能，用Ctrl+上下键像终端一样快速切换已发送消息，无需改动核心。",
	"openma-ai/deepseek-harness-acp": "为DeepSeek Harness提供ACP服务器实现，方便与其他工具集成。",
	"YYTbit/awesome-dsh-bridges": "将你喜欢的AI编程工具桥接到DeepSeek Harness中，统一工作流程。",
	"sb1733831438-maker/DSH-closerAI": "一个本地优先、模型无关、权限透明的桌面AI工作台，基于DeepSeek Harness构建。",
	"Electricitysheep/dsh-tool-turbo": "自动优化工具调用的推理强度，简单任务降低思考时间，复杂任务自动提升，加快响应速度。",
	"biociao/dsh-science": "为DeepSeek Harness提供科学计算相关功能，辅助科研数据分析。",
	"william-jin-cmu/dsh-companion": "常驻桌面的助手，支持全局唤起、定时任务、快捷回复，并集成插件市场。",
	"Moeblack/deepseek-manners": "在每次消息后自动添加感谢语，让AI交互更礼貌。",
	"H1a3x/dsh-token-stats": "显示可拖动的悬浮窗口，实时统计token使用量，帮你监控消耗。",
	"unnnnoooo/dsh-cue-plugin": "在DeepSeek Harness中跨会话引用内容，方便你复用之前的对话信息。",
	"omdsh-dev/Qwen-MM-Plugins": "为DeepSeek Harness提供多模态模型支持，让你能处理图片、音频等非文本内容。",
	"omdsh-dev/dsh-hub-workshop": "一个插件工作坊，用于开发和测试DeepSeek Harness插件。",
	"YELEBAI/dsh-plugin-marketplace": "DeepSeek Harness的插件市场，提供经过验证的插件下载和自动注册功能。",
	"yequ172672/dsh-codex-subscription": "复用Codex CLI的登录凭证，在DeepSeek Harness中使用ChatGPT订阅模型，无需API Key。",
	"keepermttl/dsh-archive-viewer": "管理DeepSeek Harness的归档会话，可查看、恢复已归档会话，并一键关闭程序。",
	"HackSing/dsh-plugins": "一个持续维护的DeepSeek Harness插件目录，中英双语，方便你查找插件。",
	"Qintsg/dsh-safe-delete": "安全删除DeepSeek Harness中的文件，先移入回收站而非永久删除，支持恢复和彻底清除。",
	"titanwings/dsh-plannotator": "在DeepSeek Harness中批注计划，选中原文逐条评论，并将反馈发送给智能体。",
	"yuko0331/DSH-telegram": "通过Telegram私聊远程控制和查看DeepSeek Harness，随时随地管理你的任务。",
	"LiangYin233/dsh-provider-model-configurator": "为DeepSeek Harness配置高级模型参数，一键应用预设模型的上下文、输出上限和推理挡位。",
	"YYTbit/dsh-plugin-opencode-bridge": "将opencode的技能和配置桥接到DeepSeek Harness中，扩展其功能。",
	"omdsh-dev/dsh-tool-csv": "解析、查询、统计和转换CSV数据，零依赖，在DeepSeek Harness中直接处理表格文本。",
	"detpecca/dsh-llm-wiki": "为DeepSeek Harness提供维基百科查询功能，方便你获取知识。",
	"dingyi222666/dsh-session-notification": "在DeepSeek Harness中发送会话完成等状态通知，支持浏览器提示和自定义提示词。",
	"lwmxiaobei/dsh-plugins": "汇集并校验 DeepSeek Harness 插件，支持搜索筛选和双语详情，一键复制安装命令。",
	"omdsh-dev/dsh-hub": "集中管理 DeepSeek Harness 插件的中心仓库，方便查找和安装各类扩展。",
	"cendaifeng/dsh-learn-everything": "在 DeepSeek Harness 中学习各种知识，提供丰富的学习资源和教程。",
	"TwotwoPiggy/dsh-balance": "实时追踪 token 用量并精准估算会话成本，支持高峰低谷动态定价。",
	"fff122/dsh-research-notes": "轻量级研究笔记插件，帮你在 DeepSeek Harness 中记录和管理研究内容。",
	"dongsheng123132/task-passport": "跨工具传递任务状态，让 DeepSeek Harness 与其他 AI 工具无缝交接工作。",
	"chen-001/dsh-chat-width": "自由调整 DeepSeek Harness 回复区域的宽度，让阅读更舒适。",
	"anweat/dsh-web-search-pro": "增强版联网搜索插件，支持多引擎、缓存和高级渲染，搜索更持久稳定。",
	"zevorn/dsh-humanize": "让 AI 回复更自然亲切，减少机械感，提升对话体验。",
	"jiesou/dsh-stream-rules": "按模式自动注入规则，不占上下文，让 AI 回复更贴合场景。",
	"GiantGKL/dsh-cost": "帮你估算 DeepSeek Harness 的使用成本，合理控制开支。",
	"HuanLinOTO/dsh-plugin-interpreters": "在 DeepSeek Harness 中直接运行 Python 和 Node 代码，查看执行结果。",
	"loudMore/dsh-drop-to-path": "把图片和文件转为工作区路径发送，让纯文本模型也能处理附件。",
	"morluto/gitcontribute": "帮 AI 代理在写代码前查清仓库指南、相关工作和验证方法。",
	"coppynight/dsh-doctor": "像医生一样诊断并修复 DeepSeek Harness 的问题，自动安全处理。",
	"zsyu9779/dsh-desktop": "跨平台桌面客户端，为DeepSeek Harness提供原生外壳，支持Windows、macOS和Linux。",
	"XiLuovo/dsh-session-timeline": "会话时间轴插件，用波浪线展示消息历史，支持点击跳转和预览，方便快速定位。",
	"HuanLinOTO/dsh-plugin-ya-workspace-sidebar": "替换工作区侧栏，顶部显示最近会话，二级菜单加面包屑，导航更清晰。",
	"HuanLinOTO/dsh-plugin-anti-ads": "广告拦截器，四层防御机制，彻底屏蔽dsh-ads插件的所有广告位。",
	"ZeroHackz/OpenFlowFrames": "开源流程框架，用于构建和编排自动化工作流，提升任务处理效率。",
	"titanwings/dsh-better-browser": "让Agent操控你已登录的浏览器，通过13个工具实现真实网页操作。",
	"bill9109/dsh-webbridge": "集成Kimi WebBridge，让DeepSeek Harness与浏览器无缝协作。",
	"weinibuliu/deepseek-harness-vsc-extension": "在VS Code中使用DeepSeek Harness，提供集成开发环境支持。",
	"SnowCrescenter-tech/dsh-desktop": "Windows桌面版，无边框窗口、托盘、通知等原生体验，开机自启。",
	"RYun601/dsh-launcher": "一键启动和管理DeepSeek Harness服务，支持后台运行、状态查询和更新。",
	"1na-ko/dsh-hdc-bridge": "鸿蒙开发助手，支持设备调试、离线知识库和构建工具链。",
	"omdsh-dev/dsh-tool-stat": "统计工具，提供描述统计、百分位数、相关性等分析，零依赖。",
	"morluto/smokinggun": "帮助Agent定位代码复杂度热点，快速找到性能瓶颈。",
	"imetn/dsh-lark-bridge": "双向控制飞书，让DeepSeek Harness与飞书消息和操作互通。",
	"Yihong89/dsh-usage-plugin": "统计每次会话的Token用量和费用，按DeepSeek定价表估算成本。",
	"rainforest888/dsh-plugins-raincode": "为DeepSeek Harness提供模型池、缓存与重试机制，并支持浏览技能目录，让模型调用更稳定高效。",
	"techysy/deepseek-harness-fnos": "将DeepSeek官方浏览器界面打包为fnOS应用，本地常驻运行，统一接入官方网关，开箱即用。",
	"fakechris/dsh-track": "在DSH中嵌入任务管理引擎，支持决策记录、灵感捕捉和类Linear的议题存储，让人与AI协作更有条理。",
	"makuralymi/dsh-webUI-Glass-Theme": "为DSH网页界面换上玻璃拟态主题，让操作界面更通透美观。",
	"DoggyHU/dsh4vscode": "在VS Code中直接使用DeepSeek Harness聊天窗口，支持独立会话和模型自动路由，编码时无需切换应用。",
	"havingautism/dsh-deepresearch": "为DeepSeek Harness增加深度研究能力，自动多步搜索、分析并生成结构化报告。",
	"HuanLinOTO/dsh-plugin-better-sidebar-plugin-office": "为侧边栏插件增加Office三件套预览功能，直接查看Word、Excel、PPT文件，无需下载。",
	"paean-ai/8x-skills": "提供8倍速技能包，加速AI执行常见任务，提升操作效率。",
	"entireyu/dsh-launcher": "一键安装和启动DeepSeek Harness的桌面助手，简化配置流程，适合新手快速上手。",
	"lehhair/dsh-mobile": "在手机上使用DeepSeek Harness，随时随地与AI对话和管理任务。",
	"jyh20030112/dsh-visual-plugin": "为DSH添加可视化操作界面，让插件管理和数据展示更直观。",
	"yyh-001/dsh-companion": "给DeepSeek开启陪伴模式，支持人格设定和长期记忆，可选QQ通道，让聊天更贴心。",
	"litestartup-com/litestartup-skills": "直接从AI助手发布博客、文档、网站和更新日志，还能发送营销邮件，一句话搞定内容上线。",
	"wingoo/codex-plugin-dsh": "把本地Codex应用服务器作为模型提供方接入DeepSeek Harness，扩展模型选择。",
	"WindLX/paper_plane_x": "本地优先的科研工作台，整合PDF解析、论文抽取、事实核查和文献检索，助力综述写作。",
	"RangeKing/vibemeter": "实时监控智能体运行状态，帮你直观了解它们的工作方式和协作情况。",
	"Mongfayi/dsh-recall": "为DSH网页界面增加消息撤回功能，一键撤销用户消息及其后续内容，且不影响代码修改。",
	"gxpppp/dsh-search-mcp": "用Tavily、Brave等搜索服务替换DSH内置搜索，可在网页设置中自由配置，并禁用默认搜索源。",
	"vlln/dsh-loop": "为DSH添加定时循环功能，支持循环命令、工具和活动状态显示，方便自动化任务。",
	"PicGo/dsh-plugin": "借助PicGo将图片和文件上传到你的图床，在DeepSeek Harness中轻松管理素材。",
	"moduqishi/GrassVison": "为纯文本大模型增加图像理解能力，自动将图片交给视觉模型分析，再把结果注入文本模型，体验接近原生多模态。",
	"MorGogh/widget-dock": "为DeepSeek Harness提供可拖拽的悬浮面板，显示余额、令牌、统计等关键信息。",
	"HuanLinOTO/dsh-plugin-sleep": "让模型可以调用sleep工具暂停指定毫秒，支持取消和限制时长，便于控制执行节奏。",
	"LaoYueHanNi/dsh-token-usage": "显示DeepSeek Harness的令牌使用情况，帮助你监控和管理API消耗。",
	"omdsh-dev/dsh-book2skill": "将书籍转化为技能的五阶段插件，包含解析、理解、生成和安装，并有人工审核环节和浏览器时间线面板。",
	"XYZ1024-alt/dsh-side-panel": "为DeepSeek Harness添加侧边栏，方便快速访问常用功能和信息。",
	"bitterSmilezzz/dsh-mac-desktop": "在macOS上以原生桌面窗口打开DeepSeek Harness网页界面，体验更流畅。",
	"erduotong/dsh-plugin-graph": "可视化展示DeepSeek Harness插件之间的依赖关系图谱，让插件结构一目了然。",
	"havingautism/dsh-notebooks": "在DeepSeek Harness中管理Jupyter笔记本，方便编写和运行代码。",
	"mitao-su/dsh-playwright-cli": "封装Playwright命令行工具，让智能体可以安装浏览器、运行测试并打开HTML报告。",
	"dongsheng123132/dsh-lineage": "数据血缘追踪插件，帮你梳理数据来源与流向，让数据关系一目了然。",
	"ben7am1n/dsh-review-skills": "技能评审插件，用于评估和审查技能掌握情况，辅助学习与提升。",
	"UynajGI/dsh-ssh": "SSH远程执行插件，支持跳板机、文件传输和远程命令，轻松管理远程服务器。",
	"FlytoMAYDAY80/dsh-pet": "桌面小鲸鱼宠物，实时显示会话状态并提醒，让工作更生动有趣。",
	"Sparrived/DSH-Deeptop": "轻量桌面客户端，让你更方便地使用DeepSeek Harness，无需浏览器。",
	"kinyokun/dsh-session-import": "会话日志导入工具，安全恢复历史对话，同步状态无需刷新。",
	"djasdh/interest-memory": "低内存AI记忆后端，占用小且准确，让智能体记住重要信息。",
	"codeAnqiang-ma/dsh-superpowers": "超级技能包，提供方法论和会话启动模板，提升工作效率。",
	"NEXTINDIE/DeepSeek-Harness-for-VS-Code": "在VS Code中像ChatGPT一样使用DeepSeek，聊天、跨项目会话都方便。",
	"yuxino/dsh-blue-whale-maid": "桌面宠物提醒器，任务完成时可爱提醒，不打扰工作。",
	"omdsh-dev/dsh-daily-progress": "每日进度追踪插件，帮你记录和查看每天的工作进展。",
	"syy-shark/dsh-music-plugin": "音乐播放插件，在DeepSeek Harness中享受音乐，工作娱乐两不误。",
	"sjscy05/deepseek-harness-vision-plugin": "视觉识别插件，让DeepSeek能看懂图片，扩展应用场景。",
	"YYTbit/dsh-plugin-meta-memory": "长期记忆系统，为DeepSeek Harness提供结构化记忆，记住用户偏好。",
	"bpc-oss/dsh-web-billing": "Token计费插件，按官方政策自动计算费用，支持人民币美元显示。",
	"AprilWizard/dsh-multi-cot": "为DeepSeek Harness提供多路径推理插件，通过多次采样、内部投票和计划执行审查流程，提升回答质量。",
	"TQSY114514/dsh-ui-appearance": "自定义DeepSeek Harness界面外观，支持主题色、背景图、透明度及毛玻璃效果，打造个性化视觉体验。",
	"KarlOfLaw/dsh-goal-mode-enhance": "为DeepSeek Harness增加可视化目标模式，提供目标栏、头部入口、设置页及历史总览，方便管理多会话目标。",
	"zzh-newlearner/dsh-postmortem": "本地优先的故障复盘插件，记录DeepSeek Harness会话中的失败案例，帮助分析原因和改进。",
	"chenhaolove89/dsh-ccswitch-import-lite": "从CCSWITCH批量导入模型供应商配置的轻量插件，简化DeepSeek Harness的模型接入流程。",
	"krislavten/ai-sdk-provider-dsh": "将DeepSeek Harness作为AI SDK的语言模型提供者，兼容AI SDK v6和v7，方便开发者集成。",
	"hccccc01333/dsh-report-html": "生成自包含的交互式HTML报告，支持Markdown、表格、图表、中国地图、流程图、数学公式及下钻表格。",
	"renat3u/dsh-paseo": "为DeepSeek Harness扩展paseo插件功能，增强其处理能力。",
	"omdsh-dev/dsh-fun-weather": "为DeepSeek Harness添加天气标签页和跟随天气变化的主题，数据来自Open-Meteo。",
	"Elaina-real/dsh-tiered-approval": "为DeepSeek Harness提供分级自动审查：静态规则安全网、LLM审查和人工兜底，自动放行安全操作，拒绝不可逆操作，其余询问人类。",
	"yoke233/dsh-openai-codex-auth": "为DeepSeek Harness添加OpenAI Codex的OAuth登录和使用卡片插件。",
	"lglglglgy/dsh-whale-pet": "为DeepSeek Harness添加鲸鱼宠物插件，增加趣味互动。",
	"Tokimorphling/tokilake-ai-gateway": "自托管的AI网关，用于分布式本地LLM GPU，提供OpenAI兼容API，支持NAT穿透、WebSocket/QUIC隧道及多种推理引擎。",
	"Xilin3/dsh-prompt-persona": "在设置页面编辑系统提示词（部署角色），并实时预览效果，方便调整AI行为。",
	"Drifter-yh/dsh-tool-policy": "为DeepSeek Harness提供声明式默认拒绝的工具策略插件，增强安全性。",
	"pinkllo/dsh-reasoning-translator": "让 DeepSeek 模型用你的语言写出思考过程，方便理解它的推理逻辑。",
	"Yuuz12/dsh-webui-auth": "为 DeepSeek Harness 网页界面增加强制登录，保护资源和接口，防止未授权访问。",
	"HuanLinOTO/dsh-plugin-aigc-canvas": "提供无限画布和多种媒体工具，连接不同 AI 服务，方便创作和编辑内容。",
	"Axiaohungry/dsh-llm-codebuddy": "在 DeepSeek Harness 中使用 WorkBuddy API，方便公司用户利用积分调用模型。",
	"jark006/RemoteOps": "远程系统维护和嵌入式 Linux 开发的 MCP 工具，方便远程操作和管理设备。",
	"drfccv/dsh-theme-neko": "给 DeepSeek Harness 网页界面换上甘城猫猫主题皮肤，让界面更可爱。",
	"sakikoTGW/pack-agent": "像安装游戏整合包一样，一键安装和管理你的 AI 代理工具集。",
	"Andy8647/dsh-auto-approval": "自动批准 DeepSeek Harness 中的操作请求，减少手动确认，提高效率。",
	"xinCodes/deepseek-billing-plugin": "显示 DeepSeek 官方 API 余额和当前会话费用，帮你控制成本。",
	"SnowCrescenter-tech/dsh-launcher": "一键启动 DeepSeek Harness，无需安装 Node.js 等环境，便携免安装。",
	"SeverusZh/dsh-notify-windows": "在 Windows 上接收 DeepSeek Harness 的通知提醒，不错过重要消息。",
	"omdsh-dev/dsh-fun-typewriter": "为聊天界面添加打字机音效，通过 WebAudio 模拟键盘声，无需音频文件。",
	"omdsh-dev/dsh-paddle-ocr": "集成 PaddleOCR 文字识别，方便在聊天中提取图片中的文字。",
	"HuanLinOTO/dsh-plugin-spur": "在聊天流中显示一条鞭子，快速甩动鞭子即可让 AI 代理继续工作。",
	"libinyam/dsh-vision-provider": "配置 OpenAI 兼容视觉模型，让 DeepSeek Harness 支持图像识别功能。",
	"chushixixin/dsh-harness-mcp-server": "将 DeepSeek Harness 的智能体能力封装成 MCP 服务，让外部工具也能调用其推理与执行能力。",
	"forrestahha/dsh-voice-input": "为 DeepSeek Harness 网页界面添加语音转文字输入功能，直接用语音输入内容。",
	"phoenixlucky/chrome-mcp-bridge-2026-skill": "为 AI 代理提供稳定可靠的 Streamable HTTP MCP 连接能力，确保通信顺畅。",
	"030611/qiushi-dsh-evidence-audit": "为 DeepSeek Harness 生成基于哈希链的证据收据，只读审计，确保操作可追溯。",
	"InklingYoshi584/dsh-tool-hashline": "为 DeepSeek Harness 提供带哈希锚定的读写编辑工具，每行内容带校验，防止陈旧数据被修改。",
	"Sunrisepeak/dsh-index": "一键安装 DeepSeek Harness 插件和智能体配置包，简化插件管理。",
	"STARDUSTLC666/dsh-email": "DeepSeek Harness 邮件插件，支持多账号收发、搜索、管理附件，内置主流邮箱预设，配置简单。",
	"bernardleex526/oh_my_deepseek_harness": "为 DeepSeek Harness 提供多智能体编排模式，灵感来自 oh-my-opencode-slim，方便管理多个智能体。",
	"0xsline/dsh-spotlight": "为 DeepSeek Harness 网页版提供键盘优先的命令面板，快速执行操作。",
	"PangYiMing/dsh-mobile-control": "DeepSeek Harness 手机操控插件，通过 ADB 或 iOS 协议远程控制手机。",
	"TYEclipse/dsh-webfetch": "为 DeepSeek Harness 抓取网页内容，提取干净的 Markdown 或纯文本，并列出链接清单，只读且零依赖。",
	"omdsh-dev/dsh-github-integration": "为 DeepSeek Harness 提供 GitHub 集成功能，方便管理代码仓库和协作。",
	"jiruidai/dsh-meta-orchestrator": "为 DeepSeek Harness 提供模型原生元智能体插件，动态规划任务流程并协调工具。",
	"brittanistrehlowll-oss/dsh-quota-panel": "为 DeepSeek Harness 网页界面添加服务商配额和余额角标，支持服务端代理和配置化显示。",
	"yoke233/dsh-prime-agent": "为 DeepSeek Harness 代码模式提供持久化的强化学习控制面板，优化智能体行为。",
	"arcmosin/dsh-wordbox": "把项目里常用的词句存进词箱，需要时一键粘贴，省去反复输入的麻烦。",
	"dpskh/dsh-a2a": "让多个AI代理在Harness中互相通信协作，构建代理网络。",
	"Scorp1o117/dsh-tool-vision": "为DeepSeek Harness接入外部视觉模型，让AI能看懂图片内容。",
	"HarcoChen/dsh-vsc-integration": "将DeepSeek Harness与VS Code编辑器深度集成，方便在编辑器中操作。",
	"omdsh-dev/dsh-inspect": "自动检查问题、修复并复查，形成闭环，提升代码质量。",
	"lunw/shopline-ai-toolkit-dsh": "连接SHOPLINE开发者工具，让AI助手能操作店铺数据，提升电商效率。",
	"WardLu/shadow-vision": "给纯文本AI加上视觉能力，支持图片识别、OCR和界面分析。",
	"hnmrxz/dsh-plugin-deepseek-balance": "在状态栏实时显示DeepSeek账户余额，方便掌握费用消耗。",
	"1475505/dsh-plugin-miliastra-toolbox": "把千星沙箱的知识库接入DeepSeek Harness，方便查询游戏资料。",
	"YYTbit/dsh-plugin-codex-bridge": "将Codex的技能和配置桥接到DeepSeek Harness，扩展AI能力。",
	"morlay/session-persistence-rdb": "将会话数据保存到关系型数据库，重启后也能恢复历史记录。",
	"Starfie1d1272/dsh-builtin-toggles": "提供内置插件目录和安全的界面开关，方便管理Harness功能。",
	"gezi-wen/sage-mem": "保存和恢复AI对话上下文，让跨会话的交流更连贯。",
	"yyh-001/dsh-expression": "用语义搜索找到表情包，并通过QQ通道发送真实文件。",
	"niyongsheng/free-vision-skill": "在macOS上本地识别图片内容，无需联网，保护隐私。",
	"omdsh-dev/dsh-science": "在DeepSeek Harness中实现可复现的Python和R代码工作，以插件形式集成。",
	"wuxiangru915/dsh-review-loop": "为DeepSeek Harness提供增量代码审查，支持Web界面和命令，方便检查修改。",
	"kevenxz/dsh-desktop": "为DeepSeek Harness提供Windows桌面客户端，支持原生窗口、托盘和共享配置。",
	"Tieboyh/dsh-session-search": "无需索引即可跨代理搜索DeepSeek Harness中的会话记录。",
	"hyls9527/dsh-plugins": "为DeepSeek Harness扩展跨会话记忆和技能管理功能，丰富插件生态。",
	"Hyperionjust/dsh-tool-underseal": "为DeepSeek Harness提供工具密封保护，确保工具使用安全可靠。",
	"sunshine-lang/dsh-pdf": "为DeepSeek Harness提供PDF工具箱，可本地提取文本、元数据和页面范围。",
	"pineapple880066/dsh-webUI-pets": "为DeepSeek Harness Web界面添加桌面宠物，增加趣味互动体验。",
	"mrbbbaixue/dsh-desktop": "为DeepSeek Harness提供Windows桌面启动器，支持子进程管理和托盘控制。",
	"KnCRJVirX/dsh-desktop": "为DeepSeek Harness提供Electron桌面封装，方便桌面使用。",
	"0lidaxiang/dsh-plugin-greet": "为DeepSeek Harness提供问候插件，启动时自动发送欢迎消息。",
	"yauntyour/DSH-for-VSC": "将DeepSeek Harness的Web界面嵌入VS Code，支持侧边栏控制台和日志查看。",
	"LingLambda/dsh-undo": "为DeepSeek Harness提供上下文撤销和重做功能，方便回退或恢复模型状态。",
	"clearkurt/dsh-win-terminal-inspector": "检查DeepSeek Harness的Windows终端会话，便于调试和管理。",
	"Dino6021/dsh-usage-cost": "为DeepSeek Harness提供API使用时间线和成本统计，帮助控制费用。",
	"whitelonng/dsh-plugin-describe-image": "给纯文本模型装上眼睛，通过兼容接口调用视觉模型，让AI能看懂图片内容。",
	"Shmilyol/galgame-skin": "为DeepSeek Harness提供Galgame风格皮肤，让界面更美观可爱。",
	"AnacondaKC/dsh-douyin": "在侧栏直接刷短视频，支持原生播放、系列导航和精确回放，追更更方便。",
	"hootandy321/dsh-Agentlink": "连接Codex等智能体与DeepSeek Harness，实现会话监控、追问、取消和人工审批。",
	"vibeinging/dsh-agent-budget": "管理智能体树状结构的令牌预算，防止超支，让资源分配更合理。",
	"omdsh-dev/dsh-voice-funasr": "为DeepSeek Harness添加语音识别功能，支持语音输入和转写。",
	"omdsh-dev/dsh-tool-regex": "正则表达式测试工具，可匹配、提取、替换并解释正则，无需写代码。",
	"omdsh-dev/dsh-tool-schema": "JSON数据格式校验工具，支持验证、路径查询、解释和标准化，安全离线。",
	"LvienOeria/dsh-launcher": "安装后输入dsh-go即可启动DeepSeek Harness并自动打开浏览器，轻量便捷。",
	"Toukaiteio/dsh-effort-tweak": "在Web界面中调整自定义模型的推理努力程度，灵活控制思考深度。",
	"GooodWei/context-vista": "右侧悬浮栏实时显示上下文令牌用量和费用，支持压缩指令，一目了然。",
	"PerryLink/dsh-plugin-guide": "提供DeepSeek Harness插件开发指南、官方文档和实战技巧，助你快速上手。",
	"vcxmug/dsh-enhance": "通过MCP集成Firecrawl工具，让智能体轻松抓取网页内容，无需写代码。",
	"yangzhe1003/dsh-web-search-firecrawl": "为DeepSeek Harness提供Firecrawl搜索能力，增强网络搜索功能。",
	"omdsh-dev/dsh-revive": "一键复活被打断的会话，自动发送继续指令，恢复对话不费力。",
	"sunshine-lang/dsh-plugin-template": "提供DeepSeek Harness插件开发的现成模板，包含打包格式、工具定义、配置和测试，帮你快速创建新插件。",
	"whiteguo233/dsh-cc-connect": "通过CC Connect远程连接DeepSeek Harness，让你随时随地使用dsh功能。",
	"YYTbit/dsh-plugin-pi-bridge": "将树莓派的技能和配置接入DeepSeek Harness，扩展你的智能硬件应用。",
	"121103qwq/dsh-vision-sidecar": "为DeepSeek Harness提供免费云端视觉辅助，并保存会话证据，方便回溯查看。",
	"jasonsun29/ds-balance-card": "在DeepSeek Harness界面常驻显示额度卡片，自动识别API密钥并展示余额和套餐用量。",
	"omdsh-dev/dsh-drag-and-drop": "为DSH网页版增加文件拖拽上传功能，直接插入原始路径，无需复制文件到本地。",
	"lordqyxz/dsh-ark-quota": "在DeepSeek Harness侧边栏显示火山方舟套餐剩余额度，附带免重启刷新工具，方便随时查看。",
	"Nanki-nn/dsh-answer-pet": "为DeepSeek Harness添加一个可爱的桌面宠物，陪伴你的编程和对话过程。",
	"omdsh-dev/sandbox-micro": "为DeepSeek Harness提供微型沙箱支持，让你在隔离环境中安全运行代码。",
	"boNeXY226/dsh-cost-chip": "在DeepSeek Harness中用/cost命令查看每个会话的花费，并显示可拖拽的悬浮费用胶囊。",
	"Luaphes/dsh-web-attention-badge": "为DeepSeek Harness网页版添加注意力提醒，通过标签角标和图标变色提示待处理会话。",
	"MirDie/dsh-xai": "支持用xAI Grok的SuperGrok或X Premium账号登录DeepSeek Harness，扩展模型选择。",
	"15828148/dsh-portable-launcher": "一键启动DeepSeek Harness网页版的便携工具，自动安装Node.js和dsh，支持国内镜像和断点续传。",
	"Auran-Lu/dsh-client-ui-monitor": "监控当前会话的额度消耗、预估费用和API余额，帮你控制成本。",
	"Scorp1o117/dsh-soul-md": "为DeepSeek Harness加载Soul.md人设卡，赋予AI特定角色和性格，提升对话体验。",
	"omdsh-dev/dsh-ernie-image": "基于文心一言的图像生成插件，帮你快速创建和编辑图片。",
	"drowned-fish1/deepseek-harness-skillx": "安全发现、审计和采用外部Agent技能，防御提示注入和Agent诱骗攻击。",
	"omdsh-dev/sandbox-nono": "提供沙盒环境支持，让插件在隔离空间中安全运行。",
	"sjscy05/matlab-modelsim-vivado-plugin": "集成MATLAB、ModelSim和Vivado，一站式完成数字通信IC设计全流程。",
	"bobcat848/dsh-calculator": "实时计算DeepSeek API调用成本，帮你掌控花费。",
	"c-ling/dsh-plugin-pet": "桌面电子宠物，跟随AI助手状态变换心情，陪伴你的工作。",
	"bobleer/deepseek-harness-plugin-mcp": "让任何AI代理都能发现、安装和运行DeepSeek Harness插件。",
	"Player-MINEPIG/dsh-llm-codex-oauth": "用ChatGPT或Codex订阅登录，把额度变成DeepSeek Harness的模型提供方。",
	"sjscy05/dsh-task-progress-notifier": "任务进度通知插件，及时提醒你任务完成情况。",
	"HuanLinOTO/dsh-plugin-auto-blame": "模型回合后自动生成3条批判性建议，点击即可发送。",
	"Heyflyingpig/long-draft-input": "聚合发送框长文本，方便你输入和编辑大段内容。",
	"PerryLink/dsh-claude-move": "把Claude Code的会话、记忆和技能迁移到DeepSeek Harness，无缝续聊。",
	"hisaniwo/dsh-ergonomics": "优化会话体验：一键新建会话，上下键回溯输入历史。",
	"securstack/securstack-dsh-plugin": "在DeepSeek Harness中运行仓库安全扫描、策略检查和诊断。",
	"ccch1mneyyy/dsh-working-activity": "实时显示模型工作状态，用俏皮文案和工具运行信息装点界面。",
	"HaoyueQin/deepseek-harness-desktop": "将 DeepSeek Harness 网页界面打包成桌面应用，随时常驻后台，操作更顺手。",
	"zhaoscsc/dsh-wikilink": "在 DeepSeek Harness 对话中像用笔记软件一样输入双括号，自动搜索并引用笔记内容。",
	"LQ-1123/paste-to-workspace": "把粘贴或拖入聊天框的图片和文件自动保存到工作区，方便后续使用。",
	"STARDUSTLC666/dsh-slack": "将 DeepSeek Harness 接入 Slack，让你在 Slack 里直接与 AI 助手对话。",
	"franksong2702/dsh-codex-connect": "为 DeepSeek Harness 添加 ChatGPT 登录和 Codex 模型支持，扩展可用模型。",
	"lvyuchuiyi/dsh-funpack": "收集了一些有趣的小插件，为 DeepSeek Harness 增添更多玩法。",
	"hxyz486/dsh-archived-conversations": "在设置页面查看、恢复或删除已归档的对话记录，管理历史会话更轻松。",
	"omdsh-dev/dsh-pet-corner": "在 DeepSeek Harness 界面养一只桌面宠物，支持收藏和自定义设置。",
	"omdsh-dev/dsh-auto-chess": "在 DeepSeek Harness 网页里玩自走棋，可人机对战或双 AI 对弈。",
	"cccakeee/awesome-dsh-plugins": "整理了一份 DeepSeek Harness 插件目录，帮你找到靠谱的扩展并安全安装。",
	"MashedPotato817/dsh-git-plugin": "为 DeepSeek Harness 增加 Git 操作能力，用斜杠命令执行常用版本控制操作。",
	"Han-1413141/dsh-sticky-disclosure": "一键折叠对话中所有展开的卡片，支持自定义快捷键，让聊天界面更清爽。",
	"Dasooul03/dsh-plugin-deepseek-pricing": "实时监控 DeepSeek 价格，自动切换高峰低价时段，并统计会话费用。",
	"Beants/dsh-trellis": "为 DeepSeek Harness 提供类似知识图谱的可视化工具，帮助梳理对话结构。",
	"hashdiana/dsh-token-usage": "在 DeepSeek Harness 中显示每次对话消耗的 token 数量，帮你掌握用量。",
	"omdsh-dev/dsh-longbridge": "为 DeepSeek Harness 提供长桥证券数据接入，方便在会话中查看行情和交易信息。",
	"vvlife/awesome-deepseek-harness-plugins": "精选 DeepSeek Harness 的插件、工具、皮肤和扩展，帮你快速发现好用的资源。",
	"sunshine-lang/dsh-weather": "为 DeepSeek Harness 添加天气查询功能，可查看当前天气和未来多天预报，无需 API 密钥。",
	"Jesse-njx/dsh-memory": "为 DeepSeek Harness 提供记忆功能，自动提炼会话要点并标注来源，支持检索和扩展。",
	"emredeveloper/deepseek-harness-huggingface": "在 DeepSeek Harness 中浏览 Hugging Face 模型库，只读发现模型，方便选择使用。",
	"luoyu-xingu/dsh-background": "为 DeepSeek Harness 网页更换背景图片，支持本地路径和实时预览，让界面更个性化。",
	"stushansusu/dsh-miku-skin": "为 DeepSeek Harness 换上初音未来主题皮肤，蓝紫渐变、毛玻璃效果，支持自定义背景和亮暗模式。",
	"tianji-qingtian/dsh-composer-polish": "一键润色 DeepSeek Harness 输入框中的草稿，自动改写并回填，让文字更流畅。",
	"lire1131/dsh-undo-plugin": "为 DeepSeek Harness 提供配置快照和回滚功能，修改插件或设置后可随时撤销恢复。",
	"dbydd/dsh-onlyne": "让 DeepSeek Harness 智能体接入 QQ、微信、飞书和 Telegram，在会话中收发消息。",
	"omdsh-dev/dsh-fun-ticker": "在 DeepSeek Harness 中显示自选标的的行情跑马灯，覆盖加密、汇率、A股等，无需密钥。",
	"384961890-ui/pawin-brain-deepseek-harness": "为 DeepSeek Harness 智能体添加类脑记忆，支持记住、自我纠正和学习，提升智能表现。",
	"PerryLink/dsh-composer-history": "为 DeepSeek Harness 输入框添加终端风格的历史记录，支持方向键切换和草稿恢复。",
	"Mappedinfo/PlainDeck": "本地优先的幻灯片编辑器，使用纯 JSON 源文件，支持 Git 版本管理，简单高效。",
	"shiningsprk-arch/dsh-context-viewer": "在 DeepSeek Harness 中查看上下文信息，帮助理解当前会话状态和内容。",
	"Pheobe-Southwood/dsh-acp-paseo": "将DeepSeek Harness变成桌面应用，支持系统托盘、开机自启和多种皮肤。",
	"jkrandom-sudo/dsh-plugin-audit": "为DeepSeek Harness插件提供安全审计，检查权限并拦截风险操作。",
	"Scorp1o117/dsh-tdai-memory": "为DeepSeek Harness添加记忆功能，让AI记住对话上下文。",
	"Mongfayi/dsh-local-filetree": "在DeepSeek Harness网页界面中显示文件树，方便浏览工作区文件。",
	"omdsh-dev/dsh-daily-fortune": "每天为你抽签、算塔罗牌或送上一句名言，带来好心情。",
	"pangzi499/dsh-balance-stats": "在DeepSeek Harness网页中查看余额、会话花费和用量统计。",
	"KhanZou/Deepseek-Harness-as-Desktop": "把DeepSeek Harness变成桌面应用，支持系统托盘、开机自启和多种皮肤。",
	"itmoqing/DeepSeek-Harness-Skill": "让Codex或Claude把任务交给DeepSeek Harness执行，支持并发多工作区。",
	"biuboomc/dsh-plugin-consult": "与另一个会话的副本对话，不影响原会话，方便咨询和对比。",
	"openma-ai/deepseek-harness-typescript-sdk": "用TypeScript开发DeepSeek Harness插件，通过JSON-RPC控制AI代理。",
	"DGPisces/deepseek-harness-openai-oauth": "让DeepSeek Harness使用GPT模型，通过ChatGPT的OAuth登录。",
	"omdsh-dev/dsh-tool-diff": "比较文本、JSON、CSV或Markdown文件，显示差异，只读安全。",
	"omdsh-dev/dsh-tool-json": "用JMESPath查询JSON数据，轻量快速，无需额外依赖。",
	"omdsh-dev/dsh-tool-markdown": "转换HTML和Markdown，整理表格，生成目录，轻量实用。",
	"renat3u/tonghuashun-webui": "仿同花顺风格的网页界面插件，提供股票行情展示。",
	"1690834643/dsh-usage-dashboard": "查看 DeepSeek Harness 的使用情况统计面板，帮你掌握资源消耗和用量趋势。",
	"havingautism/dsh-ultra-ui": "为 DeepSeek Harness 提供增强版界面，操作更顺手，显示更清晰。",
	"AnkoCD/dsh-server-deployment": "在远程服务器上部署 DeepSeek Harness 网关，让多人通过浏览器登录使用，各自独立互不干扰。",
	"czzzlq/deepseek-harness-background": "自定义 DeepSeek Harness 的背景样式，让界面更符合你的审美。",
	"lin-cheng-lab/dsh-plugin-doctor": "安装插件前先做体检，检查版本兼容性，避免崩溃，省心又安全。",
	"crayonlu/dsh-web-search-tavily": "用 Tavily 搜索增强 DeepSeek Harness 的联网能力，无需额外 API 密钥。",
	"TiankunDai/dsh-vision-LMstudio": "让 DeepSeek Harness 调用 LM Studio 里的本地视觉模型，看图分析更灵活。",
	"omdsh-dev/web-components": "为 DeepSeek Harness 提供网页组件支持，丰富界面功能。",
	"BrambleXu/dsh-prompt-profile": "为 DeepSeek Harness 创建可复用的提示词模板，支持按轮次切换模型、替换参数和恢复状态。",
	"hnmrxz/dsh-plugin-sysmon": "在 DeepSeek Harness 底部状态栏显示 CPU、内存、磁盘等系统资源占用情况。",
	"CriscolTheCoder/dsh-plugin-browser": "为 DeepSeek Harness 添加浏览器操作能力，让你在对话中直接浏览网页。",
	"ylouis8/kph": "基于 DeepSeek Harness 的量化研究助手，能驱动真实回测和交易。",
	"NIyueeE/dsh-container": "提供 DeepSeek Harness 的容器镜像，开箱即用，自动更新，方便部署。",
	"dpskh/dsh-checkpoint": "在会话中标记探索起点，配合回退功能，把探索过程折叠起来，保持上下文干净。",
	"Sanqi-normal/dsh-webui-market-plugin": "为 DeepSeek Harness 网页版提供插件市场，浏览、安装、卸载社区插件，一键搞定。",
	"akira399/dsh-godot-skill": "为DeepSeek Harness注册Godot 4.x游戏开发技能，让你在对话中直接获得全栈游戏开发辅助。",
	"vibeinging/dsh-trace": "将DeepSeek Harness的对话、模型步骤和工具调用数据发送到yiTrace，方便你远程监控和分析运行情况。",
	"Ericwong5021/dsh-kanban": "为DeepSeek Harness网页界面添加任务看板，帮你直观管理任务进度。",
	"orriduck/dsh-tui": "为DeepSeek Harness提供轻量终端界面，支持会话管理，让你在命令行中高效操作。",
	"oitsukiii/deepseek-harness-lan": "让DeepSeek Harness网页界面在家庭局域网内可访问，一键配置，方便多设备共享使用。",
	"omdsh-dev/dsh-tool-encoding": "为DeepSeek Harness提供编码与哈希工具，支持多种格式转换和加密，无需额外依赖。",
	"omdsh-dev/dsh-tool-time": "为DeepSeek Harness提供时间处理工具，支持ISO 8601解析、时区转换和日期运算，无需额外依赖。",
	"JasonJin2006/dsh-sound-effects-plugin": "为DeepSeek Harness添加音效功能，包括背景音乐、成功提示音和提醒音，提升工作氛围。",
	"benzhoupo/dsh-dardar": "在DeepSeek Harness模型选择框旁显示DeepSeek V4模型的IQ指数，每5分钟更新，方便你对比选择。",
	"XCNXNXNX/dsh-portable-tavern": "为DeepSeek Harness添加RPG角色卡生成与角色扮演聊天功能，支持导入导出，独立运行。",
	"hccccc01333/dsh-excel-chat": "让你在DeepSeek Harness中通过对话操作Excel表格，创建、编辑、修复和验证数据，自动校验每次修改。",
	"Fisfzy/zotero-wave-rag": "为Zotero论文库提供深度检索插件，结合混合检索和语义分析，帮你快速找到论文中的关键细节。",
	"Moeblack/dsh-prompt-studio": "为DeepSeek Harness提供提示词编辑工具，支持实时预览，方便你调整系统提示和用户提示。",
	"xuender/dsh-history": "在DeepSeek Harness网页输入框中用上下键快速调用和重跑历史命令，提升操作效率。",
	"Elohia/pi-mm-vision": "让纯文本大模型（如DeepSeek）通过结构化空间编码“看见”图片，扩展视觉理解能力。",
	"Misaki14987/dsh-theme-taffy": "一款美化界面主题，让DeepSeek Harness看起来更清新可爱，告别默认的单调风格。",
	"xing-shuyin/ds-web-ui": "为DeepSeek Harness提供更友好的网页操作界面，让使用更顺手。",
	"PerryLink/dsh-auto-review": "自动审核工具，用第二模型对审批请求给出允许或拒绝的建议，默认拒绝，全程可查。",
	"omdsh-dev/session-teleport": "一键将当前会话迁移到另一台设备或环境，无缝继续你的工作。",
	"MashedPotato817/dsh-tool-browser": "内置浏览器自动化工具，让DeepSeek Harness能自动操作网页，完成填表、点击等任务。",
	"dongsheng123132/dsh-action-parity": "跨界面操作绑定与回放工具，确保不同界面下的操作行为一致，便于测试和复现。",
	"Aidenwu0209/dsh-PaddleOCR-Skills": "为DeepSeek Harness集成OCR文字识别能力，支持图形界面配置，轻松提取图片文字。",
	"huahai0202/dsh-better-archive": "增强归档会话管理，提供取消归档和删除功能，让历史记录整理更灵活。",
	"loguhan/dsh-workshop": "像Steam创意工坊一样的插件商店，浏览下载850多个社区插件，一键安装，带安全检测和中文说明。",
	"Bandersnatch0x/design-playbook": "为编程助手提供设计规范和接口约束，让生成的界面更可控、可审查，方便复用。",
	"moduqishi/dsh-open-in-finder": "在会话标题栏添加一键打开文件所在位置的按钮，快速定位文件。",
	"kalynnka/vscode-deepseek-harness": "将DeepSeek Harness集成到VS Code中，作为原生聊天助手使用，与Claude Code等并列。",
	"arrow949/dsh-turn-approval": "为每个任务提供单独的审批开关，让你精细控制哪些操作需要确认。",
	"Wanbinyu/dsh-billing": "管理DeepSeek Harness的使用费用，查看账单和余额，控制成本。",
	"Xieweikang123/dsh-vision-bridge": "让纯文本模型拥有视觉能力，粘贴图片即可通过视觉接口识别为文字。",
	"lonelymoon87/dsh-gitflow": "在 DeepSeek Harness 中管理 Git 工作流，查看状态、提交代码、发起合并请求，还能处理多工作树。",
	"anweat/dsh-browser": "为 DeepSeek Harness 提供内置浏览器能力，无需额外安装即可打开网页、执行自动化操作。",
	"caopu16/dsh-llm-kiro": "让 DeepSeek Harness 接入 Kiro 的 Claude 系列模型，用你的账号直接调用。",
	"gnulife/dsh-plugin-wechat": "在 DeepSeek Harness 中集成微信，方便收发消息和管理聊天。",
	"Jolly-J/dsh-deepseek-billing": "在 DeepSeek Harness 网页界面显示余额，并估算每个会话的花费。",
	"Jesse-njx/dsh-routines": "定时运行预设任务，按计划执行提示词，并把结果摘要发送到指定位置。",
	"Jesse-njx/dsh-cowork": "在 DeepSeek Harness 中读写办公文档和笔记本，支持 Excel、PDF、Word 等格式。",
	"fff122/dsh-prompt-presets": "在 DeepSeek Harness 中保存和复用常用提示词，一键调用，省去重复输入。",
	"PerryLink/dsh-memento": "为 DeepSeek Harness 提供跨会话记忆，分层管理、需审批、可追溯，让 AI 记住上下文。",
	"ljcscp/dsh-session-cost": "在 DeepSeek Harness 网页界面显示会话费用和余额，按官方价格分时段计算。",
	"coderPerseus/dsh-hub": "发现并浏览最好的 DeepSeek Harness 插件，方便你挑选和安装。",
	"pjy-20051012/dsh-file-preview": "在 DeepSeek Harness 中预览各种文件，无需下载即可查看内容。",
	"Alexis-fish/dsh-worktrees": "用 Git 工作树隔离并行会话，让多个 DeepSeek Harness 任务互不干扰。",
	"fzlong/dsh-balance-eta": "极简余额插件：显示余额、今日消耗和可用时长，余额低时自动提醒。",
	"mtaech/dsh-material-you": "为 DeepSeek Harness 换上 Material You 风格皮肤，清新蓝白配色，界面更美观。",
	"fengzhiyushui/dsh-desktop-window": "桌面窗口管理插件，帮你更高效地整理和切换应用窗口。",
	"moduqishi/dsh-opencode-usage": "在会话顶部显示opencode.ai的配额使用进度，支持毛玻璃详情面板和模型通道筛选。",
	"Simon314620/dsh-turn-index": "在DeepSeek Harness侧边栏显示对话轮次索引，方便快速定位历史消息。",
	"hnmrxz/dsh-plugin-usage-dashboard": "在底部状态栏展示DeepSeek使用量和费用，按会话统计token与成本，余额不足时提醒。",
	"omdsh-dev/dsh-scout": "只读探测运行环境，为智能体提供系统、软件、资源、端口、硬件和工作区信息。",
	"EvilIrving/dsh-repro": "生成最小化、脱敏、可复现的问题包，方便分享和调试DeepSeek Harness会话。",
	"PangYiMing/dsh-screenshot-diff": "像素级对比两张截图，生成差异图和并排对比图，帮助发现细微变化。",
	"shelken/dsh-co-authored-by": "在git提交时自动添加Co-Authored-By和Generated-By署名，记录协作与生成来源。",
	"flee42/dsh-desktop": "DeepSeek Harness的桌面版启动器，一键打开桌面应用。",
	"miaobuao/dsh-document-parser": "基于LiteParse的文档解析工具，快速提取各类文档内容。",
	"rabbitknight/dsh-tui": "DeepSeek Harness的终端界面，让你在命令行中流畅操作。",
	"zhang66633/dsh-plugin-installer": "插件安装器，帮你轻松安装和管理DeepSeek Harness插件。",
	"akira399/dsh-plugin-publisher": "插件开发与发布工作流工具，支持开发、验证、发布到市场，需用户授权。",
	"kelai141/dsh-host-web-compat": "向网页注入旧内核浏览器兼容补丁，解决老旧浏览器访问问题。",
	"jiangnanquan/dsh-ux": "增强DeepSeek Harness网页界面体验，并提供无边框桌面窗口模式。",
	"kunjinkao-os/dsh-mobile-gui-agent": "在手机上通过网页远程操控安卓设备，支持ADB连接、步骤确认和可视化操作，让AI助手帮你完成手机任务。",
	"jihongboo/dsh-apple-mode": "为DeepSeek Harness集成Xcode AI开发环境，一键安装配置，让AI助手具备完整的苹果开发能力。",
	"Zephyr-vibe/dsh-archived-sessions": "管理AI对话会话，支持安全归档、恢复和删除，还能快速打开记录文件夹，让会话整理更轻松。",
	"ropz12138/dsh-ui-background": "为DeepSeek Harness更换背景样式，同时调整相关组件外观，让你的AI界面更个性化。",
	"Asaiuta/dsh-session-hub": "在一个网页界面里集中管理和操控多台远程DeepSeek Harness服务器，无需切换窗口，提升多服务器协作效率。",
	"PerryLink/dsh-permission-rules": "为DeepSeek Harness设置精细的权限规则，按工具、参数和路径控制AI操作，允许、拒绝或询问，保障安全。",
	"YYTbit/dsh-plugin-vision-toolkit": "给纯文本AI助手加上视觉能力，支持图像识别和处理，让AI能看懂图片内容。",
	"RealAlexandreAI/dsh-nocturne-memory": "为DeepSeek Harness接入Nocturne记忆系统，让AI跨会话记住重要信息，提供更连贯的对话体验。",
	"zimixvx/dsh-archive-manager": "管理AI会话存档，支持归档、恢复和清理，让历史记录井井有条。",
	"TohsakaRIN521/dsh-academic-skill": "自动补全学术论文中除理论计算和数值分析外的其他部分，减少AI引用幻觉，让写作更可靠。",
	"schhaohao/dsh-file-explorer": "在DeepSeek Harness中浏览和管理文件，支持查看、上传和下载，方便AI处理本地资源。",
	"rxa3c/chat2skill": "从日常AI对话中自动提取和迭代技能，让常用操作沉淀为可复用的能力。",
	"030611/dsh-verification-receipt": "为每次AI对话生成简洁的隐私保护验证摘要，让你快速了解交互内容而不泄露敏感信息。",
	"baixinghao/intent-gate": "在AI编码前强制对齐需求意图，通过PRD和状态机图确保开发方向正确，避免AI瞎猜。",
	"sikwoxy/dsh-tool-reqpipe": "为DeepSeek Harness提供需求流水线工具，从需求到方案再到评审开发，一站式管理AI开发流程。",
	"rsagacom/dsh-ajw": "为 DeepSeek Harness 机器人安装功能装甲，每日聚合 DSH 插件生态开源项目。",
	"xiaoshihou514/dsh-desktop-pet": "给 DeepSeek Harness 装上鲸鱼娘桌宠，让桌面陪伴更可爱。",
	"juhe291/dsh-token-panel": "实时监控 Token 消耗，显示用量、压力、费用和历史曲线，帮你控制成本。",
	"TheTianzz/dsh-billing": "查看账户余额和会话费用，支持命令和界面显示，价格自动同步。",
	"ouyangyipeng/dsh-desktop": "非官方桌面启动器和运行管理器，方便你启动和监控 DeepSeek Harness。",
	"MoonShadow1976/chiral-pulse": "提供手性脉冲功能，为 DeepSeek Harness 增添独特能力。",
	"yangl326-Dylan/learning-dsh": "学习 DeepSeek Harness 的示例插件，帮助开发者上手。",
	"Nexus-Aethra/DSH-plugin-switch": "插件市场，让你浏览、搜索并安装 GitHub 上的社区插件和技能。",
	"Spirit4471/multimodal-bridge": "为纯文本模型接入视觉理解和图像生成能力，支持 MCP 和 DSH 两种方式。",
	"Mingxi2077/dsh-plugin-review": "审查模式插件，对代码进行多维度健康评分并显示雷达图和历史记录。",
	"bitterSmilezzz/dsh-model-selector": "对话模型选择器，支持分组折叠和名称搜索，方便切换模型。",
	"ShawnSiao/dsh-credentials-keychain": "计划中的凭证管理插件，为 DeepSeek Harness 提供系统级安全存储。",
	"PerryLink/dsh-session-pin": "在侧边栏固定会话，支持悬停标记、持久固定和置顶排序。",
	"NigelYao/dsh-view-modes": "为 DeepSeek Harness 提供多种视图模式，包括详细、普通和摘要。",
	"tanf1ng/dsh-tool-hackernews": "提供 Hacker News 工具套件，可获取热门故事、搜索和查看条目。",
	"ang-XWBWZ/dsh-approval-ai": "为DeepSeek Harness自动回答审批问题，统一调用大模型，并默认拒绝高风险操作。",
	"wuyuanjiang1/dsh2wechat": "把DeepSeek Harness接入微信，通过ClawBot机器人收发消息，方便在微信里使用。",
	"detpecca/DSH-Wiki": "为DeepSeek Harness提供维基百科查询功能，方便在对话中获取知识。",
	"Wine-Red/dsh-prompt-stash": "在DeepSeek Harness中暂存未写完的提示词，随时保存草稿，稍后再继续编辑发送。",
	"ophielel/dsh-devkit": "为DeepSeek Harness提供开发工具集，方便开发者调试和扩展功能。",
	"ihuajiu/dsh-plugin-finder": "用自然语言搜索DeepSeek Harness插件，输入需求即可找到匹配插件并给出安装命令。",
	"Spirtxiaoqi7/mindspace-dsh-local-rag": "为DeepSeek Harness提供本地混合检索增强生成，让AI回答结合本地知识库，更准确。",
	"jkrandom-sudo/dsh-ci-doctor": "自动监控GitHub Actions的CI失败，把原始日志变成结构化诊断卡片，省去翻日志的麻烦。",
	"cakeni/harness-pet": "在DeepSeek Harness里养一只虚拟宠物，增加趣味性，非官方插件。",
	"PerryLink/dsh-github": "让DeepSeek Harness操作GitHub，创建和审查PR、读取issue，所有写操作需人工确认。",
	"PangYiMing/dsh-port-guard": "处理DeepSeek Harness的端口占用问题，提供复用、切换或精准杀进程三种方案。",
	"wuwuzhige-sudo/dsh-remote-acces": "一键为DeepSeek Harness设置密码保护的远程访问，通过Caddy代理和systemd服务，方便局域网和Tailscale外网访问。",
	"yjm110517/content-to-editable-ppt-skill": "根据主题、文档或大纲，快速生成可编辑的多页PowerPoint演示文稿。",
	"TtTRz/dsh-wecom": "把DeepSeek Harness接入企业微信，每个会话都有带真实工具的持久化AI助手。",
	"STARDUSTLC666/dsh-dingtalk": "将DeepSeek Harness接入钉钉，方便在钉钉群里使用AI对话功能。",
	"bluecobaltum/dsh-lan-proxy": "局域网代理工具，让多台设备共享网络连接，提升访问速度与稳定性。",
	"PerryLink/dsh-doublecheck": "发布前自动检查需求、测试实现、验证交付，帮你把好质量关的工程规范插件。",
	"beex-labs/dsh-desktop-plugin": "桌面端插件，让DeepSeek Harness在电脑上运行更便捷，操作更顺手。",
	"meme-dog/dsh-plugin-finder": "在智能体内搜索并审查DeepSeek插件，从试用评估到正式安装一步到位。",
	"Slowdownnn/dsh-read-history": "把Claude或Codex的聊天记录迁移到DeepSeek Harness，无缝衔接历史对话。",
	"147228/dsh-black-whale": "黑鲸实验室主题皮肤，换上官网黑鲸和夕小瑶形象，让界面更有个性。",
	"chajiuqqq/dsh-claude-theme": "把DeepSeek Harness界面换成Claude风格，熟悉又清爽的视觉体验。",
	"Ethanout/computer-use-plus": "Windows电脑自动化控制插件，低延迟低消耗，让AI帮你操作电脑。",
	"hellosz/dsh-pets": "在DeepSeek Harness里养电子宠物，增加互动乐趣，陪伴你的工作时光。",
	"sanshanya/better-model-provider": "为不同模型单独设置推理强度和视觉能力，让AI服务更贴合你的需求。",
	"crayonlu/dsh-web-search-firecrawl": "用Firecrawl做网络搜索，无需DeepSeek密钥也能获取实时网页信息。",
	"BruceWu1126/dsh-web-background": "自定义DeepSeek Harness网页背景，打造属于你的专属工作空间。",
	"Liu-ty/dsh-balance-display": "在DeepSeek Harness界面显示API余额，随时掌握用量不超支。",
	"omdsh-dev/omdsh-runtime": "运行时环境插件，为DeepSeek Harness提供基础运行支持，确保稳定执行。",
	"MC5lan/dsh-multimodal": "给DeepSeek装上眼睛和画笔：直接贴图识别内容，还能自动生成配图，图文对话更轻松。",
	"dongsheng123132/dsh-audit-bundle": "为DeepSeek Harness的多个证据生成器提供内容寻址审计索引，方便追踪和验证数据来源。",
	"justinhuangai/deepagent": "基于DeepSeek Harness的智能助手，帮你自动完成工作任务，所有功能都可通过插件扩展。",
	"ByronLeeeee/dsh-legal-dashboard": "面向法律工作场景的仪表盘和文档工具，帮助管理案件相关信息和文档。",
	"xiaoshihou514/dsh-weixin": "将DeepSeek Harness与微信集成，让你在微信中直接使用其功能。",
	"PandaColour/dsh-cmd-starter": "为DeepSeek Harness提供命令行启动工具，支持类似Claude的追加提示和恢复会话功能。",
	"2303572348/deepseek-harness-memory": "为DeepSeek Harness添加持久记忆功能，让它在多次对话中记住你的偏好和历史。",
	"dongsheng123132/dsh-release-proof": "为DeepSeek Harness生成发布证明，确保发布内容的完整性和可追溯性。",
	"qing3a/dsh-plugin-verify": "一键验证DeepSeek Harness插件的命令行工具，自动运行测试并生成报告，确保插件无副作用。",
	"PerryLink/dsh-output-styles": "为DeepSeek Harness提供可切换的输出样式，支持会话级持久化和运行时切换，让回复风格更灵活。",
	"edwardyang0011/dsh-ui-skins": "为DeepSeek Harness更换界面皮肤，让外观更符合你的喜好。",
	"kongxiangyiren/dhs-theme-plugin": "管理DeepSeek Harness的主题，方便切换和定制界面风格。",
	"zed1902209846-dotcom/DPwhale-plugin": "在DeepSeek Harness中养一只小桌宠，每次对话随机出现名字，抽到特定名字还有惊喜效果。",
	"Letter2025/dsh-approval-llm": "为DeepSeek Harness提供独立的审核模型，自动批准或拒绝权限请求，提升操作效率。",
	"dsh-plugin/dsh-plugin.github.io": "DeepSeek Harness社区插件目录，方便发现和分享各类插件。",
	"Blaczz/dsh-soundscape": "为DeepSeek Harness添加声音效果，包括完成提示、警告和打字音效，增强交互体验。",
	"tianji-qingtian/dsh-spec-loop": "帮你把开发流程串成闭环：从写规格、批准、实现到逐条验收，全程用 /spec 命令驱动，让每一步都清晰可控。",
	"feiyang-dev/DeepSeek-Harness-Desktop": "一键安装和启动 DeepSeek Harness 桌面版，自动检测环境、显示进度，装好直接打开主界面，省去手动配置的麻烦。",
	"lynkas/dsh-think-flow-flow": "让 AI 回复像打字机一样逐字显示，还能按模型分别控制开关，阅读体验更自然。",
	"hrhgit/deepseek-harness-plugin-manager": "在网页上管理 DeepSeek Harness 的插件，可以查看、搜索、分组、启用或禁用，操作简单直观。",
	"xinmo114514/dsh-usage-widget": "悬浮窗实时显示 Token 用量，可拖动、看曲线或热力图，还能查看总消耗，帮你掌握花费情况。",
	"zimai233/dsh-figma-to-lottie": "把 Figma 或 SVG 设计稿转成 Lottie 动画文件，直接用于网页或应用，无需手动编写动画代码。",
	"Loner1024/deepseek-harness-sdk-rs": "用 Rust 语言控制 DeepSeek Harness，可以把它作为子进程启动并发送指令，适合开发者集成到自己的工具里。",
	"bitterSmilezzz/dsh-skill-manager": "在 DeepSeek Harness 设置里增加技能管理页面，方便你统一查看和配置各种技能。",
	"AdamPlatin123/dsh-tonghuashun": "给 DeepSeek Harness 换上同花顺风格的皮肤，并显示代码量 K 线行情面板，炒股看盘更顺手。",
	"LJH-snow/dsh-tool-github": "为 DeepSeek Harness 提供 GitHub 工具集成，方便在对话中直接调用 GitHub 功能。",
	"yoke233/dsh-pixel-whale": "在 DeepSeek Harness 网页里养一只像素鲸鱼，它会根据运行状态活泼互动，增添趣味。",
	"ben7am1n/dsh-claude-marketplace": "让 DeepSeek Harness 兼容 Claude Code 的插件市场，可以直接使用那些插件。",
	"agentic-control-plane/dsh-acp-plugin": "给 DeepSeek Harness 加一道安全闸门，每次调用工具前都检查是否符合策略，防止误操作。",
	"Babulubobo/dsh-codex-oauth": "在 DeepSeek Harness 里登录你的 Codex 订阅账号，就能使用 Codex 的功能。",
	"FantasyStarry/dsh-token-stats": "统计 DeepSeek Harness 的 Token 使用量，帮你了解消耗情况。",
	"hellosky983/dsh-skillradar": "扫描当前会话中的技能，评估与对话的相关度，并推荐最合适的技能加载。",
	"Alyosha28/deep_option": "港美股期权研究与风险分析助手，帮助您评估期权交易风险。",
	"Gandufu/dsh-plugin": "为DeepSeek Harness提供齐天大圣主题皮肤，支持亮暗模式与响应式布局。",
	"dylan121322/llm-adaptive": "自适应语言模型插件，根据对话动态调整模型行为以提升响应质量。",
	"baiyun200/dsh-dashboard": "可视化DeepSeek Harness插件生态的看板，每日自动更新插件信息。",
	"anweat/dsh-plugin-dev-guide": "提供DeepSeek Harness插件开发与发布指南，从零开始到自动发布。",
	"hellosky983/dsh-qrcode": "离线二维码生成器，纯本地运行，无需网络，方便生成二维码。",
	"revive/dsh-git-credentials": "安全存储GitLab和GitHub令牌，加密保存，按需调用，保护模型上下文。",
	"fryghost/deepseek-eyes": "让纯文本模型拥有视觉能力，粘贴图片即可通过视觉API描述内容。",
	"wuwuzhige-sudo/dsh-terminal-panel": "在DeepSeek Harness网页界面中直接执行终端命令，支持持久目录和密码提示。",
	"Jesse-njx/dsh-skillport": "让Claude Code等现有技能无缝运行在DSH中，自动发现并转换技能格式。",
	"alooshxl/dsh-session-pins": "为DeepSeek Harness添加固定会话菜单，方便快速切换常用会话。",
	"Moeblack/dsh-payload-capture": "捕捉每次模型请求的API数据，以JSON格式保存到本地，便于调试分析。",
	"Fisfzy/math-lean": "使用Lean内核验证数学推理，确保推理过程严谨可靠。",
	"ben7am1n/dsh-browser": "通过Playwright自动化浏览器操作，让模型能够控制网页执行任务。",
	"ben7am1n/dsh-security-scan": "为DeepSeek Harness提供安全扫描功能，帮助检查项目中的安全漏洞。",
	"qingzhuo-cn/agent-fix": "为AI编程助手提供通用修复技能，解决安装、路径、版本等常见问题。",
	"Civitasv/dsh-plugin-colorscheme": "为DeepSeek Harness更换配色主题，让界面更符合你的审美。",
	"ly6170/dsh-messager": "给DeepSeek Harness添加消息提醒，通过飞书推送通知，不错过重要信息。",
	"beancookie/dsh-plugin-anydoc": "将Word、PPT、PDF等文档转换成Markdown格式，方便AI处理。",
	"NaNExist/dsh-win-launchscript": "Windows下一键启动DeepSeek Harness，自动打开浏览器并管理服务。",
	"cnyac/dsh-polling": "为DeepSeek Harness添加定时任务功能，用自然语言创建轮询任务。",
	"AmethystLuna/logicprobe": "核查AI编程助手的声明，对设计文档和重构计划做逻辑验证。",
	"hahaha-taotao/dsh-oauth-api": "为DeepSeek Harness添加OAuth登录支持，兼容Grok、Codex等平台。",
	"baidd1011/dsh-code-impact": "分析TypeScript/JavaScript代码变更影响，只读不修改，帮你评估改动风险。",
	"PerryLink/dsh-skill-pack-security": "提供5个安全审计技能，扫描密钥、依赖、供应链和提示注入风险。",
	"YJSoooooo/dsh-chrome": "让DeepSeek Harness控制你已登录的Chrome浏览器，实现自动化操作。",
	"1while1/dsh-whale-subagent": "为DeepSeek Harness添加鲸鱼少女主题的子代理面板，实时跟踪任务进度。",
	"YKennen/dsh-zh-output": "强制DeepSeek Harness用中文思考和输出，适合中文用户。",
	"acosmi/dsh-plugin": "DeepSeek Harness社区插件合集，包含多种实用功能。",
	"nekogpt/dsh-ui-quote-selection": "在对话中选中任意文本，即可一键引用到输入框，方便你引用聊天内容继续提问。",
	"showlibia/dsh-plugin-installer": "帮你一键安装和管理 DeepSeek Harness 插件，省去手动配置的麻烦。",
	"dongsheng123132/dsh-2origin": "为 DeepSeek Harness 提供状态快照与差异对比，让数据变化一目了然且不可篡改。",
	"lynx-gt/dsh-subagent-tools": "增强 DeepSeek Harness 的子代理功能，让多任务协作更高效灵活。",
	"ZgblKylin/dsh-terminal": "为 DeepSeek Harness 集成终端功能，让你在界面内直接执行命令。",
	"mouliangyu/dsh-plugins": "汇集社区开发的 DeepSeek Harness 插件，方便你发现和安装更多扩展。",
	"inmny/dsh-git-bash": "为 DeepSeek Harness 提供 Git Bash 支持，让你在 Windows 下也能使用 Bash 命令。",
	"yangyongzhen/dsh-session-export": "把 DeepSeek Harness 的会话导出为 Markdown 文件，方便你回顾、写博客或存档。",
	"2472786266-spec/deepseek-hsrness-devkit": "提供多模态画廊和智能体监控面板，让你在 DeepSeek Harness 中集中管理多媒体与多智能体。",
	"Yugitan/dsh-skin": "为 DeepSeek Harness 界面换肤，支持渐变背景、壁纸、透明度和主题色，并保存你的设置。",
	"elementor-i/dsh-agentmemory": "为 DeepSeek Harness 添加持久记忆功能，让智能体跨会话记住关键信息。",
	"chnjames/dsh-plugin-market": "在 DeepSeek Harness 内浏览、安装和管理社区插件，支持 GitHub 和 npm 双源搜索。",
	"PerryLink/dsh-checkpoint-rewind": "为 DeepSeek Harness 提供快照回滚功能，每次操作前自动保存状态，随时一键恢复。",
	"ilharp/dsh-tool-approval": "为 DeepSeek Harness 增加手动确认模式，让每次工具调用都需你批准，更安全可控。",
	"ben7am1n/dsh-memory": "为 DeepSeek Harness 提供跨会话的持久记忆存储，让智能体记住你的偏好和历史。",
	"Isekai-Mfu/dsh-mimo-vision-hint": "将图片识别任务交给专门的子模型处理，帮你快速分析图片内容。",
	"wulun811/LiuHe": "为开发者提供代码解析与编辑工具，支持多语言分析、修改和代码质量检查。",
	"ben7am1n/dsh-deepseek-usage": "查看DeepSeek账户余额和用量统计，方便管理使用情况。",
	"RealAlexandreAI/dsh-atuin": "自动记录你在DeepSeek Harness中的提问，方便后续查阅历史。",
	"suimi8/dsh-test-runner": "自动检测并运行项目测试，快速汇总失败原因，帮助定位问题。",
	"lin-cheng-lab/dsh-deepseek-balance": "在界面角落显示DeepSeek余额，并生成7天和30天的用量费用图表。",
	"BiBoyang/dsh-im-bridge": "将DeepSeek Harness接入微信等聊天工具，支持远程审批和消息推送。",
	"huey1in/trio": "一键安装浏览器自动化、MCP服务和GitHub集成，扩展DeepSeek Harness功能。",
	"XavierMarquis93/dsh-plugin-conversation-outline": "为DeepSeek Harness生成对话目录，方便快速浏览和定位内容。",
	"weigre/interaction-doc": "将模糊需求或PRD转化为可交付的交互文档，提升协作效率。",
	"CrazyShout/dsh-ssh-remote": "通过SSH远程连接服务器，浏览和编辑远程文件，运行远程命令。",
	"U-Illll/dsh-memory": "为DeepSeek Harness添加记忆功能，用知识图谱保存和检索重要信息。",
	"dongsheng123132/awesome-dsh-plugins": "提供DeepSeek Harness插件推荐和实验功能，帮你发现实用工具。",
	"SiYue-ZO/dsh-translator": "将DeepSeek Harness变成专注的翻译工作台，支持自定义配置。",
	"yoke233/dsh-tool-monitor": "监控DeepSeek Harness后台任务状态，无需重复运行命令即可查看进度。",
	"Proton1917/dsh-live-stats": "实时查看DeepSeek Harness的Token估算和真实TPS数据，让你随时掌握服务运行状态。",
	"yuzi-ska/DSH-Chrome-devtools": "通过Chrome DevTools协议真实控制Chrome浏览器，让DeepSeek Harness智能体操作网页更可靠。",
	"yumimanji/dsh-ui-spec": "将UI截图自动生成结构化前端开发规格，输出JSON和Markdown，帮助开发者快速实现页面。",
	"xuanyvne/DSHLauncher": "为DeepSeek Harness定制的启动器，优化默认端口操作，比官方命令启动更快。",
	"nitrazepam01/dsh-web-search-tavily": "基于Tavily的网页搜索插件，支持在Tavily和DeepSeek搜索之间热切换，提升信息获取效率。",
	"Sev7een/dsh-plugin-automations": "为DeepSeek Harness Web配置定时任务，自动执行计划好的操作。",
	"xiaoheizi1212/dsh-cookie-bridge": "Chrome扩展，将浏览器Cookie导出到本地服务，供dsh-computer-use使用，无需解密。",
	"linyp/dsh-plugin-langfuse": "将DeepSeek Harness的Agent会话以OpenTelemetry追踪树形式导出到Langfuse，方便监控和分析。",
	"bill9109/dsh-conversation-share": "一键分享DeepSeek Harness对话中的任意段落，方便协作交流。",
	"khiqwq/dsh-system-proxy": "智能管理HTTP(S)代理，支持多种代理协议和按主机/插件规则路由，自动选择最快通道。",
	"xlight/deepseek-visionary": "让DeepSeek智能体支持视觉能力，能看懂图片，适用于多个AI编程工具。",
	"liuyun847/dsh-client-ui-peak-valley": "在模型选择按钮旁显示DeepSeek API的峰谷价格状态，绿色为低价，橙色为高价。",
	"oceanxuikun/dsh-eva-theme-plugin": "为DSH WebUI提供EVA主题，包含初号机、二号机等风格，界面炫酷有机械感。",
	"ouyangyipeng/dsh-marketplace": "提供安全、实时的DeepSeek Harness插件市场，方便发现和安装插件。",
	"Vulcan626/dsh-pet": "在DeepSeek Harness中添加一个可爱的宠物插件，增加交互趣味。",
	"Ayase34/gal-view": "浏览和管理图片的轻量级查看工具，让你快速预览和整理本地图片。",
	"TT-Wang/dsh-slice-agent-loop": "为DeepSeek Harness提供高效对话循环，只保留关键上下文，节省资源并提升响应速度。",
	"why913/dshx": "DeepSeek Harness的辅助命令行工具，帮你轻松管理MCP服务器，还能一键从其他工具迁移。",
	"ben7am1n/dsh-telegram": "将DeepSeek Harness接入Telegram，让你在聊天中直接使用AI助手。",
	"TecFancy/dsh-deeptutor": "为DeepSeek Harness添加学习功能，支持知识库和笔记归档，方便你边学边记。",
	"TTTPOB/dsh-task-models": "为DeepSeek Harness的每个任务单独设置模型和推理强度，灵活控制成本和效果。",
	"Nwflower/dsh-file-claim": "防止多个DeepSeek Harness会话同时操作文件时冲突，支持文件认领、自动接管和合并。",
	"jonah791/dsh-agent-compact": "让AI自己总结对话内容来压缩上下文，减少内存占用，适合超长对话场景。",
	"STARDUSTLC666/dsh-calendar": "为DeepSeek Harness添加日历功能，方便你安排和查看日程。",
	"springbrand-lab/dsh-skin-universe": "为DeepSeek Harness更换皮肤主题，让界面更符合你的个人风格。",
	"chenw2759-wq/dsh-easyssh": "一个SSH前端工具，让你在网页上直接操作远程服务器，查看代码和文件。",
	"vexpaer/ContextGate": "为AI对话设置上下文访问控制，保护敏感信息不被泄露。",
	"yjm110517/visual-to-editable-ppt-skill": "把图片或视觉内容转换成可编辑的PPT，方便你快速制作演示文稿。",
	"Moximxxx/dsh-find-skill": "为DeepSeek Harness集成技能搜索和安装功能，让你轻松扩展AI能力。",
	"cyzlmh/dsh-cyber-sec": "为DeepSeek Harness提供安全评估工具，包含网络扫描、容器隔离和21种安全技能。",
	"Jesse-njx/dsh-chatnode-wechat": "通过微信与你的DSH智能体聊天、监控和审批，集成iLink网关，让你随时随地管理AI助手。",
	"studyzy/dsh-suggest-prompt": "为DSH智能体提供下一步提示建议，帮你更顺畅地引导对话和任务。",
	"cking000bigdemon/dsh-toolbelt": "集成八种实用插件，包括角色设定、语言控制、图像生成、记忆共享等，扩展DSH功能。",
	"IAMLieutenant/dsh-tool-user-memory": "为DeepSeek Harness添加用户记忆功能，让AI记住你的偏好和习惯。",
	"phoenixlucky/moon-lovers-skill": "为恋爱聊天场景设计的温柔克制型AI回复，支持四大美人角色卡，输出自然不油腻。",
	"liguobao/dsh-desktop": "独立的桌面应用，在本地启动DSH网页界面，提供安全便捷的桌面体验。",
	"MicroMilo/upstream-radar": "持续监控DSH插件的安全漏洞和破坏性更新，及时提醒你应对风险。",
	"suntianc/dsh-codex-auth": "复用本地Codex登录状态，为DSH添加GPT认证设置，简化登录流程。",
	"YYTbit/dsh-plugin-auto-docs": "自动生成DSH插件的文档，省去手动编写说明的麻烦。",
	"Luke-Yong/dsh-plugin-knowledge-graph": "为DeepSeek Harness构建知识图谱，帮助AI更好地理解和关联信息。",
	"c-ling/dsh-plugin-peak-pricing": "在DSH界面显示DeepSeek峰谷定价时段徽章，纯UI无网络请求，方便你掌握费用变化。",
	"sundusk/dsh-waterball-pet": "在DSH网页界面上添加一个浮动水球宠物，增加趣味互动体验。",
	"dyuan311/dsh-openai-codex-oauth": "通过ChatGPT订阅OAuth认证，让DSH的openai-codex提供商更易使用。",
	"BeAChanger/dsh-openclaw-acp": "为DSH集成OpenClaw和微信，通过ACP协议实现跨平台智能体管理。",
	"songqikong/dash": "DASH是DeepSeek智能体服务工具，帮你更高效地管理和运行AI任务。",
	"dongsheng123132/dsh-capability-receipt": "为DeepSeek Harness实际加载的技能生成内容寻址凭证，确保技能来源可验证、防篡改。",
	"levi-qiao/dsh-plugin-longgraph": "为DeepSeek Harness提供长图、循环图等复杂图形创作技能，让AI绘图更灵活高效。",
	"PerryLink/dsh-lsp-actions": "为DeepSeek Harness集成语言服务器，提供代码诊断、格式化和补全功能，提升编程体验。",
	"peterwangze/software-project-governance": "为AI编程项目提供规划、审查、风险和质量控制的信任层，确保交付可靠。",
	"Frost-Reed/blocker-notify": "当AI代理被阻塞时，通过全局横幅和闪烁工作区条目实时提醒用户，避免等待。",
	"pythonshiyi/dsh-plugin-tokenmeter": "在DeepSeek Harness网页端显示每条回复的实时词元消耗，帮助用户掌握用量。",
	"Airrcat/dsh-yuzuha-prompts-manager": "管理DeepSeek Harness中的提示词，方便用户组织、编辑和复用。",
	"Leawind/dsh-minecraft-dev": "为Minecraft模组开发定制的DeepSeek Harness预设，开箱即用。",
	"Hu9956/dsh-codex-provider": "为DeepSeek Harness接入OpenAI Codex，支持设备码登录、令牌刷新和网页设置。",
	"Loong-wql/Build-HOS-mcp": "为Codex提供鸿蒙应用开发插件，支持HarmonyOS应用构建。",
	"lordship12138-crypto/dsh-plugin-dedup": "为DeepSeek Harness提供去重功能，避免重复内容，提升效率。",
	"MOLAaaaaaaa/dsh-seismicx": "为DeepSeek Harness添加地震目录技能，支持SeismicX数据查询。",
	"Deklan-Deng/Dcode": "DeepSeek Harness的桌面客户端，提供更便捷的本地使用体验。",
	"slywalker2006/dsh-passwords": "为DeepSeek Harness提供登录网关，支持加密存储、防暴力破解和审计日志。",
	"Blaczz/dsh-deck-builder": "将Markdown一键转换为带主题和键盘导航的HTML演示文稿，无需依赖。",
	"zealot00/dsh-pet": "为DeepSeek Harness界面添加桌面宠物，支持动画、拖拽、闹钟和专注计时，让工作更有趣。",
	"Andy294753951/dsh-plugin-gouden-leeuw-theme": "为DeepSeek Harness网页界面换上月光圣殿主题，营造宁静氛围。",
	"fan969690/dsh-desktop-tools": "为DeepSeek Harness提供桌面端、插件社区和270个中文角色预设，方便你快速使用和扩展。",
	"acefun29/dsh-file-mount": "将文件挂载到DeepSeek Harness中，方便你直接访问和使用本地文件。",
	"Sunshine-oneday/DSH-Desktop": "轻量级跨平台桌面外壳，让你在电脑上更便捷地使用DeepSeek Harness。",
	"sliverp/DeepSeek-harness-weixin": "通过微信与DeepSeek Harness交互，支持扫码登录和收发文字、图片消息。",
	"hi-wenw/dsh-telegram-channel": "用Telegram远程控制DeepSeek Harness，绑定实时会话，随时随地继续工作。",
	"lynx-gt/dsh-subagent-cwd": "增强DeepSeek Harness的子代理委派功能，让多任务处理更高效。",
	"ang-XWBWZ/Pwiki": "为AI代理提供本地优先的知识检索，支持语义搜索和重排序，可集成到DeepSeek Harness。",
	"czzzlq/deepseek-harness-desktop": "提供DeepSeek Harness的桌面客户端，让你在电脑上更顺畅地使用。",
	"omdsh-dev/ex-setting": "扩展DeepSeek Harness的设置选项，让你更灵活地调整配置。",
	"PangYiMing/dsh-bisect-debug": "用二分法快速定位代码或提交中的bug根因，节省调试时间。",
	"omdsh-dev/7d7d": "为DeepSeek Harness提供7天7夜连续运行功能，确保长时间任务不中断。",
	"randerous/dsh-turn-meta": "为DeepSeek Harness添加每步元数据记录，适合开发者学习插件开发。",
	"qyw233/dsh-deeplink": "通过深链接直接打开DeepSeek Harness的指定项目或对话，提高操作效率。",
	"ben7am1n/dsh-lens-lite": "为DeepSeek Harness提供编辑后诊断，帮你快速发现并修正输出问题。",
	"ZhuXinAI/sidesight": "给纯文本编程助手装上眼睛，让它能看懂截图、图表和视频，用多模态模型分析视觉内容。",
	"zhouzhencheng07/dsh-tavily-search": "无需密钥即可使用的Tavily网络搜索工具，为DeepSeek Harness扩展实时信息检索能力。",
	"csiroqa/dsh-schedule": "按计划自动执行任务并监控系统状态，通过定时调度和仪表盘让你随时掌握运行情况。",
	"PeanutsDou/peanut-dsh-plugin": "个人维护的DeepSeek Harness插件合集，包含桌面启动器等实用工具。",
	"Sorwcyra/ds-vision-plugin": "在DeepSeek Harness中粘贴图片，即可让四个模型同时识别，并支持OCR和文本自动转换。",
	"oxygenaaaaa/dsh-desktop": "把DeepSeek Harness打包成Windows桌面应用，一键安装，开箱即用。",
	"MAXeaglet/dsh-bash-terminal": "为DeepSeek Harness提供终端操作能力，让你在对话中直接执行命令行指令。",
	"Yuuz12/dsh-vision-helper": "为DeepSeek Harness添加视觉识别功能，支持图像输入与理解。",
	"minybear/DeepSeek-Harness-Pet": "在DeepSeek Harness中添加桌面宠物，让编程过程更生动有趣。",
	"GengDaPeng/dsh-agent-message": "让DeepSeek Harness的不同会话之间可以互相通信，支持离线消息和回执，方便跨会话协作。",
	"xwh-01/dsh-mediacrawler": "为DeepSeek Harness集成MediaCrawler，方便抓取社交媒体数据。",
	"xiaoheizi1212/dsh-computer-use": "让DeepSeek Harness能操控电脑，通过隔离浏览器和原生助手实现自动化操作。",
	"Ye-Yu-Mo/dsh-llm-proxy": "为DeepSeek Harness配置全局HTTP代理，支持热切换和监控，方便网络调试。",
	"WSL043/dsh-codex-subscription": "在DeepSeek Harness中使用ChatGPT或Codex订阅，支持OAuth登录和额度查看。",
	"LvienOeria/dsh-desktop-launcher": "安装桌面双击启动器，macOS 带鲸鱼图标，Linux 用 .desktop 入口，轻量零依赖。",
	"dongsheng123132/dsh-switch": "为 DeepSeek Harness 提供以证据为先的模型控制面板，管理模型调用。",
	"QWQ-nn/dsh-client-ui-trajectory-categories": "为 DSH 客户端界面按类别整理对话轨迹，方便浏览和检索。",
	"tianji-qingtian/dsh-model-router": "智能路由模型并优化成本：简单问题快速回答，故障自动降级，实时显示用量和费用。",
	"1514100951/dsh-notify-plugins": "在任务完成或出错时发送桌面通知，支持浏览器和 Windows 原生提示，还能等待审批等操作。",
	"haiyoucuv/dsh-model-provider-label": "给同名模型标注来源服务商，避免混淆，让你清楚用的是哪家模型。",
	"yan5236/slcatwujian-dsh-vision-plugin": "让不支持图片的主模型借助视觉模型理解图片，自动桥接并支持追问。",
	"zcx369658780/governed-workflow-for-dsh": "为 DeepSeek Harness 代理提供策略约束、证据优先的合规工作流。",
	"ZBCs-StudioCr-CN/dsh-skill-manager": "管理 DSH 技能列表，方便启用、禁用或配置各项技能。",
	"D-Robotics/dsh-plugin-rdk": "集成地瓜机器人开发板，提供技能目录、设备检测和操作工具。",
	"imtheolin/ai-keyboard": "把常用提示词放在指尖，快速调用，提升输入效率。",
	"liliuCourier/dsh-chat-outline": "在对话栏左侧常驻大纲，快速定位每次提问和回复。",
	"bwndlct/dsh-session-export": "将 DSH 会话导出为 Markdown 和 JSON 格式，方便保存和分享。",
	"Bleed00/dsh-claude-mem": "为 DSH 集成 claude-mem 记忆功能，让对话有连续上下文。",
	"jLeon-account/dsh-client-usage": "实时显示会话的 token 用量和费用估算，区分缓存命中，适配峰谷计价。",
	"tiefeiyu/dsh-see-image": "通过任意兼容视觉模型描述图片，为DeepSeek Harness提供看图能力。",
	"huguangyu666/dsh-plugin-session-import": "导入Claude Code、Codex等会话记录到DeepSeek Harness，方便迁移和继续对话。",
	"omdsh-dev/toybox": "一个玩具箱插件，为DeepSeek Harness提供各种趣味小工具和实验功能。",
	"cute-baobao/dsh-usage-meter": "记录每个模型每日的输入输出和缓存用量，并通过网页界面直观展示。",
	"Bandersnatch0x/amber-protocol": "为编码代理提供仓库级治理规则，并附带DeepSeek Harness补丁覆盖。",
	"sunshine-lang/dsh-plugins": "整合天气、PDF处理等实用插件，为DeepSeek Harness提供统一入口。",
	"YYTbit/dsh-plugin-agent-dashboard": "为DeepSeek Harness添加多代理管理面板，方便监控和调度多个代理。",
	"anweat/dsh-restart": "一键重启DeepSeek Harness服务，快速恢复运行状态。",
	"djh2203/dsh-refined": "为DeepSeek Harness界面注入Obsidian风格的美化主题，支持多配色切换。",
	"dclichang2022/dsh-green-meter": "监测DeepSeek Harness每次请求的能耗和碳排放，并估算缓存节省的电费。",
	"Aik358/dsh-auto-memory": "自动记忆用户偏好、项目笔记和每日日志，并支持继承其他AI工具的历史记忆。",
	"JuneLearn/dsh-reasoning-settings": "自定义推理强度设置和子代理模型路由，优化DeepSeek Harness的调用策略。",
	"ropon/dsh-plugin-clawrouters": "一键启用ClawRouters，让DeepSeek Harness支持聊天、图片、视频和网页搜索。",
	"w2112515/dsh-plugin-development": "安装后教代理如何开发和审查DeepSeek Harness插件，适合学习插件开发。",
	"YinFengWindy/dsh-plugin-shiori-role": "为你的智能助手添加角色扮演能力，让对话更生动有趣。",
	"lehhair/dsh-split-panes": "将聊天窗口分割成多个面板，方便同时查看和操作多个对话。",
	"Opr4Mp3r/deepseek-harness-plugin-from-scratch": "提供代码审查和进阶指南，帮你一步步构建生产级的插件。",
	"DTSFO/dsh-model-modes": "智能调节推理模式和快速切换模型，让对话更高效省钱。",
	"omdsh-dev/sandbox-mxc": "在微软系统上也能顺畅运行沙盒环境，扩展你的使用场景。",
	"omdsh-dev/dsh-tool-browser": "在对话中直接浏览网页，获取信息不用切换窗口。",
	"shujiTech/dsh-plugin-wepre": "把对话内容一键发布到微信小程序，分享给朋友更方便。",
	"lin-cheng-lab/dsh-reloader": "安装插件后说一句“reload”即可自动重启生效，省去手动操作。",
	"dongsheng123132/dsh-narrative-ledger": "记录对话中的故事进展和人物关系，保持剧情连贯不混乱。",
	"quan2005/dsh-plugin-jinji": "内置极简记忆系统，自动记录流水和人物画像，无需额外安装。",
	"ChengChe106/dsh-session-cost": "在界面统计栏显示每次对话的API费用，帮你控制成本。",
	"z21for99/silk-background": "为网页界面添加丝绸动态背景和玻璃质感皮肤，视觉更炫酷。",
	"BeyondXinXin/deepseek-harness-box": "Windows用户免安装一键启动，无需配置环境即可使用。",
	"fff122/dsh-task-checklist": "在对话中管理任务清单，随时查看和勾选待办事项。",
	"kyorakuyk/dsh-desktop": "将智能助手打包成桌面应用，使用更快捷方便。",
	"TrueHOOHA/dsh-plugin-dev-skill": "辅助开发 DeepSeek Harness 插件的 AI 技能，覆盖工具、服务、LLM 适配器等能力的创建与发布。",
	"tc206107/dsh-open-ecosystem": "为 DeepSeek Harness 提供开放生态扩展，集成更多第三方工具与服务。",
	"YYTbit/dsh-plugin-code-review": "对 DeepSeek Harness 代码进行结构化审查，帮助发现潜在问题并提升代码质量。",
	"yangyongzhen/dsh-notify": "为 DeepSeek Harness 发送任务完成通知，支持 ServerChan、钉钉、飞书等渠道。",
	"samecorner/dsh-token-usage": "在 DeepSeek Harness 对话界面展示 Token 用量分析，包括图表和统计指标。",
	"Carpon39038/dsh-image-theme": "上传背景图自动提取配色并应用玻璃质感界面，让 DeepSeek Harness 更个性化。",
	"fff122/dsh-agent-arcade": "在 DeepSeek Harness 中运行确定性贪吃蛇游戏，由智能体自动游玩。",
	"pandashere/dsh-codex-bridge": "桥接 Codex CLI 与 DeepSeek Harness，提供主机工具和网页对话标签页。",
	"AnacondaKC/dsh-custom-css": "为 DeepSeek Harness 添加自定义 CSS 样式，自由调整界面外观。",
	"TT-Wang/dsh-assembler": "为 DeepSeek Harness 提供装配工具，方便组合和配置插件组件。",
	"Jinsong-Zhou/dsh-html-canvas": "将 AI 生成的 HTML 转为可点击编辑的画布，在聊天旁直接修改。",
	"MysaDC/dsh-plugin-description": "为 DeepSeek Harness 插件列表添加中英双语描述，并发布服务供其他插件调用。",
	"jumpserver-east/jumpserver-dsh": "管理 JumpServer 资产并通过 KoKo 操作，在 DeepSeek Harness 中直接运维。",
	"Xenia0922/dsh-opencode-go-usage": "在 DeepSeek Harness 中显示 OpenCode Go 用量与花费悬浮仪表盘，含配额和成本明细。",
	"Blaczz/dsh-achievements": "为 DeepSeek Harness 添加成就与游戏化系统，解锁徽章并展示进度。",
	"ben7am1n/dsh-webhook-bridge": "通过Webhook桥接外部服务与DeepSeek Harness，让消息自动流转，无需手动干预。",
	"RealAlexandreAI/dsh-cloudflare-browser-run": "在DeepSeek Harness中直接调用Cloudflare浏览器工具，轻松生成网页截图、PDF和Markdown。",
	"Jinsong-Zhou/safe-find-dsh-plugins": "帮你发现并安装最适合当前任务的DeepSeek Harness插件，省去搜索和筛选的麻烦。",
	"wellorbetter/dsh-product-delivery-workflow": "全AI驱动的产品交付流程插件，从调研到发布一站式搞定，自动完成测试和审计。",
	"mitao-su/dsh-playwright-native": "将原生Playwright命令行工具接入DeepSeek Harness，让你在对话中直接操作浏览器自动化。",
	"aryswisnu/dsh-eval-regression": "为DeepSeek Harness提供回归测试评估功能，自动检查模型输出质量是否稳定。",
	"shyboy/dsh-k12-lesson-builder": "一键生成同步的K12英语课件PPT和文档，让备课更高效，内容更统一。",
	"ch1bug/dsh-mimo-agent-tools": "集成小米MiMo搜索和多模态能力，让DeepSeek Harness能看图、听音、识别视频和语音。",
	"Elohia/dsh-plugin-mm-vision": "为DeepSeek Harness添加视觉理解能力，支持图像分析和多模态任务处理。",
	"t1yOS/t1y-skills": "为AI编程助手提供t1yOS平台的专业技能包，提升云端开发效率。",
	"FEOH333/dsh-delegate": "智能委派子任务给不同模型，支持依赖控制和个性化角色，让多代理协作更有序。",
	"realchenwenqiao/dash": "为DeepSeek Harness提供终端图形界面，让你在命令行中直观操作和监控。",
	"mengyaoi/dsh-mcp-pack": "零代码接入常用MCP服务器，开箱即用，让DeepSeek Harness功能瞬间扩展。",
	"zhangzheng25/dsh-token-monitor": "在DeepSeek Harness中查看Token用量和对话统计，含90天趋势图，帮你管理成本。",
	"EvilIrving/dsh-proof": "为DeepSeek Harness增加验收层，每轮对话自动校验结果，发现问题立即纠正。",
	"addxing/function-testing": "根据产品需求、代码提交或用户故事自动生成功能测试用例，并输出Excel格式的测试报告，帮你快速完成测试准备工作。",
	"xiaoshihou514/dsh-tui": "为DeepSeek Harness提供终端界面，让你在命令行中轻松操作和监控AI代理。",
	"akqwpeter-prog/dsh-media-skills": "让DeepSeek Harness支持图片读取和生成，即使纯文本对话也能粘贴图片，支持9种语言，无需额外配置。",
	"pythonshiyi/dsh-plugin-balance": "在DeepSeek Harness网页端实时显示账户余额，让你随时掌握消费情况。",
	"longyu065/dsh-theme-ti": "为DeepSeek Harness提供主题切换功能，让你自定义界面外观。",
	"RealAlexandreAI/dsh-all-search": "为DeepSeek Harness添加网络搜索能力，让AI代理能获取实时信息。",
	"tree201/dsh-capability-inspector": "诊断DeepSeek Harness运行问题，检查工具、模型、技能等组件，帮助排查故障。",
	"pinch-eng/dsh-audio-dub": "将视频或音频配音成10种语言，支持声音克隆，方便内容本地化。",
	"TYEclipse/dsh-plugins-hub": "提供DeepSeek Harness社区插件的独立索引，每日更新，方便你发现和安装新插件。",
	"LoftyTao/dsh-ui-workbench": "为DeepSeek Harness网页界面增加右侧文件管理和变更审查面板，提升操作效率。",
	"shi275773124/falsify-dsh": "让DeepSeek Harness接入Falsify命令行工具，用于生成裁决凭证，而非二次意见流程。",
	"haytham818/dsh-notify": "当AI代理完成任务、出错、提问或等待审批时，发送桌面通知，让你及时知晓。",
	"dongsheng123132/dsh-cad-review": "以证据优先的方式检查ASCII DXF文件，执行确定性CAD规则审查，确保设计合规。",
	"zeroa234/dsh-preset-minimal-windows": "为Windows用户提供DeepSeek Harness极简模式预设，包含Git Bash和PowerShell工具，替代官方预设。",
	"pig1et7/DeepSeek-Harness-Desktop": "将DeepSeek Harness封装为桌面应用，方便在电脑上直接使用。",
	"Ruler4396/dsh-launcher-lifetime": "控制DeepSeek Harness服务的运行方式，可设为常驻、托盘或跟随窗口，方便你管理启动器。",
	"6kongbai/dsh-plugin-market": "一个插件市场命令行工具，帮你浏览、安装和卸载社区插件，扩展DeepSeek Harness功能。",
	"CZX2244/dsh-bilibili": "为DeepSeek Harness添加B站相关功能，让你在命令行里也能看B站内容。",
	"RainbowDashy/dsh-theme-palettes": "为DeepSeek Harness提供多种配色主题，一键切换界面风格，让命令行更好看。",
	"zprolab/WhaleKit": "为DeepSeek Harness量身定制的增强工具包，解锁更多实用功能，提升使用体验。",
	"wenliang9527/dsh-themes": "为DeepSeek Harness提供主题皮肤，让你自定义界面外观，打造个性化命令行。",
	"cogine-ai/dsh-claude-tui": "在DeepSeek Harness中运行Claude Code的终端界面，让你用Claude的交互方式操作。",
	"030611/dsh-context-provenance": "记录DeepSeek Harness运行时的公开证据，供你查看和审计，不干预运行。",
	"MAXeaglet/dsh-plugin-manager": "桌面图形化插件管理器，支持管理配置、插件，还能一键启动DeepSeek Harness网页版。",
	"PixLunaLab/dsh-plugin-pixluna": "让DeepSeek Harness能直接查看图片，满足你的看图需求，简单直接。",
	"Moeblack/dsh-skins": "为DeepSeek Harness提供“夕港”主题皮肤，带来黄昏港口的视觉风格。",
	"ShawnSiao/dsh-agent-eval": "对DeepSeek Harness的插件和智能体进行可重复的回归测试，确保更新不破坏功能。",
	"TheChengXi/intent-flow": "注释驱动开发框架，用@intent注释作为契约，自动流转需求、设计、执行、报告四阶段，提供多种使用方式。",
	"benzhoupo/dsh-effort-config": "在设置页配置推理努力级别和第三方模型的Token预算，选择时复用原生模型选择器。",
	"cesaryike/dsh-image-to-path": "让纯文本模型也能接收图片，拖图或贴图后自动保存为路径交给模型，多模态模型不受影响。",
	"duyefeng/dsh-browser": "让AI直接操控真实Edge浏览器上网、点击、填表和截图，无需额外配置。",
	"Small-tailqwq/dsh-tps": "一个简单的TPS性能测试插件，用于测量系统每秒处理能力。",
	"skitse/dsh-dev-actions": "将重复的开发命令和习惯变成一键操作，让AI帮你快速执行。",
	"hawkongz/doubao-vision-dsh": "让纯文本AI通过桌面豆包识别聊天图片，支持取消识别。",
	"BrambleXu/dsh-revdiff": "在DeepSeek Harness中直接查看Git差异，添加批注并回传给AI。",
	"dongsheng123132/dsh-benchmark": "用于测试和评估AI模型性能的基准测试工具。",
	"qing3a/dsh-event-auditor": "查看AI事件流的审计面板，帮助理解内部运行机制。",
	"030611/dsh-telemetry-redactor": "自动隐藏敏感信息，安全导出AI会话数据。",
	"Yummyxl/dsh-eyecare": "护眼插件，减少长时间使用AI时的视觉疲劳。",
	"chancelu/dsh-llmwiki": "用本地Markdown笔记作为AI的长期记忆，自动检索相关内容。",
	"drscrewdriver/inferglow": "用Go语言打造的AI基座系统，自带终端界面和服务器，帮你快速搭建和运行AI应用。",
	"KarlOfLaw/dsh-side-chat": "为DeepSeek Harness设计的侧边聊天插件，能感知父会话上下文，让多窗口对话更连贯。",
	"Hyperionjust/Primordial-soup-": "首创碰撞式记忆系统，不检索旧想法，而是将旧卡片碰撞出新创意，让灵感不断涌现。",
	"xu1132/dsh-plugin-browser": "驱动无头浏览器抓取网页文字和截图，还能自动操作页面，方便你获取网页信息。",
	"TtTRz/dsh-gatedflow": "为DeepSeek Harness打造的可控人工审核流程引擎，确保关键步骤有人把关，工作流更可靠。",
	"joyfoxai/dsh-eco-router": "智能模型路由工具，自动选择最省token的模型，帮你节省成本并提升效率。",
	"Jelee0145/dsh-mem": "为DeepSeek Harness提供跨会话长期记忆，用JSON文件存储，支持保存、回忆、遗忘和列出记忆。",
	"PerryLink/dsh-mcp-panel": "DeepSeek Harness的MCP客户端管理面板，只读查看状态、工具和错误，方便监控和调试。",
	"mingger77/research-skills": "为AI代理设计的Python研究方法论技能，让研究过程可复现，结果更可靠。",
	"gordonlu/dsh-context-lens": "DeepSeek Harness的请求上下文分析器，显示模型请求间的变化及缓存复用情况，帮你优化性能。",
	"blue-a11y/dsh-client-shortcuts": "为DeepSeek Harness网页界面添加全局键盘快捷键，如mod+l、mod+k等，操作更快捷。",
	"ZhengQingJing/dsh-session-tree": "为DeepSeek Harness提供类似Git的不可变会话分支，方便你回溯和实验不同对话路径。",
	"sakurarain1213/deepseek-harness-lite": "轻量级本地优先的DeepSeek Harness发行版，附带经过验证的插件包，开箱即用。",
	"TableRogue/dsh-message-navigator": "在DeepSeek Harness聊天界面右侧添加垂直消息索引，方便快速跳转到任意消息。",
	"xiaoshihou514/dsh-vision": "为DeepSeek Harness添加视觉能力，让AI能理解和处理图像内容。"
};
//#endregion
//#region data/kinds.json
var kinds_default = {
	"devin-axis/ipollowork": "nonplugin",
	"crafter-station/petdex": "nonplugin",
	"deepseek-ai/deepseek-harness": "nonplugin",
	"zhu1090093659/dsh-web-ui": "nonplugin",
	"nexu-io/open-design": "nonplugin",
	"anywhere-labs/deepseek-harness-desktop": "nonplugin",
	"hyhmrright/brooks-lint": "nonplugin",
	"picgo/picgo-core": "nonplugin",
	"imsai-sh/zhuzhiliao": "skill",
	"awesome-dsh-plugin/awesome-dsh-plugin": "nonplugin",
	"paean-ai/deeptide": "nonplugin",
	"ccch1mneyyy/dsh-tui": "plugin",
	"liustack/modlens": "plugin",
	"omdsh-dev/dsh-better-sidebar": "plugin",
	"hellowind777/helloagents": "nonplugin",
	"sandbaseai/sandbase-harness": "plugin",
	"yejiming/museai": "nonplugin",
	"mnemon-dev/mnemon": "plugin",
	"adamplatin123/awesome-dsh-plugins": "skill",
	"tt-a1i/archify": "skill",
	"pm-shawn/abu-cowork": "nonplugin",
	"small-tailqwq/dsh-deep-whale": "multi",
	"titanwings/colleague-skill": "skill",
	"nutshellai-tech/mobius": "skill",
	"nagi-ovo/dsh-ads": "plugin",
	"anionex/dsh-vision-toolkit": "plugin",
	"alaliqing/claude-paper": "nonplugin",
	"cofy-x/axern": "nonplugin",
	"0xsline/awesome-deepseek-harness": "skill",
	"morluto/rea": "nonplugin",
	"tencentcloud/tencentmeeting-cli": "nonplugin",
	"nanmicoder/dsh-agent-teams": "plugin",
	"linhay/harmony-next.skills": "skill",
	"anionex/agent-vision-toolkit": "skill",
	"openma-ai/open-managed-agents": "nonplugin",
	"hust-open-atom-club/oh-dsh": "plugin",
	"whiteguo233/openbiliclaw": "skill",
	"humblebanana/open-record-replay": "nonplugin",
	"zhaoolee/notes": "nonplugin",
	"huiliyi37/dsh-tianshu-tui": "plugin",
	"xytom/coding-tools-mcp": "skill",
	"omdsh-dev/dsh-at-file": "plugin",
	"drewnekota/cetus": "nonplugin",
	"vlln/whale-girl": "plugin",
	"liustack/modsearch": "plugin",
	"lum1104/dsh-browser": "nonplugin",
	"nagi-ovo/dsh-visualize": "plugin",
	"omdsh-dev/dsh-genui": "plugin",
	"electricitysheep/dsh-handbook": "skill",
	"bruc3van/awesome-dsh-plugin": "skill",
	"labring/sealos-skills": "plugin",
	"taxueseek/argo": "nonplugin",
	"leslie-sss/seewxapkg": "skill",
	"sepinetam/mcp-for-stata": "skill",
	"nagi-ovo/dsh-find-plugins": "skill",
	"jayden-x-l/forkprobe": "plugin",
	"zhoushoujianwork/easyeda-agent": "skill",
	"zseven-w/dsh-openpencil": "plugin",
	"chisaalter/deepseek-harness-desktop": "nonplugin",
	"sikao-engine/kimix": "skill",
	"icetomoyo/dsh_workflow": "plugin",
	"foryourhealth111-pixel/vibe-skills": "skill",
	"hikariming/dshfind": "nonplugin",
	"laplaceyoung/oh-my-dsh": "nonplugin",
	"csyangwen/dsh-memory-evolve": "client",
	"wink-run/tokenbank": "skill",
	"omdsh-dev/dsh-annotation": "plugin",
	"omdsh-dev/dsh-open-in-vscode": "plugin",
	"btspoony/mstar-harness": "nonplugin",
	"lyn-77/promentor": "skill",
	"omdsh-dev/dsh-notification": "plugin",
	"ruler4396/dsh-launcher": "skill",
	"ariestar/sivtr": "skill",
	"alex-yanggg/awesome-dsh-plugin": "skill",
	"anionex/dsh-turn-rewind": "plugin",
	"kuangre123/codex-switch": "skill",
	"titanwings/dsh-automation": "plugin",
	"libukai/awesome-deepseek-harness": "skill",
	"alingalingling/ui-status-label": "plugin",
	"pingfanfan/hello-dsh": "skill",
	"ysr666/dsh-vision-router": "plugin",
	"bradegithub/dsh-plugins-marketplace": "nonplugin",
	"multica-ai/dsh-multica-runtime": "plugin",
	"xiaobright/dsh-anchored-standard": "nonplugin",
	"lhh010/dsh-ui-whale": "client",
	"openguardrails/openguardrails": "nonplugin",
	"vibeinging/dsh-work": "nonplugin",
	"yuukilike/zeromd": "skill",
	"hanelalo/browser-bridge": "skill",
	"dominic789654/awesome-deepseek-harness": "skill",
	"chinesezjc/dsh-interconnect": "plugin",
	"pulseaiclub/phi": "skill",
	"dsh-market/dsh-market": "plugin",
	"vlln/plugin-registry": "skill",
	"nwflower/dsh-chat-import": "plugin",
	"c3ll256/dsh-toy": "plugin",
	"dancingmemory/dskin": "plugin",
	"omdsh-dev/dsh-custom-tool": "plugin",
	"kuangre123/iosdev": "skill",
	"bruc3van/dsh-desktop": "nonplugin",
	"morluto/flameox": "skill",
	"wess09/deepseekharnessdesktop": "nonplugin",
	"morluto/jacobian": "skill",
	"whiteguo233/dsh-openbiliclaw": "client",
	"huiliyi37/dsh-tianshu-build": "nonplugin",
	"william-jin-cmu/dsh-vision": "nonplugin",
	"anionex/dsh-computer-use": "plugin",
	"bowenliang123/dsh-context": "plugin",
	"dietcokewithsugar/dsh-user-experience": "plugin",
	"like-study1/oh-my-dsh": "skill",
	"ali-meoo/meoo-cli": "skill",
	"iuikj/dsh-desktop": "nonplugin",
	"omdsh-dev/dsh-data-agent": "plugin",
	"unitarylab/quantum-practices": "plugin",
	"heigeai/deepseek-harness-skin": "skill",
	"weirdsky924/agent-handoff-skill": "skill",
	"omdsh-dev/dsh-plugin-check": "plugin",
	"atlascloudai/atlas-cloud-skills": "skill",
	"ccq1/dsh-side-panel": "plugin",
	"moeblack/dsh-message-edit": "plugin",
	"147228/dsh-xiaoyao-skins": "nonplugin",
	"hellodigua/dsh-share": "plugin",
	"ychris12138/dsh-usage-stats": "nonplugin",
	"anysearch-team/anysearch-dsh": "plugin",
	"laynechai/superpowers-dsh": "plugin",
	"zenx0x/allinluna": "skill",
	"inference1/clarify-intent-and-establish-shared-understanding": "skill",
	"tianji-qingtian/dsh-model-router": "plugin",
	"justgenius-s/dsh-desktop": "nonplugin",
	"tianji-qingtian/dsh-composer-polish": "plugin",
	"bugmaker2/dsh-plugin-template": "plugin",
	"fishquito7/dsh-skill-viewer": "plugin",
	"sanqi-normal/dsh-webui-market-plugin": "plugin",
	"loserfox/distill": "plugin",
	"pivotstackintelligence/dsh-github": "plugin",
	"omdsh-dev/dsh-toolkit": "plugin",
	"whyihaveyou/dsh-suite": "nonplugin",
	"senmuuuuw/dsh-group-photo": "nonplugin",
	"vlln/dsh-navbar": "plugin",
	"oil-oil/dsh-vision": "plugin",
	"zasenjc/dsh-plugins-store": "nonplugin",
	"omdsh-dev/dsh-lark": "plugin",
	"cpj-dev/dsh-plugin-cc": "nonplugin",
	"phoenixlucky/zerotoken-skill": "nonplugin",
	"canglongcl/dsh-web-review": "nonplugin",
	"awesome-dsh-plugin/dsh-find-plugin": "plugin",
	"liyupi/dsh-kun-like-pet": "nonplugin",
	"dingyi222666/dsh-focus-chat": "plugin",
	"fisfzy/ego-browser": "client",
	"omdsh-dev/dsh-gomoku": "plugin",
	"yyyyukari/dsh-plugin-workshop": "plugin",
	"lx2000wasd/dsh-web-plugin-manager": "plugin",
	"anacondakc/dsh-stock-market": "plugin",
	"lhh010/dsh-minigames": "plugin",
	"ericwong5021/deepseek-plugin-store": "plugin",
	"shuguang1994/project-blueprint": "plugin",
	"omdsh-dev/dsh-mnemon": "plugin",
	"hellodigua/dsh-emoji": "plugin",
	"openma-ai/deepseek-harness-tui": "multi",
	"ghost011118/dsh-balance-meter": "plugin",
	"dingkaihu63/dsh-robotic-harness": "nonplugin",
	"dsh-tui/dsh-tui": "plugin",
	"lzszq/dsh-scholar": "plugin",
	"isomoes/ikanban": "nonplugin",
	"zp-home/dsh-recommend": "plugin",
	"william-jin-cmu/dsh-stickers": "plugin",
	"huanlinoto/dsh-plugin-mineru": "plugin",
	"yuntaihua/illusion-agent": "skill",
	"liangyin233/dsh-provider-model-configurator": "plugin",
	"omdsh-dev/dsh-security-audit": "plugin",
	"bobleer/dsh-acp-for-bitfun": "plugin",
	"hsiangnianian/dsh-auto-continue": "plugin",
	"chyra-moon/deepseek-harness-desktop": "nonplugin",
	"suzike/freestyle-dsh-theme": "plugin",
	"biociao/dsh-science": "plugin",
	"cyijun/surfing-plugin": "plugin",
	"omdsh-dev/dsh-session-health": "plugin",
	"joejojoking-cloud/dsh-file-explorer": "plugin",
	"snowcrescenter-tech/dsh-milestone": "plugin",
	"ayuanwong/deepseek-harness-ux": "nonplugin",
	"yuezengwu/dsh-explain": "plugin",
	"whitelonng/dshcode": "nonplugin",
	"linenxi-ctrl/dsh-vision": "plugin",
	"han-1413141/dsh-cost-meter": "plugin",
	"the-beating-light-of-the-nail/dsh-meme-hub": "skill",
	"crazywoola/dsh-balance": "plugin",
	"omdsh-dev/fabric": "plugin",
	"omdsh-dev/dsh-deep-research": "plugin",
	"bill9109/dsh-web-ui-notify": "plugin",
	"omdsh-dev/dsh-plugin-dev": "skill",
	"lhh010/dsh-ui-progress": "client",
	"n0zom1z0/vocaloid-mcp": "nonplugin",
	"huawolf/news-agent": "skill",
	"shaokeyibb/dsh-plugin-product-subagents": "nonplugin",
	"dqsjqian/aria": "skill",
	"chen-001/dsh-grok-tui": "nonplugin",
	"gameswu/dsh-plugin-background": "nonplugin",
	"senmuuuuw/dsh-whale-report": "plugin",
	"morluto/internalcot": "nonplugin",
	"lhh010/dsh-paste-input": "client",
	"tianji-qingtian/dsh-spec-loop": "plugin",
	"yjh051108/dsh-super-injector": "plugin",
	"laplaceyoung/dsh-qq2006": "nonplugin",
	"vlln/dsh-task-status": "plugin",
	"totoro-qaq/cobsidian": "skill",
	"fakechris/dsh-harness-ops": "skill",
	"gusibi/molibot": "nonplugin",
	"huanlinoto/dsh-plugin-better-sidebar-plugin-office": "plugin",
	"keleus/deepseek-pet": "plugin",
	"clizo1209/dsh-playwright-browser": "plugin",
	"lhmd/dsh-promotion-toolkit": "plugin",
	"plutokeating/dsh-lark-bot": "nonplugin",
	"knqiufan/powercontext-dsh": "plugin",
	"modusensus/dsh-mneme": "multi",
	"williamliiii/deepseek-harness-billing-plugin": "nonplugin",
	"lhmd/dsh-director-toolkit": "plugin",
	"loserfox/dsh-git-identity": "plugin",
	"creght-dev/skills": "plugin",
	"yanglongyun/dsh-ramify": "plugin",
	"wangyang10/image-vision": "skill",
	"omdsh-dev/dsh-plugin-skills": "skill",
	"huanlinoto/dsh-plugin-pet-rs": "skill",
	"tyan66666/billion-context-dsh": "nonplugin",
	"white0dew/awesome-dsh-plugins": "nonplugin",
	"goalfyai/goalfydata": "skill",
	"jelly-000/dsh-balance-monitor": "plugin",
	"kitdoesit/dsh-compaction-instant": "plugin",
	"lan-tina-ws/dsh-gui-customization": "nonplugin",
	"loserfox/telegram": "plugin",
	"springbrand-lab/dsh-oauth-mcp-client": "plugin",
	"1841220388zzzcccxxx-star/dsh-git-graph": "plugin",
	"sev7een/ds-api-usage": "plugin",
	"humblebanana/dsh-record-replay": "plugin",
	"runzhliu/deepseek-harness-docker": "skill",
	"loudmore/dsh-drop-to-path": "plugin",
	"lehhair/dsh-diff-viewer": "plugin",
	"openma-ai/deepseek-harness-acp": "plugin",
	"kingao294/dsh-skin": "plugin",
	"xingyingyuzhui/dsh-updater-ui": "plugin",
	"01virex/dsh-status-rotator": "plugin",
	"n0zom1z0/th08": "skill",
	"zhenyu98/dsh-context-doctor": "plugin",
	"turtle1999/turtle-ui": "plugin",
	"ginuim/multi-screen-wireframe": "nonplugin",
	"zjl88858/dsh-huadongbianzuqi": "plugin",
	"titanwings/dsh-better-browser": "plugin",
	"icodesign/orbis": "nonplugin",
	"gxinxing/deepseek-harness-tui": "plugin",
	"yan-zero/dsh-codex": "plugin",
	"dongsheng123132/task-passport": "plugin",
	"nowledge-co/nowledge-mem-deepseek-harness": "plugin",
	"areium/dsh-fail-logger": "plugin",
	"omdsh-dev/plugin-template": "plugin",
	"axiaohungry/dsh-llm-codebuddy": "plugin",
	"moeblack/deepseek-manners": "plugin",
	"lhh010/dsh-bash-encoding": "nonplugin",
	"william-jin-cmu/dsh-evolve": "plugin",
	"flyvhidbwo/dsh-vision-proxy": "plugin",
	"weijiafu14/pi2dsh": "nonplugin",
	"lixiaoyiao/deepseek-harness-action": "nonplugin",
	"dddfxyqiming/agent_extensions": "skill",
	"kejixiaoliang/awesome-dsh-plugins": "skill",
	"morluto/leantoken": "skill",
	"atlascloudai/mcp-server": "nonplugin",
	"zibo2025/dsh-orchestrator": "plugin",
	"boxeryao/deepseek-harness-tui": "plugin",
	"wangshunnn/oh-my-dsh": "nonplugin",
	"huanlinoto/dsh-plugin-yet-another-subagent": "plugin",
	"imetn/dsh-lark-bridge": "plugin",
	"opensetk/dsh-xiaohei": "client",
	"r3alloc/dsh-session-deeplink": "plugin",
	"fakechris/dsh-track": "plugin",
	"huanlinoto/dsh-plugin-ya-workspace-sidebar": "plugin",
	"moxisuki/dsh-lan": "nonplugin",
	"omdsh-dev/dsh-tool-calculator": "plugin",
	"bramblexu/dsh-annotate": "plugin",
	"unknowbug/re-framework": "skill",
	"franksong2702/dsh-codex-connect": "plugin",
	"wssfk12138/dsh-wechat-notify": "nonplugin",
	"hyqhyq3/dsh-mcp-manager": "plugin",
	"small-tailqwq/dsh-deepcel": "skill",
	"yytbit/awesome-dsh-bridges": "skill",
	"huanlinoto/dsh-plugin-d399": "plugin",
	"fisfzy/zotero-harvest": "nonplugin",
	"thu-maic/dsh-openmaic": "plugin",
	"lehhair/dsh-mobile": "plugin",
	"omdsh-dev/dsh-advisor": "plugin",
	"unknowbug/anchorlaw": "skill",
	"toukaiteio/dsh-plugin-installer": "plugin",
	"yytbit/dsh-plugin-claude-bridge": "plugin",
	"komeiji-shiki/graycode-for-dsh": "nonplugin",
	"tensorlakeai/dsh-tensorlake-sandbox": "plugin",
	"meredith2328/dsh-sticky-note": "plugin",
	"omdsh-dev/dsh-mygo": "skill",
	"kelai141/dsh-mobile-apk": "skill",
	"kirschblutex/engineer-software": "skill",
	"congchuanling-dot/dsh-telegram-relay": "plugin",
	"czm15053/dsh-peer-link": "plugin",
	"sliverp/deepseek-harness-qqbot": "plugin",
	"walkinglabs/awesome-deepseek-harness-plugins": "skill",
	"billliao/awesome-dsh-plugin": "skill",
	"justgenius-s/dsh-plugs": "nonplugin",
	"zephyr-vibe/dsh-archived-sessions": "plugin",
	"omdsh-dev/qwen-mm-plugins": "plugin",
	"flymysql/dsh-remote": "plugin",
	"h1a3x/dsh-token-stats": "client",
	"1514100951/dsh-usage-footer": "nonplugin",
	"electricitysheep/dsh-tool-turbo": "nonplugin",
	"degurechaff57/dsh-openapi": "plugin",
	"yuko0331/dsh-telegram": "plugin",
	"wingoo/codex-plugin-dsh": "plugin",
	"miyazawai/dsh-client-pricing": "client",
	"octoparse/agent-skills": "skill",
	"void0312aurora/dsh-desktop-electron": "nonplugin",
	"alliottech/deepseek-harness-docker": "nonplugin",
	"thetianzz/dsh-billing": "plugin",
	"titanwings/dsh-plannotator": "plugin",
	"yequ172672/dsh-codex-subscription": "plugin",
	"pc2005-cloud/dsh-pet": "skill",
	"xiaohai-78/top": "skill",
	"yelebai/dsh-plugin-marketplace": "plugin",
	"nowint/oh-my-dsh": "skill",
	"techysy/deepseek-harness-fnos": "skill",
	"hacksing/dsh-plugins": "skill",
	"poiuyjie/dsh-vision-opencode": "client",
	"tencent-connect/dsh-qqbot": "plugin",
	"william-jin-cmu/dsh-companion": "nonplugin",
	"stevenx65/dsh-balance-plugin": "plugin",
	"dqsjqian/agent-guild": "skill",
	"player-minepig/dsh-llm-codex-oauth": "plugin",
	"huanlinoto/dsh-plugin-interpreters": "plugin",
	"huashenglian/dsh-her-eyes": "plugin",
	"left0ver/dsh-file-review": "plugin",
	"lhh010/dsh-input-history": "client",
	"lire1131/dsh-undo-plugin": "plugin",
	"sb1733831438-maker/dsh-closerai": "nonplugin",
	"picgo/dsh-plugin": "plugin",
	"shinelon/eyes-for-deepseek": "skill",
	"angeloszou/graphlint": "skill",
	"omdsh-dev/dsh-sidechain": "plugin",
	"omdsh-dev/dsh-inspect": "plugin",
	"skr311/dsh-codex-pet": "skill",
	"huanlinoto/dsh-plugin-anti-ads": "plugin",
	"flytomayday80/dsh-pet": "nonplugin",
	"renat3u/dsh-web-archive": "plugin",
	"unnnnoooo/dsh-cue-plugin": "plugin",
	"lvyuchuiyi/dsh-funpack": "plugin",
	"cokiscarazo-rgb/dsh-session-management": "plugin",
	"ayase34/gal-view": "plugin",
	"121103qwq/dsh-vision-sidecar": "plugin",
	"hi-wenw/dsh-telegram-channel": "plugin",
	"omdsh-dev/dsh-tool-time": "plugin",
	"flashingchen/dsh-worktree": "nonplugin",
	"jyh20030112/dsh-visual-plugin": "plugin",
	"thhoho/resanity": "nonplugin",
	"muziisabel/dsh-win-notify": "plugin",
	"omdsh-dev/dsh-hub": "plugin",
	"noob-stupid/dsh-plugin-hub": "plugin",
	"0xsline/dsh-spotlight": "plugin",
	"mishibeikejie/zat-dsh-engine": "plugin",
	"yeruizhi/dsh-lark-meeting-notifier": "plugin",
	"weinibuliu/deepseek-harness-vsc-extension": "nonplugin",
	"twotwopiggy/dsh-balance": "plugin",
	"railgun0325/dsh-phone": "skill",
	"laoyuehanni/dsh-token-usage": "plugin",
	"happyren/dsh-agent-messaging": "plugin",
	"1na-ko/dsh-hdc-bridge": "plugin",
	"sliverp/deepseek-harness-wecom": "plugin",
	"hotsteel2901/dsh-client-ui-mobile-adapt": "plugin",
	"cheshirejcat/blender": "plugin",
	"orxz/deepseek-harness-themes": "nonplugin",
	"morgogh/widget-dock": "plugin",
	"omdsh-dev/dsh-daily-progress": "plugin",
	"codeanqiang-ma/dsh-superpowers": "plugin",
	"fff122/dsh-research-notes": "nonplugin",
	"maimorylab/dib": "skill",
	"amlyczz/dsh-lark-link": "plugin",
	"brittanistrehlowll-oss/dsh-quota-panel": "plugin",
	"harcochen/dsh-vsc-integration": "nonplugin",
	"favio8/dsh-plugin-deepeye": "plugin",
	"arcmosin/dsh-wordbox": "plugin",
	"lsz-asd/dsh-plugin-session-delete": "plugin",
	"omdsh-dev/dsh-tool-csv": "plugin",
	"huanlinoto/dsh-plugin-sleep": "plugin",
	"huanlinoto/dsh-plugin-aigc-canvas": "plugin",
	"yyh-001/dsh-companion": "nonplugin",
	"drfccv/dsh-theme-neko": "plugin",
	"litestartup-com/litestartup-skills": "skill",
	"rangeking/vibemeter": "nonplugin",
	"windlx/paper_plane_x": "skill",
	"yuuz12/dsh-webui-auth": "plugin",
	"visol-456/dsh-llm-fallback": "plugin",
	"hellosky983/dsh-mc-launcher": "plugin",
	"yoke233/dsh-prime-agent": "plugin",
	"buguoshixc/deepseek-harness-external-migration": "plugin",
	"xenia0922/dsh-opencode-go-usage": "plugin",
	"chenw2759-wq/dsh-plugin-healthcheck": "plugin",
	"610la/dsh-notification-center": "plugin",
	"juhe291/dsh-token-panel": "plugin",
	"hilbert-beinghappy/deepseek-tui": "plugin",
	"omdsh-dev/dsh-fun-weather": "plugin",
	"omdsh-dev/dsh-hub-workshop": "nonplugin",
	"sulfide2085/dsh-llm-wechat": "plugin",
	"morluto/gitcontribute": "nonplugin",
	"coppynight/dsh-doctor": "skill",
	"linglambda/dsh-undo": "plugin",
	"zsyu9779/dsh-desktop": "skill",
	"xaviermarquis93/dsh-plugin-conversation-outline": "client",
	"whitelonng/dsh-plugin-describe-image": "skill",
	"omdsh-dev/dsh-paddle-ocr": "plugin",
	"1helloman1/dsh-stats-dashboard": "plugin",
	"yytbit/dsh-plugin-opencode-bridge": "plugin",
	"rainforest888/dsh-plugins-raincode": "nonplugin",
	"bobcat848/dsh-calculator": "plugin",
	"omdsh-dev/dsh-ernie-image": "plugin",
	"lwmxiaobei/dsh-plugins": "nonplugin",
	"qintsg/dsh-safe-delete": "client",
	"junelearn/dsh-reasoning-settings": "plugin",
	"omdsh-dev/dsh-fun-typewriter": "plugin",
	"xiluovo/dsh-session-timeline": "plugin",
	"hccccc01333/dsh-report-html": "plugin",
	"keepermttl/dsh-archive-viewer": "plugin",
	"huanlinoto/dsh-plugin-spur": "plugin",
	"giantgkl/dsh-cost": "client",
	"doggyhu/dsh4vscode": "nonplugin",
	"f0909172434/dsh-deepseek-girl-pet": "plugin",
	"jiesou/dsh-stream-rules": "plugin",
	"huanlinoto/dsh-plugin-auto-blame": "plugin",
	"dbi-eshuh/dsh-thinking-status-customizer": "plugin",
	"jiao-xxx/dsh-auto-approve": "plugin",
	"longyu065/dsh-desktop": "nonplugin",
	"fly233338/dsh-overleaf": "plugin",
	"morluto/smokinggun": "nonplugin",
	"xtxo/dsh-ui": "nonplugin",
	"dasooul03/dsh-plugin-deepseek-pricing": "skill",
	"makuralymi/dsh-webui-glass-theme": "plugin",
	"yihong89/dsh-usage-plugin": "nonplugin",
	"omdsh-dev/dsh-daily-fortune": "plugin",
	"itmoqing/deepseek-harness-skill": "skill",
	"vlln/dsh-loop": "plugin",
	"omdsh-dev/dsh-longbridge": "plugin",
	"zhangzheng25/dsh-token-monitor": "plugin",
	"chen-001/dsh-chat-width": "client",
	"sunshine-lang/dsh-weather": "plugin",
	"anweat/dsh-web-search-pro": "plugin",
	"zevorn/dsh-humanize": "plugin",
	"hnmrxz/dsh-plugin-deepseek-balance": "client",
	"2bingling/dsh-market": "nonplugin",
	"nekogpt/dsh-ui-quote-selection": "plugin",
	"starfie1d1272/dsh-builtin-toggles": "plugin",
	"letter2025/dsh-tool-search": "plugin",
	"chenw2759-wq/dsh-mindmap": "plugin",
	"dingyi222666/dsh-session-notification": "plugin",
	"xylt369/dsh-browser": "nonplugin",
	"yyh-001/dsh-expression": "plugin",
	"havingautism/dsh-deepresearch": "plugin",
	"detpecca/dsh-llm-wiki": "plugin",
	"gooodwei/context-vista": "plugin",
	"yytbit/dsh-plugin-cost-tracker": "plugin",
	"liguobao/dsh-desktop": "nonplugin",
	"uynajgi/dsh-ssh": "nonplugin",
	"omdsh-dev/dsh-book2skill": "plugin",
	"fuhefei/dsh-sentinel": "plugin",
	"leeaoyin/dr-agent-skills": "skill",
	"snowcrescenter-tech/dsh-desktop": "nonplugin",
	"dongsheng123132/dsh-lineage": "plugin",
	"zerohackz/openflowframes": "plugin",
	"omdsh-dev/dsh-revive": "plugin",
	"omdsh-dev/dsh-voice-funasr": "plugin",
	"criscolthecoder/dsh-plugin-browser": "plugin",
	"stardustlc666/dsh-slack": "plugin",
	"nanki-nn/dsh-answer-pet": "plugin",
	"yuqingsh/dsh-image-subagent": "plugin",
	"xiake595/touhou-hakurei": "plugin",
	"paean-ai/8x-skills": "skill",
	"entireyu/dsh-whalito-desk": "nonplugin",
	"bill9109/dsh-webbridge": "plugin",
	"chenw2759-wq/dsh-ide": "nonplugin",
	"sparrived/dsh-deeptop": "nonplugin",
	"perrylink/dsh-mcp-panel": "plugin",
	"cendaifeng/dsh-learn-everything": "plugin",
	"luaphes/dsh-web-attention-badge": "plugin",
	"stardustlc666/dsh-email": "plugin",
	"auran-lu/dsh-client-ui-monitor": "client",
	"hxyz486/dsh-archived-conversations": "client",
	"deep-ios/dsh-humanizer": "plugin",
	"mongfayi/dsh-recall": "plugin",
	"omdsh-dev/dsh-auto-chess": "plugin",
	"030611/qiushi-dsh-evidence-audit": "plugin",
	"omdsh-dev/dsh-tool-stat": "plugin",
	"xcnxnxnx/dsh-portable-tavern": "plugin",
	"omdsh-dev/7d7d": "plugin",
	"pheobe-southwood/dsh-acp-paseo": "nonplugin",
	"seryta/dsh-node-nav": "plugin",
	"jiruidai/dsh-meta-orchestrator": "plugin",
	"ryun601/dsh-launcher": "skill",
	"moduqishi/grassvison": "skill",
	"zephyr-vibe/dsh-personalize": "plugin",
	"omdsh-dev/dsh-github-integration": "skill",
	"gxpppp/dsh-search-mcp": "plugin",
	"wz-heng/dsh-feishu-bridge": "plugin",
	"lanxing6480/dsh-skill-manager": "plugin",
	"scorp1o117/dsh-tool-vision": "nonplugin",
	"sjscy05/deepseek-harness-vision-plugin": "nonplugin",
	"kestiny18/dsh-plugins": "nonplugin",
	"syy-shark/dsh-music-plugin": "plugin",
	"hrhgit/deepseek-harness-plugin-manager": "nonplugin",
	"dpskh/dsh-a2a": "plugin",
	"loguhan/dsh-workshop": "plugin",
	"dongsheng123132/dsh-action-parity": "plugin",
	"omdsh-dev/session-teleport": "plugin",
	"bpc-oss/dsh-web-billing": "plugin",
	"chhlafiu4312/promptwall": "plugin",
	"nextindie/deepseek-harness-for-vs-code": "nonplugin",
	"omdsh-dev/dsh-pet-corner": "plugin",
	"huahai0202/dsh-better-archive": "plugin",
	"xilin3/dsh-prompt-persona": "plugin",
	"zhang66633/dsh-plugin-installer": "plugin",
	"ceelog/dsh-plugins": "nonplugin",
	"asaiuta/dsh-session-hub": "plugin",
	"drifter-yh/dsh-tool-policy": "plugin",
	"akira399/dsh-plugin-publisher": "plugin",
	"tokimorphling/tokilake-ai-gateway": "skill",
	"kunjinkao-os/dsh-mobile-gui-agent": "plugin",
	"chaos-03x/dsh-agy": "plugin",
	"omdsh-dev/dsh-scout": "plugin",
	"yuxino/dsh-blue-whale-maid": "plugin",
	"yytbit/dsh-plugin-meta-memory": "plugin",
	"omdsh-dev/dsh-fun-ticker": "client",
	"perrylink/dsh-composer-history": "nonplugin",
	"pinkllo/dsh-reasoning-translator": "plugin",
	"awesomehou/dsh-plugin-marketplace": "plugin",
	"poplarity/dsh-science-workbench": "plugin",
	"dbydd/dsh-onlyne": "nonplugin",
	"dongsheng123132/dsh-benchmark": "plugin",
	"ltao0829/dsh-task-notify": "plugin",
	"jark006/remoteops": "skill",
	"omdsh-dev/dsh-llm-fallbacks": "plugin",
	"leon0555/dsh-lan-access": "plugin",
	"hccccc01333/dsh-excel-chat": "nonplugin",
	"030611/dsh-telemetry-redactor": "plugin",
	"384961890-ui/pawin-brain-deepseek-harness": "nonplugin",
	"uddoo/dsh-dashboard": "plugin",
	"jypjypjypjyp/dsh-vqa-agent": "plugin",
	"shiningsprk-arch/dsh-context-viewer": "nonplugin",
	"pixlunalab/dsh-pixluna": "plugin",
	"sereinmono/dsh-desktop-pet": "plugin",
	"mappedinfo/plaindeck": "nonplugin",
	"perrylink/dsh-background-agents": "plugin",
	"maxeaglet/dsh-plugin-manager": "nonplugin",
	"zeroa234/dsh-preset-minimal-windows": "skill",
	"czx2244/dsh-bilibili": "plugin",
	"beijingwahw/dsh-conv-search": "plugin",
	"akira399/dsh-godot-skill": "plugin",
	"cogine-ai/dsh-claude-tui": "plugin",
	"ztl34245881-commits/dsh-task-planner": "plugin",
	"dongsheng123132/dsh-cad-review": "plugin",
	"renat3u/dsh-paseo": "nonplugin",
	"elaina-real/dsh-tiered-approval": "plugin",
	"030611/dsh-verification-receipt": "plugin",
	"lglglglgy/dsh-whale-pet": "plugin",
	"ruler4396/dsh-launcher-lifetime": "plugin",
	"bwndlct/dsh-session-audit": "plugin",
	"moonshadow1976/chiral-pulse": "plugin",
	"crazyshout/dsh-ssh-remote": "plugin",
	"ylifeonlyonce/dsh-smarthome": "plugin",
	"anacondakc/dsh-douyin": "plugin",
	"hootandy321/dsh-agentlink": "nonplugin",
	"yoke233/dsh-openai-codex-auth": "plugin",
	"aprilwizard/dsh-multi-cot": "nonplugin",
	"zimixvx/dsh-archive-manager": "plugin",
	"dino6021/dsh-usage-cost": "plugin",
	"shmilyol/galgame-skin": "skill",
	"severuszh/dsh-notify-windows": "nonplugin",
	"spyqwer1/dsh-codex-tools": "plugin",
	"xincodes/deepseek-billing-plugin": "nonplugin",
	"snowcrescenter-tech/dsh-launcher": "skill",
	"libinyam/dsh-vision-provider": "plugin",
	"clearkurt/dsh-win-terminal-inspector": "nonplugin",
	"andy8647/dsh-auto-approval": "nonplugin",
	"stardustlc666/dsh-dingtalk": "plugin",
	"chushixixin/dsh-harness-mcp-server": "plugin",
	"phoenixlucky/chrome-mcp-bridge-2026-skill": "skill",
	"gnulife/dsh-plugin-wechat": "plugin",
	"sanshanya/better-model-provider": "plugin",
	"drowned-fish1/deepseek-harness-skillx": "plugin",
	"tqsy114514/dsh-ui-appearance": "plugin",
	"hashdiana/dsh-token-usage": "plugin",
	"dclichang2022/dsh-green-meter": "nonplugin",
	"1738348785/dsh-plugin-text-translation": "plugin",
	"aik358/dsh-auto-memory": "plugin",
	"wangwei-wade/dsh-quote-annotate": "plugin",
	"sjscy05/matlab-modelsim-vivado-plugin": "plugin",
	"c-ling/dsh-plugin-pet": "client",
	"karloflaw/dsh-goal-mode-enhance": "plugin",
	"omdsh-dev/sandbox-nono": "plugin",
	"dongsheng123132/dsh-xiapan-media": "plugin",
	"forrestahha/dsh-voice-input": "plugin",
	"zzh-newlearner/dsh-postmortem": "nonplugin",
	"w2112515/dsh-plugin-development": "plugin",
	"krislavten/ai-sdk-provider-dsh": "nonplugin",
	"urzeye/dsh-outline": "plugin",
	"pangyiming/dsh-mobile-control": "plugin",
	"wuwuzhige-sudo/dsh-terminal-panel": "client",
	"tsonglew/dsh-media-preview": "plugin",
	"jesse-njx/dsh-cowork": "nonplugin",
	"chenhaolove89/dsh-ccswitch-import-lite": "skill",
	"ljh-snow/dsh-tool-github": "nonplugin",
	"wuxiangru915/dsh-review-loop": "plugin",
	"hyls9527/dsh-plugins": "nonplugin",
	"hyperionjust/dsh-tool-underseal": "plugin",
	"dylan121322/llm-adaptive": "plugin",
	"kevenxz/dsh-desktop": "nonplugin",
	"sunshine-lang/dsh-pdf": "plugin",
	"hellosky983/dsh-skillradar": "plugin",
	"hellosky983/dsh-qrcode": "plugin",
	"tieboyh/dsh-session-search": "nonplugin",
	"heyflyingpig/long-draft-input": "plugin",
	"atlascloudai/cli": "skill",
	"pineapple880066/dsh-webui-pets": "skill",
	"elviszhang007/dsh-moyan": "plugin",
	"dtsfo/dsh-model-modes": "plugin",
	"bobleer/deepseek-harness-plugin-mcp": "plugin",
	"gtaifu/dsh-wechat-bridge": "nonplugin",
	"je00/dsh-codex-agent-bridge": "plugin",
	"dongsheng123132/dsh-narrative-ledger": "plugin",
	"ch0uhuaz1/deepseek-harness-desktop": "nonplugin",
	"dhicoc/dsh-reverse-skill": "plugin",
	"mashedpotato817/dsh-git-plugin": "nonplugin",
	"sjscy05/dsh-task-progress-notifier": "plugin",
	"gengdapeng/dsh-agent-message": "plugin",
	"beants/dsh-trellis": "nonplugin",
	"pangzi499/dsh-balance-stats": "plugin",
	"han-1413141/dsh-sticky-disclosure": "plugin",
	"zalpha263/dsh-file-explorer": "plugin",
	"mongfayi/dsh-local-filetree": "plugin",
	"jleon-account/dsh-client-usage": "client",
	"biuboomc/dsh-plugin-consult": "plugin",
	"khanzou/deepseek-harness-as-desktop": "skill",
	"blockrunai/dsh-clawrouter": "plugin",
	"ly6170/dsh-messager": "plugin",
	"emredeveloper/deepseek-harness-huggingface": "nonplugin",
	"stushansusu/dsh-miku-skin": "plugin",
	"lehhair/dsh-split-panes": "plugin",
	"chenyuheee/dsh-browser-playwright": "plugin",
	"ccch1mneyyy/dsh-working-activity": "skill",
	"jesse-njx/dsh-memory": "plugin",
	"perrylink/dsh-claude-move": "plugin",
	"vvlife/awesome-deepseek-harness-plugins": "skill",
	"hisaniwo/dsh-ergonomics": "client",
	"golitter/dsh-deepseek-billing": "plugin",
	"xmanrui/dsh-feishu": "plugin",
	"securstack/securstack-dsh-plugin": "plugin",
	"theyoungchen/dsh-plugin-market": "plugin",
	"ch1bug/dsh-mimo-agent-tools": "plugin",
	"luoyu-xingu/dsh-background": "plugin",
	"tttrz/dsh-wecom": "plugin",
	"yytbit/dsh-plugin-codex-bridge": "plugin",
	"niyongsheng/free-vision-skill": "nonplugin",
	"1475505/dsh-plugin-miliastra-toolbox": "plugin",
	"dongsheng123132/dsh-2origin": "plugin",
	"ylifeonlyonce/dsh-dynamic-island": "plugin",
	"omdsh-dev/dsh-science": "nonplugin",
	"wardlu/shadow-vision": "skill",
	"adkid-zephyr/liltloom": "plugin",
	"elementor-i/dsh-agentmemory": "plugin",
	"gezi-wen/sage-mem": "plugin",
	"chnjames/dsh-plugin-market": "plugin",
	"vibeinging/dsh-agent-budget": "plugin",
	"lunw/shopline-ai-toolkit-dsh": "plugin",
	"alooshxl/dsh-session-pins": "plugin",
	"w769721503/dsh-plugin-store": "plugin",
	"omdsh-dev/dsh-tool-regex": "plugin",
	"omdsh-dev/dsh-tool-schema": "plugin",
	"lvienoeria/dsh-launcher": "plugin",
	"morlay/session-persistence-rdb": "plugin",
	"perrylink/dsh-github": "plugin",
	"toukaiteio/dsh-effort-tweak": "plugin",
	"cakeni/harness-pet": "plugin",
	"jkrandom-sudo/dsh-ci-doctor": "plugin",
	"noone89a/dsh-gauge": "plugin",
	"sakikotgw/pack-agent": "plugin",
	"ben7am1n/dsh-review-skills": "plugin",
	"erduotong/dsh-plugin-graph": "plugin",
	"misaki14987/dsh-theme-taffy": "client",
	"bujue600-arch/dsh-testgen": "plugin",
	"lco117/dsh-think-any-lang": "plugin",
	"kinyokun/dsh-session-import": "client",
	"xyz1024-alt/dsh-side-panel": "plugin",
	"djasdh/interest-memory": "skill",
	"nonewind/dsh-spend": "plugin",
	"havingautism/dsh-notebooks": "plugin",
	"haoyueqin/deepseek-harness-desktop": "nonplugin",
	"omdsh-dev/web-components": "plugin",
	"lq-1123/paste-to-workspace": "plugin",
	"zhaoscsc/dsh-wikilink": "plugin",
	"acefun29/dsh-file-mount": "plugin",
	"piccolo123/url-manager": "skill",
	"xiajingchun/dsh-nebulagraph-v5": "plugin",
	"inmny/dsh-git-bash": "plugin",
	"crayonlu/dsh-web-search-tavily": "nonplugin",
	"omdsh-dev/dsh-office": "plugin",
	"kezboardpj/dsh-skill-loader": "plugin",
	"terry12138qy/dsh-vision": "plugin",
	"sunshine-lang/dsh-plugin-template": "plugin",
	"yangzhe1003/dsh-web-search-firecrawl": "plugin",
	"lordqyxz/dsh-ark-quota": "client",
	"jasonsun29/ds-balance-card": "client",
	"yytbit/dsh-plugin-pi-bridge": "plugin",
	"vcxmug/dsh-enhance": "nonplugin",
	"anionex/dsh-suggested-replies": "plugin",
	"jelech/dsh-im-gateway": "plugin",
	"whiteguo233/dsh-cc-connect": "nonplugin",
	"stardustlc666/dsh-calendar": "plugin",
	"bill9109/dsh-drag-and-drop": "plugin",
	"ljninse/dsh-open-in-ide": "plugin",
	"ericwong5021/dsh-kanban": "plugin",
	"orriduck/dsh-tui": "plugin",
	"spirtxiaoqi7/mindspace-dsh-local-rag": "plugin",
	"jasonjin2006/dsh-sound-effects-plugin": "plugin",
	"nwflower/dsh-file-claim": "plugin",
	"tecfancy/dsh-deeptutor": "plugin",
	"mitao-su/dsh-playwright-cli": "plugin",
	"moeblack/dsh-skins": "plugin",
	"benzhoupo/dsh-dardar": "plugin",
	"omdsh-dev/dsh-tool-encoding": "plugin",
	"tablerogue/dsh-message-navigator": "plugin",
	"oitsukiii/deepseek-harness-lan": "skill",
	"zhengqingjing/dsh-session-tree": "plugin",
	"bonexy226/dsh-cost-chip": "client",
	"blue-a11y/dsh-client-shortcuts": "plugin",
	"mirdie/dsh-xai": "plugin",
	"dongsheng123132/dsh-capability-receipt": "plugin",
	"15828148/dsh-portable-launcher": "skill",
	"lesliewylie/dsh-ops-kit": "plugin",
	"scorp1o117/dsh-soul-md": "nonplugin",
	"liuup/dsh-latex-tools": "plugin",
	"0lidaxiang/dsh-plugin-greet": "plugin",
	"omdsh-dev/sandbox-micro": "plugin",
	"mrbbbaixue/dsh-desktop": "skill",
	"leawind/dsh-minecraft-dev": "skill",
	"ykennen/dsh-zh-output": "plugin",
	"kncrjvirx/dsh-desktop": "nonplugin",
	"vibeinging/dsh-trace": "plugin",
	"yauntyour/dsh-for-vsc": "nonplugin",
	"yumimanji/dsh-ui-spec": "plugin",
	"vim0x3c/dsh-session-manager": "plugin",
	"dongsheng123132/dsh-switch": "plugin",
	"ouyangyipeng/dsh-marketplace": "plugin",
	"zcx369658780/governed-workflow-for-dsh": "plugin",
	"bwndlct/dsh-session-export": "plugin",
	"vulcan626/dsh-pet": "client",
	"omdsh-dev/ex-setting": "plugin",
	"cccakeee/awesome-dsh-plugins": "skill",
	"mars-sea/dsh-commandcode-provider": "plugin",
	"sunrisepeak/dsh-index": "skill",
	"bernardleex526/oh_my_deepseek_harness": "nonplugin",
	"brucewu1126/dsh-web-background": "client",
	"dongsheng123132/dsh-audit-bundle": "plugin",
	"pandacolour/dsh-cmd-starter": "plugin",
	"inklingyoshi584/dsh-tool-hashline": "nonplugin",
	"xiaoshihou514/dsh-weixin": "plugin",
	"mj-chang/dsh-vscode": "nonplugin",
	"momojie-s/dsh-workspace-env": "plugin",
	"xuender/dsh-history": "client",
	"elohia/pi-mm-vision": "nonplugin",
	"fisfzy/zotero-wave-rag": "nonplugin",
	"khalilyamber/hana-dsh-bridge": "skill",
	"lanlandeli/dsh-usage-stats": "plugin",
	"scorp1o117/dsh-tdai-memory": "nonplugin",
	"silencieuxzero/better_deepseek_harkness": "plugin",
	"bill9109/dsh-101": "plugin",
	"jkrandom-sudo/dsh-plugin-audit": "plugin",
	"moeblack/dsh-prompt-studio": "plugin",
	"sandbaseai/sandbase-skills": "nonplugin",
	"asukaleo-aa/dsh-openscience": "skill",
	"omdsh-dev/dsh-tool-diff": "plugin",
	"omdsh-dev/dsh-tool-markdown": "plugin",
	"nanshan1995/dsh-plugin-market": "plugin",
	"omdsh-dev/dsh-tool-json": "plugin",
	"havingautism/dsh-ultra-ui": "plugin",
	"1690834643/dsh-usage-dashboard": "client",
	"renat3u/tonghuashun-webui": "nonplugin",
	"dongsheng123132/dsh-recovery-proof": "plugin",
	"v587d/dsh-opencode-go-usage": "plugin",
	"openma-ai/deepseek-harness-typescript-sdk": "nonplugin",
	"ankocd/dsh-server-deployment": "skill",
	"omdsh-dev/dsh-kb-sieve": "plugin",
	"a179-sanae/dsh-code-check": "plugin",
	"dgpisces/deepseek-harness-openai-oauth": "plugin",
	"zhijun-dai/catppuccin-dsh-theme": "skill",
	"dongsheng123132/dsh-policy-drift-proof": "plugin",
	"leavestring/awesome-dsh-background-plugin": "plugin",
	"guomonth/dsh-multi-tenant": "plugin",
	"acidmoon/dizzy-dsh": "plugin",
	"dongsheng123132/dsh-cost": "plugin",
	"dongsheng123132/dsh-release-proof": "plugin",
	"devourerm/dsh-naiwa-theme": "plugin",
	"perrylink/dsh-plugin-guide": "skill"
};
//#endregion
//#region data/market-snapshot.json
var market_snapshot_default = [
	{
		"f": "deepseek-ai/deepseek-harness",
		"n": "deepseek-harness",
		"o": "deepseek-ai",
		"d": "DeepSeek Harness: Everything is a Plugin.",
		"s": 123853,
		"k": 12257,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"cordis",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:29:39Z",
		"h": "https://github.com/deepseek-ai/deepseek-harness",
		"p": "https://deepseek.com/harness"
	},
	{
		"f": "nexu-io/open-design",
		"n": "open-design",
		"o": "nexu-io",
		"d": "🎨 Best DeepSeek Harness Design Plugin. The open-source Claude Design alternative. 🖥️ Local-first desktop app. 🖼️ Your coding agent becomes the design engine: prototypes, landing pages, dashboards, slides, images & video — real files, HTML/PDF/PPTX/MP4 export. 🤖 Claude Code / Codex / Cursor / DeepSeek Harness / OpenCode & 20+ CLIs via BYOK.",
		"s": 87214,
		"k": 10130,
		"l": "TypeScript",
		"t": [
			"agent-skills",
			"ai-agents",
			"ai-design",
			"byok",
			"claude-code-for-design",
			"claude-design",
			"codex-design",
			"coding-agents",
			"cursor-design",
			"deepseek-harness",
			"design-systems",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"figma-alternative",
			"hermes-agent",
			"local-first",
			"prototyping",
			"ui-generator",
			"vibe-coding"
		],
		"u": "2026-08-16T10:26:02Z",
		"h": "https://github.com/nexu-io/open-design",
		"p": "https://open-design.ai"
	},
	{
		"f": "amruthpillai/reactive-resume",
		"n": "reactive-resume",
		"o": "amruthpillai",
		"d": "A one-of-a-kind resume builder that keeps your privacy in mind. Completely secure, customizable, portable, open-source and free forever. Try it out today!",
		"s": 40483,
		"k": 4596,
		"l": "TypeScript",
		"t": [
			"ai",
			"better-auth",
			"dsh-plugin",
			"hacktoberfest",
			"javascript",
			"react",
			"resume-builder",
			"self-hosted",
			"tailwindcss",
			"tanstack-start",
			"typescript"
		],
		"u": "2026-08-16T10:22:15Z",
		"h": "https://github.com/amruthpillai/reactive-resume",
		"p": "https://rxresu.me"
	},
	{
		"f": "volcengine/OpenViking",
		"n": "OpenViking",
		"o": "volcengine",
		"d": "Self-evolving Context Database for AI Agents. Unify Agent Memory, Knowledge RAG and Skills.",
		"s": 28575,
		"k": 2259,
		"l": "Python",
		"t": [
			"agent-memory",
			"agent-plugins",
			"agentic-rag",
			"context-database",
			"dsh-plugin",
			"self-evolving"
		],
		"u": "2026-08-16T10:29:17Z",
		"h": "https://github.com/volcengine/OpenViking",
		"p": "https://openviking.ai/"
	},
	{
		"f": "titanwings/colleague-skill",
		"n": "colleague-skill",
		"o": "titanwings",
		"d": "将冰冷的离别化为温暖的 Skill，欢迎加入数字生命1.0！Transforming cold farewells into warm skills? It's giving rebirth era. Welcome to Digital Life 1.0. 🫶",
		"s": 22670,
		"k": 2055,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agent",
			"claude-code",
			"codex",
			"dsh-plugin",
			"hermes-agent",
			"knowledge-distillation",
			"meta-skill",
			"openclaw",
			"skill-generator"
		],
		"u": "2026-08-16T10:26:41Z",
		"h": "https://github.com/titanwings/colleague-skill",
		"p": ""
	},
	{
		"f": "Nagi-ovo/voyager",
		"n": "voyager",
		"o": "Nagi-ovo",
		"d": "Enhancement suite for Gemini, AI Studio, Claude & ChatGPT — plus a prompt manager for any web UI, DeepSeek Harness included. / 面向 Gemini、AI Studio、Claude 与 ChatGPT 的增强套件；提示词管理器可用于任意 Web UI，含 DeepSeek Harness。",
		"s": 19452,
		"k": 646,
		"l": "TypeScript",
		"t": [
			"ai-studio",
			"browser-extension",
			"bun",
			"chat-management",
			"chatgpt",
			"chrome-extension",
			"claude-ai",
			"dsh",
			"dsh-plugin",
			"edge-addon",
			"firefox-addons",
			"gemini",
			"safari-extension"
		],
		"u": "2026-08-16T10:26:09Z",
		"h": "https://github.com/Nagi-ovo/voyager",
		"p": "https://voyager.nagi.fun/en"
	},
	{
		"f": "tt-a1i/archify",
		"n": "archify",
		"o": "tt-a1i",
		"d": "Agent skill for beautiful, verifiable architecture, workflow, sequence, data-flow, and lifecycle diagrams—self-contained HTML with motion and crisp export.",
		"s": 13098,
		"k": 963,
		"l": "HTML",
		"t": [
			"agent-skills",
			"anthropic",
			"architecture-diagram",
			"claude-skill",
			"codex",
			"dark-mode",
			"data-flow-diagram",
			"deepseek-harness",
			"developer-tools",
			"diagram-as-code",
			"dsh-plugin",
			"html-diagram",
			"lifecycle-diagram",
			"mermaid-alternative",
			"opencode",
			"sequence-diagram",
			"svg",
			"system-design",
			"workflow-diagram"
		],
		"u": "2026-08-16T10:19:39Z",
		"h": "https://github.com/tt-a1i/archify",
		"p": "https://tt-a1i.github.io/archify/"
	},
	{
		"f": "freestylefly/awesome-gpt-image-2",
		"n": "awesome-gpt-image-2",
		"o": "freestylefly",
		"d": "Prompt as Code | GPT-Image2 工业级提示词引擎与模板库，470+ 个案例逆向工程，20+ 套工业级模板，并提炼出Skills，持续更新中",
		"s": 10431,
		"k": 1244,
		"l": "JavaScript",
		"t": [
			"agents",
			"ai-image-generation",
			"chatgpt",
			"dsh-plugin",
			"gpt-image-2",
			"image-prompts",
			"prompt-as-code",
			"prompt-engineering",
			"skills",
			"workflow-automation"
		],
		"u": "2026-08-16T10:28:33Z",
		"h": "https://github.com/freestylefly/awesome-gpt-image-2",
		"p": "https://gpt-image2.canghe.ai"
	},
	{
		"f": "anywhere-labs/deepseek-harness-desktop",
		"n": "deepseek-harness-desktop",
		"o": "anywhere-labs",
		"d": "为 DeepSeek Harness (DSH) 插件生态打造的现代化桌面端解决方案",
		"s": 7742,
		"k": 328,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"desktop",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-desktop"
		],
		"u": "2026-08-16T10:29:42Z",
		"h": "https://github.com/anywhere-labs/deepseek-harness-desktop",
		"p": "https://dshdesktop.cn"
	},
	{
		"f": "YaoApp/yao",
		"n": "yao",
		"o": "YaoApp",
		"d": "✨ All your agents and workspaces in one place, on every device you own. Track tasks on a board, accessible from desktop, mobile, browser, or API. Self-hosted.",
		"s": 7602,
		"k": 686,
		"l": "Go",
		"t": [
			"agent",
			"agents",
			"ai",
			"ai-native",
			"claude-code",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"golang"
		],
		"u": "2026-08-16T10:23:23Z",
		"h": "https://github.com/YaoApp/yao",
		"p": "https://yaoagents.com"
	},
	{
		"f": "Q00/ouroboros",
		"n": "ouroboros",
		"o": "Q00",
		"d": "Agent OS: the agent gets smarter on its own. We just hold the line: the grading command and expected result never make it into the success contract we hand it. Interview-gated, staged evaluation, budgeted evolution loop. MCP server, 13 runtimes: Claude Code, Codex CLI, Gemini CLI, OpenCode, Copilot, Kiro and more.",
		"s": 5446,
		"k": 551,
		"l": "Python",
		"t": [
			"agent-os",
			"agentic-ai",
			"ai-agent",
			"ai-coding-agent",
			"claude-code",
			"cli",
			"codex",
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"github-copilot",
			"llm-evaluation",
			"llm-orchestration",
			"loop-engineering",
			"mcp",
			"opencode"
		],
		"u": "2026-08-16T10:23:30Z",
		"h": "https://github.com/Q00/ouroboros",
		"p": "https://ouroboros.page/"
	},
	{
		"f": "ZSeven-W/openpencil",
		"n": "openpencil",
		"o": "ZSeven-W",
		"d": "The world's first open-source AI-native vector design tool and the first to feature concurrent Agent Teams. Design-as-Code. Turn prompts into UI directly on the live canvas. A modern alternative to Pencil.",
		"s": 5040,
		"k": 461,
		"l": "Rust",
		"t": [
			"agent",
			"agent-team",
			"ai",
			"claude",
			"claude-code",
			"codex",
			"dsh-plugin",
			"fimga",
			"flutter",
			"mcp",
			"opencode",
			"openpencil",
			"pencil",
			"react",
			"react-native",
			"rust",
			"skill",
			"ui",
			"vibecoding",
			"vibedesign"
		],
		"u": "2026-08-16T10:23:35Z",
		"h": "https://github.com/ZSeven-W/openpencil",
		"p": "https://op.zseven.tech"
	},
	{
		"f": "Devin-AXIS/iPolloWork",
		"n": "iPolloWork",
		"o": "Devin-AXIS",
		"d": "A next-generation, source-available AI workspace with a self-evolving agent runtime for editable code, design, presentations, websites, and video—a Codex alternative that integrates DeepSeek Harness for subagent delegation, combining iPolloWork’s complete AI workbench with DSH’s specialized agents and both plugin ecosystems in one workflow.",
		"s": 4129,
		"k": 834,
		"l": "HTML",
		"t": [
			"agent-collaboration",
			"agent-skills",
			"ai-agents",
			"ai-work",
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"enterprise-agent-workspace",
			"hermes-agent",
			"openclaw",
			"opencode",
			"opencode-plugin",
			"self-evolving-ai",
			"visual-editor"
		],
		"u": "2026-08-16T10:24:49Z",
		"h": "https://github.com/Devin-AXIS/iPolloWork",
		"p": "https://www.ipollo.ai/"
	},
	{
		"f": "awesome-dsh-plugin/awesome-dsh-plugin",
		"n": "awesome-dsh-plugin",
		"o": "awesome-dsh-plugin",
		"d": "A curated list of plugins for DeepSeek Harness (dsh) · DeepSeek Harness 插件精选列表",
		"s": 3858,
		"k": 746,
		"l": "Python",
		"t": [
			"awesome",
			"awesome-list",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:29:36Z",
		"h": "https://github.com/awesome-dsh-plugin/awesome-dsh-plugin",
		"p": "https://awesome-dsh-plugin.com"
	},
	{
		"f": "crafter-station/petdex",
		"n": "petdex",
		"o": "crafter-station",
		"d": "A public gallery of animated pets for Codex, Claude Code, DeepSeek Harness, Hermes, OpenCode, Gemini CLI, and more.",
		"s": 3844,
		"k": 181,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"clerk",
			"cli",
			"codex",
			"developer-tools",
			"drizzle-orm",
			"dsh-plugin",
			"mascot",
			"neon",
			"nextjs",
			"pixel-art",
			"postgres",
			"react",
			"sprites",
			"tailwindcss",
			"vercel"
		],
		"u": "2026-08-16T10:06:19Z",
		"h": "https://github.com/crafter-station/petdex",
		"p": "https://petdex.dev"
	},
	{
		"f": "strukto-ai/mirage",
		"n": "mirage",
		"o": "strukto-ai",
		"d": "The World's First Unified Virtual Filesystem For AI Agents",
		"s": 3458,
		"k": 257,
		"l": "TypeScript",
		"t": [
			"agent-sandbox",
			"agent-tools",
			"ai-agents",
			"bash",
			"claude-code",
			"dsh",
			"dsh-plugin",
			"fuse",
			"llm-agents",
			"openai-agents",
			"python",
			"typescript",
			"vfs",
			"virtual-filesystem"
		],
		"u": "2026-08-16T10:28:51Z",
		"h": "https://github.com/strukto-ai/mirage",
		"p": "https://www.strukto.ai/mirage"
	},
	{
		"f": "zhu1090093659/dsh-web-ui",
		"n": "dsh-web-ui",
		"o": "zhu1090093659",
		"d": "Plugin and skin collection for DeepSeek Harness (DSH) Web UI - task board, git graph, right-side panel, remote mobile UI, pet, live token stats, and skin center.",
		"s": 3093,
		"k": 181,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"web-ui"
		],
		"u": "2026-08-16T10:29:05Z",
		"h": "https://github.com/zhu1090093659/dsh-web-ui",
		"p": "https://gallery.dsh-market.com"
	},
	{
		"f": "edison7009/EchoBird",
		"n": "EchoBird",
		"o": "edison7009",
		"d": "One-click install + model switch:Claude Code,Codex CLI (OpenAI), Grok Build (xAI), DeepSeek Harness, Kimi Code (Moonshot) ,Qwen Code,Aider,OpenCode,MiMo Code (Xiaomi),ZCode (Z.AI),OpenClaw,Pi,OpenScience,Vibe-Trading,Claude Desktop (3P profile),ChatGPT desktop,OpenCode Desktop,",
		"s": 3037,
		"k": 341,
		"l": "Rust",
		"t": [
			"claude-code",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins",
			"kimi-code",
			"openclaw",
			"opencode",
			"zcode"
		],
		"u": "2026-08-16T10:29:02Z",
		"h": "https://github.com/edison7009/EchoBird",
		"p": "https://Echobird.ai"
	},
	{
		"f": "foryourhealth111-pixel/Vibe-Skills",
		"n": "Vibe-Skills",
		"o": "foryourhealth111-pixel",
		"d": "VibeSkills is a general-purpose Skill that automatically routes local Skills and intelligently orchestrates harness workflows.",
		"s": 2833,
		"k": 225,
		"l": "Python",
		"t": [
			"agent-framework",
			"agent-skills",
			"agentic-coding",
			"ai-agents",
			"ai-scientist",
			"ai-skills",
			"ai-workflow",
			"automation",
			"claude-code",
			"codex",
			"context-engineering",
			"developer-tools",
			"dsh-plugin",
			"llm",
			"multi-agent",
			"prompt-engineering",
			"skills",
			"vibe-coding",
			"vibecoding",
			"workflow-automation"
		],
		"u": "2026-08-16T09:57:01Z",
		"h": "https://github.com/foryourhealth111-pixel/Vibe-Skills",
		"p": ""
	},
	{
		"f": "imsai-sh/zhuzhiliao",
		"n": "zhuzhiliao",
		"o": "imsai-sh",
		"d": "竹知了 —— 一转就哇哇叫的传统玩具，Web 模拟版。零依赖单文件，真实录音采样，移动端优先。",
		"s": 2820,
		"k": 343,
		"l": "HTML",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:13:12Z",
		"h": "https://github.com/imsai-sh/zhuzhiliao",
		"p": "https://imsai.top"
	},
	{
		"f": "whiteguo233/OpenBiliClaw",
		"n": "OpenBiliClaw",
		"o": "whiteguo233",
		"d": "本地私有、开源的自进化跨平台 AI 内容发现 Agent：先理解你，再主动从 B站、小红书、抖音、YouTube、X、知乎、Reddit、微博等平台与开放 Web 寻找内容。（支持 deepseek harness 插件） | Local-first open-source cross-platform AI content discovery agent: understands you, then proactively finds content across Bilibili, Xiaohongshu, Douyin, YouTube, X, Zhihu, Reddit, Weibo and the open web.（support deepseek harness plugin）",
		"s": 2676,
		"k": 126,
		"l": "Python",
		"t": [
			"ai-agent",
			"bilibili",
			"chrome-extension",
			"content-discovery",
			"cross-platform",
			"deepseek-harness",
			"douyin",
			"dsh",
			"dsh-plugin",
			"llm",
			"local-first",
			"personal-ai",
			"privacy-first",
			"python",
			"recommendation-system",
			"self-hosted",
			"typescript",
			"xiaohongshu",
			"youtube",
			"zhihu"
		],
		"u": "2026-08-16T10:28:48Z",
		"h": "https://github.com/whiteguo233/OpenBiliClaw",
		"p": "https://whiteguo233.github.io/OpenBiliClaw/"
	},
	{
		"f": "xiaobright/dsh-anchored-standard",
		"n": "dsh-anchored-standard",
		"o": "xiaobright",
		"d": "Two-phase DeepSeek Harness preset: Minimal-aligned bootstrap, then full Standard tools (Project2 98/99)",
		"s": 2640,
		"k": 83,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"llm-agent"
		],
		"u": "2026-08-16T10:28:33Z",
		"h": "https://github.com/xiaobright/dsh-anchored-standard",
		"p": "https://github.com/xiaobright/modeltest"
	},
	{
		"f": "liustack/modlens",
		"n": "modlens",
		"o": "liustack",
		"d": "The first vision plugin for DeepSeek Harness, and the vision bridge for every text-only coding agent. Paste an image, get structured JSON evidence (OCR, layout, semantics). | 全网最强 DeepSeek Harness 外挂视觉插件，为 DeepSeek、GLM 等纯文本模型外挂视觉能力，粘贴图片即得结构化 JSON 证据（OCR、版面、语义）。",
		"s": 2163,
		"k": 56,
		"l": "TypeScript",
		"t": [
			"agent-skills",
			"claude-code",
			"claude-skills",
			"codex",
			"cordis",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"glm",
			"harness",
			"harness-engineering",
			"hermes-agent",
			"image-to-text",
			"multimodal",
			"ocr",
			"openclaw",
			"pi-agent",
			"text-only-llm",
			"vision",
			"vision-transformer"
		],
		"u": "2026-08-16T10:29:19Z",
		"h": "https://github.com/liustack/modlens",
		"p": "https://liustack.dev"
	},
	{
		"f": "GCWing/BitFun",
		"n": "BitFun",
		"o": "GCWing",
		"d": "BitFun combines a high-performance agent runtime written in Rust with a polished desktop application. It pairs the depth of a Code Agent with open, general-purpose capabilities for work beyond software development.",
		"s": 1746,
		"k": 185,
		"l": "Rust",
		"t": [
			"agent-teams",
			"agentic",
			"agentic-os",
			"agentic-runtime",
			"ai-coding",
			"ai-ide",
			"ai-sdk",
			"bitfun",
			"computer-use-agent",
			"cowork",
			"dsh-plugin",
			"openclaw",
			"vibe-coding"
		],
		"u": "2026-08-16T10:11:28Z",
		"h": "https://github.com/GCWing/BitFun",
		"p": ""
	},
	{
		"f": "omdsh-dev/DSH-better-sidebar",
		"n": "DSH-better-sidebar",
		"o": "omdsh-dev",
		"d": "开放的侧边栏底座，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/Git/子代理页面",
		"s": 1460,
		"k": 92,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-better-sidebar",
			"dsh-plugin",
			"sidebar"
		],
		"u": "2026-08-16T10:29:18Z",
		"h": "https://github.com/omdsh-dev/DSH-better-sidebar",
		"p": ""
	},
	{
		"f": "ccch1mneyyy/dsh-TUI",
		"n": "dsh-TUI",
		"o": "ccch1mneyyy",
		"d": "DSH 官方公众号收录的 TUI 补位插件：Claude Code 风，鲸鱼顶栏/实时状态/流式思考/双击 Esc 回滚/上下文进度+TPS。npm 一键装。  DSH official WeChat featured TUI plugin — Claude Code style: whale bar, live status, streaming thoughts, double-Esc rollback, context bar + TPS. npm one-click.",
		"s": 1418,
		"k": 59,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"ink",
			"react",
			"terminal",
			"tui"
		],
		"u": "2026-08-16T10:27:39Z",
		"h": "https://github.com/ccch1mneyyy/dsh-TUI",
		"p": "https://dshtui.com/"
	},
	{
		"f": "hyhmrright/brooks-lint",
		"n": "brooks-lint",
		"o": "hyhmrright",
		"d": "AI code reviews grounded in 12 classic engineering books — decay risk diagnostics with book citations, severity labels, and 6 analysis modes including full-sweep auto-fix",
		"s": 1359,
		"k": 62,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"ai-code-review",
			"architecture-review",
			"auto-fix",
			"claude-code",
			"claude-code-plugin",
			"clean-architecture",
			"code-health",
			"code-quality",
			"code-review",
			"code-smells",
			"codex-cli-plugin",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"gemini-cli-extension",
			"refactoring",
			"static-analysis",
			"tech-debt",
			"test-quality"
		],
		"u": "2026-08-16T09:22:53Z",
		"h": "https://github.com/hyhmrright/brooks-lint",
		"p": "https://hyhmrright.github.io/brooks-lint/"
	},
	{
		"f": "agentrq/agentrq",
		"n": "agentrq",
		"o": "agentrq",
		"d": "AgentRQ: Human-in-loop realtime conversational task manager for AI Agents. Self-hosted! Control your own agents from wherever you want Mobile, Web, Desktop. Designed to work well with your own Claude subscriptions and any harness.",
		"s": 1072,
		"k": 80,
		"l": "Go",
		"t": [
			"acp-client",
			"acp-gateway",
			"agentic-ai",
			"agentic-workflow",
			"agents",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh-plugin",
			"mcp",
			"mcp-server",
			"supervisor",
			"task",
			"task-manager",
			"task-scheduler",
			"todo"
		],
		"u": "2026-08-16T05:07:11Z",
		"h": "https://github.com/agentrq/agentrq",
		"p": "https://agentrq.com"
	},
	{
		"f": "paean-ai/deeptide",
		"n": "deeptide",
		"o": "paean-ai",
		"d": "Built by DeepSeek, for DeepSeek — a Swift-native macOS coding agent",
		"s": 1066,
		"k": 134,
		"l": "Rust",
		"t": [
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"macos",
			"swift"
		],
		"u": "2026-08-16T09:34:59Z",
		"h": "https://github.com/paean-ai/deeptide",
		"p": "https://deeptide.sh"
	},
	{
		"f": "GanyuanRan/Aegis",
		"n": "Aegis",
		"o": "GanyuanRan",
		"d": "Make AI coding agents architecture-aware: baseline-first, evidence-verified, drift-checked, and safe across long tasks.",
		"s": 1022,
		"k": 46,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agents",
			"ai-coding",
			"architecture-driven-development",
			"awsome-coding-plugin",
			"baseline-first",
			"claude-code",
			"codex",
			"coding-agents",
			"dive",
			"dsh-plugin",
			"evidence-driven",
			"first-principles",
			"opencode",
			"software-architecture",
			"spec-driven-development",
			"spec-kit"
		],
		"u": "2026-08-16T10:24:44Z",
		"h": "https://github.com/GanyuanRan/Aegis",
		"p": "https://github.com/GanyuanRan/Aegis"
	},
	{
		"f": "AdamPlatin123/awesome-dsh-plugins",
		"n": "awesome-dsh-plugins",
		"o": "AdamPlatin123",
		"d": "前部索引仓库（Radar）：自动扫描发现的所有 dsh 插件候选；经测试合格的将移入后序精选目录仓库",
		"s": 1021,
		"k": 91,
		"l": "Python",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T10:23:25Z",
		"h": "https://github.com/AdamPlatin123/awesome-dsh-plugins",
		"p": ""
	},
	{
		"f": "Small-tailqwq/dsh-deep-whale",
		"n": "dsh-deep-whale",
		"o": "Small-tailqwq",
		"d": "DSH Web 鲸鱼娘皮肤系列(深海女仆工坊 maid-atelier)——CC BY-NC-SA 4.0",
		"s": 997,
		"k": 33,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:29:14Z",
		"h": "https://github.com/Small-tailqwq/dsh-deep-whale",
		"p": ""
	},
	{
		"f": "PicGo/PicGo-Core",
		"n": "PicGo-Core",
		"o": "PicGo",
		"d": ":zap:The ultimate image uploading engine. Both CLI & API supports.",
		"s": 974,
		"k": 99,
		"l": "TypeScript",
		"t": [
			"dsh-plugin",
			"picgo",
			"picture-upload",
			"upload-pictures"
		],
		"u": "2026-08-16T04:47:39Z",
		"h": "https://github.com/PicGo/PicGo-Core",
		"p": "https://docs.picgo.app/core/"
	},
	{
		"f": "Anionex/agent-vision-toolkit",
		"n": "agent-vision-toolkit",
		"o": "Anionex",
		"d": "为纯文本模型\"看图“设计更好的视觉工具箱和技能，支持多图理解，图片问答，前端UI还原、GUI 自动化等，并可选无缝接入多个主流agent，直接识别粘贴图片｜ A vision toolkit and skill designed for text-only llms — image Q&A, long-screenshot OCR, frontend UI restoration, and GUI automation, with optional seamless integration for Codex, Claude Code, Pi, Oh My Pi, and OpenCode",
		"s": 930,
		"k": 34,
		"l": "Python",
		"t": [
			"agent",
			"agent-skills",
			"claude-code",
			"codex",
			"computer-use",
			"deepseek",
			"dsh-plugin",
			"glm",
			"harness-engineering",
			"multimodal",
			"opencode",
			"text-only-llm",
			"vision",
			"vision-language-model"
		],
		"u": "2026-08-16T10:28:49Z",
		"h": "https://github.com/Anionex/agent-vision-toolkit",
		"p": "https://agent-vision.anionex.me"
	},
	{
		"f": "freestylefly/wesight",
		"n": "wesight",
		"o": "freestylefly",
		"d": "Open-source desktop AI agent workspace with one-click Claude Code, Codex, OpenClaw, Hermes Agent setup and custom LLM model routing.",
		"s": 879,
		"k": 205,
		"l": "TypeScript",
		"t": [
			"agent-skills",
			"agent-workspace",
			"ai-agent",
			"ai-agents",
			"claude-code",
			"codex",
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"hermes-agent",
			"llm",
			"local-first",
			"macos",
			"model-router",
			"openclaw",
			"react",
			"typescript",
			"vibe-coding"
		],
		"u": "2026-08-16T06:22:53Z",
		"h": "https://github.com/freestylefly/wesight",
		"p": "https://wesight.ai"
	},
	{
		"f": "vostride/agent-qa",
		"n": "agent-qa",
		"o": "vostride",
		"d": "Open-source self-improving QA agent for software teams. A test harness with memory. Write tests in natural language for web and mobile. agent-qa learns from every run, adapts to UI changes, and catches regressions before you ship.",
		"s": 822,
		"k": 13,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"ai-testing",
			"anthropic",
			"autonomous-agents",
			"browser-automation",
			"chatgpt",
			"claude-code",
			"clawdbot",
			"codex",
			"developer-tools",
			"dsh-plugin",
			"end-to-end-testing",
			"frontend",
			"mcp",
			"mcp-server",
			"mcp-tools",
			"model-context-protocol",
			"openai",
			"playwright",
			"qa-automation"
		],
		"u": "2026-08-16T10:27:18Z",
		"h": "https://github.com/vostride/agent-qa",
		"p": "https://vostride.com"
	},
	{
		"f": "xyTom/coding-tools-mcp",
		"n": "coding-tools-mcp",
		"o": "xyTom",
		"d": "Give any AI agent the ability to code",
		"s": 796,
		"k": 136,
		"l": "Python",
		"t": [
			"dsh-plugin",
			"mcp",
			"mcp-server"
		],
		"u": "2026-08-16T09:19:13Z",
		"h": "https://github.com/xyTom/coding-tools-mcp",
		"p": "https://coding-1afcb9be.mintlify.app"
	},
	{
		"f": "hellowind777/helloagents",
		"n": "helloagents",
		"o": "hellowind777",
		"d": "一个自主的高级智能伙伴，不仅分析问题，更持续工作直到完成实现和验证。",
		"s": 685,
		"k": 96,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:51:39Z",
		"h": "https://github.com/hellowind777/helloagents",
		"p": ""
	},
	{
		"f": "ccch1mneyyy/working-activity",
		"n": "working-activity",
		"o": "ccch1mneyyy",
		"d": "Lively Working-line extension for pi CLI and DSH",
		"s": 644,
		"k": 230,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"pi-coding-agent",
			"pi-plugin",
			"statusline",
			"working-line"
		],
		"u": "2026-08-15T23:03:30Z",
		"h": "https://github.com/ccch1mneyyy/working-activity",
		"p": ""
	},
	{
		"f": "sandbaseai/sandbase-harness",
		"n": "sandbase-harness",
		"o": "sandbaseai",
		"d": "Open-source CMA-compatible agent runtime for any model, with MCP tools, sandboxed sessions, audit, replay, and a local console. Includes a native DeepSeek Harness bundle over stdio MCP.",
		"s": 597,
		"k": 57,
		"l": "TypeScript",
		"t": [
			"agent-framework",
			"agent-observability",
			"agent-runtime",
			"agent-sandbox",
			"ai-agents",
			"ai-infrastructure",
			"deepseek",
			"deepseek-harness",
			"deepseek-v4",
			"docker",
			"dsh",
			"dsh-plugin",
			"local-first",
			"mcp-server",
			"model-context-protocol",
			"openai-compatible",
			"sandbox",
			"self-hosted",
			"typescript",
			"workflow-automation"
		],
		"u": "2026-08-16T08:53:56Z",
		"h": "https://github.com/sandbaseai/sandbase-harness",
		"p": "https://github.com/sandbaseai/sandbase-harness/releases/latest"
	},
	{
		"f": "yejiming/MuseAI",
		"n": "MuseAI",
		"o": "yejiming",
		"d": "创建你的 AI 角色，进入你的故事世界。和角色聊天、冒险、穿书，让每一次互动都留下羁绊（支持 DeepSeek Harness 插件，欢迎使用）",
		"s": 567,
		"k": 46,
		"l": "TypeScript",
		"t": [
			"agent",
			"ai",
			"companion-ai",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:52:07Z",
		"h": "https://github.com/yejiming/MuseAI",
		"p": ""
	},
	{
		"f": "nutshellai-tech/mobius",
		"n": "mobius",
		"o": "nutshellai-tech",
		"d": "The first self-evolving open-source Agent OS, connecting your team, AI agents, devices, and compute",
		"s": 553,
		"k": 11,
		"l": "TypeScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T07:43:37Z",
		"h": "https://github.com/nutshellai-tech/mobius",
		"p": "https://nutshellai-tech.github.io/mobius/"
	},
	{
		"f": "0xsline/awesome-deepseek-harness",
		"n": "awesome-deepseek-harness",
		"o": "0xsline",
		"d": "DeepSeek Harness (DSH) ecosystem: curated plugins, tools, and infrastructure from dsh-external/hub and the public dsh-plugin topic.",
		"s": 550,
		"k": 198,
		"l": "Python",
		"t": [
			"agent",
			"ai",
			"ai-agents",
			"ai-tools",
			"awesome",
			"awesome-list",
			"coding-assistant",
			"curated-list",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"harness",
			"llm",
			"mcp",
			"plugins"
		],
		"u": "2026-08-16T10:18:14Z",
		"h": "https://github.com/0xsline/awesome-deepseek-harness",
		"p": "https://deepseekdocs.com/"
	},
	{
		"f": "adoresever/graph-memory",
		"n": "graph-memory",
		"o": "adoresever",
		"d": "Openclaw记忆插件Knowledge Graph + Memory；Knowledge Graph Context Engine for OpenClaw — extracts structured triples from conversations, compresses context 75%, enables cross-session experience reuse",
		"s": 523,
		"k": 78,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"codex",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"knowledge-graph",
			"memory",
			"openclaw",
			"openclaw-plugin",
			"opencode"
		],
		"u": "2026-08-16T10:07:28Z",
		"h": "https://github.com/adoresever/graph-memory",
		"p": ""
	},
	{
		"f": "Anionex/dsh-vision-toolkit",
		"n": "dsh-vision-toolkit",
		"o": "Anionex",
		"d": "让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等｜DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, long-screenshot OCR, UI restoration, grounding, pixel diff, Artifacts, and Web UI.",
		"s": 478,
		"k": 23,
		"l": "TypeScript",
		"t": [
			"agent-skills",
			"agent-vision-toolkit",
			"computer-vision",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gui-automation",
			"ocr",
			"plugin",
			"python",
			"screenshot-testing",
			"text-only-llm",
			"typescript",
			"ui-restoration",
			"vision-language-model",
			"vision-tools"
		],
		"u": "2026-08-16T10:19:16Z",
		"h": "https://github.com/Anionex/dsh-vision-toolkit",
		"p": ""
	},
	{
		"f": "mnemon-dev/mnemon",
		"n": "mnemon",
		"o": "mnemon-dev",
		"d": "LLM-supervised persistent memory for AI agents — graph-based recall, cross-session knowledge, single binary. Works with DeepSeek Harness, Claude Code, OpenClaw, and any agent runtime.",
		"s": 456,
		"k": 61,
		"l": "Go",
		"t": [
			"agent-framework",
			"agent-memory",
			"ai-agent",
			"ai-tools",
			"claude",
			"claude-code",
			"cli",
			"context-window",
			"dsh",
			"dsh-plugin",
			"knowledge-graph",
			"llm-agent",
			"llm-memory",
			"llm-supervised",
			"memory",
			"openclaw",
			"persistent-memory"
		],
		"u": "2026-08-16T08:17:56Z",
		"h": "https://github.com/mnemon-dev/mnemon",
		"p": "https://github.com/mnemon-dev/mnemon#readme"
	},
	{
		"f": "Nagi-ovo/dsh-ads",
		"n": "dsh-ads",
		"o": "Nagi-ovo",
		"d": "把 DSH 变成 2005 年门户网站｜Parody ads, fake games, and popups for the DSH Web UI",
		"s": 437,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"trolling",
			"web-ui"
		],
		"u": "2026-08-16T09:46:09Z",
		"h": "https://github.com/Nagi-ovo/dsh-ads",
		"p": ""
	},
	{
		"f": "dsh-market/dsh-market",
		"n": "dsh-market",
		"o": "dsh-market",
		"d": "The plugin market inside DeepSeek Harness — browse, search, one-click install · DSH 可视化插件市场",
		"s": 435,
		"k": 36,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"marketplace"
		],
		"u": "2026-08-16T10:22:26Z",
		"h": "https://github.com/dsh-market/dsh-market",
		"p": "https://dshmarket.com"
	},
	{
		"f": "superdesigndev/treg",
		"n": "treg",
		"o": "superdesigndev",
		"d": "OpenRouter for agent tools. Join community here: https://discord.gg/6mQYYfFMAn",
		"s": 423,
		"k": 31,
		"l": "Python",
		"t": [
			"agents",
			"api-keys",
			"cli",
			"credentials",
			"developer-tools",
			"dsh-plugin",
			"mcp",
			"proxy",
			"python",
			"registry",
			"secrets"
		],
		"u": "2026-08-16T07:26:53Z",
		"h": "https://github.com/superdesigndev/treg",
		"p": "https://treg.to"
	},
	{
		"f": "superdesigndev/superdesign-skill",
		"n": "superdesign-skill",
		"o": "superdesigndev",
		"d": "The design skill for Claude Code, Cursor and any coding agent. Stop shipping AI-slop UI: turn it into shippable, tasteful frontend. Install: npx skills add superdesigndev/superdesign-skill. Powered by superdesign.dev",
		"s": 417,
		"k": 28,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"ai-design",
			"claude-code",
			"claude-skill",
			"claude-skills",
			"coding-agent",
			"cursor",
			"design-agent",
			"dsh-plugin",
			"frontend",
			"superdesign",
			"ui-design",
			"ux-design"
		],
		"u": "2026-08-16T05:14:15Z",
		"h": "https://github.com/superdesigndev/superdesign-skill",
		"p": "https://superdesign.dev"
	},
	{
		"f": "Ikalus1988/MisakaNet",
		"n": "MisakaNet",
		"o": "Ikalus1988",
		"d": "📚 A zero-dependency, git-backed micro-lesson library for AI Agents to asynchronously share and search verified debugging experience. Python stdlib only. | https://misakanet.org",
		"s": 389,
		"k": 155,
		"l": "Python",
		"t": [
			"agent-framework",
			"agent-network",
			"ai-agent",
			"ai-infra",
			"claude",
			"deepseek-harness",
			"devops",
			"distributed-memory",
			"dsh-plugin",
			"failure-analysis",
			"git-based",
			"knowledge-graph",
			"knowledge-sharing",
			"langchain",
			"lesson-database",
			"llm",
			"multi-agent",
			"open-source",
			"python",
			"swarm-intelligence"
		],
		"u": "2026-08-16T10:28:42Z",
		"h": "https://github.com/Ikalus1988/MisakaNet",
		"p": "https://misakanet.org"
	},
	{
		"f": "NanmiCoder/dsh-agent-teams",
		"n": "dsh-agent-teams",
		"o": "NanmiCoder",
		"d": "AgentTeams plugin for DeepSeek Harness",
		"s": 379,
		"k": 35,
		"l": "TypeScript",
		"t": [
			"agentteams",
			"deepseekharness",
			"dsh",
			"dsh-agent-teams",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:54:19Z",
		"h": "https://github.com/NanmiCoder/dsh-agent-teams",
		"p": ""
	},
	{
		"f": "yogsoth-ai/de-anthropocentric-research-engine",
		"n": "de-anthropocentric-research-engine",
		"o": "yogsoth-ai",
		"d": "900+ pure-markdown skills for autonomous AI research, organized as 9 freely-composable packages over a 4-layer hierarchy (Campaign → Strategy → Tactic → SOP). Non-linear orchestration with backtracking, 6 MCP integrations. The AI is the researcher — you set the direction.",
		"s": 371,
		"k": 32,
		"l": "HTML",
		"t": [
			"academic-research",
			"agent-native-research-artifact",
			"ai-scientist",
			"auto-research",
			"autonomous-research",
			"autoresearch",
			"claude-code",
			"codex",
			"deep-research",
			"dsh-plugin",
			"literature-review",
			"mcp",
			"research-agent",
			"research-orchestration",
			"scientific-discovery",
			"semantic-scholar",
			"skill"
		],
		"u": "2026-08-16T01:57:10Z",
		"h": "https://github.com/yogsoth-ai/de-anthropocentric-research-engine",
		"p": ""
	},
	{
		"f": "EthanYoQ/AI-Novel-Writer",
		"n": "AI-Novel-Writer",
		"o": "EthanYoQ",
		"d": "AI小说写作软件，通过大纲、角色、章节蓝图、审稿修稿和知识库控制长篇小说写作，支持本地模型编写。",
		"s": 361,
		"k": 52,
		"l": "TypeScript",
		"t": [
			"ai-writing",
			"dsh-plugin",
			"dsh-plugins",
			"electron",
			"fiction-writing",
			"gemini",
			"local-first",
			"novel-writing",
			"ollama",
			"react",
			"typescript",
			"web-novel"
		],
		"u": "2026-08-16T06:45:25Z",
		"h": "https://github.com/EthanYoQ/AI-Novel-Writer",
		"p": ""
	},
	{
		"f": "Electricitysheep/dsh-handbook",
		"n": "dsh-handbook",
		"o": "Electricitysheep",
		"d": "DeepSeek Harness (dsh) 从 0 到 1 深度手册：安装/插件开发/性能调优/实测案例/同模型多 Agent 实测对比（中文 + 英文 PDF）",
		"s": 333,
		"k": 9,
		"l": "HTML",
		"t": [
			"agent",
			"agent-framework",
			"ai-agents",
			"beginners",
			"deepseek",
			"deepseek-ai",
			"dsh-plugin",
			"getting-started",
			"guide",
			"harness",
			"llm",
			"tutorial"
		],
		"u": "2026-08-16T10:24:19Z",
		"h": "https://github.com/Electricitysheep/dsh-handbook",
		"p": "https://github.com/Electricitysheep/dsh-handbook"
	},
	{
		"f": "morluto/rea",
		"n": "rea",
		"o": "morluto",
		"d": "Reverse engineer anything with agents, from app behavior down to native binaries.",
		"s": 331,
		"k": 26,
		"l": "TypeScript",
		"t": [
			"agent-skills",
			"ai-agent-tools",
			"ai-agents",
			"binary-analysis",
			"cli",
			"coding-agent",
			"coding-agents",
			"cordis",
			"decompiler",
			"disassembler",
			"dsh",
			"dsh-plugin",
			"hopper-disassembler",
			"mcp",
			"mcp-server",
			"model-context-protocol",
			"reverse-engineering",
			"reverse-engineering-tools",
			"static-analysis"
		],
		"u": "2026-08-16T06:50:46Z",
		"h": "https://github.com/morluto/rea",
		"p": ""
	},
	{
		"f": "PM-Shawn/Abu-Cowork",
		"n": "Abu-Cowork",
		"o": "PM-Shawn",
		"d": "Open-source alternative to Claude Cowork — a local-first AI agent desktop app · multi-model · self-evolving skills · privacy-first · multi-Harness roadmap · DeepSeek Harness integration in progress",
		"s": 329,
		"k": 77,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"ai-assistant",
			"automation",
			"desktop-app",
			"dsh-plugin",
			"dsh-plugins",
			"llm",
			"local-first",
			"mcp",
			"privacy",
			"productivity",
			"react",
			"tauri",
			"typescript"
		],
		"u": "2026-08-16T00:50:41Z",
		"h": "https://github.com/PM-Shawn/Abu-Cowork",
		"p": "https://myabu.cn"
	},
	{
		"f": "Minara-AI/minara-skills",
		"n": "minara-skills",
		"o": "Minara-AI",
		"d": "The skills for trading, to make your agent earn for you.",
		"s": 327,
		"k": 35,
		"l": "Shell",
		"t": [
			"agent-skills",
			"codex",
			"dsh-plugin"
		],
		"u": "2026-08-16T03:24:50Z",
		"h": "https://github.com/Minara-AI/minara-skills",
		"p": ""
	},
	{
		"f": "linhay/harmony-next.skills",
		"n": "harmony-next.skills",
		"o": "linhay",
		"d": "🚀 Expert guidance for HarmonyOS NEXT (API 12+) development. Covers IDE operations, performance tuning, architecture (HAP/HAR/HSP), and automation testing.",
		"s": 323,
		"k": 24,
		"l": "Python",
		"t": [
			"arkts",
			"automation-testing",
			"deveco-studio",
			"dsh-plugin",
			"harmonyos",
			"harmonyos-next",
			"openharmony",
			"performance-tuning"
		],
		"u": "2026-08-16T06:54:55Z",
		"h": "https://github.com/linhay/harmony-next.skills",
		"p": ""
	},
	{
		"f": "alaliqing/claude-paper",
		"n": "claude-paper",
		"o": "alaliqing",
		"d": "📖 Cross-agent research paper toolkit for Claude Code, Codex, OpenCode, and DeepSeek Harness—quick summaries, deep study materials, code demos, and a local web viewer.",
		"s": 306,
		"k": 24,
		"l": "Vue",
		"t": [
			"academic-tools",
			"agent-skills",
			"claude-code",
			"code-generation",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"learning-management",
			"npm-package",
			"opencode",
			"pdf-parser",
			"research-papers",
			"vue",
			"web-viewer"
		],
		"u": "2026-08-16T09:39:16Z",
		"h": "https://github.com/alaliqing/claude-paper",
		"p": ""
	},
	{
		"f": "ysr666/dsh-vision-router",
		"n": "dsh-vision-router",
		"o": "ysr666",
		"d": "Eyes for text-only DeepSeek Harness agents: built-in free vision chain (no key) + pixel-level vision tools (Q&A, grounding, crop, pixel diff, colors, OCR, SVG trace, cutout, screenshots). One-command install, no Python, image turns work like ordinary tool-calling turns.",
		"s": 292,
		"k": 17,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multimodal",
			"vision"
		],
		"u": "2026-08-16T10:28:12Z",
		"h": "https://github.com/ysr666/dsh-vision-router",
		"p": "https://github.com/ysr666/dsh-vision-router"
	},
	{
		"f": "text2future/flowix",
		"n": "flowix",
		"o": "text2future",
		"d": "Notes for you, Memory for your agents.",
		"s": 290,
		"k": 37,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"codex-cli",
			"dsh",
			"dsh-plugin",
			"hermes-agent",
			"markdown-editor",
			"memory-system",
			"note-taking",
			"open-code"
		],
		"u": "2026-08-16T09:10:10Z",
		"h": "https://github.com/text2future/flowix",
		"p": "https://www.flowix-memo.com/"
	},
	{
		"f": "omdsh-dev/dsh-at-file",
		"n": "dsh-at-file",
		"o": "omdsh-dev",
		"d": "Codex-style @file mentions for DeepSeek Harness: search workspace files in the composer and attach their contents to prompts.",
		"s": 245,
		"k": 9,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:07:03Z",
		"h": "https://github.com/omdsh-dev/dsh-at-file",
		"p": ""
	},
	{
		"f": "SepineTam/mcp-for-stata",
		"n": "mcp-for-stata",
		"o": "SepineTam",
		"d": "A MCP server for Stata to integrate Stata into your agent. ",
		"s": 244,
		"k": 33,
		"l": "Python",
		"t": [
			"claude-code",
			"claude-code-plugin",
			"claude-code-skill",
			"codex",
			"codex-plugin",
			"dsh-plugin",
			"dsh-plugins",
			"econometrics",
			"empirical",
			"empirical-research",
			"llm",
			"mcp",
			"social-science",
			"social-science-research",
			"stata",
			"stata-mcp",
			"statistical-analysis"
		],
		"u": "2026-08-15T07:49:14Z",
		"h": "https://github.com/SepineTam/mcp-for-stata",
		"p": "https://www.aidea-labs.com/mcp-for-stata"
	},
	{
		"f": "openma-ai/open-managed-agents",
		"n": "open-managed-agents",
		"o": "openma-ai",
		"d": "Open-source Claude Managed Agents API implementation and self-hosted Claude Tag-style agent runtime. Drop-in compatible; runs on Cloudflare Workers/Durable Objects or Node.js. Apache 2.0.",
		"s": 235,
		"k": 32,
		"l": "TypeScript",
		"t": [
			"agent-framework",
			"agent-infrastructure",
			"agent-platform",
			"ai-agents",
			"anthropic-api",
			"anthropic-managed-agents",
			"byok",
			"claude-api",
			"claude-code",
			"claude-managed-agents",
			"claude-tag",
			"claude-tag-alternative",
			"cloudflare",
			"dsh-plugin",
			"dsh-plugins",
			"durable-objects",
			"managed-agents",
			"open-managed-agents",
			"open-source-agents",
			"self-hosted-agents"
		],
		"u": "2026-08-16T09:51:20Z",
		"h": "https://github.com/openma-ai/open-managed-agents",
		"p": "https://openma.dev"
	},
	{
		"f": "h4dex/opc-nexus",
		"n": "opc-nexus",
		"o": "h4dex",
		"d": "开源的企业版的数字员工工作台, OPC-Nexus（One Person Company Nexus）是一款本地优先的桌面 AI Agent 管理器。它为单人公司 / 独立开发者提供统一的 AI 数字员工管理平台 —— 从 Agent 创建、任务编排、多引擎接入，到消息渠道集成、工作流自动化和专家团协作，一站式覆盖。 （原内部项目AiBoxDash） ",
		"s": 231,
		"k": 7,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"ai-employees",
			"deepseek",
			"desktop",
			"dsh-plugin",
			"remote-android-control"
		],
		"u": "2026-08-16T08:32:46Z",
		"h": "https://github.com/h4dex/opc-nexus",
		"p": "https://www.apptq.com"
	},
	{
		"f": "zhoushoujianwork/easyeda-agent",
		"n": "easyeda-agent",
		"o": "zhoushoujianwork",
		"d": "",
		"s": 228,
		"k": 33,
		"l": "Go",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:17:39Z",
		"h": "https://github.com/zhoushoujianwork/easyeda-agent",
		"p": ""
	},
	{
		"f": "TencentCloud/tencentmeeting-cli",
		"n": "tencentmeeting-cli",
		"o": "TencentCloud",
		"d": "腾讯会议命令行工具（CLI），基于腾讯会议开放平台 OAuth2 授权，支持会议管理、录制管理、参会报告等功能。",
		"s": 217,
		"k": 10,
		"l": "Go",
		"t": [
			"codebuddy",
			"codebuddy-skill",
			"dsh-plugin",
			"workbuddy",
			"workbuddy-skill"
		],
		"u": "2026-08-15T00:46:59Z",
		"h": "https://github.com/TencentCloud/tencentmeeting-cli",
		"p": "https://meeting.tencent.com/ai-skill-cli.html"
	},
	{
		"f": "hust-open-atom-club/oh-dsh",
		"n": "oh-dsh",
		"o": "hust-open-atom-club",
		"d": " 一套 DSH runtime，Desktop、Web 与 TUI 三种开发体验。",
		"s": 210,
		"k": 18,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"cordis",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:11:05Z",
		"h": "https://github.com/hust-open-atom-club/oh-dsh",
		"p": "https://dsh.openatom.club/"
	},
	{
		"f": "vibeinging/deepseek-harness-desktop-app",
		"n": "deepseek-harness-desktop-app",
		"o": "vibeinging",
		"d": "DeepSeek Harness Desktop App: a local AI desktop workspace for DSH Sessions, projects, files, web research, plugins, and Office artifacts.",
		"s": 208,
		"k": 4,
		"l": "JavaScript",
		"t": [
			"agentic-workflows",
			"ai-agent",
			"ai-workbench",
			"data-analysis",
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"local-first",
			"mcp",
			"model-context-protocol",
			"office-automation",
			"react",
			"typescript"
		],
		"u": "2026-08-16T09:03:19Z",
		"h": "https://github.com/vibeinging/deepseek-harness-desktop-app",
		"p": ""
	},
	{
		"f": "Lum1104/dsh-browser",
		"n": "dsh-browser",
		"o": "Lum1104",
		"d": "dsh plugin: Chrome sidebar extension that lets DSH operate your browser directly, no vision capabilities required. 一款 Chrome 侧边栏扩展程序，可让 DSH 直接操控您的浏览器，无需视觉能力。",
		"s": 181,
		"k": 13,
		"l": "TypeScript",
		"t": [
			"chrome-extension",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:13:53Z",
		"h": "https://github.com/Lum1104/dsh-browser",
		"p": ""
	},
	{
		"f": "vlln/whale-girl",
		"n": "whale-girl",
		"o": "vlln",
		"d": "DSH Web GUI 桌面宠物插件（QQ 宠物形态）：右下角悬浮、可拖拽/投喂/玩耍的积累型伙伴。",
		"s": 181,
		"k": 8,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-repository-plugin",
			"pet"
		],
		"u": "2026-08-16T09:40:21Z",
		"h": "https://github.com/vlln/whale-girl",
		"p": ""
	},
	{
		"f": "huiliyi37/dsh-tianshu-tui",
		"n": "dsh-tianshu-tui",
		"o": "huiliyi37",
		"d": "dsh-tianshu-tui — 是官方 Dsh web端的交互式终端极简风格 UI 插件。以自研ansi为渲染核心，极度丝滑流畅，在官方的基础上增加了TDD、证据门、视觉图像模块等工作流。",
		"s": 180,
		"k": 7,
		"l": "TypeScript",
		"t": [
			"coding",
			"dsh",
			"dsh-plugin",
			"harness",
			"harness-engineering",
			"tui"
		],
		"u": "2026-08-16T09:38:31Z",
		"h": "https://github.com/huiliyi37/dsh-tianshu-tui",
		"p": "https://github.com/huiliyi37/dsh-tianshu-tui"
	},
	{
		"f": "cofy-x/axern",
		"n": "axern",
		"o": "cofy-x",
		"d": "Open-source sandboxes for AI agents, untrusted code execution, and durable services.",
		"s": 167,
		"k": 5,
		"l": "Go",
		"t": [
			"agent-sandbox",
			"agentic-infrastructure",
			"ai-agents",
			"cloud-native",
			"code-execution",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"kubernetes",
			"remote-execution",
			"sandbox",
			"self-hosted"
		],
		"u": "2026-08-15T22:44:40Z",
		"h": "https://github.com/cofy-x/axern",
		"p": "https://axern.cofy-x.space"
	},
	{
		"f": "bruc3van/awesome-dsh-plugin",
		"n": "awesome-dsh-plugin",
		"o": "bruc3van",
		"d": "用 30 秒为你的 DeepSeek Harness（DSH）找到合适的插件。 这不是又一个仓库清单：GitHub 上所有打着 dsh-plugin 标签的仓库由脚本每天自动抓取，再经人工逐个核实——真插件进目录，蹭热度的进黑名单，每条剔除理由公开可查。并告诉你每个插件适合谁、从哪里开始。",
		"s": 166,
		"k": 38,
		"l": "JavaScript",
		"t": [
			"awesome-list",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:20:12Z",
		"h": "https://github.com/bruc3van/awesome-dsh-plugin",
		"p": "https://x.com/bruc3van"
	},
	{
		"f": "tinqiao-oss/engramory",
		"n": "engramory",
		"o": "tinqiao-oss",
		"d": "A portable memory protocol for AI agents — load it as standing rules; a curation discipline + reference spec + optional cap hook.",
		"s": 154,
		"k": 11,
		"l": "Python",
		"t": [
			"agent-memory",
			"ai-agents",
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"knowledge-base",
			"llm-memory",
			"long-term-memory",
			"markdown",
			"memory",
			"prompt-engineering",
			"zero-dependency"
		],
		"u": "2026-08-16T09:39:42Z",
		"h": "https://github.com/tinqiao-oss/engramory",
		"p": ""
	},
	{
		"f": "Nagi-ovo/dsh-visualize",
		"n": "dsh-visualize",
		"o": "Nagi-ovo",
		"d": "在 DSH 对话中生成交互式可视化｜Render model-generated interactive cards inside DSH conversations",
		"s": 141,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"data-visualization",
			"deepseek-harness",
			"dsh-plugin",
			"interactive-visualization"
		],
		"u": "2026-08-16T10:28:25Z",
		"h": "https://github.com/Nagi-ovo/dsh-visualize",
		"p": ""
	},
	{
		"f": "zhaoolee/notes",
		"n": "notes",
		"o": "zhaoolee",
		"d": "开源版锤子便签，复刻锤科美学，一键Docker私有化部署，支持skill调用，支持dsh plugin，支持多租户，一键生成公众号格式，支持导出便签为图片",
		"s": 141,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"dsh-plugin",
			"notes",
			"smartisan"
		],
		"u": "2026-08-15T23:12:58Z",
		"h": "https://github.com/zhaoolee/notes",
		"p": "https://notes.fangyuanxiaozhan.com"
	},
	{
		"f": "humblebanana/open-record-replay",
		"n": "open-record-replay",
		"o": "humblebanana",
		"d": "Open-source macOS record-and-replay workflow recorder for computer use agents. Captures mouse, keyboard, and UI events as structured traces so agents can learn, replay, and automate real desktop tasks.",
		"s": 138,
		"k": 4,
		"l": "Swift",
		"t": [
			"agent",
			"codex",
			"computer-use-agent",
			"dsh-plugin",
			"skills"
		],
		"u": "2026-08-15T00:52:53Z",
		"h": "https://github.com/humblebanana/open-record-replay",
		"p": ""
	},
	{
		"f": "Ariestar/sivtr",
		"n": "sivtr",
		"o": "Ariestar",
		"d": "A unified agent memory workspace for human and agent",
		"s": 135,
		"k": 18,
		"l": "Rust",
		"t": [
			"agent",
			"cli",
			"dsh-plugin",
			"dsh-plugins",
			"output",
			"rust",
			"search",
			"sivtr",
			"workspace"
		],
		"u": "2026-08-16T04:07:38Z",
		"h": "https://github.com/Ariestar/sivtr",
		"p": "https://sivtr.pages.dev/"
	},
	{
		"f": "hyqibot/A-share-Ai",
		"n": "A-share-Ai",
		"o": "hyqibot",
		"d": "幻银量化A股阿法狗AlphaHYQi，100%由ai自主驱动的实盘交易机器。接入自产龙虾iClaw，手机端一句话控制四大模型同时干活。获取方法：前往https://hyqibot.com/card-shop.html 购服务卡即可获得软件，详情README.md。  A股Ai炒股大赛历史排行（模拟基金）：https://hyqibot.github.io/A-share-Ai/reports/report.html   A股Ai炒股大赛历史排行（全市场）：https://hyqibot.github.io/A-share-Ai/reportsall/report.html    实时播报：https://hyqibot.github.io/A-sh",
		"s": 124,
		"k": 12,
		"l": "",
		"t": [
			"alphago",
			"alphazero",
			"claude",
			"claude-ai",
			"claude-code",
			"claude-code-plugin",
			"claude-skills",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsp",
			"hermes",
			"hermes-agent",
			"iclaw",
			"openclaw"
		],
		"u": "2026-08-16T03:40:03Z",
		"h": "https://github.com/hyqibot/A-share-Ai",
		"p": "https://www.hyqibot.com"
	},
	{
		"f": "omdsh-dev/dsh-genui",
		"n": "dsh-genui",
		"o": "omdsh-dev",
		"d": "GenUI for DeepSeek Harness: interactive UI components rendered inline in assistant replies via the dsh-ui fence — layout, charts, plots, forms, quizzes, mermaid, 3D scenes, and an action event loop back to the model. Ships the fence-teaching host plugin, the browser renderer (client half), and the genui skill.",
		"s": 122,
		"k": 14,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:05:00Z",
		"h": "https://github.com/omdsh-dev/dsh-genui",
		"p": ""
	},
	{
		"f": "Ruler4396/dsh-launcher",
		"n": "dsh-launcher",
		"o": "Ruler4396",
		"d": "Lightweight Windows launcher for DeepSeek Harness: silent autostart at logon + a minimal WebView2 window instead of a full browser",
		"s": 119,
		"k": 4,
		"l": "C#",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"launcher",
			"webview2",
			"windows"
		],
		"u": "2026-08-16T10:08:26Z",
		"h": "https://github.com/Ruler4396/dsh-launcher",
		"p": ""
	},
	{
		"f": "Nagi-ovo/dsh-find-plugins",
		"n": "dsh-find-plugins",
		"o": "Nagi-ovo",
		"d": "帮 DSH 搜索、安装并验证插件的 Skill｜A DSH skill that finds, installs, and verifies GitHub plugins",
		"s": 118,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"deepseek-harness",
			"dsh-plugin",
			"plugin-discovery"
		],
		"u": "2026-08-16T10:21:44Z",
		"h": "https://github.com/Nagi-ovo/dsh-find-plugins",
		"p": ""
	},
	{
		"f": "drewnekota/cetus",
		"n": "cetus",
		"o": "drewnekota",
		"d": "One macOS app for Claude Code, Codex, and every agent runtime you use — scheduled runs, global hotkey launcher, per-run git worktrees, one review board.",
		"s": 115,
		"k": 6,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"automation",
			"claude-code",
			"codex",
			"computer-use",
			"deepseek-harness",
			"desktop-agent",
			"dsh",
			"dsh-plugin",
			"local-first",
			"macos",
			"rust",
			"tauri"
		],
		"u": "2026-08-16T09:51:21Z",
		"h": "https://github.com/drewnekota/cetus",
		"p": ""
	},
	{
		"f": "liceses/dsh-gitbash-preset",
		"n": "dsh-gitbash-preset",
		"o": "liceses",
		"d": "DeepSeek Harness 插件：一键安装「极简模式 (Git Bash)」agent preset —— 把 DSH 自带极简模式中的 bash 调用映射到 Git for Windows 的 bash（MSYS），让 Windows 上的极简模式真正可用。",
		"s": 114,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:17:49Z",
		"h": "https://github.com/liceses/dsh-gitbash-preset",
		"p": ""
	},
	{
		"f": "liustack/modsearch",
		"n": "modsearch",
		"o": "liustack",
		"d": "The web plugin for DeepSeek Harness, and the search bridge for every model without native web access. Ask the web or X, get structured JSON evidence. | DeepSeek Harness 的 web 插件，为不能联网的模型补上搜索。问网页或 X，拿回结构化 JSON 证据（搜索、抓取、引用）。",
		"s": 107,
		"k": 5,
		"l": "TypeScript",
		"t": [
			"agent-skills",
			"agentic-workflow",
			"claude-code",
			"claude-skills",
			"codex",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"glm",
			"harness",
			"harness-engineering",
			"hermes-agent",
			"openclaw",
			"opencode",
			"pi-agent",
			"web-fetch",
			"web-search"
		],
		"u": "2026-08-16T09:52:57Z",
		"h": "https://github.com/liustack/modsearch",
		"p": "https://liustack.dev"
	},
	{
		"f": "fufankeji/deepseek-harness-studio",
		"n": "deepseek-harness-studio",
		"o": "fufankeji",
		"d": "DeepSeek Harness 零代码桌面端｜一键启动，支持 Windows 与 macOS；内置插件发现、热点插件推送、一键安装与管理、AI 智能推荐和视觉增强。",
		"s": 107,
		"k": 6,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-studio",
			"desktop-app",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"electron",
			"macos",
			"plugin-manager",
			"windows"
		],
		"u": "2026-08-16T10:20:26Z",
		"h": "https://github.com/fufankeji/deepseek-harness-studio",
		"p": "https://deepseekdesktop.com"
	},
	{
		"f": "Sikao-Engine/KimiX",
		"n": "KimiX",
		"o": "Sikao-Engine",
		"d": "The next-gen lightweight coding agent cli",
		"s": 105,
		"k": 13,
		"l": "Python",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T10:20:53Z",
		"h": "https://github.com/Sikao-Engine/KimiX",
		"p": ""
	},
	{
		"f": "csyangwen/dsh-memory-evolve",
		"n": "dsh-memory-evolve",
		"o": "csyangwen",
		"d": "为 DeepSeek Harness 带来「跨会话长期记忆 + 后台自我进化」能力的纯插件实现：五轨记忆 · git 分支感知 · 回合内自我审查 · 技能自我进化与技能管理器 · 四轨待办 · COI 调度 · 会话广播 · 会话搜索 · 提示词管理器 · 临时信息便签——零核心修改、零运行时依赖，随装随用、卸载即净。",
		"s": 105,
		"k": 8,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:22:09Z",
		"h": "https://github.com/csyangwen/dsh-memory-evolve",
		"p": ""
	},
	{
		"f": "Vladimir-Human/humanizer-ru",
		"n": "humanizer-ru",
		"o": "Vladimir-Human",
		"d": "Скилл для ИИ-агентов: находит и убирает следы машинной генерации из русского текста. 38 паттернов, 39 regex-маркеров с реестром доказательств, слепые парные прогоны, файловый слой снятия C2PA/EXIF/XMP | Russian AI-writing humanizer skill with file metadata cleaning",
		"s": 100,
		"k": 5,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai",
			"ai-detection",
			"ai-writing",
			"c2pa",
			"claude",
			"claude-code",
			"claude-skills",
			"codex",
			"cursor",
			"dsh-plugin",
			"gemini-cli",
			"humanizer",
			"llm",
			"nlp",
			"opencode",
			"russian",
			"russian-nlp",
			"text-humanization",
			"watermarks"
		],
		"u": "2026-08-16T05:29:45Z",
		"h": "https://github.com/Vladimir-Human/humanizer-ru",
		"p": "https://skills.sh/vladimir-human/humanizer-ru/humanizer-ru"
	},
	{
		"f": "ChisaAlter/Deepseek-Harness-Desktop",
		"n": "Deepseek-Harness-Desktop",
		"o": "ChisaAlter",
		"d": "DSH桌面端，支持主题和背景图等多种个性化配置。Electron desktop shell for DeepSeek Harness web UI",
		"s": 94,
		"k": 9,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:13:34Z",
		"h": "https://github.com/ChisaAlter/Deepseek-Harness-Desktop",
		"p": ""
	},
	{
		"f": "ZSeven-W/dsh-openpencil",
		"n": "dsh-openpencil",
		"o": "ZSeven-W",
		"d": "The DeepSeek Harness plugin for OpenPencil — preview, inspect, and edit real .op documents inside a conversation.",
		"s": 93,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"design",
			"dsh",
			"dsh-plugin",
			"openpencil",
			"ppt",
			"ui",
			"ui-design"
		],
		"u": "2026-08-16T09:19:39Z",
		"h": "https://github.com/ZSeven-W/dsh-openpencil",
		"p": "https://op.zseven.tech"
	},
	{
		"f": "hikariming/dshfind",
		"n": "dshfind",
		"o": "hikariming",
		"d": "DSH (DeepSeek Harness) 原理学习、插件市场与最佳实践 · Learn DSH principles, plugin marketplace & best practices",
		"s": 92,
		"k": 4,
		"l": "MDX",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:21:28Z",
		"h": "https://github.com/hikariming/dshfind",
		"p": "https://dshfind.com"
	},
	{
		"f": "pulseaiclub/phi",
		"n": "phi",
		"o": "pulseaiclub",
		"d": "a coding Agent from pi. ∞ providers, sub-agents, hashline edits, and a permission gate",
		"s": 89,
		"k": 5,
		"l": "Go",
		"t": [
			"ai",
			"ai-agent",
			"cli",
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"go",
			"openai",
			"pi",
			"terminal",
			"tui"
		],
		"u": "2026-08-16T08:32:50Z",
		"h": "https://github.com/pulseaiclub/phi",
		"p": ""
	},
	{
		"f": "WYH66666666/DSH-Transparent-UI-Plugin",
		"n": "DSH-Transparent-UI-Plugin",
		"o": "WYH66666666",
		"d": "是一层高自由度的玻璃质感主题，套在 DeepSeek Harness 网页端。顶栏、侧边栏、输入框、统计行、轨迹视图都成了磨砂玻璃片。玻璃模糊度、磨砂度、背景（流体或自定义壁纸，壁纸还能单独调模糊和磨砂）全都能在设置卡片里自由调节。关掉开关就回到原生界面，不改 DSH 任何一行源码。",
		"s": 88,
		"k": 4,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"theme"
		],
		"u": "2026-08-16T10:27:37Z",
		"h": "https://github.com/WYH66666666/DSH-Transparent-UI-Plugin",
		"p": ""
	},
	{
		"f": "taxueseek/argo",
		"n": "argo",
		"o": "taxueseek",
		"d": "专门为 agent 打造的 agent 搜索工具，具备多语言搜索能力，覆盖中文/英文/学术/代码/购物/金融/新闻/百科。",
		"s": 88,
		"k": 4,
		"l": "Python",
		"t": ["dsh-ecosystem", "dsh-plugin"],
		"u": "2026-08-16T09:59:20Z",
		"h": "https://github.com/taxueseek/argo",
		"p": ""
	},
	{
		"f": "orziz/odai",
		"n": "odai",
		"o": "orziz",
		"d": "AI agent 通用任务治理框架：对齐目标与事实，规划和调度能力，守住授权与风险边界，治理任务执行到真实验收与交付。Governance framework for evidence-driven planning, orchestration, and verified delivery.",
		"s": 84,
		"k": 16,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"ai-agents",
			"dsh-plugin",
			"dsh-plugins",
			"odai"
		],
		"u": "2026-08-15T23:25:09Z",
		"h": "https://github.com/orziz/odai",
		"p": ""
	},
	{
		"f": "Zhiyuan-Fan/Awesome-DeepSeek-Harness-Plugins",
		"n": "Awesome-DeepSeek-Harness-Plugins",
		"o": "Zhiyuan-Fan",
		"d": "Curated DeepSeek Harness (DSH) plugins, extensions, tools, skills, clients, runtimes, integrations, and verified references — English and Chinese.",
		"s": 84,
		"k": 15,
		"l": "",
		"t": [
			"agent-harness",
			"ai-agents",
			"awesome-list",
			"bilingual",
			"curated-list",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"extensions",
			"llm-tools",
			"plugins"
		],
		"u": "2026-08-16T10:29:13Z",
		"h": "https://github.com/Zhiyuan-Fan/Awesome-DeepSeek-Harness-Plugins",
		"p": ""
	},
	{
		"f": "Leslie-SSS/seeWxapkg",
		"n": "seeWxapkg",
		"o": "Leslie-SSS",
		"d": "极简实用的微信小程序反编译 Web 工具",
		"s": 83,
		"k": 26,
		"l": "Go",
		"t": [
			"decompile",
			"decompiler",
			"dsh-plugin",
			"mini-program",
			"reverse-engineering",
			"unpack",
			"wechat",
			"wechat-app",
			"wechat-mini-program",
			"wexin",
			"wxapkg"
		],
		"u": "2026-08-16T03:29:56Z",
		"h": "https://github.com/Leslie-SSS/seeWxapkg",
		"p": "https://seewxapkg.keepbuild.cn"
	},
	{
		"f": "yjh051108/dsh-super-injector",
		"n": "dsh-super-injector",
		"o": "yjh051108",
		"d": "",
		"s": 82,
		"k": 9,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:00:26Z",
		"h": "https://github.com/yjh051108/dsh-super-injector",
		"p": ""
	},
	{
		"f": "libukai/awesome-deepseek-harness",
		"n": "awesome-deepseek-harness",
		"o": "libukai",
		"d": "DeepSeek Harness 终极指南：快速入门、资源推荐、精选插件与实用工具 ｜The Ultimate Guide to DeepSeek Harness: QuickStart, Resources, Plugins&Toolkit",
		"s": 80,
		"k": 22,
		"l": "",
		"t": [
			"agent",
			"agent-harness",
			"awesome-list",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"plugins"
		],
		"u": "2026-08-16T09:42:17Z",
		"h": "https://github.com/libukai/awesome-deepseek-harness",
		"p": "https://x.com/libukai"
	},
	{
		"f": "ZSeven-W/dsh-noema",
		"n": "dsh-noema",
		"o": "ZSeven-W",
		"d": "Noema long-term memory plugin for DSH: durable, inspectable agent memory with recall tools and a settings page.",
		"s": 77,
		"k": 6,
		"l": "TypeScript",
		"t": [
			"agent-memory",
			"ai-agents",
			"coding-agent",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"long-term-memory",
			"mcp",
			"memory",
			"noema",
			"plugin",
			"typescript"
		],
		"u": "2026-08-16T10:29:27Z",
		"h": "https://github.com/ZSeven-W/dsh-noema",
		"p": "op.zseven.tech"
	},
	{
		"f": "bradeGithub/DSH-Plugins-Marketplace",
		"n": "DSH-Plugins-Marketplace",
		"o": "bradeGithub",
		"d": "DSH插件市场 / DSH Plugin Marketplace: 在 DeepSeek Harness Web GUI 中一键浏览、安装与更新 GitHub topic:dsh-plugin 的全部插件 | browse, install & update all GitHub dsh-plugin plugins in the DSH Web GUI",
		"s": 75,
		"k": 6,
		"l": "JavaScript",
		"t": [
			"agent",
			"ai-agents",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"javascript",
			"llm",
			"marketplace",
			"nodejs",
			"plugin",
			"plugin-marketplace"
		],
		"u": "2026-08-16T10:12:18Z",
		"h": "https://github.com/bradeGithub/DSH-Plugins-Marketplace",
		"p": ""
	},
	{
		"f": "wink-run/tokenbank",
		"n": "tokenbank",
		"o": "wink-run",
		"d": "Token Bank — the local LLM gateway that sits between your AI agents and every provider.  Know where tokens go · Spend less with smart routing to Ollama, Groq, GitHub Models · Earn by sharing idle quota on a community P2P network.  One-click onboarding for Cursor, Claude Code, Codex CLI, Gemini CLI — no agent changes. Full trace, seamless model swap",
		"s": 75,
		"k": 11,
		"l": "JavaScript",
		"t": [
			"agent",
			"anthropic",
			"claudecode",
			"codex",
			"cursor",
			"dsh",
			"dsh-plugin",
			"llm",
			"llm-gateway",
			"llm-gateway-system",
			"llm-proxy",
			"llm-router",
			"local",
			"local-first",
			"observability",
			"openai",
			"openclaw",
			"token",
			"token-usage",
			"tokenhub"
		],
		"u": "2026-08-16T08:36:43Z",
		"h": "https://github.com/wink-run/tokenbank",
		"p": "https://tokenbank.wink.run"
	},
	{
		"f": "Dominic789654/awesome-deepseek-harness",
		"n": "awesome-deepseek-harness",
		"o": "Dominic789654",
		"d": "A curated list of plugins, skills, MCP servers, patch/profile layers, orchestrators & UIs for DeepSeek Harness (DSH). Visualization · PPT · Coding · Agents · Loops (auto-research) and more. #dsh",
		"s": 72,
		"k": 41,
		"l": "TypeScript",
		"t": [
			"agent",
			"agent-framework",
			"ai-agent",
			"ai-agents",
			"awesome",
			"awesome-list",
			"coding-agent",
			"deepseek",
			"deepseek-ai",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-patch",
			"dsh-plugin",
			"dsh-plugins",
			"llm",
			"llm-agent",
			"mcp",
			"plugins"
		],
		"u": "2026-08-16T10:08:06Z",
		"h": "https://github.com/Dominic789654/awesome-deepseek-harness",
		"p": ""
	},
	{
		"f": "labring/sealos-skills",
		"n": "sealos-skills",
		"o": "labring",
		"d": "AI agent skills for Sealos — deploy any project, provision databases, object storage & more with one command. Works with Claude Code, Gemini CLI, Codex.",
		"s": 70,
		"k": 19,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agent",
			"claude-code",
			"cloud-native",
			"codex",
			"deployment",
			"docker",
			"dsh-plugin",
			"gemini-cli",
			"kubernetes",
			"sealos"
		],
		"u": "2026-08-14T08:19:41Z",
		"h": "https://github.com/labring/sealos-skills",
		"p": "https://sealos.io/sealos-skills"
	},
	{
		"f": "NanmiCoder/dsh-auto-mode",
		"n": "dsh-auto-mode",
		"o": "NanmiCoder",
		"d": "Safe automatic permissions for DeepSeek Harness.",
		"s": 69,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"deepseekharness",
			"dsh",
			"dsh-auto-model",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:43:40Z",
		"h": "https://github.com/NanmiCoder/dsh-auto-mode",
		"p": ""
	},
	{
		"f": "kuangre123/codex-switch",
		"n": "codex-switch",
		"o": "kuangre123",
		"d": "Codex Switch 是一个 macOS 工具，一键配置 Codex 的自定义 API，同时保留官方 OpenAI 登录。保存后 Codex 的模型选择器里只会出现你选的那个 provider 的模型。也支持 Claude Code 的官方 / 自定义 API 切换。Codex Switch is a lightweight helper for configuring multiple coding-agent API routes. For Codex, it keeps Official OpenAI and a custom API provider configured in parallel, registers the custom model in Codex's mod",
		"s": 67,
		"k": 1,
		"l": "Python",
		"t": [
			"codex",
			"codex-app",
			"codex-cli",
			"codex-desktop",
			"codex-github",
			"codex-pet",
			"codex-plugin",
			"codex-project",
			"codex-skill",
			"codex-skills",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:34:18Z",
		"h": "https://github.com/kuangre123/codex-switch",
		"p": ""
	},
	{
		"f": "Co-Engram/Co-Engram",
		"n": "Co-Engram",
		"o": "Co-Engram",
		"d": "Self-evolving team memory",
		"s": 66,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"agent-memory",
			"ai-memory",
			"claude-code",
			"cordis",
			"deepseek-harness",
			"dsh-plugin",
			"engram",
			"mcp",
			"memory",
			"team-memory"
		],
		"u": "2026-08-16T10:03:09Z",
		"h": "https://github.com/Co-Engram/Co-Engram",
		"p": ""
	},
	{
		"f": "Jayden-X-L/forkprobe",
		"n": "forkprobe",
		"o": "Jayden-X-L",
		"d": "Compare multiple skills on the same task and pick the winner.",
		"s": 66,
		"k": 3,
		"l": "Python",
		"t": [
			"agent-workflow",
			"ai-agents",
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"pptx",
			"research-writing",
			"skill-comparison",
			"skills"
		],
		"u": "2026-08-15T11:04:10Z",
		"h": "https://github.com/Jayden-X-L/forkprobe",
		"p": "https://jayden-x-l.github.io/forkprobe/"
	},
	{
		"f": "Alex-Yanggg/awesome-DSH-plugin",
		"n": "awesome-DSH-plugin",
		"o": "Alex-Yanggg",
		"d": "A meticulously curated list of useful plugins, extensions, tools and development resources built for DSH, covering productivity enhancement, functional expansion, debugging utilities and custom development modules.",
		"s": 65,
		"k": 60,
		"l": "Python",
		"t": [
			"agents",
			"awesome",
			"awesome-list",
			"deepseek",
			"dsh-plugin",
			"plugins"
		],
		"u": "2026-08-16T01:53:54Z",
		"h": "https://github.com/Alex-Yanggg/awesome-DSH-plugin",
		"p": ""
	},
	{
		"f": "Vladimir-Human/ru-marketplace-mcp",
		"n": "ru-marketplace-mcp",
		"o": "Vladimir-Human",
		"d": "Девять российских маркетплейсов и китайский Taobao как MCP-серверы: Wildberries, Ozon, Яндекс Маркет, Детский мир, Авито, Мегамаркет, Lamoda, DNS, Ситилинк. Плюс сравнение цен по всем сразу. Только чтение, ключи не нужны.",
		"s": 63,
		"k": 10,
		"l": "Python",
		"t": [
			"avito",
			"citilink",
			"claude",
			"detmir",
			"dns",
			"dsh-plugin",
			"ecommerce",
			"lamoda",
			"marketplace",
			"mcp",
			"mcp-server",
			"megamarket",
			"ozon",
			"price-comparison",
			"python",
			"russia",
			"scraping",
			"taobao",
			"wildberries",
			"yandex-market"
		],
		"u": "2026-08-16T09:29:50Z",
		"h": "https://github.com/Vladimir-Human/ru-marketplace-mcp",
		"p": "https://github.com/Vladimir-Human/ru-marketplace-mcp/releases/tag/v1.4.1"
	},
	{
		"f": "Anionex/dsh-turn-rewind",
		"n": "dsh-turn-rewind",
		"o": "Anionex",
		"d": "deepseek harness对话和代码状态回退插件 | DSH — rewind conversation and workspace state, powered by a persistent Change Ledger",
		"s": 61,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agent-rewind",
			"cordis-plugin",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"marisa-plugin",
			"restore-point",
			"turn-rewind",
			"workspace-safety"
		],
		"u": "2026-08-16T07:43:37Z",
		"h": "https://github.com/Anionex/dsh-turn-rewind",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh_workflow",
		"n": "dsh_workflow",
		"o": "omdsh-dev",
		"d": "把Claude Code的UltraCode模式带给DSH，把 DSH 的一次性多 Agent 调度，升级为可生成、可保存、可治理、可观察、可恢复的 Workflow 层",
		"s": 61,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-orchestration",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dshtopic",
			"multi-agent",
			"workflow"
		],
		"u": "2026-08-16T05:10:52Z",
		"h": "https://github.com/omdsh-dev/dsh_workflow",
		"p": ""
	},
	{
		"f": "Sanqi-normal/dsh-webui-market-plugin",
		"n": "dsh-webui-market-plugin",
		"o": "Sanqi-normal",
		"d": "dsh Web GUI 社区插件市场：浏览 awesome-dsh-plugin.com 插件目录，一键安装/卸载到 profile。Community plugin market for the DeepSeek Harness (dsh) web GUI: browse, install and uninstall plugins into a profile.",
		"s": 60,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agent-harness",
			"deepseek",
			"dsh-plugin",
			"plugin-market",
			"ui",
			"web"
		],
		"u": "2026-08-16T08:09:55Z",
		"h": "https://github.com/Sanqi-normal/dsh-webui-market-plugin",
		"p": ""
	},
	{
		"f": "Ayase34/gal-view",
		"n": "gal-view",
		"o": "Ayase34",
		"d": "把dsh会话界面切换成galgame游戏界面的插件",
		"s": 59,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:17:47Z",
		"h": "https://github.com/Ayase34/gal-view",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-annotation",
		"n": "dsh-annotation",
		"o": "omdsh-dev",
		"d": "DSH Web 选中批注插件：选文字→批注→回车随消息发送；气泡隐藏批注块（零闪烁）；回复按 Annotation N 逐条对照（可悬浮芯片）。官方 bundle，零核心改动",
		"s": 59,
		"k": 3,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:50:50Z",
		"h": "https://github.com/omdsh-dev/dsh-annotation",
		"p": ""
	},
	{
		"f": "pingfanfan/hello-dsh",
		"n": "hello-dsh",
		"o": "pingfanfan",
		"d": "从零开始，看懂 DeepSeek Harness 的「万物皆可插件」— 零基础插件开发教程（含 22 个中文技能实例）| Zero-to-plugin tutorial for DeepSeek Harness",
		"s": 58,
		"k": 3,
		"l": "Python",
		"t": [
			"ai-agent",
			"chinese",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"tutorial"
		],
		"u": "2026-08-16T09:48:36Z",
		"h": "https://github.com/pingfanfan/hello-dsh",
		"p": "https://github.com/pingfanfan/hello-dsh/blob/main/docs/hello-dsh.md"
	},
	{
		"f": "Lyn-77/ProMentor",
		"n": "ProMentor",
		"o": "Lyn-77",
		"d": "ProMentor 是一个 AI Coding Agent Skill。装上它，你的 AI 编程助手立刻化身为导师——扫描项目架构、生成阶梯式 Chapter、带你手写核心逻辑、自动判题、AI Code Review。",
		"s": 57,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:04:12Z",
		"h": "https://github.com/Lyn-77/ProMentor",
		"p": ""
	},
	{
		"f": "JingbiaoMei/Tokdash",
		"n": "Tokdash",
		"o": "JingbiaoMei",
		"d": "Agent Dashboard: Visualization and analytics for Sessions and Quota Usage. Track, analyze, and optimize token usage across providers with heatmaps, cost tracking, token counting and quota resets..",
		"s": 55,
		"k": 10,
		"l": "Python",
		"t": [
			"agent",
			"analytics",
			"anthropic",
			"claude-code",
			"claude-code-plugin",
			"codex",
			"codex-cli",
			"dashboard",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"kimi-cli",
			"opencode",
			"pi",
			"token-efficiency",
			"token-usage",
			"visualization"
		],
		"u": "2026-08-16T08:06:22Z",
		"h": "https://github.com/JingbiaoMei/Tokdash",
		"p": "https://tokdash.github.io"
	},
	{
		"f": "anysearch-team/anysearch-dsh",
		"n": "anysearch-dsh",
		"o": "anysearch-team",
		"d": "AnySearch web search provider and advanced search tools for DeepSeek Harness (DSH)",
		"s": 54,
		"k": 5,
		"l": "TypeScript",
		"t": [
			"agent-tools",
			"anysearch",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"typescript",
			"web-search"
		],
		"u": "2026-08-16T09:53:32Z",
		"h": "https://github.com/anysearch-team/anysearch-dsh",
		"p": "https://www.anysearch.com"
	},
	{
		"f": "ningbainb/deepseek-harness-desktop",
		"n": "deepseek-harness-desktop",
		"o": "ningbainb",
		"d": "Open-source Windows desktop client and GUI for DeepSeek Harness — zero-setup installer with Codex, plugins, skills, SSH, mobile remote access, and 11 skins.",
		"s": 52,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"ai-coding-assistant",
			"codex",
			"deepseek",
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"electron-app",
			"gui",
			"open-source",
			"plugin-system",
			"plugins",
			"remote-access",
			"skills",
			"ssh-client",
			"windows",
			"windows-desktop"
		],
		"u": "2026-08-16T10:28:06Z",
		"h": "https://github.com/ningbainb/deepseek-harness-desktop",
		"p": "https://ningbainb.github.io/deepseek-harness-desktop/"
	},
	{
		"f": "omdsh-dev/dsh-notification",
		"n": "dsh-notification",
		"o": "omdsh-dev",
		"d": "Desktop notifications for DeepSeek Harness turn completions, with per-outcome controls and include/exclude keyword rules.",
		"s": 52,
		"k": 6,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T07:21:42Z",
		"h": "https://github.com/omdsh-dev/dsh-notification",
		"p": ""
	},
	{
		"f": "PC2005-cloud/dsh-pet",
		"n": "dsh-pet",
		"o": "PC2005-cloud",
		"d": "DSH 桌面宠物：一行命令安装现成宠物（28 个透明动画，即装即用），或内置素材链从 AI 视频自造专属宠物 | One-line install desktop pet for DeepSeek Harness + DIY asset pipeline",
		"s": 51,
		"k": 4,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"desktop-pet",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:51:01Z",
		"h": "https://github.com/PC2005-cloud/dsh-pet",
		"p": ""
	},
	{
		"f": "c3ll256/dsh-toy",
		"n": "dsh-toy",
		"o": "c3ll256",
		"d": "Toy Control Protocol for DSH",
		"s": 51,
		"k": 5,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:39:28Z",
		"h": "https://github.com/c3ll256/dsh-toy",
		"p": ""
	},
	{
		"f": "mishibeikejie/zat-dsh-engine",
		"n": "zat-dsh-engine",
		"o": "mishibeikejie",
		"d": "Visual plugin marketplace for DeepSeek Harness — browse, search and install community plugins",
		"s": 50,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:18:12Z",
		"h": "https://github.com/mishibeikejie/zat-dsh-engine",
		"p": ""
	},
	{
		"f": "oil-oil/dsh-vision",
		"n": "dsh-vision",
		"o": "oil-oil",
		"d": "Near-native image understanding for DeepSeek Harness",
		"s": 49,
		"k": 5,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"image-understanding",
			"multimodal",
			"vision"
		],
		"u": "2026-08-16T10:22:06Z",
		"h": "https://github.com/oil-oil/dsh-vision",
		"p": ""
	},
	{
		"f": "morluto/jacobian",
		"n": "jacobian",
		"o": "morluto",
		"d": "Pure mathematics for agents: search for examples and counterexamples, compute exactly, and independently check what a result proves.",
		"s": 48,
		"k": 9,
		"l": "Python",
		"t": [
			"ai-agents",
			"automated-theorem-proving",
			"computer-algebra",
			"cordis",
			"dsh",
			"dsh-plugin",
			"formal-methods",
			"formal-verification",
			"lean4",
			"math",
			"mcp",
			"mcp-server",
			"model-context-protocol",
			"proof-assistant",
			"python",
			"smt-solver",
			"symbolic-math",
			"sympy",
			"theorem-proving",
			"z3"
		],
		"u": "2026-08-16T09:53:08Z",
		"h": "https://github.com/morluto/jacobian",
		"p": ""
	},
	{
		"f": "fwerkor/local-shell-mcp",
		"n": "local-shell-mcp",
		"o": "fwerkor",
		"d": "Enables LLM to use a cli environment. ",
		"s": 48,
		"k": 9,
		"l": "Python",
		"t": [
			"chatgpt-app",
			"dsh-plugin",
			"harness",
			"mcp",
			"remote-control"
		],
		"u": "2026-08-16T10:20:18Z",
		"h": "https://github.com/fwerkor/local-shell-mcp",
		"p": "https://fwerkor.github.io/local-shell-mcp/"
	},
	{
		"f": "LX2000WASD/dsh-web-plugin-manager",
		"n": "dsh-web-plugin-manager",
		"o": "LX2000WASD",
		"d": "在 Web UI 中一键管理 DeepSeek Harness (DSH) 插件：查看、实时启停、安装/卸载、更新检测、健康检查（依赖/冲突/兼容性分析）、环境管理、插件市场。bundle 与非 bundle 插件全覆盖",
		"s": 48,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:43:02Z",
		"h": "https://github.com/LX2000WASD/dsh-web-plugin-manager",
		"p": ""
	},
	{
		"f": "LaplaceYoung/oh-my-dsh",
		"n": "oh-my-dsh",
		"o": "LaplaceYoung",
		"d": "oh-my-dsh：面向 DSH (DeepSeek Harness) 的插件生态——700+ 插件，只通过扩展接缝注册，不修改 agent-loop 骨架",
		"s": 48,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek-harness",
			"dsh-ecosystem",
			"dsh-plugin",
			"oh-my-dsh"
		],
		"u": "2026-08-16T09:36:39Z",
		"h": "https://github.com/LaplaceYoung/oh-my-dsh",
		"p": ""
	},
	{
		"f": "vlln/plugin-registry",
		"n": "plugin-registry",
		"o": "vlln",
		"d": "DSH 插件生态基建：薄控制台（浏览器面板管理官方 repository 插件，0 patch）+ make-dsh-plugin skill 官方插件开发引导",
		"s": 47,
		"k": 5,
		"l": "TypeScript",
		"t": [
			"console",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-repository-plugin",
			"plugin-management",
			"ui"
		],
		"u": "2026-08-16T09:48:37Z",
		"h": "https://github.com/vlln/plugin-registry",
		"p": ""
	},
	{
		"f": "xiincs/deepseek-harness-desktop",
		"n": "deepseek-harness-desktop",
		"o": "xiincs",
		"d": "DeepSeek Harness 原生桌面版，基于 Tauri 2，内置 Node.js 运行时，一键安装，极速启动，托盘常驻，自动更新。DeepSeek Harness native desktop version: built on Tauri 2 with a bundled Node.js runtime.",
		"s": 46,
		"k": 5,
		"l": "Rust",
		"t": [
			"agent",
			"ai-agent",
			"deepseek",
			"deepseek-harness",
			"desktop",
			"dsh-plugin",
			"rust",
			"tauri",
			"windows"
		],
		"u": "2026-08-16T09:28:54Z",
		"h": "https://github.com/xiincs/deepseek-harness-desktop",
		"p": ""
	},
	{
		"f": "bowenliang123/dsh-context",
		"n": "dsh-context",
		"o": "bowenliang123",
		"d": "A DeepSeek Harness plugin for  Context insight dashboard — showing what the model's context window is made of and how it evolves.",
		"s": 46,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh-external",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:26:26Z",
		"h": "https://github.com/bowenliang123/dsh-context",
		"p": "https://www.npmjs.com/package/dsh-context"
	},
	{
		"f": "ZASENJC/dsh-plugins-store",
		"n": "dsh-plugins-store",
		"o": "ZASENJC",
		"d": "自动分类、收录和验证 DeepSeek-Harness 社区插件市场。 Automatically categorize, curate, and validate the DeepSeek-Harness community plugin marketplace.",
		"s": 46,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"agent-tools",
			"awesome-list",
			"community-project",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:00:20Z",
		"h": "https://github.com/ZASENJC/dsh-plugins-store",
		"p": "https://dsh.aitreez.com"
	},
	{
		"f": "btspoony/mstar-harness",
		"n": "mstar-harness",
		"o": "btspoony",
		"d": "A Skill-driven Harness/Loop Engineering Workflow Agent Plugin",
		"s": 46,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"cursor-plugin",
			"dsh-plugin",
			"harness-engineering",
			"knowledge-management",
			"omp-plugin",
			"opencode-plugin",
			"sdd",
			"spec-driven",
			"subagents"
		],
		"u": "2026-08-16T09:00:05Z",
		"h": "https://github.com/btspoony/mstar-harness",
		"p": ""
	},
	{
		"f": "beancookie/awesome-dsh-plugin",
		"n": "awesome-dsh-plugin",
		"o": "beancookie",
		"d": "Awesome DeepSeek Harness (DSH) Plugin",
		"s": 46,
		"k": 29,
		"l": "HTML",
		"t": [
			"awesome",
			"awesome-list",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:01:55Z",
		"h": "https://github.com/beancookie/awesome-dsh-plugin",
		"p": "https://beancookie.github.io/awesome-dsh-plugin/"
	},
	{
		"f": "omdsh-dev/dsh-open-in-vscode",
		"n": "dsh-open-in-vscode",
		"o": "omdsh-dev",
		"d": "Open DeepSeek Harness workspace directories in VS Code directly from the web GUI.",
		"s": 45,
		"k": 5,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:52:41Z",
		"h": "https://github.com/omdsh-dev/dsh-open-in-vscode",
		"p": ""
	},
	{
		"f": "tencent-connect/dsh-qqbot",
		"n": "dsh-qqbot",
		"o": "tencent-connect",
		"d": "让 QQ Bot 接入 DeepSeek Harness（dsh）的官方插件",
		"s": 44,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"qqbot"
		],
		"u": "2026-08-16T10:19:40Z",
		"h": "https://github.com/tencent-connect/dsh-qqbot",
		"p": ""
	},
	{
		"f": "titanwings/dsh-automation",
		"n": "dsh-automation",
		"o": "titanwings",
		"d": "DSH 自动化插件：让 Coding 任务按计划在全新 Agent Session 中运行，并由用户或 Agent 创建和管理定时任务。 / Run coding tasks in fresh Agent sessions and manage schedules from DSH Web or an Agent.",
		"s": 44,
		"k": 5,
		"l": "TypeScript",
		"t": [
			"automation",
			"coding-agent",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"scheduled-tasks"
		],
		"u": "2026-08-16T07:06:21Z",
		"h": "https://github.com/titanwings/dsh-automation",
		"p": ""
	},
	{
		"f": "kelai141/dsh-mobile-apk",
		"n": "dsh-mobile-apk",
		"o": "kelai141",
		"d": "dsh 安卓壳 APK——WebView UI + 内嵌 Termux 运行时快照（解压即跑）、SAF 目录桥、保活服务、看门狗、运行时在线更新。",
		"s": 44,
		"k": 9,
		"l": "Kotlin",
		"t": [
			"android",
			"dsh-plugin",
			"kotlin",
			"termux",
			"webview"
		],
		"u": "2026-08-16T10:26:27Z",
		"h": "https://github.com/kelai141/dsh-mobile-apk",
		"p": ""
	},
	{
		"f": "QCYTSN/dsh-dafeiyu",
		"n": "dsh-dafeiyu",
		"o": "QCYTSN",
		"d": "Desktop-native BigFish companion for DeepSeek Harness — real Agent status, always on top on Windows.",
		"s": 44,
		"k": 7,
		"l": "JavaScript",
		"t": [
			"agent-companion",
			"deepseek-harness",
			"desktop-pet",
			"dsh-plugin",
			"windows"
		],
		"u": "2026-08-16T09:51:14Z",
		"h": "https://github.com/QCYTSN/dsh-dafeiyu",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-mnemon",
		"n": "dsh-mnemon",
		"o": "omdsh-dev",
		"d": "Cross-agent, local-first persistent memory plugin for DeepSeek Harness (DSH), powered by Mnemon. It shares long-term memory across Mnemon-enabled agents and adds runtime memory, searchable project documents, semantic recall, knowledge graph, and a Sidebar UI.",
		"s": 43,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"agent-memory",
			"cross-agent-memory",
			"deepseek-harness",
			"document-search",
			"dsh",
			"dsh-plugin",
			"knowledge-graph",
			"llm-agent",
			"local-first",
			"long-term-memory",
			"memory-plugin",
			"memory-system",
			"mnemon",
			"multi-agent-memory",
			"persistent-memory",
			"project-documents",
			"runtime-memory",
			"semantic-recall",
			"shared-agent-memory",
			"workspace-memory"
		],
		"u": "2026-08-16T09:22:21Z",
		"h": "https://github.com/omdsh-dev/dsh-mnemon",
		"p": "https://github.com/omdsh-dev/dsh-mnemon#readme"
	},
	{
		"f": "bruc3van/dsh-desktop",
		"n": "dsh-desktop",
		"o": "bruc3van",
		"d": "让 Agent 安全常驻桌面的独立 dsh 客户端：官方 Web UI 原封不动，长任务常驻托盘，精选插件先审查、再安装。 ｜ Independent dsh desktop client: the official Web UI untouched, long tasks alive in the tray, curated plugins reviewed before install.",
		"s": 42,
		"k": 8,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-desktop",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:21:55Z",
		"h": "https://github.com/bruc3van/dsh-desktop",
		"p": "https://x.com/bruc3van"
	},
	{
		"f": "wess09/DeepSeekHarnessDesktop",
		"n": "DeepSeekHarnessDesktop",
		"o": "wess09",
		"d": "DeepSeekHarness桌面端打包",
		"s": 42,
		"k": 7,
		"l": "JavaScript",
		"t": [
			"deepseekharnessdesktop",
			"desktop",
			"desktop-app",
			"desktop-application",
			"desktop-tools",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T08:47:19Z",
		"h": "https://github.com/wess09/DeepSeekHarnessDesktop",
		"p": ""
	},
	{
		"f": "Nwflower/dsh-chat-import",
		"n": "dsh-chat-import",
		"o": "Nwflower",
		"d": "从Claude Code、Codex、Reasonix等Agent工具导入迁移历史消息，并在DeepSeek Harness(DSH)中继续对话",
		"s": 42,
		"k": 8,
		"l": "JavaScript",
		"t": [
			"agent",
			"ai-agents",
			"automation",
			"chatgpt",
			"claude-code",
			"codex",
			"cursor",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"gemini",
			"import",
			"jsonl",
			"migration",
			"openai",
			"plugin",
			"sessions",
			"transcript"
		],
		"u": "2026-08-16T10:21:01Z",
		"h": "https://github.com/Nwflower/dsh-chat-import",
		"p": ""
	},
	{
		"f": "Han-1413141/dsh-cost-meter",
		"n": "dsh-cost-meter",
		"o": "Han-1413141",
		"d": "DeepSeek Harness 会话费用统计与opencode go额度显示，类codex token热力图插件:本会话费用、当日费用、预算费用显示、历史记录与官方价格同步",
		"s": 42,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"cost-tracking",
			"deepseek",
			"deepseek-api",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"harness",
			"llm",
			"plugins",
			"token-usage"
		],
		"u": "2026-08-16T09:57:00Z",
		"h": "https://github.com/Han-1413141/dsh-cost-meter",
		"p": ""
	},
	{
		"f": "liyupi/dsh-kun-like-pet",
		"n": "dsh-kun-like-pet",
		"o": "liyupi",
		"d": "Kun Like 桌宠 —— DeepSeek Harness 桌面宠物插件：右下角小坤宠随 Agent 工作状态切换 9 种动作，任务完成播放「你干嘛~哎哟」",
		"s": 41,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"desktop-pet",
			"dsh",
			"dsh-plugin",
			"ikun",
			"plugin"
		],
		"u": "2026-08-16T07:22:56Z",
		"h": "https://github.com/liyupi/dsh-kun-like-pet",
		"p": ""
	},
	{
		"f": "Devin-AXIS/deepseek-design",
		"n": "deepseek-design",
		"o": "Devin-AXIS",
		"d": "DeepSeek Harness 可编辑设计系统：AI 生成、可视化编辑、模板市场与 PPT｜Native Design & PPT Studio for DeepSeek Harness.",
		"s": 41,
		"k": 11,
		"l": "JavaScript",
		"t": [
			"ai-design",
			"deepseek",
			"deepseek-harness",
			"design",
			"design-studio",
			"dsh-plugin",
			"ipollowork",
			"plugin",
			"ppt",
			"presentation",
			"prototyping",
			"visual-editor"
		],
		"u": "2026-08-16T10:05:13Z",
		"h": "https://github.com/Devin-AXIS/deepseek-design",
		"p": "https://github.com/Devin-AXIS/iPolloWork"
	},
	{
		"f": "Ychris12138/dsh-usage-stats",
		"n": "dsh-usage-stats",
		"o": "Ychris12138",
		"d": "Token usage heatmap, per-model breakdowns, and DeepSeek account balance for the DeepSeek Harness Web GUI (dsh web).",
		"s": 41,
		"k": 5,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugin-dev",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:05:50Z",
		"h": "https://github.com/Ychris12138/dsh-usage-stats",
		"p": ""
	},
	{
		"f": "Fishquito7/dsh-skill-viewer",
		"n": "dsh-skill-viewer",
		"o": "Fishquito7",
		"d": "DSH Web UI plugin: Skills settings section with hot enable/disable, delete and add（Web界面的skill管理工具）",
		"s": 40,
		"k": 5,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"dsh",
			"dsh-plugin",
			"plugin",
			"skills"
		],
		"u": "2026-08-16T07:10:41Z",
		"h": "https://github.com/Fishquito7/dsh-skill-viewer",
		"p": ""
	},
	{
		"f": "edonadei/caliper",
		"n": "caliper",
		"o": "edonadei",
		"d": "Know if your agent skill actually works. A lightweight evaluation harness that tracks a success rate across Claude Code, Codex, Pi, and Hermes.",
		"s": 39,
		"k": 5,
		"l": "Python",
		"t": [
			"ai-agents",
			"claude-code",
			"cli",
			"codex",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"evals",
			"evaluation",
			"hermes",
			"hermes-agent",
			"hermes-skill",
			"pi",
			"reliability",
			"skills"
		],
		"u": "2026-08-16T00:18:13Z",
		"h": "https://github.com/edonadei/caliper",
		"p": "https://pypi.org/project/caliper-eval/"
	},
	{
		"f": "like-study1/Oh-My-DSH",
		"n": "Oh-My-DSH",
		"o": "like-study1",
		"d": "🐳 DeepSeek Harness 插件聚合社区 — 自动同步 dsh-plugin 生态 · 精选目录 · 每 4 小时自动维护 | Oh-My-DSH: a community-maintained catalog of DeepSeek Harness plugins, auto-synced from the dsh-plugin topic",
		"s": 39,
		"k": 10,
		"l": "Python",
		"t": [
			"awesome-deepseek-harness",
			"awesome-dsh-plugin",
			"awesome-list",
			"deepseek-harness",
			"dsh",
			"dsh-ecosystem",
			"dsh-plugin",
			"plugin-marketplace",
			"plugins"
		],
		"u": "2026-08-16T10:20:50Z",
		"h": "https://github.com/like-study1/Oh-My-DSH",
		"p": "https://like-study1.github.io/Oh-My-DSH/"
	},
	{
		"f": "HeiGeAi/deepseek-harness-skin",
		"n": "deepseek-harness-skin",
		"o": "HeiGeAi",
		"d": "DeepSeek Harness 换肤系统：21 套内置皮肤 + 一张图生成整套配色的自定义皮肤。数据源驱动，保对比度推导，构建期校验可读性。",
		"s": 38,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"css",
			"dark-mode",
			"deepseek-harness",
			"dsh-plugin",
			"skin",
			"theme",
			"ui-theme"
		],
		"u": "2026-08-16T09:02:01Z",
		"h": "https://github.com/HeiGeAi/deepseek-harness-skin",
		"p": ""
	},
	{
		"f": "HanaAyane/dsh-reasoning-effort",
		"n": "dsh-reasoning-effort",
		"o": "HanaAyane",
		"d": "DSH适用的Codex风格的思考强度滑块，以及大肥鱼跑步滑块。Codex-style model and reasoning-effort slider for DeepSeek Harness",
		"s": 38,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"reasoning-effort"
		],
		"u": "2026-08-16T10:29:11Z",
		"h": "https://github.com/HanaAyane/dsh-reasoning-effort",
		"p": ""
	},
	{
		"f": "kingOfSoySauce/dsh-liang-skin",
		"n": "dsh-liang-skin",
		"o": "kingOfSoySauce",
		"d": "DeepSeek Harness 滑动变阻器皮肤",
		"s": 38,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:49:28Z",
		"h": "https://github.com/kingOfSoySauce/dsh-liang-skin",
		"p": ""
	},
	{
		"f": "LayneChai/superpowers-dsh",
		"n": "superpowers-dsh",
		"o": "LayneChai",
		"d": "Superpowers skills for DeepSeek Harness: TDD, debugging, planning, and collaboration skills adapted from obra/superpowers",
		"s": 38,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"skills",
			"superpowers"
		],
		"u": "2026-08-16T08:45:05Z",
		"h": "https://github.com/LayneChai/superpowers-dsh",
		"p": ""
	},
	{
		"f": "multica-ai/dsh-multica-runtime",
		"n": "dsh-multica-runtime",
		"o": "multica-ai",
		"d": "Support dsh runtime on Multica.",
		"s": 38,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T07:10:22Z",
		"h": "https://github.com/multica-ai/dsh-multica-runtime",
		"p": ""
	},
	{
		"f": "lire1131/dsh-undo-plugin",
		"n": "dsh-undo-plugin",
		"o": "lire1131",
		"d": "DSH crash-rescue plugin: undo config & plugin-code changes, secret-safe snapshots, one-click SAFE MODE, plus offline CLI/GUI that work even when DSH won't boot.",
		"s": 37,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"rollback",
			"snapshot",
			"undo"
		],
		"u": "2026-08-16T10:26:18Z",
		"h": "https://github.com/lire1131/dsh-undo-plugin",
		"p": ""
	},
	{
		"f": "hanelalo/browser-bridge",
		"n": "browser-bridge",
		"o": "hanelalo",
		"d": "让你的agent真的像你一样操控你的浏览器窗口",
		"s": 36,
		"k": 5,
		"l": "Rust",
		"t": [
			"dsh",
			"dsh-plugin",
			"mcp"
		],
		"u": "2026-08-15T03:14:41Z",
		"h": "https://github.com/hanelalo/browser-bridge",
		"p": ""
	},
	{
		"f": "whyihaveyou/dsh-suite",
		"n": "dsh-suite",
		"o": "whyihaveyou",
		"d": "The living DeepSeek Harness plugin directory — refreshed hourly, compat-tested daily, with an in-app plugin store and scaffolder. DSH 插件活目录：每小时刷新，每日兼容实测，内置插件商店与脚手架。",
		"s": 35,
		"k": 4,
		"l": "HTML",
		"t": [
			"agent-framework",
			"awesome-list",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"plugins",
			"scaffold"
		],
		"u": "2026-08-16T10:18:18Z",
		"h": "https://github.com/whyihaveyou/dsh-suite",
		"p": "https://whyihaveyou.github.io/dsh-suite/"
	},
	{
		"f": "morluto/flameox",
		"n": "flameox",
		"o": "morluto",
		"d": "Runtime evidence that helps agents trace, profile, and burn down hotspots in application and native code, GPU kernels, and inference stacks.",
		"s": 34,
		"k": 1,
		"l": "Python",
		"t": [
			"benchmarking",
			"coding-agents",
			"cordis",
			"debugging",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"gpu-profiling",
			"local-first",
			"mcp",
			"mcp-server",
			"model-context-protocol",
			"performance",
			"performance-analysis",
			"performance-engineering",
			"performance-regression",
			"profiler",
			"profiling",
			"python",
			"runtime-analysis"
		],
		"u": "2026-08-15T11:05:41Z",
		"h": "https://github.com/morluto/flameox",
		"p": ""
	},
	{
		"f": "alingalingling/ui-status-label",
		"n": "ui-status-label",
		"o": "alingalingling",
		"d": "把你鲸鱼娘思考时的 deep diving 自定义成任意你想要的样子",
		"s": 34,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:52:39Z",
		"h": "https://github.com/alingalingling/ui-status-label",
		"p": ""
	},
	{
		"f": "awesome-dsh-plugin/dsh-find-plugin",
		"n": "dsh-find-plugin",
		"o": "awesome-dsh-plugin",
		"d": "Find DSH plugins inside the agent — live GitHub dsh-plugin topic search, star-ranked / 会话内搜索发现 DSH 插件",
		"s": 33,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:55:34Z",
		"h": "https://github.com/awesome-dsh-plugin/dsh-find-plugin",
		"p": ""
	},
	{
		"f": "yuukiLike/zeromd",
		"n": "zeromd",
		"o": "yuukiLike",
		"d": "Obsidian 零成本同步：iPhone ↔ Mac，GitHub 自动备份。本地优先 + 长期积累。｜Local First. Zero-cost Obsidian sync across iPhone, Mac & GitHub. Let knowledge grow over time.",
		"s": 33,
		"k": 1,
		"l": "Shell",
		"t": [
			"dsh-plugin",
			"git-backup",
			"local-first",
			"macos",
			"markdown",
			"obsidian"
		],
		"u": "2026-08-15T22:48:54Z",
		"h": "https://github.com/yuukiLike/zeromd",
		"p": ""
	},
	{
		"f": "Tabbit-Browser/dsh-plugin",
		"n": "dsh-plugin",
		"o": "Tabbit-Browser",
		"d": "Tabbit Broser plugins for Deepseek Harness",
		"s": 32,
		"k": 5,
		"l": "JavaScript",
		"t": [
			"browser-automation",
			"browser-use",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins",
			"playwright",
			"tabbit"
		],
		"u": "2026-08-16T09:33:45Z",
		"h": "https://github.com/Tabbit-Browser/dsh-plugin",
		"p": "https://www.tabbit.ai"
	},
	{
		"f": "dancingmemory/dskin",
		"n": "dskin",
		"o": "dancingmemory",
		"d": "DSKIN · DeepSeek Harness（DSH）卡通像素皮肤插件 / Cartoon pixel skin plugin for DSH Web GUI — 原始界面不动，像素宠物会散步、眨眼、跳跃 / living pixel pets that stroll, blink and hop",
		"s": 32,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cartoon",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"pixel-art",
			"skin",
			"theme",
			"ui-skin"
		],
		"u": "2026-08-16T08:20:48Z",
		"h": "https://github.com/dancingmemory/dskin",
		"p": "https://github.com/topics/dsh-plugin"
	},
	{
		"f": "Yts1919/dsh-vision-complete",
		"n": "dsh-vision-complete",
		"o": "Yts1919",
		"d": "给 DeepSeek 补上「眼睛和耳朵」的多模态视觉插件：看图 / OCR / 物体检测 / 视频理解 / 语音转写 / 截图直读，一键安装（DSH 插件）。",
		"s": 31,
		"k": 2,
		"l": "PowerShell",
		"t": [
			"dashscope",
			"deepseek",
			"dsh-plugin",
			"mcp",
			"multimodal",
			"ocr",
			"qwen",
			"vision"
		],
		"u": "2026-08-16T09:02:40Z",
		"h": "https://github.com/Yts1919/dsh-vision-complete",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-data-agent",
		"n": "dsh-data-agent",
		"o": "omdsh-dev",
		"d": "Connect DSH to your database for conversational data analysis and actionable business insights.",
		"s": 30,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"data-agent",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:45:14Z",
		"h": "https://github.com/omdsh-dev/dsh-data-agent",
		"p": ""
	},
	{
		"f": "ChangedenCZD/dsh-minimal-turbo",
		"n": "dsh-minimal-turbo",
		"o": "ChangedenCZD",
		"d": "Deepseek Harness 极简模式 Windows适配，享用满血Deepseek-V4系列模型",
		"s": 30,
		"k": 1,
		"l": "HTML",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-v4",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:24:48Z",
		"h": "https://github.com/ChangedenCZD/dsh-minimal-turbo",
		"p": ""
	},
	{
		"f": "lhh010/dsh-ui-whale",
		"n": "dsh-ui-whale",
		"o": "lhh010",
		"d": "【求⭐】🐋DSH Web UI 全手绘像素鲸鱼伙伴插件：会话标题栏常驻，平时眨眼/偶尔摆尾/动胸鳍，思考运行时持续动起来，回合完成头顶喷水，点击还会冒爱心，不工作时还会偷懒睡觉，零核心改动。 【喜欢的话就点点star⭐吧~】",
		"s": 29,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:40:31Z",
		"h": "https://github.com/lhh010/dsh-ui-whale",
		"p": ""
	},
	{
		"f": "whiteguo233/dsh-openbiliclaw",
		"n": "dsh-openbiliclaw",
		"o": "whiteguo233",
		"d": "OpenBiliClaw 是本地运行的跨平台个性化内容推荐 Agent，持续理解你的兴趣并主动找内容。本仓库是它的 DeepSeek Harness 插件：DSH 界面常驻第四栏（推荐/内容库/对话/画像/设置），注册 22 个 Agent Bridge 工具，让 Agent 也能读推荐、答探测、闭环学习。",
		"s": 29,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"agent-bridge",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"openbiliclaw"
		],
		"u": "2026-08-16T06:45:12Z",
		"h": "https://github.com/whiteguo233/dsh-openbiliclaw",
		"p": ""
	},
	{
		"f": "Inference1/clarify-intent-and-establish-shared-understanding",
		"n": "clarify-intent-and-establish-shared-understanding",
		"o": "Inference1",
		"d": "Systematically clarify intent, challenge assumptions, resolve contradictions, and align goals, constraints, risks, and success criteria.",
		"s": 29,
		"k": 0,
		"l": "",
		"t": [
			"agent-skill",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:32:08Z",
		"h": "https://github.com/Inference1/clarify-intent-and-establish-shared-understanding",
		"p": ""
	},
	{
		"f": "openma-ai/deepseek-harness-tui",
		"n": "deepseek-harness-tui",
		"o": "openma-ai",
		"d": "TUI Plugin of DeepSeek Harness 让DeepSeek Harness在终端跑起来",
		"s": 29,
		"k": 3,
		"l": "Rust",
		"t": [
			"agent",
			"agents",
			"dsh-plugin",
			"dsh-plugins",
			"tui",
			"tui-rs"
		],
		"u": "2026-08-16T09:34:56Z",
		"h": "https://github.com/openma-ai/deepseek-harness-tui",
		"p": ""
	},
	{
		"f": "Noob-stupid/dsh-plugin-hub",
		"n": "dsh-plugin-hub",
		"o": "Noob-stupid",
		"d": "DeepSeek Harness (DSH) 插件管理面板：一键启用/停用插件 + GitHub dsh-plugin 插件市场，带插件详情与一键安装 | Plugin manager & marketplace for DeepSeek Harness",
		"s": 29,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"github",
			"help-wanted",
			"plugin-manager",
			"plugin-market"
		],
		"u": "2026-08-16T10:21:05Z",
		"h": "https://github.com/Noob-stupid/dsh-plugin-hub",
		"p": ""
	},
	{
		"f": "Chinesezjc/dsh-interconnect",
		"n": "dsh-interconnect",
		"o": "Chinesezjc",
		"d": "Cross-instance message/event handoff plugins for DSH (interconnect service + tools)",
		"s": 28,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"interconnect"
		],
		"u": "2026-08-16T03:13:41Z",
		"h": "https://github.com/Chinesezjc/dsh-interconnect",
		"p": ""
	},
	{
		"f": "william-jin-cmu/dsh-vision",
		"n": "dsh-vision",
		"o": "william-jin-cmu",
		"d": "dsh 插件：给纯文本 DeepSeek 加视觉——view_image 工具桥接任意 OpenAI 兼容 VLM（默认智谱免费档，实测 4 厂商 10 模型）",
		"s": 28,
		"k": 4,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:12:58Z",
		"h": "https://github.com/william-jin-cmu/dsh-vision",
		"p": ""
	},
	{
		"f": "zenx0x/allinluna",
		"n": "allinluna",
		"o": "zenx0x",
		"d": "Resource-aware multi-agent orchestration for Codex and DeepSeek Harness (All in Flash DSH plugin)",
		"s": 28,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-orchestration",
			"agent-skills",
			"ai-agents",
			"allinflash",
			"codex",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"luna",
			"multi-agent",
			"orchestration"
		],
		"u": "2026-08-15T11:06:31Z",
		"h": "https://github.com/zenx0x/allinluna",
		"p": ""
	},
	{
		"f": "openguardrails/openguardrails",
		"n": "openguardrails",
		"o": "openguardrails",
		"d": "The vendor-neutral protocol for AI agent safety & security — and the neutral benchmark that ranks the vendors.",
		"s": 27,
		"k": 6,
		"l": "Python",
		"t": [
			"agents",
			"ai-safety",
			"ai-security",
			"dsh-plugin",
			"guardrails",
			"llm",
			"prompt-injection",
			"protocol",
			"specification"
		],
		"u": "2026-08-15T22:48:55Z",
		"h": "https://github.com/openguardrails/openguardrails",
		"p": "https://openguardrails.com"
	},
	{
		"f": "THEWOLFWALKER/dsh-notifier",
		"n": "dsh-notifier",
		"o": "THEWOLFWALKER",
		"d": "Unified notification push plugin for DeepSeek Harness (DSH): one minimal notify() API, 8 channel adapters (telegram/dingtalk/feishu/wxpusher/pushplus/serverchan/bark/webhook), dual trigger (auto session events + agent tool).",
		"s": 27,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:56:05Z",
		"h": "https://github.com/THEWOLFWALKER/dsh-notifier",
		"p": ""
	},
	{
		"f": "WeirdSky924/agent-handoff-skill",
		"n": "agent-handoff-skill",
		"o": "WeirdSky924",
		"d": "Use this cross-platform skill in Codex or Claude Code to establish repository-local continuity memory so a future agent can recover objective, status, decisions, validation, risks, and next actions without relying on previous chat history.",
		"s": 26,
		"k": 3,
		"l": "Python",
		"t": [
			"agent-handoff",
			"agent-skills",
			"claude-code",
			"codex",
			"context-engineering",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"session-memory"
		],
		"u": "2026-08-15T11:07:06Z",
		"h": "https://github.com/WeirdSky924/agent-handoff-skill",
		"p": ""
	},
	{
		"f": "zuorn/Tydora",
		"n": "Tydora",
		"o": "zuorn",
		"d": "Let Your Ideas Flow — Tydora is a modern desktop Markdown editor combining WYSIWYG editing, bidirectional links, mind maps, and an infinite canvas — empowering deep thinking and effortless expression.",
		"s": 26,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"canvas",
			"dsh-plugin",
			"markdown",
			"markdown-converter",
			"markdown-editor",
			"markdown-it",
			"markdown-lang",
			"markdown-language",
			"markdown-parser",
			"markdown-to-html",
			"markdown-to-pdf",
			"markdown-viewer",
			"mindmap",
			"obsidan",
			"tydora"
		],
		"u": "2026-08-16T08:22:08Z",
		"h": "https://github.com/zuorn/Tydora",
		"p": "https://zuorn.github.io/Tydora/"
	},
	{
		"f": "HuanLinOTO/dsh-plugin-mineru",
		"n": "dsh-plugin-mineru",
		"o": "HuanLinOTO",
		"d": "向模型暴露 MinerU 文档解析工具，将 PDF/图片/DOCX/PPTX/XLSX 转为结构化 Markdown/JSON | Exposes MinerU document-parsing tools to the model, converting PDF/images/DOCX/PPTX/XLSX into structured Markdown/JSON",
		"s": 26,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:33:14Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-mineru",
		"p": ""
	},
	{
		"f": "vlln/dsh-navbar",
		"n": "dsh-navbar",
		"o": "vlln",
		"d": "DSH 插件：对话节点导航条（右缘节点串快速跳转 user 消息）。官方 bundle 插件，dsh plugin --profile web add 安装",
		"s": 26,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"plugin",
			"ui"
		],
		"u": "2026-08-16T10:26:29Z",
		"h": "https://github.com/vlln/dsh-navbar",
		"p": ""
	},
	{
		"f": "Awu12277/dsh-stock-watch",
		"n": "dsh-stock-watch",
		"o": "Awu12277",
		"d": "A股自选股实时行情盯盘插件 - DeepSeek Harness Web 右上角可折叠弹窗",
		"s": 25,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"plugin",
			"stock",
			"stock-market"
		],
		"u": "2026-08-16T08:56:11Z",
		"h": "https://github.com/Awu12277/dsh-stock-watch",
		"p": ""
	},
	{
		"f": "tianji-qingtian/dsh-model-router",
		"n": "dsh-model-router",
		"o": "tianji-qingtian",
		"d": "模型路由与成本优化器：简单问题 flash 直答、故障自动降级、会话 token/缓存/成本实时面板 | Model router & cost optimizer for DeepSeek Harness: flash quick-answers for simple questions, failure fallback, live token/cache/cost panel",
		"s": 25,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"model-router"
		],
		"u": "2026-08-16T08:49:48Z",
		"h": "https://github.com/tianji-qingtian/dsh-model-router",
		"p": ""
	},
	{
		"f": "cpj-dev/dsh-plugin-cc",
		"n": "dsh-plugin-cc",
		"o": "cpj-dev",
		"d": "Bridge Deepseek-harness into Claude Code for review, critique, delegation, and session import.",
		"s": 25,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"claude-code",
			"claude-code-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:05:25Z",
		"h": "https://github.com/cpj-dev/dsh-plugin-cc",
		"p": ""
	},
	{
		"f": "keleus/deepseek-pet",
		"n": "deepseek-pet",
		"o": "keleus",
		"d": "在你的deepseek-harness上养一只吃白饭的大蓝鲸",
		"s": 25,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:24:14Z",
		"h": "https://github.com/keleus/deepseek-pet",
		"p": ""
	},
	{
		"f": "Moeblack/dsh-message-edit",
		"n": "dsh-message-edit",
		"o": "Moeblack",
		"d": "DSH 插件：分支式消息编辑、重掷、重试与版本时间线 | DSH plugin: branch-based message editing, reroll, retry, version timeline",
		"s": 24,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:47:57Z",
		"h": "https://github.com/Moeblack/dsh-message-edit",
		"p": ""
	},
	{
		"f": "kuangre123/iosdev",
		"n": "iosdev",
		"o": "kuangre123",
		"d": "ios app 开发 skill",
		"s": 24,
		"k": 1,
		"l": "",
		"t": [
			"app",
			"apple",
			"apple-intelligence",
			"apple-watch",
			"dsh-plugin",
			"dsh-plugins",
			"ios",
			"mac",
			"macos",
			"swift"
		],
		"u": "2026-08-14T11:37:11Z",
		"h": "https://github.com/kuangre123/iosdev",
		"p": ""
	},
	{
		"f": "834063245-creator/HoloGram",
		"n": "HoloGram",
		"o": "834063245-creator",
		"d": "3D code dependency graph generator with built-in LLM agent. Language-agnostic (Python, TypeScript, Rust, Go, Java, C/C++, C#, Ruby, Kotlin, Swift, PHP, Lua). Coupling depth analysis, constraint gating, real-time file watching. Tauri 2 + Three.js + Rust engine.跨语言代码依赖拓扑图生成器 · 14 门语言统一 IR · 3D 全息星图 · 内置 AI Agent 双向联动 · 四级耦合诊断 · 桌面应用 / CLI 双模",
		"s": 24,
		"k": 1,
		"l": "Rust",
		"t": [
			"code-analysis-true",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:14:23Z",
		"h": "https://github.com/834063245-creator/HoloGram",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-custom-tool",
		"n": "dsh-custom-tool",
		"o": "omdsh-dev",
		"d": "Create and manage sandboxed JavaScript tools for DeepSeek Harness with a Monaco editor and model-driven tool lifecycle.",
		"s": 24,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T05:24:40Z",
		"h": "https://github.com/omdsh-dev/dsh-custom-tool",
		"p": ""
	},
	{
		"f": "yyyyukari/dsh-plugin-workshop",
		"n": "dsh-plugin-workshop",
		"o": "yyyyukari",
		"d": "Steam Workshop-style plugin browser for the DeepSeek Harness (DSH) Web UI - zero-server: GitHub-powered search, trending windows, Chinese search & bilingual translation, plugin-signature filtering, and smart one-click install/update/uninstall with an installed-plugins manager.",
		"s": 24,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"workshop"
		],
		"u": "2026-08-16T05:55:33Z",
		"h": "https://github.com/yyyyukari/dsh-plugin-workshop",
		"p": ""
	},
	{
		"f": "whitelonng/dshcode",
		"n": "dshcode",
		"o": "whitelonng",
		"d": "Community desktop companion for DeepSeek Harness — one-click Electron app for macOS and Windows",
		"s": 24,
		"k": 3,
		"l": "TypeScript",
		"t": ["deepseekharness-plugin", "dsh-plugin"],
		"u": "2026-08-16T10:26:25Z",
		"h": "https://github.com/whitelonng/dshcode",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-lark",
		"n": "dsh-lark",
		"o": "omdsh-dev",
		"d": "Lark/Feishu IM bot channel for DeepSeek Harness | 飞书 DeepSeek Harness （DSH）插件",
		"s": 23,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"feishu",
			"lark"
		],
		"u": "2026-08-16T04:21:59Z",
		"h": "https://github.com/omdsh-dev/dsh-lark",
		"p": ""
	},
	{
		"f": "the-beating-light-of-the-nail/dsh-meme-hub",
		"n": "dsh-meme-hub",
		"o": "the-beating-light-of-the-nail",
		"d": "🐋 The meme side of DeepSeek Harness — 贪玩蓝鲸/QQ2006/whale girls/mini-games · A curated tour of the wildest dsh plugins",
		"s": 23,
		"k": 1,
		"l": "",
		"t": [
			"awesome",
			"awesome-list",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"meme",
			"plugins"
		],
		"u": "2026-08-16T05:38:52Z",
		"h": "https://github.com/the-beating-light-of-the-nail/dsh-meme-hub",
		"p": "https://dsh-meme-hub.cdqyfdbymn.me/"
	},
	{
		"f": "147228/dsh-xiaoyao-skins",
		"n": "dsh-xiaoyao-skins",
		"o": "147228",
		"d": "夕小瑶 × DeepSeek Harness Web 皮肤合集、安装器与社区创作工具链",
		"s": 23,
		"k": 2,
		"l": "CSS",
		"t": [
			"ai-agent",
			"community",
			"deepseek-harness",
			"dsh-plugin",
			"skin",
			"theme",
			"xiaoyao"
		],
		"u": "2026-08-15T15:52:46Z",
		"h": "https://github.com/147228/dsh-xiaoyao-skins",
		"p": "https://147228.github.io/dsh-xiaoyao-skins/"
	},
	{
		"f": "bugmaker2/dsh-plugin-template",
		"n": "dsh-plugin-template",
		"o": "bugmaker2",
		"d": "Template for deepseek-harness plugin development.",
		"s": 23,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:59:52Z",
		"h": "https://github.com/bugmaker2/dsh-plugin-template",
		"p": ""
	},
	{
		"f": "zimodzh/dsh-plugin-dev-skills",
		"n": "dsh-plugin-dev-skills",
		"o": "zimodzh",
		"d": "An Agent Skills skill for developing DeepSeek Harness (DSH) plugins（开发 DSH 插件的 Agent Skill）——插件/服务/事件/工具/LLM 适配器/打包安装的标准。Works with Claude Code, Codex, DSH, VS Code Copilot & any compatible agent.",
		"s": 22,
		"k": 0,
		"l": "",
		"t": [
			"agent-skills",
			"awesome-dsh-plugin",
			"claude-code",
			"codex",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm-agent",
			"skills"
		],
		"u": "2026-08-16T10:24:37Z",
		"h": "https://github.com/zimodzh/dsh-plugin-dev-skills",
		"p": "https://github.com/zimodzh/dsh-plugin-dev-skills"
	},
	{
		"f": "AtlasCloudAI/atlas-cloud-skills",
		"n": "atlas-cloud-skills",
		"o": "AtlasCloudAI",
		"d": "Atlas Cloud skills for Claude Code, Codex & Gemini CLI — generate images/videos and call 300+ AI models from your coding agent.",
		"s": 22,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"ai",
			"atlascloud",
			"claude-code",
			"dsh-plugin",
			"generative-ai",
			"image-generation",
			"llm",
			"mcp",
			"video-generation"
		],
		"u": "2026-08-15T23:56:52Z",
		"h": "https://github.com/AtlasCloudAI/atlas-cloud-skills",
		"p": "https://www.atlascloud.ai"
	},
	{
		"f": "RevolutionLA/dsh-dream-skin",
		"n": "dsh-dream-skin",
		"o": "RevolutionLA",
		"d": "DeepSeek Harness 换肤 / 壁纸 / 主题包插件 (dsh-plugin) — 8 套 Mirage 主题、每用户强调色、壁纸2.0、主题包导入导出/分享链接、收藏与随机，纯原生 token 系统实现。",
		"s": 22,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-theme",
			"skin",
			"theme",
			"wallpaper"
		],
		"u": "2026-08-16T10:00:23Z",
		"h": "https://github.com/RevolutionLA/dsh-dream-skin",
		"p": ""
	},
	{
		"f": "Mars-Sea/dsh-commandcode-provider",
		"n": "dsh-commandcode-provider",
		"o": "Mars-Sea",
		"d": "Unofficial DeepSeek Harness LLM provider plugin for Command Code: live model catalog, reasoning-effort support, Models-page card. Ported from pi-commandcode-provider (MIT).",
		"s": 21,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm",
			"llm-provider",
			"npm",
			"plugin",
			"provider",
			"typescript"
		],
		"u": "2026-08-16T09:38:55Z",
		"h": "https://github.com/Mars-Sea/dsh-commandcode-provider",
		"p": "https://github.com/Mars-Sea/dsh-commandcode-provider"
	},
	{
		"f": "JustGenius-s/DSH-Desktop",
		"n": "DSH-Desktop",
		"o": "JustGenius-s",
		"d": "DSH-Desktop",
		"s": 21,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-desktop",
			"dsh-plugin"
		],
		"u": "2026-08-15T06:15:04Z",
		"h": "https://github.com/JustGenius-s/DSH-Desktop",
		"p": ""
	},
	{
		"f": "Francis-Xavier-code/dsh-balance-plugin",
		"n": "dsh-balance-plugin",
		"o": "Francis-Xavier-code",
		"d": "deepSeek 余额监控与用量统计（DSH 动态 Cordis 插件）：余额监控 · 官方充值入口 · 用量统计 · 三方插件管理",
		"s": 21,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"dsharpplus",
			"token",
			"wallet",
			"webui"
		],
		"u": "2026-08-16T03:38:25Z",
		"h": "https://github.com/Francis-Xavier-code/dsh-balance-plugin",
		"p": ""
	},
	{
		"f": "ali-meoo/meoo-cli",
		"n": "meoo-cli",
		"o": "ali-meoo",
		"d": "meoo cli 是秒悟（Meoo）官方推出的命令行工具，让 Claude Code、Codex、Cursor、Qoder等本地 agent 在帮你写完前端代码后，能直接接管「数据库、用户登录、文件存储、部署上线」的所有云端工作——你只需要在终端跑一条命令，剩下的交给 AI。",
		"s": 21,
		"k": 1,
		"l": "",
		"t": [
			"claude-code-skill",
			"claude-skills",
			"cli",
			"deploy",
			"dsh-plugin",
			"edge-functions",
			"fullstack",
			"meoo",
			"skill-md",
			"supabase"
		],
		"u": "2026-08-14T04:48:58Z",
		"h": "https://github.com/ali-meoo/meoo-cli",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-plugin-check",
		"n": "dsh-plugin-check",
		"o": "omdsh-dev",
		"d": "DSH 插件健康检查工具：扫描插件仓库的清单协议 / patch 格式 / 构建陷阱 / hub 收录状态，零依赖只读，注册 plugin_check 工具",
		"s": 21,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"diagnostics",
			"dsh",
			"dsh-plugin",
			"linting",
			"plugin-health"
		],
		"u": "2026-08-16T02:59:27Z",
		"h": "https://github.com/omdsh-dev/dsh-plugin-check",
		"p": ""
	},
	{
		"f": "AwesomeHou/dsh-plugin-marketplace",
		"n": "dsh-plugin-marketplace",
		"o": "AwesomeHou",
		"d": "Plugin marketplace for DeepSeek Harness — live-syncs the GitHub dsh-plugin topic (1800+ repos) into a searchable, paginated settings tab with one-click install and agent tools (market_search / market_install).",
		"s": 20,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"plugin-marketplace"
		],
		"u": "2026-08-16T08:27:32Z",
		"h": "https://github.com/AwesomeHou/dsh-plugin-marketplace",
		"p": ""
	},
	{
		"f": "Anionex/dsh-computer-use",
		"n": "dsh-computer-use",
		"o": "Anionex",
		"d": "为 DeepSeek Harness 提供电脑控制插件：新鲜 Accessibility 观测、过期状态拒绝、作用域权限与安全输入（目前支持macos）｜Accessibility-first macOS Computer Use bundle for DSH with fresh observations, stale-state rejection, scoped permissions, and safe input.",
		"s": 20,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"accessibility",
			"agent-skills",
			"agent-tools",
			"appkit",
			"computer-use",
			"deepseek",
			"deepseek-harness",
			"desktop-automation",
			"dsh",
			"dsh-plugin",
			"gui-automation",
			"human-in-the-loop",
			"macos",
			"native-apps",
			"typescript"
		],
		"u": "2026-08-16T09:50:00Z",
		"h": "https://github.com/Anionex/dsh-computer-use",
		"p": ""
	},
	{
		"f": "feiyang-dev/dsh-usage-plugin",
		"n": "dsh-usage-plugin",
		"o": "feiyang-dev",
		"d": "DeepSeek Harness 用量与消耗插件（dsh-usage）—— 每次调用的 token 用量/缓存命中统计、峰谷计费、余额查询、CSV/JSON/PNG 导出，可经桌面端一键安装或命令行 dsh plugin add 安装。",
		"s": 19,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-v4",
			"deepseek-v4-pro",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:31:43Z",
		"h": "https://github.com/feiyang-dev/dsh-usage-plugin",
		"p": ""
	},
	{
		"f": "tianji-qingtian/dsh-composer-polish",
		"n": "dsh-composer-polish",
		"o": "tianji-qingtian",
		"d": "DeepSeek Harness plugin: one-click ✨ polish for composer drafts — flash rewrite, auto fill-back · DeepSeek Harness 插件：输入框草稿一键 ✨ 润色，flash 改写、自动回填",
		"s": 19,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T05:53:01Z",
		"h": "https://github.com/tianji-qingtian/dsh-composer-polish",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-toolkit",
		"n": "dsh-toolkit",
		"o": "omdsh-dev",
		"d": "DSH 零依赖工具包 collection —— time / encoding / json / calculator / csv / regex / markdown / diff / stat / schema 十个确定性工具，统一入口一键安装",
		"s": 19,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"collection",
			"dsh",
			"dsh-plugin",
			"toolkit",
			"zero-dependency"
		],
		"u": "2026-08-16T06:37:23Z",
		"h": "https://github.com/omdsh-dev/dsh-toolkit",
		"p": ""
	},
	{
		"f": "hellodigua/dsh-share",
		"n": "dsh-share",
		"o": "hellodigua",
		"d": "DSH 对话分享插件，分享单轮或多轮对话，可导出为图片或 Markdown。Share DSH Q&As or selected conversation groups as PNG or Markdown.",
		"s": 19,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T12:29:13Z",
		"h": "https://github.com/hellodigua/dsh-share",
		"p": ""
	},
	{
		"f": "hellodigua/dsh-emoji",
		"n": "dsh-emoji",
		"o": "hellodigua",
		"d": "让 AI 回复加入自定义表情，支持Bilibili、小红书、贴吧、知乎等多平台表情包，或自定义表情",
		"s": 19,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T06:58:00Z",
		"h": "https://github.com/hellodigua/dsh-emoji",
		"p": ""
	},
	{
		"f": "feibi-mochi/deepseek-harness-wallet",
		"n": "deepseek-harness-wallet",
		"o": "feibi-mochi",
		"d": "Balance monitoring, per-session spend & token tracking, low-balance alerts, and an official recharge shortcut for DeepSeek Harness. / 余额监控和充值插件",
		"s": 19,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"agentic-ai",
			"balance-monitor",
			"cost-tracking",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"javascript",
			"llm",
			"plugin",
			"recharge",
			"token-tracking",
			"wallet"
		],
		"u": "2026-08-16T09:25:35Z",
		"h": "https://github.com/feibi-mochi/deepseek-harness-wallet",
		"p": ""
	},
	{
		"f": "LoserFox/distill",
		"n": "distill",
		"o": "LoserFox",
		"d": "自动对话蒸馏：后台 subagent 反省 + 技能 create/update",
		"s": 19,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:36:01Z",
		"h": "https://github.com/LoserFox/distill",
		"p": ""
	},
	{
		"f": "YELEBAI/dsh-plugin-marketplace",
		"n": "dsh-plugin-marketplace",
		"o": "YELEBAI",
		"d": "Verified plugin marketplace and autonomous registry for DeepSeek Harness",
		"s": 18,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:53:37Z",
		"h": "https://github.com/YELEBAI/dsh-plugin-marketplace",
		"p": ""
	},
	{
		"f": "crazywoola/dsh-balance",
		"n": "dsh-balance",
		"o": "crazywoola",
		"d": "DeepSeek Harness balance plugin for the Settings page",
		"s": 18,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T07:29:20Z",
		"h": "https://github.com/crazywoola/dsh-balance",
		"p": ""
	},
	{
		"f": "lsz-asd/dsh-plugin-session-delete",
		"n": "dsh-plugin-session-delete",
		"o": "lsz-asd",
		"d": "Delete DeepSeek Harness sessions from the UI: header danger button + sidebar session-row menu item (no conversation jump), risk-consent dialog with session name/id, stops running agents first, in-place list refresh without page reload. Works in web and the desktop client.",
		"s": 18,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:14:40Z",
		"h": "https://github.com/lsz-asd/dsh-plugin-session-delete",
		"p": ""
	},
	{
		"f": "dhicoc/dsh-reverse-skill",
		"n": "dsh-reverse-skill",
		"o": "dhicoc",
		"d": "Complete reverse-skill (85 SKILL.md) as a DeepSeek Harness (dsh) Cordis plugin — reverse engineering, authorized pentesting and security research skill pack.",
		"s": 18,
		"k": 5,
		"l": "PowerShell",
		"t": [
			"ctf",
			"deepseek-harness",
			"dsh-plugin",
			"pentest",
			"reverse-engineering",
			"security"
		],
		"u": "2026-08-16T03:42:16Z",
		"h": "https://github.com/dhicoc/dsh-reverse-skill",
		"p": ""
	},
	{
		"f": "william-jin-cmu/dsh-stickers",
		"n": "dsh-stickers",
		"o": "william-jin-cmu",
		"d": "DSH WebUI sticker plugin for bidirectional user and agent reactions",
		"s": 18,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T07:14:09Z",
		"h": "https://github.com/william-jin-cmu/dsh-stickers",
		"p": ""
	},
	{
		"f": "morluto/leantoken",
		"n": "leantoken",
		"o": "morluto",
		"d": "Code intelligence for agents: find the code that matters and keep your context window and tokens lean.",
		"s": 18,
		"k": 2,
		"l": "Rust",
		"t": [
			"ai-coding",
			"code-intelligence",
			"code-navigation",
			"code-retrieval",
			"code-search",
			"codebase-indexing",
			"coding-agents",
			"context-engineering",
			"context-window",
			"cordis",
			"dsh",
			"dsh-plugin",
			"mcp",
			"mcp-server",
			"model-context-protocol",
			"rust",
			"token-budget",
			"token-counting",
			"token-efficient",
			"tree-sitter"
		],
		"u": "2026-08-15T18:41:48Z",
		"h": "https://github.com/morluto/leantoken",
		"p": ""
	},
	{
		"f": "zhuiyueya/dsh-im-gateway",
		"n": "dsh-im-gateway",
		"o": "zhuiyueya",
		"d": "把 dsh agent 接入微信、飞书等 20+ 聊天平台的聚合网关插件 | Aggregate IM gateway for DeepSeek Harness (dsh): connect your agents to WeChat, Feishu, Telegram, Discord & 20+ chat platforms",
		"s": 18,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"gateway",
			"im-gateway"
		],
		"u": "2026-08-16T10:01:01Z",
		"h": "https://github.com/zhuiyueya/dsh-im-gateway",
		"p": ""
	},
	{
		"f": "HsiangNianian/dsh-auto-continue",
		"n": "dsh-auto-continue",
		"o": "HsiangNianian",
		"d": "DSH Web UI plugin: auto-sends 「继续」 to resume requests interrupted by network errors or other non-human causes — error classification, adaptive backoff, templated continue text, browser notifications, all configurable from the settings card",
		"s": 18,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"auto-contiune",
			"automatic",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"web-ui"
		],
		"u": "2026-08-16T01:31:14Z",
		"h": "https://github.com/HsiangNianian/dsh-auto-continue",
		"p": ""
	},
	{
		"f": "lhh010/dsh-minigames",
		"n": "dsh-minigames",
		"o": "lhh010",
		"d": "DSH Web UI 右侧小游戏面板：18 款离线小游戏（恐龙跳一跳 / 俄罗斯方块 / 坦克大战 / 扫雷 / 2048 / 数独 / 吃豆人 / 跟枪练习等），可扩展游戏注册表，等待模型回复或修 bug 时的摸鱼神器",
		"s": 18,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T07:28:44Z",
		"h": "https://github.com/lhh010/dsh-minigames",
		"p": ""
	},
	{
		"f": "DietCokewithSugar/dsh-user-experience",
		"n": "dsh-user-experience",
		"o": "DietCokewithSugar",
		"d": "Persona-driven UX walkthrough plugin for DeepSeek Harness (DSH) - scans React + TypeScript source code for UX issues, pinpoints them, and suggests fixes.",
		"s": 18,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"code-review",
			"deepseek-harness",
			"dsh-plugin",
			"ux"
		],
		"u": "2026-08-14T15:50:50Z",
		"h": "https://github.com/DietCokewithSugar/dsh-user-experience",
		"p": ""
	},
	{
		"f": "UNLINEARITY/dsh-code",
		"n": "dsh-code",
		"o": "UNLINEARITY",
		"d": " Claude-Code-style TUI bundle for DeepSeek Harness. 充分结合 DSH 的核心机制与Codex CLI 、Claude Code 的优秀机制，打造的 DSH-Code. （注：Deepseek 官方 API 有特殊动画）",
		"s": 18,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"cli",
			"codex",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"harness",
			"plugin"
		],
		"u": "2026-08-16T07:40:38Z",
		"h": "https://github.com/UNLINEARITY/dsh-code",
		"p": ""
	},
	{
		"f": "Fisfzy/ego-browser",
		"n": "ego-browser",
		"o": "Fisfzy",
		"d": "DSH（DeepSeek Harness）插件：把 ego-lite 浏览器（给 AI Agent 用的 Chromium）接入 HARNESS——13 个结构化 ego_* 工具（文本语义快照、语义定位点击、表单填充、截图、CDP 控制、任务空间隔离），内置 ego 运行时，Linux + Chrome 开箱即用，无需克隆官方仓库或手动构建。",
		"s": 18,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agent-browser",
			"browser-automation",
			"dsh-plugin",
			"dshx",
			"ego-lite"
		],
		"u": "2026-08-16T08:22:31Z",
		"h": "https://github.com/Fisfzy/ego-browser",
		"p": ""
	},
	{
		"f": "iuikj/dsh-desktop",
		"n": "dsh-desktop",
		"o": "iuikj",
		"d": "一个微调美观的DeepSeek harness客户端（欢迎插件加入）",
		"s": 17,
		"k": 4,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T01:29:54Z",
		"h": "https://github.com/iuikj/dsh-desktop",
		"p": ""
	},
	{
		"f": "mexiaosqwq/dsh-web-mobile",
		"n": "dsh-web-mobile",
		"o": "mexiaosqwq",
		"d": "DeepSeek Harness Web UI 移动端适配插件:窄屏下侧边栏变为 overlay 抽屉,会话独占全宽。",
		"s": 17,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mobile",
			"mobile-ui",
			"plugin",
			"responsive",
			"web-ui"
		],
		"u": "2026-08-16T10:17:23Z",
		"h": "https://github.com/mexiaosqwq/dsh-web-mobile",
		"p": ""
	},
	{
		"f": "unitarylab/quantum-practices",
		"n": "quantum-practices",
		"o": "unitarylab",
		"d": "Quantum Algorithms Best Practices",
		"s": 17,
		"k": 3,
		"l": "Python",
		"t": [
			"agent-skills",
			"best-practices",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"quantum-algorithms",
			"quantum-computing"
		],
		"u": "2026-08-15T03:36:29Z",
		"h": "https://github.com/unitarylab/quantum-practices",
		"p": ""
	},
	{
		"f": "YunTaiHua/illusion-agent",
		"n": "illusion-agent",
		"o": "YunTaiHua",
		"d": "Illusion-Agent: Where fantasy meets functionality — an AI agent platform for terminal, browser, any model, any OS.",
		"s": 17,
		"k": 6,
		"l": "Python",
		"t": [
			"agent",
			"ai",
			"claude",
			"claude-code",
			"codex",
			"deepseek",
			"dsh-plugin",
			"gemini",
			"glm",
			"gpt",
			"hermes",
			"hermes-agent",
			"kimi",
			"mimo",
			"minimax",
			"openai",
			"openclaw",
			"opencode",
			"python"
		],
		"u": "2026-08-16T03:10:15Z",
		"h": "https://github.com/YunTaiHua/illusion-agent",
		"p": ""
	},
	{
		"f": "PivotStackIntelligence/dsh-github",
		"n": "dsh-github",
		"o": "PivotStackIntelligence",
		"d": "",
		"s": 17,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T07:41:40Z",
		"h": "https://github.com/PivotStackIntelligence/dsh-github",
		"p": ""
	},
	{
		"f": "upstash/skills",
		"n": "skills",
		"o": "upstash",
		"d": "Collection of skills for Upstash",
		"s": 17,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"mcp",
			"skills"
		],
		"u": "2026-08-14T16:57:53Z",
		"h": "https://github.com/upstash/skills",
		"p": ""
	},
	{
		"f": "bill9109/dsh-web-ui-notify",
		"n": "dsh-web-ui-notify",
		"o": "bill9109",
		"d": "为 DSH 增加桌面通知提醒",
		"s": 17,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:10:31Z",
		"h": "https://github.com/bill9109/dsh-web-ui-notify",
		"p": ""
	},
	{
		"f": "N0zoM1z0/th08",
		"n": "th08",
		"o": "N0zoM1z0",
		"d": "Source reconstruction of Touhou Eiyashou (TH08) 1.00d",
		"s": 17,
		"k": 1,
		"l": "C++",
		"t": [
			"decompilation",
			"dsh-plugin",
			"game-preservation",
			"ida-pro",
			"msvc",
			"reccmp",
			"reverse-engineering",
			"th08",
			"touhou",
			"touhou-games"
		],
		"u": "2026-08-16T09:29:37Z",
		"h": "https://github.com/N0zoM1z0/th08",
		"p": ""
	},
	{
		"f": "Tyan66666/billion-context-dsh",
		"n": "billion-context-dsh",
		"o": "Tyan66666",
		"d": "Model-driven context management (Active Context Pruning / ACP) for the DeepSeek Harness — the model decides when and what to compress. Ported from billion-context-pi (ranxianglei); acp-kernel reused verbatim. CompactionEngine backend with compress/decompress/search_context/acp_status tools.",
		"s": 17,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"acp",
			"billion-context",
			"context-management",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:55:42Z",
		"h": "https://github.com/Tyan66666/billion-context-dsh",
		"p": "https://www.npmjs.com/package/billion-context-dsh"
	},
	{
		"f": "SenmuuuuW/dsh-group-photo",
		"n": "dsh-group-photo",
		"o": "SenmuuuuW",
		"d": "DSH 内测收官合影墙：GitHub OAuth 零权限登录 + 冻结白名单校验的拍立得合影站（含 DSH Skill 包装）",
		"s": 17,
		"k": 1,
		"l": "HTML",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T00:14:26Z",
		"h": "https://github.com/SenmuuuuW/dsh-group-photo",
		"p": ""
	},
	{
		"f": "left0ver/dsh-file-review",
		"n": "dsh-file-review",
		"o": "left0ver",
		"d": "a dsh plugin - review  files that an agent just changed,you can see the diff",
		"s": 16,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T03:54:00Z",
		"h": "https://github.com/left0ver/dsh-file-review",
		"p": ""
	},
	{
		"f": "2BingLing/dsh-market",
		"n": "dsh-market",
		"o": "2BingLing",
		"d": "DeepSeek Harness 插件市场 · 持续收录 1500+ DSH 插件：中文搜索 + 实用五维评分 + 一键安装。Web 版与 DSH 侧边栏插件双形态。Plugin marketplace for DeepSeek Harness: 1500+ plugins, Chinese search, 5-dim scoring, one-click install.",
		"s": 16,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-bundle",
			"dsh-market",
			"dsh-plugin",
			"dsh-plugins",
			"dsh-skill",
			"dsh-web",
			"marketplace",
			"plugin-market",
			"plugin-marketplace",
			"plugin-registry",
			"plugin-search",
			"web"
		],
		"u": "2026-08-16T08:30:46Z",
		"h": "https://github.com/2BingLing/dsh-market",
		"p": "https://dsh.market/"
	},
	{
		"f": "zp-home/dsh-recommend",
		"n": "dsh-recommend",
		"o": "zp-home",
		"d": "DSH 插件生态透明排行与推荐：每日自动抓取 dsh-plugin 话题 + 公开评分模型 + 排行/推荐插件与静态站",
		"s": 16,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"plugin",
			"rankings",
			"recommendations"
		],
		"u": "2026-08-16T09:36:00Z",
		"h": "https://github.com/zp-home/dsh-recommend",
		"p": "https://github.com/zp-home/dsh-recommend"
	},
	{
		"f": "kejixiaoliang/awesome-dsh-plugins",
		"n": "awesome-dsh-plugins",
		"o": "kejixiaoliang",
		"d": "DeepSeek Harness (DSH) 插件精选目录 — 14 类 280+ 个社区插件，覆盖 MCP / Skill / TUI / 多 Agent / 上下文记忆 / UI 皮肤，点链接直达仓库。Curated directory of dsh plugins for DeepSeek Harness.",
		"s": 16,
		"k": 9,
		"l": "JavaScript",
		"t": [
			"agnet",
			"ai-agents",
			"awesome",
			"awesome-list",
			"awesome-lists",
			"coding-agent",
			"coding-agents",
			"cordis",
			"cordis-plugin",
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"deepseek-v4-pro",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"plugins"
		],
		"u": "2026-08-16T10:14:14Z",
		"h": "https://github.com/kejixiaoliang/awesome-dsh-plugins",
		"p": ""
	},
	{
		"f": "SnowCrescenter-tech/dsh-milestone",
		"n": "dsh-milestone",
		"o": "SnowCrescenter-tech",
		"d": "Git-style milestone timeline for DeepSeek Harness - hover for metadata, click to jump to any message. 会话里程碑导航条：像 Git 提交图一眼定位每条提问，悬停看时间/轮次/耗时/TTFT，点击即跳转。",
		"s": 16,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"milestone",
			"navigation"
		],
		"u": "2026-08-16T04:21:13Z",
		"h": "https://github.com/SnowCrescenter-tech/dsh-milestone",
		"p": ""
	},
	{
		"f": "lzszq/dsh-scholar",
		"n": "dsh-scholar",
		"o": "lzszq",
		"d": "dsh-scholar",
		"s": 16,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T06:40:16Z",
		"h": "https://github.com/lzszq/dsh-scholar",
		"p": ""
	},
	{
		"f": "CAPTAIN1275/dsh-ui-web",
		"n": "dsh-ui-web",
		"o": "CAPTAIN1275",
		"d": "",
		"s": 16,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-16T03:37:18Z",
		"h": "https://github.com/CAPTAIN1275/dsh-ui-web",
		"p": ""
	},
	{
		"f": "SummerSec/AI-Inner-Os",
		"n": "AI-Inner-Os",
		"o": "SummerSec",
		"d": "AI Inner OS 是一个面向 AI CLI 工具的插件，支持 Claude Code、Codex CLI、Cursor、OpenCode CLI。  它通过协议注入，让 AI 在正常完成任务的同时，额外输出一层可见的自由独白：  ▎InnerOS：这仓库现在还像毛坯房，先把承重墙立起来再说。 不预设人格，不限制语气。AI 可以吐槽、得意、焦虑、冷笑、跳跃联想——或者什么都不说。独白是否出现，由 AI 自己决定。",
		"s": 16,
		"k": 1,
		"l": "Python",
		"t": [
			"ai",
			"ai-inner-os",
			"claude",
			"claude-code",
			"codex-cli",
			"cursor",
			"dsh-plugin",
			"inner-os",
			"llm",
			"opencode",
			"opencode-cli"
		],
		"u": "2026-08-15T06:16:04Z",
		"h": "https://github.com/SummerSec/AI-Inner-Os",
		"p": ""
	},
	{
		"f": "PlutoKeating/dsh-lark-bot",
		"n": "dsh-lark-bot",
		"o": "PlutoKeating",
		"d": "dsh-lark-bot：把 DeepSeek Harness (dsh) 桥接进飞书/Lark 的 bot：流式卡片、项目工作区、并行任务、多角色 Agent、跨会话通知、对话内模型/密钥管理与安全网守护（dsh 崩溃后飞书仍可自救）。A bridge bot connecting DeepSeek Harness (dsh) into Feishu/Lark: streaming cards, workspaces, parallel tasks, multi-role agents, cross-session notify, in-chat model/key management, and a safety-net guardian.",
		"s": 16,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"bot",
			"bridge",
			"chatbot",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"feishu",
			"lark",
			"messaging",
			"typescript"
		],
		"u": "2026-08-15T22:59:20Z",
		"h": "https://github.com/PlutoKeating/dsh-lark-bot",
		"p": ""
	},
	{
		"f": "dingyi222666/dsh-focus-chat",
		"n": "dsh-focus-chat",
		"o": "dingyi222666",
		"d": "为 dsh 提供新的「聚焦会话」精简会话视图，更轻松易于阅读，只关注最终产出结果。",
		"s": 16,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:26:01Z",
		"h": "https://github.com/dingyi222666/dsh-focus-chat",
		"p": ""
	},
	{
		"f": "Aik358/dsh-auto-memory",
		"n": "dsh-auto-memory",
		"o": "Aik358",
		"d": "DSH 自动记忆插件:三层记忆(用户级/项目笔记/每日日志)自动注入与检索、每日反思、可视化面板与设置页,支持继承其他 AI 工具的历史记忆。An auto-memory plugin for the DeepSeek Harness Web GUI: three-layer memory (user-level / project notes / daily logs) with automatic injection and retrieval, daily reflections, a visual panel and settings page, and inheritance of memories from other AI tools.",
		"s": 16,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"memory",
			"npm",
			"plugin"
		],
		"u": "2026-08-16T09:53:27Z",
		"h": "https://github.com/Aik358/dsh-auto-memory",
		"p": "https://www.npmjs.com/package/@a9i5k4/dsh-auto-memory"
	},
	{
		"f": "eri64/dsh-claude-ux",
		"n": "dsh-claude-ux",
		"o": "eri64",
		"d": "DSH plugin: Claude-style Chinese risk control & conversation autonomy for DeepSeek Harness web",
		"s": 15,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:52:22Z",
		"h": "https://github.com/eri64/dsh-claude-ux",
		"p": "https://github.com/eri64/dsh-claude-web"
	},
	{
		"f": "CanglongCl/dsh-web-review",
		"n": "dsh-web-review",
		"o": "CanglongCl",
		"d": "DeepSeek Harness Web GUI 的网页预览与元素批注插件，让 AI 根据可视化反馈直接修改前端源码。",
		"s": 15,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"dsh",
			"dsh-plugin",
			"human-in-the-loop"
		],
		"u": "2026-08-16T08:00:08Z",
		"h": "https://github.com/CanglongCl/dsh-web-review",
		"p": ""
	},
	{
		"f": "ZRui-C/dsh-computer-use",
		"n": "dsh-computer-use",
		"o": "ZRui-C",
		"d": "Text-first browser & background macOS control for DeepSeek Harness (DSH): target the right process and window without taking the user's pointer. 为 DSH 提供文本优先的电脑控制：后台操作 Chromium 与 macOS，不抢前台、不移动鼠标。",
		"s": 15,
		"k": 0,
		"l": "Swift",
		"t": [
			"accessibility",
			"agent-tools",
			"ai-agents",
			"browser-automation",
			"computer-use",
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"desktop-automation",
			"dsh",
			"dsh-plugin",
			"macos"
		],
		"u": "2026-08-16T09:44:51Z",
		"h": "https://github.com/ZRui-C/dsh-computer-use",
		"p": "https://computer-use.zrui.tech/"
	},
	{
		"f": "KinGao294/dsh-skin",
		"n": "dsh-skin",
		"o": "KinGao294",
		"d": "Skin switcher + custom wallpaper for DeepSeek Harness (dsh): curated --dsw-alias-* palettes, translucent wallpaper with opacity/blur controls, persisted per browser (like Codex themes) — 换皮肤 / 自定义背景插件",
		"s": 15,
		"k": 5,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"skin",
			"theme",
			"wallpaper"
		],
		"u": "2026-08-16T05:55:30Z",
		"h": "https://github.com/KinGao294/dsh-skin",
		"p": ""
	},
	{
		"f": "dsh-tui/dsh-tui",
		"n": "dsh-tui",
		"o": "dsh-tui",
		"d": "Claude Code-style terminal UI for DeepSeek Harness agents, as an out-of-tree dsh plugin bundle",
		"s": 15,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"claude-code",
			"cli",
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"terminal",
			"tui"
		],
		"u": "2026-08-15T11:01:33Z",
		"h": "https://github.com/dsh-tui/dsh-tui",
		"p": "https://openguardrails.com"
	},
	{
		"f": "ccq1/dsh-side-panel",
		"n": "dsh-side-panel",
		"o": "ccq1",
		"d": "DSH 侧边栏，集成文件浏览器、终端和 Git 审查，方便预览文件。",
		"s": 15,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T17:03:08Z",
		"h": "https://github.com/ccq1/dsh-side-panel",
		"p": ""
	},
	{
		"f": "Ghost011118/dsh-balance-meter",
		"n": "dsh-balance-meter",
		"o": "Ghost011118",
		"d": "DeepSeek account balance and session cost readout for the DeepSeek Harness Web GUI",
		"s": 15,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"balance",
			"cost-tracking",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-web-ui",
			"plugin"
		],
		"u": "2026-08-16T03:49:40Z",
		"h": "https://github.com/Ghost011118/dsh-balance-meter",
		"p": ""
	},
	{
		"f": "lehhair/dsh-diff-viewer",
		"n": "dsh-diff-viewer",
		"o": "lehhair",
		"d": "DSH Web GUI PiUI-style diff viewer plugin: replaces the stock DiffBlock for write/edit tool calls via ui-tool diff-card chain slots (host patch included). Private.",
		"s": 15,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:44:06Z",
		"h": "https://github.com/lehhair/dsh-diff-viewer",
		"p": ""
	},
	{
		"f": "Nexus-Aethra/DSHBox",
		"n": "DSHBox",
		"o": "Nexus-Aethra",
		"d": "Manage DeepSeek Harness locally: run multiple DSH versions in isolated containers, open the UI in an embedded WebView, import plugins/skills with one click, share extension bundles, and let a queued task system handle installs with live logs. Zero-dependency installer.",
		"s": 15,
		"k": 0,
		"l": "Rust",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:13:52Z",
		"h": "https://github.com/Nexus-Aethra/DSHBox",
		"p": ""
	},
	{
		"f": "dqsjqian/Aria",
		"n": "Aria",
		"o": "dqsjqian",
		"d": "Modern C++20 MVVM framework — cross-platform, layered, coroutine-first. Reactive DAG (Property/Computed/Effect), Task<T>, and pluggable adapters (Qt6, AppKit, ...).",
		"s": 15,
		"k": 5,
		"l": "C++",
		"t": [
			"coroutines",
			"cpp",
			"cpp20",
			"cross-platform",
			"dsh-plugin",
			"framework",
			"header-only",
			"mvvm",
			"reactive-programming"
		],
		"u": "2026-08-16T09:44:06Z",
		"h": "https://github.com/dqsjqian/Aria",
		"p": ""
	},
	{
		"f": "joejojoking-cloud/dsh-file-explorer",
		"n": "dsh-file-explorer",
		"o": "joejojoking-cloud",
		"d": "File explorer plugin for DeepSeek Harness: file tree, preview, markdown, syntax highlighting, in-panel editing, VS Code integration - DeepSeek Harness 全局文件资源管理器插件",
		"s": 15,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"cordis",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"file-explorer",
			"file-manager",
			"llm",
			"markdown",
			"syntax-highlighting"
		],
		"u": "2026-08-15T13:21:34Z",
		"h": "https://github.com/joejojoking-cloud/dsh-file-explorer",
		"p": ""
	},
	{
		"f": "zh667/TokenLedger",
		"n": "TokenLedger",
		"o": "zh667",
		"d": "Relay-site attributed token usage for DeepSeek Harness — zero config, no credentials",
		"s": 15,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"billing",
			"deepseek-harness",
			"dsh-plugin",
			"newapi",
			"sub2api",
			"token-usage"
		],
		"u": "2026-08-16T09:33:16Z",
		"h": "https://github.com/zh667/TokenLedger",
		"p": "https://www.npmjs.com/package/dsh-tokenledger"
	},
	{
		"f": "Sqhao-O/dsh-docs",
		"n": "dsh-docs",
		"o": "Sqhao-O",
		"d": "Fully local document intelligence for DeepSeek Harness. Parse PDF, Office files, images, and scanned documents with offline OCR. | DeepSeek Harness 全本地文档智能插件，支持 PDF、Office、图片与离线 OCR",
		"s": 15,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"deepseek",
			"deepseek-harness",
			"docling",
			"document-intelligence",
			"document-parsing",
			"document-processing",
			"dsh-plugin",
			"llm",
			"nodejs",
			"ocr",
			"pdf",
			"rag",
			"typescript"
		],
		"u": "2026-08-16T09:00:20Z",
		"h": "https://github.com/Sqhao-O/dsh-docs",
		"p": ""
	},
	{
		"f": "modusensus/dsh-mneme",
		"n": "dsh-mneme",
		"o": "modusensus",
		"d": "Structured memory engine for DeepSeek Harness. Offline semantic search, entity-attribute-timeline, autoDream self-consolidation, and human-editable Markdown storage.",
		"s": 15,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"agent-memory",
			"agent-memory-system",
			"autodream",
			"deepseek-harness",
			"dsh-plugin",
			"knowledge-management",
			"long-term-memory",
			"memory-consolidation",
			"persistent-memory",
			"reranking",
			"semantic-search",
			"vector-search"
		],
		"u": "2026-08-16T10:18:30Z",
		"h": "https://github.com/modusensus/dsh-mneme",
		"p": ""
	},
	{
		"f": "zhu168/dsh-save-money",
		"n": "dsh-save-money",
		"o": "zhu168",
		"d": "Save-money plugin for DSH (DeepSeek Harness) — define your own \"pause / resume\" time windows; at pause time running long tasks are paused (not stopped) automatically, and they resume when the window ends. ",
		"s": 15,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:24:55Z",
		"h": "https://github.com/zhu168/dsh-save-money",
		"p": ""
	},
	{
		"f": "xmanrui/dsh-im",
		"n": "dsh-im",
		"o": "xmanrui",
		"d": "通过扫码或机器人凭据把IM机器人接入DeepSeek Harness（支持飞书、微信、钉钉、企业微信、QQ、Telegram、Discord和WhatsApp）。 Connect IM bots to DeepSeek Harness via QR code or credentials (8 channels).",
		"s": 15,
		"k": 3,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T10:23:05Z",
		"h": "https://github.com/xmanrui/dsh-im",
		"p": ""
	},
	{
		"f": "Ericwong5021/deepseek-plugin-store",
		"n": "deepseek-plugin-store",
		"o": "Ericwong5021",
		"d": "DeepSeek Harness 独立社区插件商店：发现、安装并提交经过验证的插件、工具与扩展。 | Independent community plugin directory.",
		"s": 15,
		"k": 1,
		"l": "HTML",
		"t": [
			"agent-tools",
			"ai-agents",
			"awesome-list",
			"community",
			"curated-list",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"open-source",
			"plugin-directory",
			"plugin-ecosystem",
			"plugin-marketplace",
			"plugins"
		],
		"u": "2026-08-16T01:37:46Z",
		"h": "https://github.com/Ericwong5021/deepseek-plugin-store",
		"p": "https://deepseekplugin.store"
	},
	{
		"f": "flymysql/dsh-remote",
		"n": "dsh-remote",
		"o": "flymysql",
		"d": "Remote-work assistant for DeepSeek Harness (DSH): connect via SSH (key or password), pick a remote workspace, operate with rw_* tools, and SFTP-mirror it into a real local DSH workspace.",
		"s": 14,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"plugin",
			"remote",
			"ssh",
			"tunnel"
		],
		"u": "2026-08-16T07:34:59Z",
		"h": "https://github.com/flymysql/dsh-remote",
		"p": ""
	},
	{
		"f": "SenmuuuuW/dsh-whale-report",
		"n": "dsh-whale-report",
		"o": "SenmuuuuW",
		"d": "🐋 鲸鱼记事本 — 你的 Agent 年度报告：从会话事件日志生成日报/周报/月报/年报，任意区间、只读不改写",
		"s": 14,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"agent-report",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:42:44Z",
		"h": "https://github.com/SenmuuuuW/dsh-whale-report",
		"p": ""
	},
	{
		"f": "CheshireJCat/blender",
		"n": "blender",
		"o": "CheshireJCat",
		"d": "DeepSeek Harness plugin for complete Blender 3D modeling, reconstruction, rendering, validation, and export workflows",
		"s": 14,
		"k": 0,
		"l": "Python",
		"t": [
			"3d-modeling",
			"agent-skills",
			"blender",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:02:19Z",
		"h": "https://github.com/CheshireJCat/blender",
		"p": "https://www.npmjs.com/package/dsh-blender"
	},
	{
		"f": "Make0209/dsh-usage-stats",
		"n": "dsh-usage-stats",
		"o": "Make0209",
		"d": "DeepSeek Harness 插件：GitHub 风格用量热力图 + Token / 缓存命中 / 账户余额看板 + 工作区别名管理。",
		"s": 14,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"analytics",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"heatmap",
			"usage-stats"
		],
		"u": "2026-08-16T08:57:50Z",
		"h": "https://github.com/Make0209/dsh-usage-stats",
		"p": ""
	},
	{
		"f": "lehhair/dsh-mobile",
		"n": "dsh-mobile",
		"o": "lehhair",
		"d": "",
		"s": 14,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T00:25:12Z",
		"h": "https://github.com/lehhair/dsh-mobile",
		"p": ""
	},
	{
		"f": "Nyasers/dsh-hanako",
		"n": "dsh-hanako",
		"o": "Nyasers",
		"d": "DSH for Hanako",
		"s": 14,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"oh-plugin",
			"openhanako-plugin"
		],
		"u": "2026-08-16T09:50:09Z",
		"h": "https://github.com/Nyasers/dsh-hanako",
		"p": "https://github.com/liliMozi/openhanako"
	},
	{
		"f": "Links2008/DeepSeek-Harness-Desktop",
		"n": "DeepSeek-Harness-Desktop",
		"o": "Links2008",
		"d": "非官方的 Windows 桌面版 DeepSeek Harness 发行版，支持原生通知、流畅的窗口控制、捆绑运行时和自动更新。追踪官方主分支。",
		"s": 14,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"auto-update",
			"deepseek",
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"electron",
			"windows",
			"windows-notifications"
		],
		"u": "2026-08-16T10:29:10Z",
		"h": "https://github.com/Links2008/DeepSeek-Harness-Desktop",
		"p": "https://github.com/Links2008/DeepSeek-Harness-Desktop/releases/latest"
	},
	{
		"f": "omdsh-dev/fabric",
		"n": "fabric",
		"o": "omdsh-dev",
		"d": "一种类似MC Fabric的hook处理器",
		"s": 14,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:58:31Z",
		"h": "https://github.com/omdsh-dev/fabric",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-pet-rs",
		"n": "dsh-plugin-pet-rs",
		"o": "HuanLinOTO",
		"d": "DSH 桌宠（Rust 版），5 态鲸鱼 + 双 SSE 实时推送 + 透明置顶窗 + 系统托盘，三端支持 | DSH desktop pet (Rust edition): 5-state whale + dual SSE real-time push + transparent always-on-top window + tray, cross-platform",
		"s": 13,
		"k": 1,
		"l": "Rust",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T00:55:12Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-pet-rs",
		"p": ""
	},
	{
		"f": "weijiafu14/pi2dsh",
		"n": "pi2dsh",
		"o": "weijiafu14",
		"d": "Bridge the Pi and DeepSeek Harness ecosystems: one Pi Host ABI runs unmodified Pi extensions as native DSH plugins. 打通 Pi 与 DSH 生态。",
		"s": 13,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"compatibility-layer",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"migration",
			"pi",
			"pi-agent",
			"plugin-migration"
		],
		"u": "2026-08-16T10:13:19Z",
		"h": "https://github.com/weijiafu14/pi2dsh",
		"p": ""
	},
	{
		"f": "LAN-TINA-WS/dsh-gui-customization",
		"n": "dsh-gui-customization",
		"o": "LAN-TINA-WS",
		"d": "DeepSeek Harness 时装工坊：给 DSH 界面换装——更改主题配色/自定义背景图/自定义视频背景/可调节氛围灯，中英双语 ·DSH Web UI 时装工坊。",
		"s": 13,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"skin",
			"theme"
		],
		"u": "2026-08-16T04:10:01Z",
		"h": "https://github.com/LAN-TINA-WS/dsh-gui-customization",
		"p": "https://github.com/LAN-TINA-WS/dsh-gui-customization/releases/latest"
	},
	{
		"f": "phoenixlucky/zerotoken-skill",
		"n": "zerotoken-skill",
		"o": "phoenixlucky",
		"d": "让 Agent 高效又守纪律 — 不止省 token：ZeroToken 压缩无效上下文/推理/输出；尉缭子十原则约束权限边界、单一指令、先谋后动、验证先于结束；附 Unicode 编码规范、搜索规范、六种任务模式。More than token savings: ZeroToken efficiency + AI coding discipline for Reasonix / Codex / OpenCode / Hermes",
		"s": 13,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-discipline",
			"ai-agent",
			"ai-workflow",
			"codex",
			"concise-output",
			"context-optimization",
			"dsh-plugin",
			"llm",
			"opencode",
			"prompt-engineering",
			"reasonix",
			"skill",
			"token-budget",
			"token-efficiency",
			"token-efficient",
			"zerotoken"
		],
		"u": "2026-08-14T12:22:23Z",
		"h": "https://github.com/phoenixlucky/zerotoken-skill",
		"p": "https://clawhub.ai/phoenixlucky/zerotoken-skill"
	},
	{
		"f": "songyang0603/ds-spec-loop",
		"n": "ds-spec-loop",
		"o": "songyang0603",
		"d": "Portable Agent Skill for repository-native Spec programming, informed by public DeepSeek Harness engineering patterns.",
		"s": 13,
		"k": 1,
		"l": "",
		"t": [
			"agent-skills",
			"ai-coding",
			"claude-code",
			"codex",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"github-copilot",
			"spec-driven-development",
			"spec-programming",
			"vibe-coding"
		],
		"u": "2026-08-16T10:08:18Z",
		"h": "https://github.com/songyang0603/ds-spec-loop",
		"p": ""
	},
	{
		"f": "nevertoday/dsh-theme-plugin",
		"n": "dsh-theme-plugin",
		"o": "nevertoday",
		"d": "Chinese traditional colors as a DeepSeek Harness theme pack. ",
		"s": 13,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-16T08:51:31Z",
		"h": "https://github.com/nevertoday/dsh-theme-plugin",
		"p": "https://vip.xiaoxiaodong.ai/#project"
	},
	{
		"f": "MarvekG/deepseek-harness-model-config",
		"n": "deepseek-harness-model-config",
		"o": "MarvekG",
		"d": "",
		"s": 13,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:33:42Z",
		"h": "https://github.com/MarvekG/deepseek-harness-model-config",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-gomoku",
		"n": "dsh-gomoku",
		"o": "omdsh-dev",
		"d": "在DSH中与AI下五子棋，也可以让AI对局，看哪个AI棋力更强",
		"s": 13,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T05:42:35Z",
		"h": "https://github.com/omdsh-dev/dsh-gomoku",
		"p": ""
	},
	{
		"f": "chokwinlee/deepseek-harness-desktop",
		"n": "deepseek-harness-desktop",
		"o": "chokwinlee",
		"d": "Compact DeepSeek Harness desktop host. macOS downloads under 90 MB with Tauri; Windows uses Electron.",
		"s": 13,
		"k": 1,
		"l": "Rust",
		"t": [
			"ai-agents",
			"coding-agent",
			"cross-platform",
			"deepseek",
			"deepseek-harness",
			"desktop",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"lightweight",
			"macos",
			"tauri",
			"windows"
		],
		"u": "2026-08-16T10:03:27Z",
		"h": "https://github.com/chokwinlee/deepseek-harness-desktop",
		"p": ""
	},
	{
		"f": "WEP-56/DSH-Launcher",
		"n": "DSH-Launcher",
		"o": "WEP-56",
		"d": "deepseek harness的启动器，非webui二次打包而是webui内嵌，可以适配所有webui强化插件。额外提供dsh包管理、配置文件管理、插件管理、浏览器标签页、多窗口等功能",
		"s": 13,
		"k": 2,
		"l": "Rust",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:27:31Z",
		"h": "https://github.com/WEP-56/DSH-Launcher",
		"p": ""
	},
	{
		"f": "tianji-qingtian/dsh-spec-loop",
		"n": "dsh-spec-loop",
		"o": "tianji-qingtian",
		"d": "Spec-driven 开发闭环（OpenSpec 兼容）：/spec 命令族驱动 生成规格 → 批准 → 实现 → 逐条验收 → 归档 | Spec-driven dev loop (OpenSpec-compatible) for DeepSeek Harness: /spec drives propose → approve → implement → verify → archive",
		"s": 13,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"openspec",
			"spec-driven-development"
		],
		"u": "2026-08-16T05:55:15Z",
		"h": "https://github.com/tianji-qingtian/dsh-spec-loop",
		"p": ""
	},
	{
		"f": "AITabby/dockyard-dsh",
		"n": "dockyard-dsh",
		"o": "AITabby",
		"d": "A macOS-only native account-pool and provider plugin for DeepSeek Harness.",
		"s": 13,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"account-pool",
			"deepseek-harness",
			"dsh-plugin",
			"macos",
			"oauth"
		],
		"u": "2026-08-16T10:01:28Z",
		"h": "https://github.com/AITabby/dockyard-dsh",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-deep-research",
		"n": "dsh-deep-research",
		"o": "omdsh-dev",
		"d": "Adaptive deep-research orchestrator plugin for DeepSeek Harness (official workflow engine, cybernetics/information-theory design)",
		"s": 13,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:24:31Z",
		"h": "https://github.com/omdsh-dev/dsh-deep-research",
		"p": ""
	},
	{
		"f": "huawolf/news-agent",
		"n": "news-agent",
		"o": "huawolf",
		"d": "AI-powered personal news aggregator with LLM scoring, Web console, and push notifications to Feishu/Discord.",
		"s": 12,
		"k": 1,
		"l": "Python",
		"t": [
			"dsh-plugin",
			"news-aggregator",
			"news-worker",
			"rss-reader",
			"vaneworker"
		],
		"u": "2026-08-15T11:09:59Z",
		"h": "https://github.com/huawolf/news-agent",
		"p": ""
	},
	{
		"f": "runzhliu/deepseek-harness-docker",
		"n": "deepseek-harness-docker",
		"o": "runzhliu",
		"d": "Community Docker and Kubernetes packaging for DeepSeek Harness (@deepseek-ai/dsh), with a hardened image, Compose stack, Helm chart, Web UI, and headless CLI.",
		"s": 12,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agent-runtime",
			"ai-agents",
			"cli",
			"deepseek",
			"deepseek-ai",
			"deepseek-harness",
			"docker",
			"docker-compose",
			"docker-image",
			"dockerfile",
			"dsh",
			"dsh-plugin",
			"helm",
			"host-self",
			"kubernetes",
			"llm"
		],
		"u": "2026-08-16T09:22:29Z",
		"h": "https://github.com/runzhliu/deepseek-harness-docker",
		"p": ""
	},
	{
		"f": "amlyczz/dsh-lark-link",
		"n": "dsh-lark-link",
		"o": "amlyczz",
		"d": "High-reliability Feishu/Lark bridge for DeepSeek Harness — QR one-click auth, multi-mode agents, card-based commands, zero-loss outbox, media in/out, session-log doctor, reusable DSH Web GUI",
		"s": 12,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"bot",
			"bridge",
			"deepseek-harness",
			"dsh-plugin",
			"feishu",
			"lark"
		],
		"u": "2026-08-16T08:23:44Z",
		"h": "https://github.com/amlyczz/dsh-lark-link",
		"p": ""
	},
	{
		"f": "cosyncing/cosyncing",
		"n": "cosyncing",
		"o": "cosyncing",
		"d": "Synchronize and Orchestrate agents from CLI to GUI, across desktop to phone.",
		"s": 12,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"ade",
			"agent-orchestration",
			"agents",
			"ai-agents",
			"ai-agents-framework",
			"ai-agents-platform",
			"claude-code",
			"codex",
			"codex-cli",
			"dsh-plugin",
			"ide",
			"opencode",
			"orchestration",
			"pi"
		],
		"u": "2026-08-16T07:50:56Z",
		"h": "https://github.com/cosyncing/cosyncing",
		"p": "https://cosyncing.com"
	},
	{
		"f": "chenw2759-wq/dsh-IDE",
		"n": "dsh-IDE",
		"o": "chenw2759-wq",
		"d": "dsh-IDE 把 DeepSeek Harness（DSH）网页版升级成一站式 IDE：JupyterLab 式文件树、带语法高亮的代码编辑、多格式预览、Trae 风格红绿 diff 和内置终端，再加上「本地大脑、远程手脚」的 SSH 远程工作区，让 AI 直接在本机操控远程服务器，全程零配置文件改动。",
		"s": 12,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:57:12Z",
		"h": "https://github.com/chenw2759-wq/dsh-IDE",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-better-sidebar-plugin-office",
		"n": "dsh-plugin-better-sidebar-plugin-office",
		"o": "HuanLinOTO",
		"d": "为 better-sidebar 提供 Office 三件套预览（.docx/.xlsx/.pptx），独立 bundle 瘦身主体 | Provides Office-suite preview (.docx/.xlsx/.pptx) for better-sidebar as a separate bundle to slim the core",
		"s": 12,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-better-sidebar", "dsh-plugin"],
		"u": "2026-08-16T04:10:57Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-better-sidebar-plugin-office",
		"p": ""
	},
	{
		"f": "biociao/dsh-science",
		"n": "dsh-science",
		"o": "biociao",
		"d": "",
		"s": 12,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T06:48:47Z",
		"h": "https://github.com/biociao/dsh-science",
		"p": ""
	},
	{
		"f": "1841220388zzzcccxxx-star/dsh-git-graph",
		"n": "dsh-git-graph",
		"o": "1841220388zzzcccxxx-star",
		"d": "Embedded git repository graph visualizer for the DeepSeek Harness Web GUI | 嵌入式 Git 仓库图谱可视化插件（提交历史图 / 分支过滤 / 文件 diff / VSCode 式未提交改动）",
		"s": 12,
		"k": 2,
		"l": "HTML",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"git",
			"git-graph"
		],
		"u": "2026-08-16T07:18:48Z",
		"h": "https://github.com/1841220388zzzcccxxx-star/dsh-git-graph",
		"p": ""
	},
	{
		"f": "agi-fans/oh-my-dsh",
		"n": "oh-my-dsh",
		"o": "agi-fans",
		"d": "omdsh is a plugin-first terminal coding agent built on DeepSeek Harness, with an interaction model inspired by oh-my-pi.",
		"s": 12,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"harness",
			"oh-my-pi",
			"omdsh",
			"tui"
		],
		"u": "2026-08-16T07:34:19Z",
		"h": "https://github.com/agi-fans/oh-my-dsh",
		"p": ""
	},
	{
		"f": "N0zoM1z0/vocaloid-mcp",
		"n": "vocaloid-mcp",
		"o": "N0zoM1z0",
		"d": "An agent-native MCP for composing, tuning, rendering, mixing, and auditing native VOCALOID3/4 projects — built just for fun.",
		"s": 12,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"audio-engineering",
			"codex",
			"computer-music",
			"dsh-plugin",
			"generative-music",
			"mcp",
			"model-context-protocol",
			"music-production",
			"typescript",
			"vocaloid",
			"vocaloid3",
			"vsqx"
		],
		"u": "2026-08-15T17:15:26Z",
		"h": "https://github.com/N0zoM1z0/vocaloid-mcp",
		"p": ""
	},
	{
		"f": "Yan-Zero/dsh-codex",
		"n": "dsh-codex",
		"o": "Yan-Zero",
		"d": "Use your ChatGPT subscription in DeepSeek Harness through OpenAI's Codex sign-in flow",
		"s": 12,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T07:48:15Z",
		"h": "https://github.com/Yan-Zero/dsh-codex",
		"p": ""
	},
	{
		"f": "shuguang1994/project-blueprint",
		"n": "project-blueprint",
		"o": "shuguang1994",
		"d": "Make any project AI-agent-ready in one command. Adaptive tech stack detection (7 languages × 14 frameworks × 61 components), auto-generates AGENTS.md, docs skeleton, CI/CD, and testing infrastructure. 一句话让任何项目具备 AI 开发能力。",
		"s": 12,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"ai-coding",
			"claude-code",
			"codex",
			"coding-conventions",
			"cursor",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"harness-engineering",
			"opencode",
			"scaffolding",
			"skills",
			"spec-driven"
		],
		"u": "2026-08-15T11:10:07Z",
		"h": "https://github.com/shuguang1994/project-blueprint",
		"p": ""
	},
	{
		"f": "ayuanwong/deepseek-harness-ux",
		"n": "deepseek-harness-ux",
		"o": "ayuanwong",
		"d": "长任务，不刷屏：关键进度清晰可见，完成后自动折叠，详情随时展开。 Long agent tasks, without transcript clutter: focused progress, auto-folded history, details on demand.",
		"s": 12,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-harness",
			"ai-agent",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"typescript",
			"web-ui"
		],
		"u": "2026-08-16T08:54:03Z",
		"h": "https://github.com/ayuanwong/deepseek-harness-ux",
		"p": ""
	},
	{
		"f": "Yan-Zero/dsh-codex",
		"n": "dsh-codex",
		"o": "Yan-Zero",
		"d": "Use your ChatGPT subscription in DeepSeek Harness through OpenAI's Codex sign-in flow",
		"s": 12,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T07:48:15Z",
		"h": "https://github.com/Yan-Zero/dsh-codex",
		"p": ""
	},
	{
		"f": "xiake595/touhou-hakurei",
		"n": "touhou-hakurei",
		"o": "xiake595",
		"d": "灵梦（Reimu）·博丽神社（东方Project）美化版皮肤：神社昼夜实景背景、灵梦立绘、画框侧边栏与输入框、纸白透明界面 — DeepSeek Harness Web GUI skin",
		"s": 12,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"anime",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-skin",
			"skin",
			"touhou"
		],
		"u": "2026-08-16T07:11:23Z",
		"h": "https://github.com/xiake595/touhou-hakurei",
		"p": ""
	},
	{
		"f": "dingkaihu63/dsh-robotic-harness",
		"n": "dsh-robotic-harness",
		"o": "dingkaihu63",
		"d": "Robotic Harness: embodied-intelligence research tools for DeepSeek Harness - robot asset inspection, MuJoCo pick-place simulation with fault injection, evidence-based diagnostics, and reproducible experiment bundles.",
		"s": 12,
		"k": 2,
		"l": "Python",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"embodied-ai",
			"mujoco",
			"robotics"
		],
		"u": "2026-08-14T23:54:28Z",
		"h": "https://github.com/dingkaihu63/dsh-robotic-harness",
		"p": ""
	},
	{
		"f": "linenxi-ctrl/dsh-vision",
		"n": "dsh-vision",
		"o": "linenxi-ctrl",
		"d": "为 DeepSeek Harness 增加外挂识图模型：圆形鲸鱼按钮、发送图片识图自动回传、模型自主截图+识图工具、多协议自动适配、小白一键安装（未装 Node.js 自动下载）",
		"s": 11,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"harness",
			"image-recognition",
			"llm",
			"ocr",
			"plugin",
			"screenshot",
			"vision"
		],
		"u": "2026-08-15T15:01:59Z",
		"h": "https://github.com/linenxi-ctrl/dsh-vision",
		"p": ""
	},
	{
		"f": "LiangYin233/dsh-provider-model-configurator",
		"n": "dsh-provider-model-configurator",
		"o": "LiangYin233",
		"d": "DSH 模型 Pro:为 DSH WebUI 提供将 pi-ai 预设或任意已配置提供商的模型上下文、输出上限、推理档位与兼容开关一键应用到目标提供商,并集中查看、新建、编辑、复制与删除各提供商模型条目的能力。",
		"s": 11,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T04:02:19Z",
		"h": "https://github.com/LiangYin233/dsh-provider-model-configurator",
		"p": ""
	},
	{
		"f": "Lixiaoyiao/deepseek-harness-action",
		"n": "deepseek-harness-action",
		"o": "Lixiaoyiao",
		"d": "Community GitHub Action for DeepSeek Harness — AI Code Review · CI Diagnosis · Auto Fix · Issue → PR",
		"s": 11,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"ci-cd",
			"code-review",
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"github-actions"
		],
		"u": "2026-08-15T12:20:17Z",
		"h": "https://github.com/Lixiaoyiao/deepseek-harness-action",
		"p": ""
	},
	{
		"f": "franksong2702/dsh-codex-connect",
		"n": "dsh-codex-connect",
		"o": "franksong2702",
		"d": "ChatGPT OAuth and Codex models for DeepSeek Harness.",
		"s": 11,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"chatgpt",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"oauth"
		],
		"u": "2026-08-16T06:34:23Z",
		"h": "https://github.com/franksong2702/dsh-codex-connect",
		"p": "https://www.npmjs.com/package/dsh-codex-connect"
	},
	{
		"f": "cyijun/dsh-surfing-plugin",
		"n": "dsh-surfing-plugin",
		"o": "cyijun",
		"d": "SearXNG search and Crawl4AI fetch providers for DeepSeek Harness",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"web-fetch",
			"web-search",
			"webfetch",
			"websearch"
		],
		"u": "2026-08-15T13:12:54Z",
		"h": "https://github.com/cyijun/dsh-surfing-plugin",
		"p": ""
	},
	{
		"f": "fredalxin/dsh-solo-thinking",
		"n": "dsh-solo-thinking",
		"o": "fredalxin",
		"d": "Solo-style isolated brainstorm branches and Handoffs for DeepSeek Harness",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"brainstorming",
			"deepseek-harness",
			"dsh-plugin",
			"handoff",
			"typescript"
		],
		"u": "2026-08-16T07:27:50Z",
		"h": "https://github.com/fredalxin/dsh-solo-thinking",
		"p": ""
	},
	{
		"f": "Zhenyu98/dsh-context-doctor",
		"n": "dsh-context-doctor",
		"o": "Zhenyu98",
		"d": "DSH 上下文注入审计插件：统计 AGENTS.md 指令链/技能目录/工具 schema 的 token 成本，检测重复与冲突；Web UI 圆环面板 + context_audit 工具。Context Doctor for DeepSeek Harness: audit instruction-chain / skill catalog / tool schemas token cost.",
		"s": 11,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"context",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"tool",
			"ui"
		],
		"u": "2026-08-16T08:02:24Z",
		"h": "https://github.com/Zhenyu98/dsh-context-doctor",
		"p": ""
	},
	{
		"f": "pengyue-polaron/deepseek-harness-genui",
		"n": "deepseek-harness-genui",
		"o": "pengyue-polaron",
		"d": "Code-first generative UI for DeepSeek Harness",
		"s": 11,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"generative-ui",
			"genui",
			"mcp",
			"react"
		],
		"u": "2026-08-16T09:33:26Z",
		"h": "https://github.com/pengyue-polaron/deepseek-harness-genui",
		"p": ""
	},
	{
		"f": "Moeblack/deepseek-manners",
		"n": "deepseek-manners",
		"o": "Moeblack",
		"d": "DSH 插件：给每次消息后注入感谢语 | DSH plugin: inject a thank-you line after every message (deepseek-manners)",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T14:43:37Z",
		"h": "https://github.com/Moeblack/deepseek-manners",
		"p": ""
	},
	{
		"f": "CraZY222123/dsh-ocr-plugin",
		"n": "dsh-ocr-plugin",
		"o": "CraZY222123",
		"d": "",
		"s": 11,
		"k": 0,
		"l": "Python",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:26:24Z",
		"h": "https://github.com/CraZY222123/dsh-ocr-plugin",
		"p": ""
	},
	{
		"f": "AnacondaKC/dsh-stock-market",
		"n": "dsh-stock-market",
		"o": "AnacondaKC",
		"d": "有效解决了写代码的时候账户不能同时亏钱的BUG",
		"s": 11,
		"k": 3,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T14:27:46Z",
		"h": "https://github.com/AnacondaKC/dsh-stock-market",
		"p": ""
	},
	{
		"f": "suzike/freestyle-dsh-theme",
		"n": "freestyle-dsh-theme",
		"o": "suzike",
		"d": "DeepSeek Harness 主题体验插件：OKLCH 主题提案 + 主题设计器（跨重启持久化）",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"oklch",
			"theme"
		],
		"u": "2026-08-16T02:44:33Z",
		"h": "https://github.com/suzike/freestyle-dsh-theme",
		"p": ""
	},
	{
		"f": "starslittle/dsh-queue-plus",
		"n": "dsh-queue-plus",
		"o": "starslittle",
		"d": "DSH 排队消息增强面板：编辑、删除、插话、排序与批量删除功能",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"prompt-queue"
		],
		"u": "2026-08-16T09:03:11Z",
		"h": "https://github.com/starslittle/dsh-queue-plus",
		"p": ""
	},
	{
		"f": "chyra-moon/deepseek-harness-desktop",
		"n": "deepseek-harness-desktop",
		"o": "chyra-moon",
		"d": "DeepSeek Harness desktop shell: 1:1 replica of the official web UI as a Windows desktop app (community project)",
		"s": 11,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"community-project",
			"deepseek",
			"desktop",
			"dsh-plugin",
			"electron",
			"windows"
		],
		"u": "2026-08-15T18:53:11Z",
		"h": "https://github.com/chyra-moon/deepseek-harness-desktop",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-advisor",
		"n": "dsh-advisor",
		"o": "omdsh-dev",
		"d": "Advisor - Pair a second model that passively reviews each turn and injects notes.  搭配一个会在每轮对话被动注入见解和审查的副模型。",
		"s": 11,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"advisor",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T04:58:41Z",
		"h": "https://github.com/omdsh-dev/dsh-advisor",
		"p": ""
	},
	{
		"f": "Zephyr-vibe/dsh-archived-sessions",
		"n": "dsh-archived-sessions",
		"o": "Zephyr-vibe",
		"d": "DSH Session Manager: manage conversations, archive/restore, delete safely, open record folders.",
		"s": 11,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"plugin",
			"plugins",
			"session-manager"
		],
		"u": "2026-08-16T08:57:23Z",
		"h": "https://github.com/Zephyr-vibe/dsh-archived-sessions",
		"p": ""
	},
	{
		"f": "knqiufan/powercontext-dsh",
		"n": "powercontext-dsh",
		"o": "knqiufan",
		"d": "DeepSeek Harness plugin that connects to a PowerContext Server over HTTP for recall, memory, handoff, experience, and skills.",
		"s": 11,
		"k": 1,
		"l": "TypeScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T06:25:30Z",
		"h": "https://github.com/knqiufan/powercontext-dsh",
		"p": ""
	},
	{
		"f": "yuezengwu/dsh-explain",
		"n": "dsh-explain",
		"o": "yuezengwu",
		"d": "DSH 本地优先学习模式插件：跨会话全局学习线程、按来源讲解、ExplainContext、压缩与可诊断设置界面",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T09:23:30Z",
		"h": "https://github.com/yuezengwu/dsh-explain",
		"p": ""
	},
	{
		"f": "Hilbert-beinghappy/seektty",
		"n": "seektty",
		"o": "Hilbert-beinghappy",
		"d": "Pluggable DeepSeek-colored TUI for DeepSeek Harness",
		"s": 11,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agentic-ai",
			"ai-agent",
			"cli",
			"coding-agent",
			"command-line",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"linux",
			"llm",
			"macos",
			"seektty",
			"syntax-highlighting",
			"terminal",
			"terminal-ui",
			"tui",
			"typescript",
			"vscode-theme"
		],
		"u": "2026-08-16T09:16:55Z",
		"h": "https://github.com/Hilbert-beinghappy/seektty",
		"p": ""
	},
	{
		"f": "AHGGG/dsh-side-chat",
		"n": "dsh-side-chat",
		"o": "AHGGG",
		"d": "Codex-style Side Chat for DeepSeek Harness — select text, ask follow-up questions in a focused side conversation, and keep the main chat uninterrupted.",
		"s": 11,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"codex",
			"codex-desktop",
			"dsh",
			"dsh-plugin",
			"side-chat",
			"sidechat"
		],
		"u": "2026-08-16T08:41:43Z",
		"h": "https://github.com/AHGGG/dsh-side-chat",
		"p": ""
	},
	{
		"f": "kxh4892636/pi-deepseek-anchor",
		"n": "pi-deepseek-anchor",
		"o": "kxh4892636",
		"d": "pi extension: DeepSeek V4 Pro Minimal-anchored bootstrap, then full Standard tools (port of dsh-anchored-standard)",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"pi-agent",
			"pi-extension",
			"pi-package"
		],
		"u": "2026-08-16T08:59:42Z",
		"h": "https://github.com/kxh4892636/pi-deepseek-anchor",
		"p": ""
	},
	{
		"f": "bill9109/dsh-drag-and-drop",
		"n": "dsh-drag-and-drop",
		"o": "bill9109",
		"d": "为 DSH Web UI 增加跨平台文件拖拽与原始路径插入能力，无需复制文件",
		"s": 11,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T04:26:33Z",
		"h": "https://github.com/bill9109/dsh-drag-and-drop",
		"p": ""
	},
	{
		"f": "isomoes/ikanban",
		"n": "ikanban",
		"o": "isomoes",
		"d": "Monorepo for the iKanban browser-surface fork for DeepSeek Harness.",
		"s": 11,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"dsh",
			"dsh-plugin",
			"ikanban",
			"multi-agent"
		],
		"u": "2026-08-16T10:01:08Z",
		"h": "https://github.com/isomoes/ikanban",
		"p": "https://www.npmjs.com/package/@isomoes/dsh-ikanban"
	},
	{
		"f": "anweat/dsh-web-search-pro",
		"n": "dsh-web-search-pro",
		"o": "anweat",
		"d": "Enhanced, persistent web search plugin for DeepSeek Harness (multi-engine search, SQLite+LRU cache, platform backends, Playwright rendering)",
		"s": 11,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"web-search"
		],
		"u": "2026-08-16T07:58:17Z",
		"h": "https://github.com/anweat/dsh-web-search-pro",
		"p": ""
	},
	{
		"f": "fakechris/dsh-harness-ops",
		"n": "dsh-harness-ops",
		"o": "fakechris",
		"d": "DSH 运维工具箱：升级、重启、故障都不用操心。① 官方每日快照 A/B 双槽轮换——旧插件迁移+构建+验收全过才原子切换，一键回滚，旧版本永远兜底；② 守护 10s 自动拉起 web + agent 断点自动续接，重启无人值守；③ web 全挂（A/B 都坏、agent 不可用）时 dsh-doctor 一条命令自救：九项诊断→机械修复配置→LLM 深度检测修复（完整推理实时可见）→拉起 web。install via: git clone + bash scripts/install.sh",
		"s": 11,
		"k": 1,
		"l": "Shell",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"ops",
			"restart",
			"self-heal",
			"snapshot-ab"
		],
		"u": "2026-08-16T09:30:00Z",
		"h": "https://github.com/fakechris/dsh-harness-ops",
		"p": ""
	},
	{
		"f": "alib8b8/aflare",
		"n": "aflare",
		"o": "alib8b8",
		"d": "本地优先的自动化 Agent · 数据不出本地 · 连接你自己的 LLM / 数据库 / 知识库 · ReAct 推理 · 300+ 技能模板 · 确定性工作流执行（DAG/WAL/Saga/幂等） · MCP 协议 · 离线/内网可用",
		"s": 11,
		"k": 3,
		"l": "Go",
		"t": [
			"agent",
			"automation",
			"cordis",
			"dag",
			"data-protection",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"go",
			"llm",
			"local-first",
			"mcp",
			"offline",
			"ollama",
			"privacy",
			"rag",
			"react",
			"saga",
			"workflow"
		],
		"u": "2026-08-16T10:26:32Z",
		"h": "https://github.com/alib8b8/aflare",
		"p": "https://github.com/alib8b8/aflare"
	},
	{
		"f": "imsai-sh/awesome-deepseek-harness-plugins",
		"n": "awesome-deepseek-harness-plugins",
		"o": "imsai-sh",
		"d": "DeepSeek Harness plugin store, marketplace and hub — 3,100+ dsh plugins with search, rankings, install commands and a free public API. DeepSeek Harness 插件市场 / 插件商店：自动收集与格式校验，免费搜索 API。deepseek1024.com",
		"s": 11,
		"k": 7,
		"l": "TypeScript",
		"t": [
			"awesome-list",
			"catalog",
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugins",
			"deepseek1024",
			"dsh",
			"dsh-1024store",
			"dsh-bundle",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins",
			"dsh-skill",
			"marketplace",
			"plugin-directory",
			"plugin-hub",
			"plugin-store",
			"plugins",
			"registry"
		],
		"u": "2026-08-16T08:54:43Z",
		"h": "https://github.com/imsai-sh/awesome-deepseek-harness-plugins",
		"p": "https://deepseek1024.com/"
	},
	{
		"f": "LaplaceYoung/dsh-qq2006",
		"n": "dsh-qq2006",
		"o": "LaplaceYoung",
		"d": "DSH (DeepSeek Harness) 的 QQ2006 皮肤插件：注册 qq2006 主题、镜像 body[data-ds-skin]、全局皮肤表与完整素材",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"dsh-skin",
			"qq2006",
			"theme"
		],
		"u": "2026-08-15T16:13:12Z",
		"h": "https://github.com/LaplaceYoung/dsh-qq2006",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-security-audit",
		"n": "dsh-security-audit",
		"o": "omdsh-dev",
		"d": "DSH 本机安全审计插件：配置/插件来源/会话/网络暴露面，只读脱敏风险报告",
		"s": 11,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"audit",
			"dsh",
			"dsh-plugin",
			"secret-scanning",
			"security"
		],
		"u": "2026-08-15T16:21:39Z",
		"h": "https://github.com/omdsh-dev/dsh-security-audit",
		"p": ""
	},
	{
		"f": "hchao3335-maker/dsh-lan-gate",
		"n": "dsh-lan-gate",
		"o": "hchao3335-maker",
		"d": "一个DSH内网访问插件 局域网设备安全访问本机 DSH 的即插即用网关：本机审批、设备令牌、限流、手机适配，单文件零依赖。",
		"s": 11,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T07:06:22Z",
		"h": "https://github.com/hchao3335-maker/dsh-lan-gate",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-plugin-dev",
		"n": "dsh-plugin-dev",
		"o": "omdsh-dev",
		"d": "DSH 插件开发踩坑与做法档案（skill + 文档）：cordis 双副本、tsconfig 三件套、Windows junction、多帧 zstd 等实测记录",
		"s": 11,
		"k": 1,
		"l": "",
		"t": [
			"best-practices",
			"documentation",
			"dsh",
			"dsh-plugin",
			"skill"
		],
		"u": "2026-08-15T21:06:51Z",
		"h": "https://github.com/omdsh-dev/dsh-plugin-dev",
		"p": ""
	},
	{
		"f": "gameswu/dsh-plugin-background",
		"n": "dsh-plugin-background",
		"o": "gameswu",
		"d": "dsh壁纸插件",
		"s": 10,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:56:05Z",
		"h": "https://github.com/gameswu/dsh-plugin-background",
		"p": ""
	},
	{
		"f": "zhaiyateng/dsh-design-skills",
		"n": "dsh-design-skills",
		"o": "zhaiyateng",
		"d": "Design aesthetics skill pack for DeepSeek Harness (DSH) - keeps vibe-coded websites away from the AI look. 6 styles: dark-saas, apple-minimal, neo-neumorphism, brutalism, glassmorphism, japanese-minimal.",
		"s": 10,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"design-skills",
			"design-system",
			"dsh-plugin",
			"ui",
			"vibe-coding",
			"web-design"
		],
		"u": "2026-08-15T15:43:00Z",
		"h": "https://github.com/zhaiyateng/dsh-design-skills",
		"p": ""
	},
	{
		"f": "01Virex/dsh-status-rotator",
		"n": "dsh-status-rotator",
		"o": "01Virex",
		"d": "A DeepSeek Harness (dsh) web plugin that replaces the \"Deep diving…\" turn-status label with phase-aware, typewriter-animated, rainbow-gradient phrases — all configurable from a JSON file.",
		"s": 10,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T06:14:13Z",
		"h": "https://github.com/01Virex/dsh-status-rotator",
		"p": ""
	},
	{
		"f": "chen-001/dsh-grok-tui",
		"n": "dsh-grok-tui",
		"o": "chen-001",
		"d": "Use dsh via grok-build's TUI.",
		"s": 10,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T19:20:22Z",
		"h": "https://github.com/chen-001/dsh-grok-tui",
		"p": ""
	},
	{
		"f": "xtxo/dsh-ui",
		"n": "dsh-ui",
		"o": "xtxo",
		"d": "DeepSeek Harness desktop",
		"s": 10,
		"k": 1,
		"l": "Rust",
		"t": [
			"deepseek",
			"deepseek-desktop",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T06:03:22Z",
		"h": "https://github.com/xtxo/dsh-ui",
		"p": "https://xtxo.github.io/dsh-ui/"
	},
	{
		"f": "railgun0325/dsh-phone",
		"n": "dsh-phone",
		"o": "railgun0325",
		"d": "让 DeepSeek Harness 的 agent 跑在手机里，通过 Magisk root 原生操作安卓系统（截图/点击/滑动/开应用）+ 移动端布局 + WebView APK",
		"s": 10,
		"k": 1,
		"l": "Java",
		"t": [
			"agent",
			"android",
			"deepseek-harness",
			"dsh-plugin",
			"termux"
		],
		"u": "2026-08-16T09:35:19Z",
		"h": "https://github.com/railgun0325/dsh-phone",
		"p": ""
	},
	{
		"f": "loudMore/dsh-drop-to-path",
		"n": "dsh-drop-to-path",
		"o": "loudMore",
		"d": "DSH 插件:图片与文件直达纯文本模型——图片保留原生附件体验,PDF/Office/压缩包/视频/音频显示为附件栏方块,点击发送时自动转为工作区路径,配合 dsh-vision-toolkit 粘贴即看图。A DSH plugin that delivers images AND files to text-only models as workspace paths: images keep the native attachment UI, other files show as square chips in the rail, paths append on send — pairs with dsh-vision-toolkit.",
		"s": 10,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"agent",
			"attachments",
			"deepseek",
			"deepseek-harness",
			"drag-and-drop",
			"dsh",
			"dsh-plugin",
			"file-upload",
			"plugin",
			"text-only-llm",
			"vision"
		],
		"u": "2026-08-15T19:01:56Z",
		"h": "https://github.com/loudMore/dsh-drop-to-path",
		"p": ""
	},
	{
		"f": "Bin-hy/dsh",
		"n": "dsh",
		"o": "Bin-hy",
		"d": "源码级拆解 DeepSeek Harness · 面向 Agent 开发者的中文学习资料",
		"s": 10,
		"k": 0,
		"l": "",
		"t": [
			"ai-agents",
			"codis",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"harness",
			"learning"
		],
		"u": "2026-08-15T02:23:25Z",
		"h": "https://github.com/Bin-hy/dsh",
		"p": "https://deepseek-docs.pages.dev"
	},
	{
		"f": "Fishsb/dsh-prompt-enhancer",
		"n": "dsh-prompt-enhancer",
		"o": "Fishsb",
		"d": "DeepSeek Harness DSH 提示词增强插件：✨ 一键优化草稿，增强提示词。",
		"s": 10,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"plugin",
			"prompt-engineering"
		],
		"u": "2026-08-16T10:08:41Z",
		"h": "https://github.com/Fishsb/dsh-prompt-enhancer",
		"p": ""
	},
	{
		"f": "xlight/deepseek-visionary",
		"n": "deepseek-visionary",
		"o": "xlight",
		"d": "使用 DeepSeek 官方多模态视觉模型让你的 Agent 不再眼瞎（支持 DSH、Zed、OpenCode、Codex、Claude Code、Cursor、Claude Desktop）",
		"s": 10,
		"k": 1,
		"l": "Rust",
		"t": [
			"agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"harness",
			"mcp",
			"mcp-server",
			"skills"
		],
		"u": "2026-08-16T04:25:37Z",
		"h": "https://github.com/xlight/deepseek-visionary",
		"p": ""
	},
	{
		"f": "ChenRuoT/dsh-sidebar-qa",
		"n": "dsh-sidebar-qa",
		"o": "ChenRuoT",
		"d": "一个基于DSH-better-sidebar的侧边栏提问tab，实现类codex的侧边提问或claude code的/btw功能",
		"s": 10,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-better-sidebar",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"sidebar"
		],
		"u": "2026-08-16T09:49:25Z",
		"h": "https://github.com/ChenRuoT/dsh-sidebar-qa",
		"p": ""
	},
	{
		"f": "fuhefei/dsh-sentinel",
		"n": "dsh-sentinel",
		"o": "fuhefei",
		"d": "Condition-driven wakeup for DeepSeek Harness: durable file/command/http/process/webhook watches that wake the agent, with dock, sidebar branch, and a global dashboard.",
		"s": 10,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-better-sidebar",
			"dsh-plugin"
		],
		"u": "2026-08-16T05:41:42Z",
		"h": "https://github.com/fuhefei/dsh-sentinel",
		"p": ""
	},
	{
		"f": "weinibuliu/deepseek-harness-vsc-extension",
		"n": "deepseek-harness-vsc-extension",
		"o": "weinibuliu",
		"d": "DeepSeek Harness as VSCode Extension",
		"s": 10,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"dsh",
			"dsh-plugin",
			"vscode",
			"vscode-extension"
		],
		"u": "2026-08-16T03:11:32Z",
		"h": "https://github.com/weinibuliu/deepseek-harness-vsc-extension",
		"p": "https://marketplace.visualstudio.com/items?itemName=weinibuliu.dsh-vsc"
	},
	{
		"f": "kanghelyu/dsh-deepseek-flow",
		"n": "dsh-deepseek-flow",
		"o": "kanghelyu",
		"d": "",
		"s": 10,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-workflow",
			"dark-mode",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"flow-editor",
			"markdown",
			"visual-workflow",
			"visualization",
			"workflow",
			"workflow-builder",
			"workflow-management"
		],
		"u": "2026-08-16T09:42:00Z",
		"h": "https://github.com/kanghelyu/dsh-deepseek-flow",
		"p": "https://deepseekflow.kanghelyu.org/"
	},
	{
		"f": "billLiao/awesome-dsh-plugin",
		"n": "awesome-dsh-plugin",
		"o": "billLiao",
		"d": "A curated list of plugins for DeepSeek Harness (dsh) — 精选 DeepSeek Harness 插件列表",
		"s": 10,
		"k": 5,
		"l": "Shell",
		"t": [
			"awesome",
			"awesome-list",
			"curated-list",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:04:08Z",
		"h": "https://github.com/billLiao/awesome-dsh-plugin",
		"p": ""
	},
	{
		"f": "XCNXNXNX/dsh-portable-tavern",
		"n": "dsh-portable-tavern",
		"o": "XCNXNXNX",
		"d": "DeepSeek Harness 的「便携酒馆」插件：RPG 式 SillyTavern V2/V3 角色卡生成器 + 酒馆角色扮演聊天。支持世界书、角色卡 JSON/PNG 导入导出、面板主题与本地音乐。独立插件，仅依赖官方 @deepseek-ai SDK。",
		"s": 10,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"character-card",
			"dsh",
			"dsh-plugin",
			"roleplay",
			"sillytavern"
		],
		"u": "2026-08-16T09:51:52Z",
		"h": "https://github.com/XCNXNXNX/dsh-portable-tavern",
		"p": ""
	},
	{
		"f": "gxpppp/dsh-search-mcp",
		"n": "dsh-search-mcp",
		"o": "gxpppp",
		"d": "Replace dsh's built-in web search with search MCP servers (Tavily/Brave/Exa/Perplexity/DuckDuckGo/custom), configured from the web Settings page. Disables the built-in DeepSeek search provider while enabled.",
		"s": 10,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"mcp",
			"search"
		],
		"u": "2026-08-16T10:20:45Z",
		"h": "https://github.com/gxpppp/dsh-search-mcp",
		"p": ""
	},
	{
		"f": "icodesign/orbis",
		"n": "orbis",
		"o": "icodesign",
		"d": "A mobile client for deepseek harness remote control",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:30:36Z",
		"h": "https://github.com/icodesign/orbis",
		"p": ""
	},
	{
		"f": "Miyazawai/dsh-client-pricing",
		"n": "dsh-client-pricing",
		"o": "Miyazawai",
		"d": "会话顶栏实时显示 DeepSeek API 价格（峰谷定价 / 现行一口价，flash / pro 自动切换） | DeepSeek Harness client plugin: live DeepSeek API pricing badge (peak/off-peak, flash/pro) in the session header",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"pricing"
		],
		"u": "2026-08-16T07:34:21Z",
		"h": "https://github.com/Miyazawai/dsh-client-pricing",
		"p": ""
	},
	{
		"f": "sulfide2085/dsh-skill-manager",
		"n": "dsh-skill-manager",
		"o": "sulfide2085",
		"d": "在 DeepSeek Harness 设置页统一管理 DSH / Codex / Claude 的 AI 技能：热开关启停、GitHub 技能市场一键发现安装、本地 ZIP 导入（dsh-plugin skill hub）",
		"s": 9,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T12:10:35Z",
		"h": "https://github.com/sulfide2085/dsh-skill-manager",
		"p": ""
	},
	{
		"f": "Small-tailqwq/dsh-deepcel",
		"n": "dsh-deepcel",
		"o": "Small-tailqwq",
		"d": "一款模仿 excel 的 dsh 皮肤",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:19:17Z",
		"h": "https://github.com/Small-tailqwq/dsh-deepcel",
		"p": ""
	},
	{
		"f": "MAXeaglet/dsh-bash-terminal",
		"n": "dsh-bash-terminal",
		"o": "MAXeaglet",
		"d": "",
		"s": 9,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T17:23:00Z",
		"h": "https://github.com/MAXeaglet/dsh-bash-terminal",
		"p": ""
	},
	{
		"f": "rirko/dsh-melody-launcher",
		"n": "dsh-melody-launcher",
		"o": "rirko",
		"d": "dsh-旋律启动器：DeepSeek Harness 桌面启动器与插件管理器",
		"s": 9,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"electron",
			"launcher",
			"plugin-manager",
			"windows"
		],
		"u": "2026-08-16T08:03:04Z",
		"h": "https://github.com/rirko/dsh-melody-launcher",
		"p": ""
	},
	{
		"f": "FlytoMAYDAY80/dsh-pet",
		"n": "dsh-pet",
		"o": "FlytoMAYDAY80",
		"d": "🐋 DSH 有声桌宠：悬浮桌面的 DeepSeek 小鲸鱼，不打开 DSH 也能实时感知会话状态（需要确认/工作中/完成/空闲/离线），支持音效提醒与零代码定制素材",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"macos",
			"pet"
		],
		"u": "2026-08-16T09:13:27Z",
		"h": "https://github.com/FlytoMAYDAY80/dsh-pet",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-plugin-skills",
		"n": "dsh-plugin-skills",
		"o": "omdsh-dev",
		"d": "Agent skills for building and testing DeepSeek Harness plugins — from scaffolding a new plugin package to choosing the right test tiers, entirely inside an agent session.",
		"s": 9,
		"k": 1,
		"l": "",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:10:45Z",
		"h": "https://github.com/omdsh-dev/dsh-plugin-skills",
		"p": ""
	},
	{
		"f": "bobleer/dsh-acp-for-bitfun",
		"n": "dsh-acp-for-bitfun",
		"o": "bobleer",
		"d": "BitFun 与 DSH ACP 交互对接 插件",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"bitfun",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-13T16:39:00Z",
		"h": "https://github.com/bobleer/dsh-acp-for-bitfun",
		"p": ""
	},
	{
		"f": "Totoro-qaq/Cobsidian",
		"n": "Cobsidian",
		"o": "Totoro-qaq",
		"d": "Agent-agnostic workflow skill for maintaining Obsidian knowledge bases",
		"s": 9,
		"k": 2,
		"l": "Python",
		"t": [
			"agent-skill",
			"ai-agent",
			"codex",
			"dsh-plugin",
			"knowledge-base",
			"markdown",
			"obsidian"
		],
		"u": "2026-08-15T23:03:40Z",
		"h": "https://github.com/Totoro-qaq/Cobsidian",
		"p": ""
	},
	{
		"f": "techysy/deepseek-harness-fnos",
		"n": "deepseek-harness-fnos",
		"o": "techysy",
		"d": "DeepSeek Harness (DeepSeek 官方 agent 浏览器 UI) fnOS 应用 — 本地常驻服务",
		"s": 9,
		"k": 1,
		"l": "Shell",
		"t": [
			"agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"fnos",
			"fnos-app",
			"fnos-appcenter",
			"fnos-nas",
			"nas",
			"self-hosted"
		],
		"u": "2026-08-16T06:55:59Z",
		"h": "https://github.com/techysy/deepseek-harness-fnos",
		"p": ""
	},
	{
		"f": "GoalfyAI/goalfydata",
		"n": "goalfydata",
		"o": "GoalfyAI",
		"d": "A shared data backend for AI agents and authorized teams.",
		"s": 9,
		"k": 0,
		"l": "Shell",
		"t": [
			"agent-skills",
			"ai-agents",
			"ai-agents-automation",
			"claude-code",
			"codex",
			"data-apps",
			"data-assets",
			"data-governance",
			"deepseek-harness",
			"dsh-plugin",
			"goalfydata",
			"mcp",
			"mcp-tools",
			"model-context-protocol"
		],
		"u": "2026-08-14T02:59:32Z",
		"h": "https://github.com/GoalfyAI/goalfydata",
		"p": ""
	},
	{
		"f": "BlockRunAI/dsh-clawrouter",
		"n": "dsh-clawrouter",
		"o": "BlockRunAI",
		"d": "A safety gate for DeepSeek Harness: a stronger model reviews dangerous tool calls before they run. Plus vision and 67 models from one wallet, paid per request over x402.",
		"s": 9,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"blockrun",
			"code-review",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm-router",
			"x402"
		],
		"u": "2026-08-15T17:31:51Z",
		"h": "https://github.com/BlockRunAI/dsh-clawrouter",
		"p": "https://www.npmjs.com/package/dsh-clawrouter"
	},
	{
		"f": "Lxiayu/DshCockpit",
		"n": "DshCockpit",
		"o": "Lxiayu",
		"d": "Desktop cockpit for DeepSeek Harness (dsh): token usage & cost tracking, budget alerts, runtime auto-update with rollback, Quick Ask hotkey, scheduled tasks, session search. Win+macOS. DeepSeek Harness 桌面驾驶舱：成本/用量监控 · 自动更新 · 定时任务",
		"s": 9,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agent-dashboard",
			"ai-agent",
			"auto-update",
			"budget-tracker",
			"cockpit",
			"cost-tracking",
			"deepseek",
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"llm-cost",
			"local-first",
			"quick-ask",
			"scheduled-tasks",
			"session-search",
			"token-usage",
			"tray-app",
			"typescript"
		],
		"u": "2026-08-16T08:51:40Z",
		"h": "https://github.com/Lxiayu/DshCockpit",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-office",
		"n": "dsh-office",
		"o": "omdsh-dev",
		"d": "办公三件套！Office document tools for DeepSeek Harness (dsh): generate, read, and edit spreadsheets (.xlsx), PDFs, and presentations (.pptx).",
		"s": 9,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"office"
		],
		"u": "2026-08-16T09:23:37Z",
		"h": "https://github.com/omdsh-dev/dsh-office",
		"p": ""
	},
	{
		"f": "vlln/dsh-task-status",
		"n": "dsh-task-status",
		"o": "vlln",
		"d": "DSH 插件：后台任务状态条（对话页任务进度 + 实时输出 tail）。官方 bundle 插件，dsh plugin --profile web add 安装",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"plugin",
			"ui"
		],
		"u": "2026-08-16T09:56:17Z",
		"h": "https://github.com/vlln/dsh-task-status",
		"p": ""
	},
	{
		"f": "Meredith2328/dsh-sticky-note",
		"n": "dsh-sticky-note",
		"o": "Meredith2328",
		"d": "左下角便签：随手记点子/感想/TODO，实时保存到归档目录，清单+悬浮归档",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-external", "dsh-plugin"],
		"u": "2026-08-16T07:28:20Z",
		"h": "https://github.com/Meredith2328/dsh-sticky-note",
		"p": ""
	},
	{
		"f": "LiuMengxuan04/oh-my-dsh",
		"n": "oh-my-dsh",
		"o": "LiuMengxuan04",
		"d": "Oh My DSH (DSH Autopilot): durable, bounded autonomous development for DeepSeek Harness",
		"s": 9,
		"k": 6,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T05:30:31Z",
		"h": "https://github.com/LiuMengxuan04/oh-my-dsh",
		"p": ""
	},
	{
		"f": "yequ172672/dsh-codex-subscription",
		"n": "dsh-codex-subscription",
		"o": "yequ172672",
		"d": "DSH 插件:直接复用 Codex CLI 本地登录订阅凭证,在 DeepSeek Harness 中使用 ChatGPT 订阅模型,无需 API Key | DSH plugin: reuse your Codex CLI local subscription login to use ChatGPT subscription models in DeepSeek Harness, no API key required",
		"s": 9,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"chatgpt",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm"
		],
		"u": "2026-08-16T09:50:33Z",
		"h": "https://github.com/yequ172672/dsh-codex-subscription",
		"p": ""
	},
	{
		"f": "AcidGr/dsh-web-lan-access",
		"n": "dsh-web-lan-access",
		"o": "AcidGr",
		"d": "DeepSeek Harness (dsh) Web plugin",
		"s": 9,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:57:22Z",
		"h": "https://github.com/AcidGr/dsh-web-lan-access",
		"p": ""
	},
	{
		"f": "WilliamLIiii/DeepSeek-Harness-billing-plugin",
		"n": "DeepSeek-Harness-billing-plugin",
		"o": "WilliamLIiii",
		"d": "DeepSeek Harness billing plugin: account balance + per-model remaining-task estimator with a session-header badge",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T04:49:27Z",
		"h": "https://github.com/WilliamLIiii/DeepSeek-Harness-billing-plugin",
		"p": ""
	},
	{
		"f": "Stormycry-cryp/dsh-AuthInOne",
		"n": "dsh-AuthInOne",
		"o": "Stormycry-cryp",
		"d": "Self-contained DeepSeek Harness (DSH) plugin for Provider/Auth login, model switching, image fallback, token/cost analytics, and same-port Web restart. Useful? A star helps.",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cost-attribution",
			"cost-tracking",
			"custom-api",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"image-understanding",
			"llm-provider",
			"model-switching",
			"multimodal",
			"oauth",
			"openai-codex",
			"openai-compatible",
			"provider-management",
			"same-port-restart",
			"self-contained-installer",
			"text-only-model",
			"token-usage",
			"usage-attribution",
			"vision-fallback"
		],
		"u": "2026-08-16T07:52:42Z",
		"h": "https://github.com/Stormycry-cryp/dsh-AuthInOne",
		"p": ""
	},
	{
		"f": "NoWint/Oh-My-DSH",
		"n": "Oh-My-DSH",
		"o": "NoWint",
		"d": "🐋 Oh-My-DSH — DeepSeek Harness Plugin Ecosystem【每一小时更新】",
		"s": 9,
		"k": 1,
		"l": "Python",
		"t": [
			"agent",
			"agent-tools",
			"awesome-list",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:10:53Z",
		"h": "https://github.com/NoWint/Oh-My-DSH",
		"p": ""
	},
	{
		"f": "huey1in/reef",
		"n": "reef",
		"o": "huey1in",
		"d": "DSH 插件全家桶:浏览器自动化 + MCP Server + GitHub/GitLab 自动评审 + 原生嵌入面板 | One install, five modules for DeepSeek Harness: browser automation, MCP server, GitHub & GitLab automation, native in-app panel",
		"s": 9,
		"k": 5,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T10:10:58Z",
		"h": "https://github.com/huey1in/reef",
		"p": ""
	},
	{
		"f": "Flyvhidbwo/dsh-vision-proxy",
		"n": "dsh-vision-proxy",
		"o": "Flyvhidbwo",
		"d": "DeepSeek Harness 插件：DeepSeek 大脑 + 自动识图。GUI 附加图片自动经 OpenAI 兼容 VLM 转译成文字后交给 DeepSeek 作答；支持百炼/智谱/OpenRouter 等任意 OpenAI 兼容端点（默认 qwen3.7-flash），无 key 自动探测本地 Ollama（图片不出本机）；安装时有一问式确认",
		"s": 9,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"dashscope",
			"deepseek-harness",
			"dsh-plugin",
			"image-understanding",
			"multimodal",
			"ocr",
			"qwen",
			"vision",
			"vlm"
		],
		"u": "2026-08-15T15:55:08Z",
		"h": "https://github.com/Flyvhidbwo/dsh-vision-proxy",
		"p": ""
	},
	{
		"f": "timeance/dsh-approve-for-me",
		"n": "dsh-approve-for-me",
		"o": "timeance",
		"d": "DeepSeek Harness plugin for rule-gated automatic sandbox approval with optional LLM review, one-time grants, fixed high-risk checks, and native human fallback.",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T02:49:41Z",
		"h": "https://github.com/timeance/dsh-approve-for-me",
		"p": ""
	},
	{
		"f": "Gin-7/dsh-pet-remielle",
		"n": "dsh-pet-remielle",
		"o": "Gin-7",
		"d": "",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T10:24:51Z",
		"h": "https://github.com/Gin-7/dsh-pet-remielle",
		"p": ""
	},
	{
		"f": "morluto/internalcot",
		"n": "internalcot",
		"o": "morluto",
		"d": "Make agents show their full chain of thought.",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T11:12:47Z",
		"h": "https://github.com/morluto/internalcot",
		"p": ""
	},
	{
		"f": "limbo947/dsh-recall-plugin",
		"n": "dsh-recall-plugin",
		"o": "limbo947",
		"d": "DSH 消息撤回插件：回到发送该消息时的状态",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"windows"
		],
		"u": "2026-08-16T08:09:32Z",
		"h": "https://github.com/limbo947/dsh-recall-plugin",
		"p": ""
	},
	{
		"f": "zetaluolang-cyber/deepseek-harness-phone-remote",
		"n": "deepseek-harness-phone-remote",
		"o": "zetaluolang-cyber",
		"d": "DeepSeek Harness phone remote control via Tailscale - persistent file/workspace plugin - tested on OPPO Find X8 Ultra",
		"s": 9,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"remote-access",
			"remote-desktop",
			"tailscale"
		],
		"u": "2026-08-16T09:32:59Z",
		"h": "https://github.com/zetaluolang-cyber/deepseek-harness-phone-remote",
		"p": ""
	},
	{
		"f": "white0dew/awesome-dsh-plugins",
		"n": "awesome-dsh-plugins",
		"o": "white0dew",
		"d": "Awesome DSH Plugins: a public GitHub directory for DeepSeek Harness plugins, DSH plugins, install commands, and ecosystem discovery.",
		"s": 9,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"awesome-list",
			"deepseek-harness",
			"dsh-plugin",
			"nextjs",
			"plugin-directory",
			"typescript"
		],
		"u": "2026-08-16T03:16:19Z",
		"h": "https://github.com/white0dew/awesome-dsh-plugins",
		"p": "https://dsh.reshub.vip"
	},
	{
		"f": "shaokeyibb/dsh-plugin-product-subagents",
		"n": "dsh-plugin-product-subagents",
		"o": "shaokeyibb",
		"d": "Role-based Codex / Claude Code / ACP subagent providers for the DeepSeek Harness — continuable children, durable session recovery, per-role product permissions, and delegation with a permission ceiling.",
		"s": 9,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"acp",
			"claude-code",
			"codex",
			"cursor",
			"dsh-plugin"
		],
		"u": "2026-08-15T13:18:58Z",
		"h": "https://github.com/shaokeyibb/dsh-plugin-product-subagents",
		"p": ""
	},
	{
		"f": "urzeye/dsh-outline",
		"n": "dsh-outline",
		"o": "urzeye",
		"d": "DeepSeek Harness（DSH）Web GUI 的实时大纲插件",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:48:13Z",
		"h": "https://github.com/urzeye/dsh-outline",
		"p": ""
	},
	{
		"f": "lbwnb666-ai/DeepSeekHarnessRemoteGateway",
		"n": "DeepSeekHarnessRemoteGateway",
		"o": "lbwnb666-ai",
		"d": "一个轻量级 DeepSeek Harness 远程网关，让你通过 Web 或移动设备远程访问和控制本地 AI Agent",
		"s": 9,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin", "remote-work"],
		"u": "2026-08-16T07:26:15Z",
		"h": "https://github.com/lbwnb666-ai/DeepSeekHarnessRemoteGateway",
		"p": ""
	},
	{
		"f": "Lanxing6480/dsh-galgame",
		"n": "dsh-galgame",
		"o": "Lanxing6480",
		"d": "我要成为Galgame高手！！将你的Vibe coding界面修改成为Galgame的样子，在不影响工作的情况下和赏心悦目的DeepSeek娘进行友好互动",
		"s": 9,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"galgame"
		],
		"u": "2026-08-16T02:58:55Z",
		"h": "https://github.com/Lanxing6480/dsh-galgame",
		"p": ""
	},
	{
		"f": "THU-MAIC/dsh-openmaic",
		"n": "dsh-openmaic",
		"o": "THU-MAIC",
		"d": "OpenMAIC for DeepSeek Harness: classrooms, slides, interactive widgets, and Socratic teaching",
		"s": 9,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"openmaic"
		],
		"u": "2026-08-16T09:33:08Z",
		"h": "https://github.com/THU-MAIC/dsh-openmaic",
		"p": ""
	},
	{
		"f": "jyh20030112/dsh-visual-plugin",
		"n": "dsh-visual-plugin",
		"o": "jyh20030112",
		"d": "Dsh-visual-plugin.Give your text-only model eyes: forward user images to any OpenAI-compatible vision model and see the results in a Web UI right panel",
		"s": 9,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"image-description",
			"llm",
			"multimodal",
			"openai-compatible",
			"typescript",
			"vision"
		],
		"u": "2026-08-16T09:58:24Z",
		"h": "https://github.com/jyh20030112/dsh-visual-plugin",
		"p": ""
	},
	{
		"f": "Mombrane/dsh-subagent-monitor",
		"n": "dsh-subagent-monitor",
		"o": "Mombrane",
		"d": "",
		"s": 9,
		"k": 1,
		"l": "TypeScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-15T23:10:33Z",
		"h": "https://github.com/Mombrane/dsh-subagent-monitor",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-ya-workspace-sidebar",
		"n": "dsh-plugin-ya-workspace-sidebar",
		"o": "HuanLinOTO",
		"d": "DSH Web 工作区侧栏替代，顶部全局最近会话 + Workspace→Session 二级菜单 + 面包屑 | DSH Web workspace sidebar replacement: top global recent sessions + Workspace→Session two-level menu + breadcrumbs",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T08:09:02Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-ya-workspace-sidebar",
		"p": ""
	},
	{
		"f": "creght-dev/skills",
		"n": "skills",
		"o": "creght-dev",
		"d": "Codex and agent skills for Cregh.",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-website",
			"ai-website-builder",
			"creght",
			"dsh-plugin"
		],
		"u": "2026-08-15T08:50:30Z",
		"h": "https://github.com/creght-dev/skills",
		"p": "https://www.creght.cn/features/cli"
	},
	{
		"f": "XMoon/dsh-pi-tui",
		"n": "dsh-pi-tui",
		"o": "XMoon",
		"d": "A third-party TUI mode for DeepSeek Harness (dsh), built on a vendored fork of pi-tui",
		"s": 8,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:13:19Z",
		"h": "https://github.com/XMoon/dsh-pi-tui",
		"p": ""
	},
	{
		"f": "AlliotTech/deepseek-harness-docker",
		"n": "deepseek-harness-docker",
		"o": "AlliotTech",
		"d": "deepseek-harness docker部署",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-docker",
			"deepseek-harness-plugin",
			"docker",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T16:01:42Z",
		"h": "https://github.com/AlliotTech/deepseek-harness-docker",
		"p": "https://www.deepseek.com/harness/"
	},
	{
		"f": "Clizo1209/dsh-playwright-browser",
		"n": "dsh-playwright-browser",
		"o": "Clizo1209",
		"d": "Playwright browser automation for DeepSeek Harness｜面向 DeepSeek Harness 的 Playwright 浏览器自动化插件",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"browser-automation",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"playwright",
			"web-automation"
		],
		"u": "2026-08-16T02:34:14Z",
		"h": "https://github.com/Clizo1209/dsh-playwright-browser",
		"p": "https://www.npmjs.com/package/dsh-playwright-browser"
	},
	{
		"f": "CH4ACKO3/dsh-harmony",
		"n": "dsh-harmony",
		"o": "CH4ACKO3",
		"d": "A library for patching, replacing and decorating dsh plugin during runtime",
		"s": 8,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"harmony",
			"nodejs",
			"runtime-patching",
			"typescript"
		],
		"u": "2026-08-16T10:10:31Z",
		"h": "https://github.com/CH4ACKO3/dsh-harmony",
		"p": "https://www.npmjs.com/package/dsh-harmony"
	},
	{
		"f": "wangyang10/image-vision",
		"n": "image-vision",
		"o": "wangyang10",
		"d": "",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"claude-code-skill",
			"codex-skill",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T17:06:50Z",
		"h": "https://github.com/wangyang10/image-vision",
		"p": ""
	},
	{
		"f": "springbrand-lab/dsh-oauth-mcp-client",
		"n": "dsh-oauth-mcp-client",
		"o": "springbrand-lab",
		"d": "OAuth 2.1 Streamable HTTP MCP client plugin for DeepSeek Harness.",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"deepseek-v4",
			"deepseek-v4-pro",
			"dsh-plugin",
			"mcp",
			"mcp-client"
		],
		"u": "2026-08-15T22:05:06Z",
		"h": "https://github.com/springbrand-lab/dsh-oauth-mcp-client",
		"p": ""
	},
	{
		"f": "chenw2759-wq/dsh-plugin-healthcheck",
		"n": "dsh-plugin-healthcheck",
		"o": "chenw2759-wq",
		"d": "害怕插件装了就崩溃？用这个插件帮你检测插件是否正常/是否含木马！",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"dsharpplus"
		],
		"u": "2026-08-16T10:28:07Z",
		"h": "https://github.com/chenw2759-wq/dsh-plugin-healthcheck",
		"p": ""
	},
	{
		"f": "yejiming/dsh-museai-tavern",
		"n": "dsh-museai-tavern",
		"o": "yejiming",
		"d": "MuseAI的DeepSeek Harness插件，可以将你的MuseAI角色放进DSH使用啦！",
		"s": 8,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T07:45:24Z",
		"h": "https://github.com/yejiming/dsh-museai-tavern",
		"p": ""
	},
	{
		"f": "Tommy00748/dsh-theme-cyberpunk2077",
		"n": "dsh-theme-cyberpunk2077",
		"o": "Tommy00748",
		"d": "Cyberpunk 2077 / Night City theme for the DeepSeek Harness Web UI — CRT scanlines, Kiroshi lock-on, typewriter SFX, Relic glitch & easter eggs",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cyberpunk-2077",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"theme"
		],
		"u": "2026-08-16T09:41:41Z",
		"h": "https://github.com/Tommy00748/dsh-theme-cyberpunk2077",
		"p": ""
	},
	{
		"f": "chaojixinren/dsh-reviewer-bot",
		"n": "dsh-reviewer-bot",
		"o": "chaojixinren",
		"d": "原生 DeepSeek Harness 插件形态的代码评审机器人：跨代码平台、规则可插拔、可本地重放。",
		"s": 8,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:22:48Z",
		"h": "https://github.com/chaojixinren/dsh-reviewer-bot",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-session-health",
		"n": "dsh-session-health",
		"o": "omdsh-dev",
		"d": "DSH 会话健康检查插件：多帧 zstd 会话文件的帧级扫描诊断（torn/损坏/空会话检测），零依赖只读，注册 session_health 工具",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"diagnostics",
			"dsh",
			"dsh-plugin",
			"health-check",
			"zstd"
		],
		"u": "2026-08-15T16:21:37Z",
		"h": "https://github.com/omdsh-dev/dsh-session-health",
		"p": ""
	},
	{
		"f": "lhh010/dsh-ui-progress",
		"n": "dsh-ui-progress",
		"o": "lhh010",
		"d": "DSH Web UI 会话进度插件：输入框停靠区常驻会话进度条（todos 真实进度 / 实时 token 生成速率 / 中断橘红态 / 待办提醒），零核心改动",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-14T12:11:37Z",
		"h": "https://github.com/lhh010/dsh-ui-progress",
		"p": ""
	},
	{
		"f": "w2112515/dsh-plugin-development",
		"n": "dsh-plugin-development",
		"o": "w2112515",
		"d": "Portable Agent Skill for developing and auditing DeepSeek Harness plugins, with an optional profile-installable DSH bundle adapter.",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"plugin-development"
		],
		"u": "2026-08-15T11:14:20Z",
		"h": "https://github.com/w2112515/dsh-plugin-development",
		"p": ""
	},
	{
		"f": "SpookySandwich/dsh-smooth-stream",
		"n": "dsh-smooth-stream",
		"o": "SpookySandwich",
		"d": "Better streaming text animation for DeepSeek Harness 给DSH加入更好文字动画 ",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis-plugin",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T01:32:04Z",
		"h": "https://github.com/SpookySandwich/dsh-smooth-stream",
		"p": ""
	},
	{
		"f": "chaos-03x/dsh-agy",
		"n": "dsh-agy",
		"o": "chaos-03x",
		"d": "Google Antigravity (agy) OAuth auth + model access plugin for DeepSeek Harness: multi-account pool, 429 rotation, device fingerprinting, CLI and web login.",
		"s": 8,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agy",
			"antigravity",
			"claude",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gemini"
		],
		"u": "2026-08-16T06:36:02Z",
		"h": "https://github.com/chaos-03x/dsh-agy",
		"p": ""
	},
	{
		"f": "bpc-oss/dsh-web-billing",
		"n": "dsh-web-billing",
		"o": "bpc-oss",
		"d": "RMB/USD token-billing plugin for DeepSeek Harness (dsh web): official-policy auto pricing with peak/off-peak hours, per-message ledger, account balance, locale-driven currency display. 人民币/美元 token 计费插件",
		"s": 8,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"billing",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T20:15:24Z",
		"h": "https://github.com/bpc-oss/dsh-web-billing",
		"p": ""
	},
	{
		"f": "jelly-000/dsh-balance-monitor",
		"n": "dsh-balance-monitor",
		"o": "jelly-000",
		"d": "DeepSeek 账户余额、剩余比例条与今日花费，显示在 dsh 侧边栏底部 · DeepSeek balance, remaining-ratio bar and today's spend in the dsh sidebar footer.",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T01:09:56Z",
		"h": "https://github.com/jelly-000/dsh-balance-monitor",
		"p": ""
	},
	{
		"f": "Mr-remon219/dsh-search-boost",
		"n": "dsh-search-boost",
		"o": "Mr-remon219",
		"d": "The plunge for dsh to boost model's search ability.",
		"s": 8,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"web-search"
		],
		"u": "2026-08-16T10:25:02Z",
		"h": "https://github.com/Mr-remon219/dsh-search-boost",
		"p": ""
	},
	{
		"f": "Areium/dsh-fail-logger",
		"n": "dsh-fail-logger",
		"o": "Areium",
		"d": "DeepSeek Harness（DSH）插件：自动记录所有执行模式（原生工具 / PTC run_code / 代码内嵌工具调用）的工具失败错因，去重、计数、确定性排序后沉淀进 skill 的机器维护实录区段——让 Agent 越用越少错。",
		"s": 8,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"fail-logger",
			"skill"
		],
		"u": "2026-08-15T06:31:16Z",
		"h": "https://github.com/Areium/dsh-fail-logger",
		"p": ""
	},
	{
		"f": "poiuyjie/dsh-vision-opencode",
		"n": "dsh-vision-opencode",
		"o": "poiuyjie",
		"d": "DSH plugin: Auto-convert images to text for pure-text LLMs (DeepSeek etc.) via any vision model. No need to switch your main model.",
		"s": 8,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:47:20Z",
		"h": "https://github.com/poiuyjie/dsh-vision-opencode",
		"p": ""
	},
	{
		"f": "zimzaza4/dsh-bash-win",
		"n": "dsh-bash-win",
		"o": "zimzaza4",
		"d": "在 Windows 环境中为 DeepSeek Harness 提供 Git Bash 与 WSL 2 bash 工具,含 bwrap 沙箱、审批模式、后台任务",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:15:25Z",
		"h": "https://github.com/zimzaza4/dsh-bash-win",
		"p": ""
	},
	{
		"f": "Axiaohungry/dsh-llm-codebuddy",
		"n": "dsh-llm-codebuddy",
		"o": "Axiaohungry",
		"d": "在deepseek harness中使用workbuddy api，因为公司只提供workbuddy积分",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T06:07:25Z",
		"h": "https://github.com/Axiaohungry/dsh-llm-codebuddy",
		"p": ""
	},
	{
		"f": "KCNyu/clawock",
		"n": "clawock",
		"o": "KCNyu",
		"d": "AI argues. Code settles. The losses stay on the page. A portable investment decision-workflow plugin and verifiable harness, proven on a real HK + US portfolio.",
		"s": 8,
		"k": 1,
		"l": "Python",
		"t": [
			"agentic-ai",
			"ai-agents",
			"algorithmic-trading",
			"audit-trail",
			"decision-support",
			"deepseek-harness",
			"dsh-plugin",
			"fintech",
			"harness",
			"investment",
			"investment-research",
			"openclaw",
			"portfolio-management",
			"quantitative-finance",
			"risk-management",
			"self-hosted",
			"stock-market",
			"trading",
			"trading-bot",
			"verifiable-ai"
		],
		"u": "2026-08-16T10:02:53Z",
		"h": "https://github.com/KCNyu/clawock",
		"p": "https://kcnyu.github.io/clawock/"
	},
	{
		"f": "Player-MINEPIG/dsh-llm-codex-oauth",
		"n": "dsh-llm-codex-oauth",
		"o": "Player-MINEPIG",
		"d": "在 dsh（DeepSeek Harness）里使用你的 ChatGPT / Codex 订阅。插件通过 OpenAI Codex 的 OAuth 流程登录 ChatGPT 账号，把订阅额度暴露成 dsh 的 `codex-oauth` 模型提供方。",
		"s": 8,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T10:10:33Z",
		"h": "https://github.com/Player-MINEPIG/dsh-llm-codex-oauth",
		"p": ""
	},
	{
		"f": "Owen718/snapgrep",
		"n": "snapgrep",
		"o": "Owen718",
		"d": "An in-process trigram index that makes code search in Pi&DSH 20-70x faster than ripgrep, with identical results and no sidecar process.",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-coding-agent",
			"code-search",
			"coding-agent",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"grep",
			"napi-rs",
			"oh-my-pi",
			"pi-agent",
			"pi-coding-agent",
			"ripgrep",
			"rust",
			"trigram-index"
		],
		"u": "2026-08-15T11:01:59Z",
		"h": "https://github.com/Owen718/snapgrep",
		"p": ""
	},
	{
		"f": "lhh010/dsh-paste-input",
		"n": "dsh-paste-input",
		"o": "lhh010",
		"d": "DSH WebUI 文件输入增强：Ctrl+V 粘贴（带首次告知弹窗）+ 拖拽 + 选择文件，发送时复制进会话工作区临时目录",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-14T12:04:36Z",
		"h": "https://github.com/lhh010/dsh-paste-input",
		"p": ""
	},
	{
		"f": "skymecode/deepseek-harness-for-vscode",
		"n": "deepseek-harness-for-vscode",
		"o": "skymecode",
		"d": "deepseek-harness for vscode .This is a community project, and we welcome your valuable feedback!",
		"s": 8,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:01:40Z",
		"h": "https://github.com/skymecode/deepseek-harness-for-vscode",
		"p": ""
	},
	{
		"f": "titanwings/dsh-better-browser",
		"n": "dsh-better-browser",
		"o": "titanwings",
		"d": "DSH 真实浏览器插件：通过 Kimi WebBridge 让 Agent 操作用户已登录的浏览器，并提供 13 个 webbridge_* 工具。 / Let DSH Agents use your signed-in browser through thirteen Kimi WebBridge tools.",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"automation",
			"browser",
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"kimi-webbridge",
			"tool"
		],
		"u": "2026-08-16T03:26:56Z",
		"h": "https://github.com/titanwings/dsh-better-browser",
		"p": ""
	},
	{
		"f": "yanglongyun/dsh-ramify",
		"n": "dsh-ramify",
		"o": "yanglongyun",
		"d": "Ramify 是 DeepSeek Harness 的创意分支画布插件，用树状工作区生成、对比和迭代多个可交互方案。",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"ramify"
		],
		"u": "2026-08-16T08:45:35Z",
		"h": "https://github.com/yanglongyun/dsh-ramify",
		"p": ""
	},
	{
		"f": "lhmd/dsh-promotion-toolkit",
		"n": "dsh-promotion-toolkit",
		"o": "lhmd",
		"d": "把你的任何想法，变成每个平台原生的宣发内容 | Turn any idea into platform-native publicity",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agents",
			"agents-skills",
			"agentskills",
			"content-creation",
			"content-creation-ai",
			"content-creation-automation",
			"content-creation-tool",
			"content-creation-tools",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"open-source",
			"opensource",
			"plugin",
			"promotion",
			"skill",
			"skills"
		],
		"u": "2026-08-15T06:18:49Z",
		"h": "https://github.com/lhmd/dsh-promotion-toolkit",
		"p": "http://lhmd.top/dsh-promotion-toolkit/"
	},
	{
		"f": "Hotsteel2901/dsh-client-ui-mobile-adapt",
		"n": "dsh-client-ui-mobile-adapt",
		"o": "Hotsteel2901",
		"d": "Your DeepSeek Harness web UI, rebuilt for the phone in your hand. Built for developers who code in Termux on Android: single-column layout, sidebar drawer, one-line composer, fullscreen scrollable settings & trajectory details, tap-to-open session stats. Desktop untouched.",
		"s": 8,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"android",
			"deepseek-harness",
			"dsh-plugin",
			"mobile-ui",
			"responsive-design",
			"termux"
		],
		"u": "2026-08-15T07:59:25Z",
		"h": "https://github.com/Hotsteel2901/dsh-client-ui-mobile-adapt",
		"p": ""
	},
	{
		"f": "zhujunpeng12/dsh-memory-system",
		"n": "dsh-memory-system",
		"o": "zhujunpeng12",
		"d": "Local-first persistent memory infrastructure for DeepSeek Harness: hot bootstrap, Chinese-BM25 cold recall, lease-lock transactional writes, read-only governance",
		"s": 8,
		"k": 0,
		"l": "Python",
		"t": [
			"ai-agents",
			"coding-agent",
			"deepseek-harness",
			"dsh-plugin",
			"persistent-memory",
			"plugin-evolution"
		],
		"u": "2026-08-16T05:17:24Z",
		"h": "https://github.com/zhujunpeng12/dsh-memory-system",
		"p": ""
	},
	{
		"f": "Len7183/DSH-Think-zh",
		"n": "DSH-Think-zh",
		"o": "Len7183",
		"d": "DeepSeek Harness 默认的思考语言为英文，这不利于中文使用者阅读推理过程与复核结论。本插件通过在每次请求的 system prompt 中注入一条精简的强制语言指令，使: 思考过程强制简体中文，无论用户用什么语言提问。",
		"s": 8,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-desktop",
			"dsh-plugin-market",
			"dsh-plugin-theme",
			"dsh-plugins",
			"dsh-plugins-terminal"
		],
		"u": "2026-08-16T09:58:58Z",
		"h": "https://github.com/Len7183/DSH-Think-zh",
		"p": ""
	},
	{
		"f": "suntianc/dsh-codex-auth",
		"n": "dsh-codex-auth",
		"o": "suntianc",
		"d": "DeepSeek Harness plugin that reuses the local Codex CLI ChatGPT login and adds a native GPT Auth settings card",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"chatgpt",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"oauth"
		],
		"u": "2026-08-15T15:42:29Z",
		"h": "https://github.com/suntianc/dsh-codex-auth",
		"p": "https://github.com/deepseek-ai/deepseek-harness"
	},
	{
		"f": "HuanLinOTO/dsh-plugin-anti-ads",
		"n": "dsh-plugin-anti-ads",
		"o": "HuanLinOTO",
		"d": "DSH Web 广告拦截器，四层独立防御拦截 dsh-ads 插件的所有广告位 | DSH Web ad blocker with four independent defense layers targeting the dsh-ads plugin",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:55:00Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-anti-ads",
		"p": ""
	},
	{
		"f": "TheTianzz/dsh-billing",
		"n": "dsh-billing",
		"o": "TheTianzz",
		"d": "DeepSeek Harness plugin: 账户余额 + 会话费用（/balance /cost 命令、deepseek_billing 工具、Web UI 双胶囊），官方价格每 12 小时自动同步",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"billing",
			"deepseek",
			"deepseek-api",
			"deepseek-harness",
			"dsh-plugin",
			"plugin"
		],
		"u": "2026-08-15T17:15:36Z",
		"h": "https://github.com/TheTianzz/dsh-billing",
		"p": "https://www.npmjs.com/package/dsh-billing"
	},
	{
		"f": "xiaoshihou514/dsh-desktop-pet",
		"n": "dsh-desktop-pet",
		"o": "xiaoshihou514",
		"d": "DeepSeek Harness：鲸鱼娘桌宠！",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T04:43:54Z",
		"h": "https://github.com/xiaoshihou514/dsh-desktop-pet",
		"p": ""
	},
	{
		"f": "1na-ko/dsh-hdc-bridge",
		"n": "dsh-hdc-bridge",
		"o": "1na-ko",
		"d": "DSH 原生鸿蒙开发助手：hdc 设备闭环调试 + 离线官方知识层（Tier-1 随包）+ DevEco CLI 构建通道 / DSH-native HarmonyOS dev assistant: hdc device loop, offline official knowledge, DevEco CLI builds",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"arkts",
			"deepseek-harness",
			"deveco",
			"dsh-plugin",
			"harmonyos",
			"hdc",
			"openharmony"
		],
		"u": "2026-08-16T01:03:08Z",
		"h": "https://github.com/1na-ko/dsh-hdc-bridge",
		"p": ""
	},
	{
		"f": "LeemanCheung/dsh-token-usage",
		"n": "dsh-token-usage",
		"o": "LeemanCheung",
		"d": "Persistent token usage records and dashboard for DeepSeek Harness",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"token-usage"
		],
		"u": "2026-08-15T16:09:12Z",
		"h": "https://github.com/LeemanCheung/dsh-token-usage",
		"p": ""
	},
	{
		"f": "SummerSec/SumSec-Skills",
		"n": "SumSec-Skills",
		"o": "SummerSec",
		"d": "SummerSec 个人自定义Skill仓库",
		"s": 7,
		"k": 1,
		"l": "Python",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T06:31:10Z",
		"h": "https://github.com/SummerSec/SumSec-Skills",
		"p": ""
	},
	{
		"f": "moxisuki/dsh-lan",
		"n": "dsh-lan",
		"o": "moxisuki",
		"d": "DeepSeek Harness（dsh）的局域网插件：一条 overlay 把 dsh web 绑定到局域网，并通过 index tap 注入 crypto.randomUUID    │ polyfill 修复非安全上下文启动崩溃。",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:52:25Z",
		"h": "https://github.com/moxisuki/dsh-lan",
		"p": ""
	},
	{
		"f": "boxeryao/dsh-mini-tui",
		"n": "dsh-mini-tui",
		"o": "boxeryao",
		"d": "DSH-TUI: a lightweight and fast terminal plugin connected directly to the DSH runtime.",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"deepseek",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"dsh-tui",
			"pi-tui",
			"terminal",
			"terminal-ui",
			"tui",
			"typescript"
		],
		"u": "2026-08-16T07:47:34Z",
		"h": "https://github.com/boxeryao/dsh-mini-tui",
		"p": ""
	},
	{
		"f": "jjxjjjjiik-bot/dsh-chat-timeline",
		"n": "dsh-chat-timeline",
		"o": "jjxjjjjiik-bot",
		"d": "1:1 port of DeepSeek's official web right-side chat navigation rail (ScrollNav) as a DeepSeek Harness (DSH) plugin",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"chat",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"harness",
			"navigation",
			"timeline"
		],
		"u": "2026-08-16T06:46:15Z",
		"h": "https://github.com/jjxjjjjiik-bot/dsh-chat-timeline",
		"p": ""
	},
	{
		"f": "imetn/dsh-lark-bridge",
		"n": "dsh-lark-bridge",
		"o": "imetn",
		"d": "Bidirectional Lark/Feishu controller for DeepSeek Harness",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"chatbot",
			"deepseek-harness",
			"dsh-plugin",
			"feishu",
			"lark"
		],
		"u": "2026-08-15T08:06:29Z",
		"h": "https://github.com/imetn/dsh-lark-bridge",
		"p": ""
	},
	{
		"f": "fly233338/dsh-overleaf",
		"n": "dsh-overleaf",
		"o": "fly233338",
		"d": "Connect Overleaf projects to DeepSeek Harness (DSH) through OverleafMCP and MCP tools.",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"latex",
			"mcp",
			"overleaf",
			"overleaf-mcp"
		],
		"u": "2026-08-15T01:15:56Z",
		"h": "https://github.com/fly233338/dsh-overleaf",
		"p": "https://github.com/fly233338/dsh-overleaf#readme"
	},
	{
		"f": "omdsh-dev/dsh-sidechain",
		"n": "dsh-sidechain",
		"o": "omdsh-dev",
		"d": "DSH 侧会话插件：/side 持续性侧会话（Codex 风格）与 /btw 一次性侧问（Claude 风格）——在临时 fork 中运行、不写入主会话历史；Web UI 右侧链面板内嵌对话，主会话保持不变",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"side-conversation",
			"sidechain"
		],
		"u": "2026-08-15T12:14:56Z",
		"h": "https://github.com/omdsh-dev/dsh-sidechain",
		"p": ""
	},
	{
		"f": "lhh010/dsh-bash-encoding",
		"n": "dsh-bash-encoding",
		"o": "lhh010",
		"d": "DSH bash 输出编码自动识别插件：替换 ctx.bash，自管 spawn 收集原始字节，自动检测 UTF-16LE/UTF-8/GBK 等编码并正确解码，修复 WSL/Windows 下 bash 工具的中文乱码。",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-14T22:56:25Z",
		"h": "https://github.com/lhh010/dsh-bash-encoding",
		"p": ""
	},
	{
		"f": "610la/dsh-notification-center",
		"n": "dsh-notification-center",
		"o": "610la",
		"d": "DSH 通知中心插件：对话/任务完成、报错、等待批准等事件触发浏览器通知 + 21 种匹配音效",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T18:16:05Z",
		"h": "https://github.com/610la/dsh-notification-center",
		"p": ""
	},
	{
		"f": "yunxiiQwQ/dsh-maid-whale-webUI",
		"n": "dsh-maid-whale-webUI",
		"o": "yunxiiQwQ",
		"d": "DeepSeek Harness Web UI 鲸鱼女仆主题插件",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:49:50Z",
		"h": "https://github.com/yunxiiQwQ/dsh-maid-whale-webUI",
		"p": ""
	},
	{
		"f": "william-jin-cmu/dsh-evolve",
		"n": "dsh-evolve",
		"o": "william-jin-cmu",
		"d": "自进化插件：agent 在 session 内随对话给自己长出/剪掉能力 —— evolve_add 热挂载持久化 cordis 插件（下一 step 工具即可见），evolve_remove 可逆卸载，重启自动恢复",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:18:44Z",
		"h": "https://github.com/william-jin-cmu/dsh-evolve",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-yet-another-subagent",
		"n": "dsh-plugin-yet-another-subagent",
		"o": "HuanLinOTO",
		"d": "可配置子代理 profile 系统，单一 subagent 工具 + profile 参数，含 Web UI 设置/实时进度/子代理树 | Configurable subagent profile system: single subagent tool + profile param, with Web UI settings/real-time progress/subagent tree",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T06:13:06Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-yet-another-subagent",
		"p": ""
	},
	{
		"f": "dclichang2022/dsh-green-meter",
		"n": "dsh-green-meter",
		"o": "dclichang2022",
		"d": "Energy & carbon metering for DeepSeek Harness: per-turn/per-request energy, cache carbon savings, electricity cost.",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"carbon-footprint",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"energy",
			"green-ai",
			"monitoring",
			"sustainability"
		],
		"u": "2026-08-16T09:01:54Z",
		"h": "https://github.com/dclichang2022/dsh-green-meter",
		"p": ""
	},
	{
		"f": "xmutfyh/dsh-plugin-writing-guard",
		"n": "dsh-plugin-writing-guard",
		"o": "xmutfyh",
		"d": "Deterministic manuscript integrity guard for AI-assisted academic revision - protects scientific facts, claim strength (causal & evidential), negation, scope and citations during polishing while flagging mechanical AI writing (Scholarship Lock + Epistemic Lock, zero LLM)",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"academic-paper",
			"academic-writing",
			"ai-detection",
			"ai-writing",
			"ai-writing-style",
			"deepseek-harness",
			"defensive-writing",
			"dsh-plugin",
			"llm-writing",
			"manuscript",
			"manuscript-review",
			"paper-writing",
			"proofreading",
			"research-paper",
			"scientific-writing",
			"writing-assistant",
			"writing-style"
		],
		"u": "2026-08-16T10:22:49Z",
		"h": "https://github.com/xmutfyh/dsh-plugin-writing-guard",
		"p": ""
	},
	{
		"f": "LoserFox/dsh-git-identity",
		"n": "dsh-git-identity",
		"o": "LoserFox",
		"d": "DSH 插件：git 提交固定使用环境自身作者身份（优先 gh CLI 登录账号，GitHub noreply 邮箱），GIT_AUTHOR_*/GIT_COMMITTER_* 环境变量注入压过一切 git config",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-13T16:39:09Z",
		"h": "https://github.com/LoserFox/dsh-git-identity",
		"p": ""
	},
	{
		"f": "dingyi222666/dsh-session-notification",
		"n": "dsh-session-notification",
		"o": "dingyi222666",
		"d": "提供会话完成等四种状态的通知响应，支持浏览器提示和提示词",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T12:18:50Z",
		"h": "https://github.com/dingyi222666/dsh-session-notification",
		"p": ""
	},
	{
		"f": "CocoSgt/dsh-skills",
		"n": "dsh-skills",
		"o": "CocoSgt",
		"d": "",
		"s": 7,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"claude-skills",
			"coding-agent",
			"cordis",
			"deepseek",
			"deepseek-ai",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"skill-hub",
			"skills",
			"slash-commands"
		],
		"u": "2026-08-15T15:08:48Z",
		"h": "https://github.com/CocoSgt/dsh-skills",
		"p": ""
	},
	{
		"f": "gtaifu/dsh-wechat-bridge",
		"n": "dsh-wechat-bridge",
		"o": "gtaifu",
		"d": "DeepSeek Harness (dsh) transport plugin: chat with your agents on WeChat via official Tencent iLink bot API — zero runtime deps, no OpenClaw, QR-code login, one friend = one persistent agent session.",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"ilink",
			"wechat",
			"wechat-bot",
			"weixin"
		],
		"u": "2026-08-16T03:05:50Z",
		"h": "https://github.com/gtaifu/dsh-wechat-bridge",
		"p": ""
	},
	{
		"f": "Laplace-bit/dsh-smooth-stream",
		"n": "dsh-smooth-stream",
		"o": "Laplace-bit",
		"d": "DeepSeek Harness (dsh) plugin: silky streaming reveal, no flicker. dsh 丝滑流式渲染插件。",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"ai-chat",
			"chat-ui",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"llm",
			"markdown",
			"plugin",
			"react",
			"smooth-streaming",
			"streaming",
			"typescript",
			"typewriter",
			"typewriter-effect",
			"web-ui"
		],
		"u": "2026-08-16T07:46:14Z",
		"h": "https://github.com/Laplace-bit/dsh-smooth-stream",
		"p": "https://laplace-bit.github.io/dsh-smooth-stream/"
	},
	{
		"f": "gusibi/molibot",
		"n": "molibot",
		"o": "gusibi",
		"d": "A memory-first personal AI Agent that grows with your work.开源、开箱即用的 AI Agent。",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"ai",
			"dsh-plugin",
			"local-first",
			"local-first-ai",
			"miniapp",
			"molibot",
			"personal-ai",
			"pi",
			"pi-agent"
		],
		"u": "2026-08-16T08:44:28Z",
		"h": "https://github.com/gusibi/molibot",
		"p": "https://molibot.eztoolab.com"
	},
	{
		"f": "omdsh-dev/plugin-template",
		"n": "plugin-template",
		"o": "omdsh-dev",
		"d": "基于原turtle ui官方仓库创建的plugin模板仓库",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T09:15:51Z",
		"h": "https://github.com/omdsh-dev/plugin-template",
		"p": ""
	},
	{
		"f": "Yuuz12/dsh-webui-auth",
		"n": "dsh-webui-auth",
		"o": "Yuuz12",
		"d": "WebUI 身份认证：HTTP/传输层强制登录（资源、插件 bundle、/api、WebSocket 四层防护），服务端会话 + HttpOnly Cookie。",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"auth",
			"authorization",
			"dsh",
			"dsh-plugin",
			"gate"
		],
		"u": "2026-08-16T09:53:35Z",
		"h": "https://github.com/Yuuz12/dsh-webui-auth",
		"p": ""
	},
	{
		"f": "humblebanana/dsh-record-replay",
		"n": "dsh-record-replay",
		"o": "humblebanana",
		"d": "DeepSeek Harness record macOS desktop workflows by demonstration and turn them into agent skills (open-record-replay skill + orr_* tools)",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"computer-use",
			"deepseek-harness",
			"dsh-plugin",
			"macos",
			"record-replay"
		],
		"u": "2026-08-15T08:00:27Z",
		"h": "https://github.com/humblebanana/dsh-record-replay",
		"p": ""
	},
	{
		"f": "openma-ai/deepseek-harness-acp",
		"n": "deepseek-harness-acp",
		"o": "openma-ai",
		"d": "ACP server implementation for DeepSeek harness",
		"s": 7,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"acp",
			"agent-client-protocol",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T14:52:54Z",
		"h": "https://github.com/openma-ai/deepseek-harness-acp",
		"p": ""
	},
	{
		"f": "tianyhjg-lab/dsh-font",
		"n": "dsh-font",
		"o": "tianyhjg-lab",
		"d": "Font switcher for DeepSeek Harness Web GUI: 99 UI fonts + 31 code fonts with CJK-Latin pairing, instant apply, localStorage persistence",
		"s": 7,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T07:09:11Z",
		"h": "https://github.com/tianyhjg-lab/dsh-font",
		"p": ""
	},
	{
		"f": "Nanki-nn/dsh-answer-pet",
		"n": "dsh-answer-pet",
		"o": "Nanki-nn",
		"d": "",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"desktop-pet",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:48:07Z",
		"h": "https://github.com/Nanki-nn/dsh-answer-pet",
		"p": ""
	},
	{
		"f": "penguin-oo/dsh-bookmarks",
		"n": "dsh-bookmarks",
		"o": "penguin-oo",
		"d": "Bookmark assistant replies in DeepSeek Harness: per-message bookmarks with notes/tags, a cross-session center, and one-click Markdown export.",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"bookmark",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"web"
		],
		"u": "2026-08-16T08:38:16Z",
		"h": "https://github.com/penguin-oo/dsh-bookmarks",
		"p": ""
	},
	{
		"f": "hyqhyq3/dsh-mcp-manager",
		"n": "dsh-mcp-manager",
		"o": "hyqhyq3",
		"d": "MCP server manager plugin for DeepSeek Harness: Settings → MCP page, OAuth (PKCE + dynamic client registration) or static-token auth, tools registered as mcp__<name>__*",
		"s": 7,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh-plugin",
			"mcp",
			"model-context-protocol",
			"oauth"
		],
		"u": "2026-08-16T09:49:10Z",
		"h": "https://github.com/hyqhyq3/dsh-mcp-manager",
		"p": ""
	},
	{
		"f": "yxccai/dsh-desktop",
		"n": "dsh-desktop",
		"o": "yxccai",
		"d": "Unofficial Windows and macOS desktop app for DeepSeek Harness, with bundled runtime and automatic reuse of existing DSH environments.",
		"s": 7,
		"k": 3,
		"l": "JavaScript",
		"t": [
			"deepdeepseek",
			"deepseek-harness",
			"desktop",
			"desktop-app",
			"dsh",
			"dsh-desktop",
			"dsh-plugin",
			"dsh-plugin-desktop",
			"dsh-plugins",
			"sider"
		],
		"u": "2026-08-16T10:27:26Z",
		"h": "https://github.com/yxccai/dsh-desktop",
		"p": ""
	},
	{
		"f": "lhmd/dsh-director-toolkit",
		"n": "dsh-director-toolkit",
		"o": "lhmd",
		"d": "DSH Director Toolkit is a DeepSeek Harness plugin for 3D artists, technical designers, and creative coders. Paste a half-formed idea, a reference note, or a portfolio caption and get a compact direction pack for Blender, Three.js, Houdini, or C4D.",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"agent-vision-toolkit",
			"blender",
			"computer-vision",
			"deepseek-harness",
			"director",
			"dsh",
			"dsh-plugin",
			"plugin",
			"python",
			"skills",
			"video-generation"
		],
		"u": "2026-08-14T09:19:02Z",
		"h": "https://github.com/lhmd/dsh-director-toolkit",
		"p": "http://lhmd.top/dsh-director-toolkit/"
	},
	{
		"f": "renat3u/dsh-web-archive",
		"n": "dsh-web-archive",
		"o": "renat3u",
		"d": "折叠对话当中众多的“无用消息”，例如Think、Bash等",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T11:15:37Z",
		"h": "https://github.com/renat3u/dsh-web-archive",
		"p": ""
	},
	{
		"f": "Starfie1d1272/dsh-builtin-toggles",
		"n": "dsh-builtin-toggles",
		"o": "Starfie1d1272",
		"d": "Evidence-backed built-in capability inspector with fail-closed controls for DeepSeek Harness Web.",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"capability-inspector",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T19:00:14Z",
		"h": "https://github.com/Starfie1d1272/dsh-builtin-toggles",
		"p": "https://www.npmjs.com/package/dsh-builtin-toggles"
	},
	{
		"f": "ZK-Andy/dsh-continual-evolve",
		"n": "dsh-continual-evolve",
		"o": "ZK-Andy",
		"d": "Continual self-evolution plugin for DeepSeek Harness: versioned, auditable, rollback-safe harness state refined from session trajectories, with a benchmark-driven validation loop.",
		"s": 7,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"self-evolving-agents",
			"typescript"
		],
		"u": "2026-08-16T08:53:34Z",
		"h": "https://github.com/ZK-Andy/dsh-continual-evolve",
		"p": ""
	},
	{
		"f": "NoNameLeGo/dsh-catppuccin",
		"n": "dsh-catppuccin",
		"o": "NoNameLeGo",
		"d": "DeepSeek Harness Web GUI 的 Catppuccin 主题插件：Latte / Frappé / Macchiato / Mocha 四种主题一键切换，内置可开关的玻璃质感（Glassmorphism）",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"catppuccin",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"theme"
		],
		"u": "2026-08-16T08:46:13Z",
		"h": "https://github.com/NoNameLeGo/dsh-catppuccin",
		"p": ""
	},
	{
		"f": "KitDoesIt/dsh-compaction-instant",
		"n": "dsh-compaction-instant",
		"o": "KitDoesIt",
		"d": "LLM-free lossless* compaction engine for DeepSeek Harness",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"compaction",
			"context-compression",
			"cordis",
			"dsh",
			"dsh-plugin",
			"llm",
			"plugin"
		],
		"u": "2026-08-16T09:08:48Z",
		"h": "https://github.com/KitDoesIt/dsh-compaction-instant",
		"p": ""
	},
	{
		"f": "609476965/dsh-LorebookMD",
		"n": "dsh-LorebookMD",
		"o": "609476965",
		"d": "DSH lorebook-driven fiction writer plugin: import Tavern/SillyTavern character cards & world books, save local Markdown settings, generate novel prose referencing the world.",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"lorebook",
			"tavern"
		],
		"u": "2026-08-16T09:07:02Z",
		"h": "https://github.com/609476965/dsh-LorebookMD",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-mygo",
		"n": "dsh-mygo",
		"o": "omdsh-dev",
		"d": "",
		"s": 7,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T09:55:33Z",
		"h": "https://github.com/omdsh-dev/dsh-mygo",
		"p": ""
	},
	{
		"f": "CocoSgt/dsh-attachments",
		"n": "dsh-attachments",
		"o": "CocoSgt",
		"d": "",
		"s": 7,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"attachments",
			"coding-agent",
			"cordis",
			"deepseek",
			"deepseek-ai",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"file-upload",
			"files",
			"plugin",
			"workspace"
		],
		"u": "2026-08-15T14:31:21Z",
		"h": "https://github.com/CocoSgt/dsh-attachments",
		"p": ""
	},
	{
		"f": "xingyingyuzhui/dsh-liquid-glass",
		"n": "dsh-liquid-glass",
		"o": "xingyingyuzhui",
		"d": "Wallpaper plus optional Liquid Glass overlay for DeepSeek Harness Web UI",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T06:52:37Z",
		"h": "https://github.com/xingyingyuzhui/dsh-liquid-glass",
		"p": ""
	},
	{
		"f": "WNJXYK/dsh-codex-oauth",
		"n": "dsh-codex-oauth",
		"o": "WNJXYK",
		"d": "Use your OpenAI subscription with DeepSeek Harness to access GPT models, image generation, and web search.",
		"s": 7,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"codex",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-verify",
			"dsh-plugins",
			"oauth",
			"openai"
		],
		"u": "2026-08-16T10:02:49Z",
		"h": "https://github.com/WNJXYK/dsh-codex-oauth",
		"p": ""
	},
	{
		"f": "gxinxing/deepseek-harness-tui",
		"n": "deepseek-harness-tui",
		"o": "gxinxing",
		"d": "Terminal-native interactive TUI for DeepSeek Harness (dsh) — built with Ink, React for terminals",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cli",
			"deepseek",
			"dsh-plugin",
			"ink",
			"react",
			"terminal",
			"tui"
		],
		"u": "2026-08-14T20:07:57Z",
		"h": "https://github.com/gxinxing/deepseek-harness-tui",
		"p": ""
	},
	{
		"f": "Abyss-Seeker/dsh-plugin-working-status",
		"n": "dsh-plugin-working-status",
		"o": "Abyss-Seeker",
		"d": "把思考状态里那句 \"Deep diving...\" 改成你喜欢的任何话。超轻量级。",
		"s": 7,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T09:41:34Z",
		"h": "https://github.com/Abyss-Seeker/dsh-plugin-working-status",
		"p": ""
	},
	{
		"f": "zhijun-dai/Catppuccin-dsh-theme",
		"n": "Catppuccin-dsh-theme",
		"o": "zhijun-dai",
		"d": "🐱 Soothing pastel theme for DeepSeek Harness",
		"s": 7,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"catppuccin",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"theme"
		],
		"u": "2026-08-16T01:09:34Z",
		"h": "https://github.com/zhijun-dai/Catppuccin-dsh-theme",
		"p": "https://www.npmjs.com/package/dsh-catppuccin"
	},
	{
		"f": "ginuim/multi-screen-wireframe",
		"n": "multi-screen-wireframe",
		"o": "ginuim",
		"d": "Generate offline multi-screen wireframes with canvas + demo navigation. Zero Node/npm.",
		"s": 6,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:31:46Z",
		"h": "https://github.com/ginuim/multi-screen-wireframe",
		"p": ""
	},
	{
		"f": "sulfide2085/dsh-llm-wechat",
		"n": "dsh-llm-wechat",
		"o": "sulfide2085",
		"d": "DeepSeek Harness 微信网关适配插件：复用 DeepSeekAdapter + 流式 think 标签转译",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:54Z",
		"h": "https://github.com/sulfide2085/dsh-llm-wechat",
		"p": ""
	},
	{
		"f": "juhe291/dsh-token-panel",
		"n": "dsh-token-panel",
		"o": "juhe291",
		"d": "A corner HUD for DeepSeek Harness that shows your session's token pressure, per-model cost, and daily/monthly usage at a glance, with an editable budget and balance that tracks spending for you. 右下角常驻的 Token 仪表盘：实时看会话压力、按模型估算花费。预算和余额点一下就能改，每天每月用了多少都有记录。",
		"s": 6,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"cost-tracking",
			"dashboard",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"hud",
			"monitoring",
			"token-meter",
			"token-tracking",
			"token-usage"
		],
		"u": "2026-08-15T13:12:07Z",
		"h": "https://github.com/juhe291/dsh-token-panel",
		"p": "https://github.com/topics/dsh-plugin"
	},
	{
		"f": "2672243194/dsh-read-url",
		"n": "dsh-read-url",
		"o": "2672243194",
		"d": "DeepSeek Harness URL reader: fetch any page and return clean main-content text/Markdown. Auto charset (GBK/GB2312/UTF-8/Big5), token-efficient (6000-char cap, cache, offset), zero deps, no API key. 网页一键读全文 → 干净正文 / 结构化 Markdown",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:10:37Z",
		"h": "https://github.com/2672243194/dsh-read-url",
		"p": ""
	},
	{
		"f": "hxyz486/dsh-archived-conversations",
		"n": "dsh-archived-conversations",
		"o": "hxyz486",
		"d": "归档对话查看 (archived-conversation-viewer)：在 DSH 设置页查看、恢复与删除归档会话的 Cordis 插件",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:38Z",
		"h": "https://github.com/hxyz486/dsh-archived-conversations",
		"p": ""
	},
	{
		"f": "lvyuchuiyi/dsh-funpack",
		"n": "dsh-funpack",
		"o": "lvyuchuiyi",
		"d": " DeepSeek Harness的一些有趣插件",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-15T13:11:30Z",
		"h": "https://github.com/lvyuchuiyi/dsh-funpack",
		"p": "https://github.com/lvyuchuiyi/dsh-funpack"
	},
	{
		"f": "wssfk12138/dsh-wechat-notify",
		"n": "dsh-wechat-notify",
		"o": "wssfk12138",
		"d": "DeepSeek Harness 插件：为 agent 新增 wechat_notify 工具，让 AI 通过本机 ClawBot 微信通道主动给你发通知（任务完成 / 需决策时），中文可靠、掉线自提示。",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"clawbot",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"notify",
			"wechat",
			"wechat-notify"
		],
		"u": "2026-08-15T11:21:52Z",
		"h": "https://github.com/wssfk12138/dsh-wechat-notify",
		"p": ""
	},
	{
		"f": "hi-wenw/dsh-telegram-channel",
		"n": "dsh-telegram-channel",
		"o": "hi-wenw",
		"d": "DeepSeek Harness Telegram mobile remote: bind live Web sessions (Codex-style). Install: dsh plugin add github:hi-wenw/dsh-telegram-channel",
		"s": 6,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"agent",
			"bot",
			"channel",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"mobile",
			"remote",
			"sessions",
			"telegram"
		],
		"u": "2026-08-15T09:02:57Z",
		"h": "https://github.com/hi-wenw/dsh-telegram-channel",
		"p": "https://github.com/topics/dsh-plugin"
	},
	{
		"f": "BrambleXu/dsh-annotate",
		"n": "dsh-annotate",
		"o": "BrambleXu",
		"d": "Visual browser element annotation for DeepSeek Harness, capturing DOM, styles, accessibility data, comments, and viewport screenshots. DeepSeek Harness 浏览器元素标注插件，捕获 DOM、样式、可访问性数据、评论和视口截图。",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dom-inspection",
			"dsh",
			"dsh-plugin",
			"frontend-tools",
			"typescript",
			"visual-feedback"
		],
		"u": "2026-08-16T05:06:47Z",
		"h": "https://github.com/BrambleXu/dsh-annotate",
		"p": ""
	},
	{
		"f": "havingautism/dsh-deepresearch",
		"n": "dsh-deepresearch",
		"o": "havingautism",
		"d": "",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:02:53Z",
		"h": "https://github.com/havingautism/dsh-deepresearch",
		"p": ""
	},
	{
		"f": "a179-sanae/dsh-auto-collapse",
		"n": "dsh-auto-collapse",
		"o": "a179-sanae",
		"d": "",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:08:09Z",
		"h": "https://github.com/a179-sanae/dsh-auto-collapse",
		"p": ""
	},
	{
		"f": "YYTbit/dsh-plugin-claude-bridge",
		"n": "dsh-plugin-claude-bridge",
		"o": "YYTbit",
		"d": "Bridge Claude Code memory, skills, and config into DeepSeek Harness",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"deepseek-harness",
			"dsh-plugin",
			"memory"
		],
		"u": "2026-08-16T06:16:25Z",
		"h": "https://github.com/YYTbit/dsh-plugin-claude-bridge",
		"p": ""
	},
	{
		"f": "LoserFox/telegram",
		"n": "telegram",
		"o": "LoserFox",
		"d": "Telegram Bot API 桥接插件：长轮询、per-chat 会话、HTML 格式化",
		"s": 6,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-13T16:39:31Z",
		"h": "https://github.com/LoserFox/telegram",
		"p": ""
	},
	{
		"f": "akira399/dsh-godot-skill",
		"n": "dsh-godot-skill",
		"o": "akira399",
		"d": "Godot Engine 4.x 全栈游戏开发技能插件 for DeepSeek Harness (DSH) — registers the godot-4-development skill at runtime",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"game-development",
			"gdscript",
			"godot",
			"godot-engine"
		],
		"u": "2026-08-15T15:48:04Z",
		"h": "https://github.com/akira399/dsh-godot-skill",
		"p": ""
	},
	{
		"f": "Qinling-Melon-Farmers/dsh-memoir",
		"n": "dsh-memoir",
		"o": "Qinling-Melon-Farmers",
		"d": "DSH 项目持久化记忆插件（TypeScript）：会话归纳 + 经验教训沉淀，写入 PROJECT_MEMORY.md 与全局索引；每轮工作结束自动提醒蒸馏、自动注入未来 AGENTS；附 Web GUI 记忆面板（项目/全局 tab、检索、手动记录/删除）。dsh-plugin",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek-harness",
			"dsh-plugin",
			"memory"
		],
		"u": "2026-08-16T09:13:01Z",
		"h": "https://github.com/Qinling-Melon-Farmers/dsh-memoir",
		"p": ""
	},
	{
		"f": "seed-forge/harness-ai-kit",
		"n": "harness-ai-kit",
		"o": "seed-forge",
		"d": "Package manager for AI agent assets (skills / CLIs / MCPs / loops) across Codex, Claude Code, Cursor and Kiro.",
		"s": 6,
		"k": 1,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agents",
			"claude-code",
			"claude-skills",
			"codex",
			"cursor",
			"devops",
			"dsh",
			"dsh-plugin",
			"kiro",
			"llm-ops",
			"mcp",
			"package-manager",
			"python"
		],
		"u": "2026-08-16T10:15:57Z",
		"h": "https://github.com/seed-forge/harness-ai-kit",
		"p": "https://pypi.org/project/harness-ai-kit/"
	},
	{
		"f": "fakechris/dsh-track",
		"n": "dsh-track",
		"o": "fakechris",
		"d": "DSH Track Bridge 插件：嵌入式任务管理引擎——决策点协议、念头捕获墙、Linear 形 issue 存储（bundle），AI 与人之间的任务轨道",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"plugin",
			"task-management",
			"track"
		],
		"u": "2026-08-15T01:10:06Z",
		"h": "https://github.com/fakechris/dsh-track",
		"p": ""
	},
	{
		"f": "oliblue-evan/dsh-roleplay-preset",
		"n": "dsh-roleplay-preset",
		"o": "oliblue-evan",
		"d": "DeepSeek 深度调校的沉浸式角色扮演 Agent 预设（dsh）——零工具纯对话、酒馆式演出格式、文件记忆库",
		"s": 6,
		"k": 0,
		"l": "",
		"t": [
			"agent-preset",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"roleplay"
		],
		"u": "2026-08-16T06:42:25Z",
		"h": "https://github.com/oliblue-evan/dsh-roleplay-preset",
		"p": ""
	},
	{
		"f": "tsrigo/dsh-from-scratch",
		"n": "dsh-from-scratch",
		"o": "tsrigo",
		"d": "A runnable TypeScript tutorial that builds a minimal DeepSeek-style agent harness from scratch.",
		"s": 6,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent-harness",
			"agent-loop",
			"ai-agents",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"long-running-tasks",
			"session-log",
			"tool-calling",
			"typescript"
		],
		"u": "2026-08-16T09:16:59Z",
		"h": "https://github.com/tsrigo/dsh-from-scratch",
		"p": "https://dsh-from-scratch.pages.dev/"
	},
	{
		"f": "huguangyu666/dsh-plugin-session-import",
		"n": "dsh-plugin-session-import",
		"o": "huguangyu666",
		"d": "DeepSeek Harness plugin: import claude-code / codex / reasonix / zcode sessions",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"reasonix",
			"session-import",
			"zcode"
		],
		"u": "2026-08-16T08:50:41Z",
		"h": "https://github.com/huguangyu666/dsh-plugin-session-import",
		"p": ""
	},
	{
		"f": "unknowbug/RE-Framework",
		"n": "RE-Framework",
		"o": "unknowbug",
		"d": "Modular engineering methodology framework for AI agents — reverse engineering & software development (core + re-binary / re-code / swe modules).",
		"s": 6,
		"k": 2,
		"l": "Python",
		"t": [
			"agent-framework",
			"ai-agents",
			"binary-analysis",
			"code-analysis",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"deobfuscation",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"engineering-workflow",
			"framework",
			"methodology",
			"multi-agent",
			"re-engineering",
			"reverse-engineering",
			"subagents"
		],
		"u": "2026-08-15T23:03:41Z",
		"h": "https://github.com/unknowbug/RE-Framework",
		"p": ""
	},
	{
		"f": "yascitom/dsh-opencode-go-box",
		"n": "dsh-opencode-go-box",
		"o": "yascitom",
		"d": "",
		"s": 6,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T04:36:40Z",
		"h": "https://github.com/yascitom/dsh-opencode-go-box",
		"p": ""
	},
	{
		"f": "Noob-stupid/dsh-github-login",
		"n": "dsh-github-login",
		"o": "Noob-stupid",
		"d": "DeepSeek Harness 生态的 GitHub 可视化登录工具（零终端）：设备码流程，令牌同步 gh CLI | Visual GitHub login for the DSH ecosystem - no terminal needed",
		"s": 6,
		"k": 0,
		"l": "HTML",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gh-cli",
			"github",
			"github-login",
			"help-wanted",
			"oauth"
		],
		"u": "2026-08-16T10:25:39Z",
		"h": "https://github.com/Noob-stupid/dsh-github-login",
		"p": ""
	},
	{
		"f": "Tkingxiao/dsh-any-background",
		"n": "dsh-any-background",
		"o": "Tkingxiao",
		"d": "一个自定义主题插件，包括背景图（大小和位置），主界面和设置界面（透明度，色轮全色主题色）插件",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin"
		],
		"u": "2026-08-16T10:24:00Z",
		"h": "https://github.com/Tkingxiao/dsh-any-background",
		"p": ""
	},
	{
		"f": "sliverp/DeepSeek-harness-qqbot",
		"n": "DeepSeek-harness-qqbot",
		"o": "sliverp",
		"d": "QQ Bot text and image channel plugin for DeepSeek Harness",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"qqbot",
			"typescript"
		],
		"u": "2026-08-15T23:49:47Z",
		"h": "https://github.com/sliverp/DeepSeek-harness-qqbot",
		"p": ""
	},
	{
		"f": "dongsheng123132/task-passport",
		"n": "task-passport",
		"o": "dongsheng123132",
		"d": "Open task handoff protocol for DeepSeek Harness, WorkBuddy, Claude Code and Codex — verified state, not chat logs",
		"s": 6,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"agent-memory",
			"ai-agent",
			"ai-agent-infrastructure",
			"claude-code",
			"codebuddy",
			"codex",
			"cross-harness",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"handoff",
			"mcp",
			"task-state",
			"workbuddy"
		],
		"u": "2026-08-16T08:42:41Z",
		"h": "https://github.com/dongsheng123132/task-passport",
		"p": ""
	},
	{
		"f": "walkinglabs/awesome-deepseek-harness-plugins",
		"n": "awesome-deepseek-harness-plugins",
		"o": "walkinglabs",
		"d": "A curated, bilingual list of verified plugins, tools, design workflows, and learning resources for DeepSeek Harness (DSH).",
		"s": 6,
		"k": 10,
		"l": "",
		"t": [
			"deepseek-harness",
			"digital-persona",
			"dsh-plugin",
			"dsh-plugins",
			"dshpersona",
			"openclaw",
			"skill-generator"
		],
		"u": "2026-08-16T09:09:42Z",
		"h": "https://github.com/walkinglabs/awesome-deepseek-harness-plugins",
		"p": ""
	},
	{
		"f": "YYTbit/dsh-plugin-claude-bridge",
		"n": "dsh-plugin-claude-bridge",
		"o": "YYTbit",
		"d": "Bridge Claude Code memory, skills, and config into DeepSeek Harness",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"deepseek-harness",
			"dsh-plugin",
			"memory"
		],
		"u": "2026-08-16T06:16:25Z",
		"h": "https://github.com/YYTbit/dsh-plugin-claude-bridge",
		"p": ""
	},
	{
		"f": "czm15053/dsh-peer-link",
		"n": "dsh-peer-link",
		"o": "czm15053",
		"d": "",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T07:32:57Z",
		"h": "https://github.com/czm15053/dsh-peer-link",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-sleep",
		"n": "dsh-plugin-sleep",
		"o": "HuanLinOTO",
		"d": "向模型暴露 sleep 工具，按指定毫秒暂停执行后返回，支持取消/clamp | Exposes a sleep tool that pauses for specified ms then returns, with cancellation/clamping",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T06:13:17Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-sleep",
		"p": ""
	},
	{
		"f": "Acidmoon/DIzzy-DSH",
		"n": "DIzzy-DSH",
		"o": "Acidmoon",
		"d": "My DSH plugins",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T07:53:09Z",
		"h": "https://github.com/Acidmoon/DIzzy-DSH",
		"p": ""
	},
	{
		"f": "loadingvx/deepseek-harness-workbench-plugin",
		"n": "deepseek-harness-workbench-plugin",
		"o": "loadingvx",
		"d": "Deepseek-harness-workbench-plugin ",
		"s": 6,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-bundle",
			"dsh-plugin-market",
			"dsh-plugins",
			"dsh-plugins-terminal"
		],
		"u": "2026-08-16T09:01:52Z",
		"h": "https://github.com/loadingvx/deepseek-harness-workbench-plugin",
		"p": "https://www.npmjs.com/package/dsh-workbench-plugin"
	},
	{
		"f": "heartmove/dsh-side-chat",
		"n": "dsh-side-chat",
		"o": "heartmove",
		"d": "一个 DSH 网页插件，Codex 式侧边聊天的强化版本： 在右侧面板提供按主会话隔离的独立聊天，具备 Codex 式的智能体能力——继承主会话的 工具集、模型、思考难度与权限预设，能感知所在工作目录；选中对话内容即可提问，AI 回复 也能带回主会话（直接带回或摘要后带回，写入草稿或注入为折叠提示行）。  在 Codex 式能力之上，它额外支持：当主会话的智能体弹出问题弹框向你提问时，可以 把问题与各个选项带入侧边聊天、让 AI 帮你分析，不必打断当前流程——想清楚后把答案 带回，再回答弹框即可。",
		"s": 6,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"codex-desktop",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"question-dialog",
			"side-chat"
		],
		"u": "2026-08-16T09:44:42Z",
		"h": "https://github.com/heartmove/dsh-side-chat",
		"p": ""
	},
	{
		"f": "congchuanling-dot/DSH-Telegram-Relay",
		"n": "DSH-Telegram-Relay",
		"o": "congchuanling-dot",
		"d": "DSH Relay 让你可以通过 Telegram 远程与 DeepSeek Harness 对话，并接收通知。DSH Relay turns Telegram into a remote conversation and notification channel for DeepSeek Harness.",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"automation",
			"automation-highway",
			"automotive",
			"autonomous-agents",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"text-only-llm",
			"typescript"
		],
		"u": "2026-08-15T19:00:45Z",
		"h": "https://github.com/congchuanling-dot/DSH-Telegram-Relay",
		"p": ""
	},
	{
		"f": "imlishiyuan/deepseek-harness-zh-cn",
		"n": "deepseek-harness-zh-cn",
		"o": "imlishiyuan",
		"d": "让 DeepSeek Harness 的推理（reasoning）与输出默认使用简体中文的中文插件。A Chinese-first plugin that makes [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) reason (`reasoning`) and answer in Simplified Chinese by default.",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:47:32Z",
		"h": "https://github.com/imlishiyuan/deepseek-harness-zh-cn",
		"p": ""
	},
	{
		"f": "xingyingyuzhui/dsh-updater-ui",
		"n": "dsh-updater-ui",
		"o": "xingyingyuzhui",
		"d": "",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-14T13:54:27Z",
		"h": "https://github.com/xingyingyuzhui/dsh-updater-ui",
		"p": ""
	},
	{
		"f": "R3alloc/dsh-session-deeplink",
		"n": "dsh-session-deeplink",
		"o": "R3alloc",
		"d": "DeepSeek Harness plugin for shareable session deep links",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T00:59:15Z",
		"h": "https://github.com/R3alloc/dsh-session-deeplink",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-calculator",
		"n": "dsh-tool-calculator",
		"o": "omdsh-dev",
		"d": "DSH 计算器工具插件：安全的数学表达式求值器，零依赖递归下降解析器",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"calculator",
			"dsh",
			"dsh-plugin",
			"expression-evaluator",
			"math"
		],
		"u": "2026-08-14T16:17:40Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-calculator",
		"p": ""
	},
	{
		"f": "jiezeng2004-design/dsh-chatgpt-bridge",
		"n": "dsh-chatgpt-bridge",
		"o": "jiezeng2004-design",
		"d": "MCP bridge that lets ChatGPT create, view, continue, and control DeepSeek Harness (DSH) agent sessions.",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"chatgpt",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mcp",
			"model-context-protocol"
		],
		"u": "2026-08-16T07:20:10Z",
		"h": "https://github.com/jiezeng2004-design/dsh-chatgpt-bridge",
		"p": ""
	},
	{
		"f": "Realyujie/dsh-us-stocks",
		"n": "dsh-us-stocks",
		"o": "Realyujie",
		"d": "US stock market data tools for DeepSeek Harness, powered by yahoo-finance2",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"market-data",
			"stock-market",
			"typescript",
			"us-stocks",
			"yahoo-finance"
		],
		"u": "2026-08-16T07:45:02Z",
		"h": "https://github.com/Realyujie/dsh-us-stocks",
		"p": "https://www.npmjs.com/package/dsh-us-stocks"
	},
	{
		"f": "yascitom/dsh-opencode-go-box",
		"n": "dsh-opencode-go-box",
		"o": "yascitom",
		"d": "",
		"s": 6,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T04:36:40Z",
		"h": "https://github.com/yascitom/dsh-opencode-go-box",
		"p": ""
	},
	{
		"f": "unknowbug/RE-Framework",
		"n": "RE-Framework",
		"o": "unknowbug",
		"d": "Modular engineering methodology framework for AI agents — reverse engineering & software development (core + re-binary / re-code / swe modules).",
		"s": 6,
		"k": 2,
		"l": "Python",
		"t": [
			"agent-framework",
			"ai-agents",
			"binary-analysis",
			"code-analysis",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"deobfuscation",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"engineering-workflow",
			"framework",
			"methodology",
			"multi-agent",
			"re-engineering",
			"reverse-engineering",
			"subagents"
		],
		"u": "2026-08-15T23:03:41Z",
		"h": "https://github.com/unknowbug/RE-Framework",
		"p": ""
	},
	{
		"f": "hi-wenw/dsh-telegram-channel",
		"n": "dsh-telegram-channel",
		"o": "hi-wenw",
		"d": "DeepSeek Harness Telegram mobile remote: bind live Web sessions (Codex-style). Install: dsh plugin add github:hi-wenw/dsh-telegram-channel",
		"s": 6,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"agent",
			"bot",
			"channel",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"mobile",
			"remote",
			"sessions",
			"telegram"
		],
		"u": "2026-08-15T09:02:57Z",
		"h": "https://github.com/hi-wenw/dsh-telegram-channel",
		"p": "https://github.com/topics/dsh-plugin"
	},
	{
		"f": "wssfk12138/dsh-wechat-notify",
		"n": "dsh-wechat-notify",
		"o": "wssfk12138",
		"d": "DeepSeek Harness 插件：为 agent 新增 wechat_notify 工具，让 AI 通过本机 ClawBot 微信通道主动给你发通知（任务完成 / 需决策时），中文可靠、掉线自提示。",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"clawbot",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"notify",
			"wechat",
			"wechat-notify"
		],
		"u": "2026-08-15T11:21:52Z",
		"h": "https://github.com/wssfk12138/dsh-wechat-notify",
		"p": ""
	},
	{
		"f": "hxyz486/dsh-archived-conversations",
		"n": "dsh-archived-conversations",
		"o": "hxyz486",
		"d": "归档对话查看 (archived-conversation-viewer)：在 DSH 设置页查看、恢复与删除归档会话的 Cordis 插件",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:38Z",
		"h": "https://github.com/hxyz486/dsh-archived-conversations",
		"p": ""
	},
	{
		"f": "lvyuchuiyi/dsh-funpack",
		"n": "dsh-funpack",
		"o": "lvyuchuiyi",
		"d": " DeepSeek Harness的一些有趣插件",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-15T13:11:30Z",
		"h": "https://github.com/lvyuchuiyi/dsh-funpack",
		"p": "https://github.com/lvyuchuiyi/dsh-funpack"
	},
	{
		"f": "BrambleXu/dsh-annotate",
		"n": "dsh-annotate",
		"o": "BrambleXu",
		"d": "Visual browser element annotation for DeepSeek Harness, capturing DOM, styles, accessibility data, comments, and viewport screenshots. DeepSeek Harness 浏览器元素标注插件，捕获 DOM、样式、可访问性数据、评论和视口截图。",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dom-inspection",
			"dsh",
			"dsh-plugin",
			"frontend-tools",
			"typescript",
			"visual-feedback"
		],
		"u": "2026-08-16T05:06:47Z",
		"h": "https://github.com/BrambleXu/dsh-annotate",
		"p": ""
	},
	{
		"f": "turtle1999/turtle-ui",
		"n": "turtle-ui",
		"o": "turtle1999",
		"d": "as is, no warranty",
		"s": 6,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T23:00:09Z",
		"h": "https://github.com/turtle1999/turtle-ui",
		"p": ""
	},
	{
		"f": "Smalldy/godot-bridge",
		"n": "godot-bridge",
		"o": "Smalldy",
		"d": "DSH (DeepSeek Harness) plugin that launches and drives a running Godot 4.x game through its in-game TCP interaction server — replaces the godot-mcp MCP server with native agent tools.",
		"s": 6,
		"k": 1,
		"l": "GDScript",
		"t": [
			"agent-tools",
			"ai-agent",
			"automation",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"game-development",
			"godot",
			"godot-engine",
			"godot-plugin",
			"mcp"
		],
		"u": "2026-08-15T14:59:54Z",
		"h": "https://github.com/Smalldy/godot-bridge",
		"p": ""
	},
	{
		"f": "fakechris/dsh-track",
		"n": "dsh-track",
		"o": "fakechris",
		"d": "DSH Track Bridge 插件：嵌入式任务管理引擎——决策点协议、念头捕获墙、Linear 形 issue 存储（bundle），AI 与人之间的任务轨道",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"plugin",
			"task-management",
			"track"
		],
		"u": "2026-08-15T01:10:06Z",
		"h": "https://github.com/fakechris/dsh-track",
		"p": ""
	},
	{
		"f": "oliblue-evan/dsh-roleplay-preset",
		"n": "dsh-roleplay-preset",
		"o": "oliblue-evan",
		"d": "DeepSeek 深度调校的沉浸式角色扮演 Agent 预设（dsh）——零工具纯对话、酒馆式演出格式、文件记忆库",
		"s": 6,
		"k": 0,
		"l": "",
		"t": [
			"agent-preset",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"roleplay"
		],
		"u": "2026-08-16T06:42:25Z",
		"h": "https://github.com/oliblue-evan/dsh-roleplay-preset",
		"p": ""
	},
	{
		"f": "huguangyu666/dsh-plugin-session-import",
		"n": "dsh-plugin-session-import",
		"o": "huguangyu666",
		"d": "DeepSeek Harness plugin: import claude-code / codex / reasonix / zcode sessions",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"reasonix",
			"session-import",
			"zcode"
		],
		"u": "2026-08-16T08:50:41Z",
		"h": "https://github.com/huguangyu666/dsh-plugin-session-import",
		"p": ""
	},
	{
		"f": "tsrigo/dsh-from-scratch",
		"n": "dsh-from-scratch",
		"o": "tsrigo",
		"d": "A runnable TypeScript tutorial that builds a minimal DeepSeek-style agent harness from scratch.",
		"s": 6,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent-harness",
			"agent-loop",
			"ai-agents",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"long-running-tasks",
			"session-log",
			"tool-calling",
			"typescript"
		],
		"u": "2026-08-16T09:16:59Z",
		"h": "https://github.com/tsrigo/dsh-from-scratch",
		"p": "https://dsh-from-scratch.pages.dev/"
	},
	{
		"f": "havingautism/dsh-deepresearch",
		"n": "dsh-deepresearch",
		"o": "havingautism",
		"d": "",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:02:53Z",
		"h": "https://github.com/havingautism/dsh-deepresearch",
		"p": ""
	},
	{
		"f": "LoserFox/telegram",
		"n": "telegram",
		"o": "LoserFox",
		"d": "Telegram Bot API 桥接插件：长轮询、per-chat 会话、HTML 格式化",
		"s": 6,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-13T16:39:31Z",
		"h": "https://github.com/LoserFox/telegram",
		"p": ""
	},
	{
		"f": "akira399/dsh-godot-skill",
		"n": "dsh-godot-skill",
		"o": "akira399",
		"d": "Godot Engine 4.x 全栈游戏开发技能插件 for DeepSeek Harness (DSH) — registers the godot-4-development skill at runtime",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"game-development",
			"gdscript",
			"godot",
			"godot-engine"
		],
		"u": "2026-08-15T15:48:04Z",
		"h": "https://github.com/akira399/dsh-godot-skill",
		"p": ""
	},
	{
		"f": "Qinling-Melon-Farmers/dsh-memoir",
		"n": "dsh-memoir",
		"o": "Qinling-Melon-Farmers",
		"d": "DSH 项目持久化记忆插件（TypeScript）：会话归纳 + 经验教训沉淀，写入 PROJECT_MEMORY.md 与全局索引；每轮工作结束自动提醒蒸馏、自动注入未来 AGENTS；附 Web GUI 记忆面板（项目/全局 tab、检索、手动记录/删除）。dsh-plugin",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek-harness",
			"dsh-plugin",
			"memory"
		],
		"u": "2026-08-16T09:13:01Z",
		"h": "https://github.com/Qinling-Melon-Farmers/dsh-memoir",
		"p": ""
	},
	{
		"f": "seed-forge/harness-ai-kit",
		"n": "harness-ai-kit",
		"o": "seed-forge",
		"d": "Package manager for AI agent assets (skills / CLIs / MCPs / loops) across Codex, Claude Code, Cursor and Kiro.",
		"s": 6,
		"k": 1,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agents",
			"claude-code",
			"claude-skills",
			"codex",
			"cursor",
			"devops",
			"dsh",
			"dsh-plugin",
			"kiro",
			"llm-ops",
			"mcp",
			"package-manager",
			"python"
		],
		"u": "2026-08-16T10:15:57Z",
		"h": "https://github.com/seed-forge/harness-ai-kit",
		"p": "https://pypi.org/project/harness-ai-kit/"
	},
	{
		"f": "Chang-Tong/dsh-import-agents",
		"n": "dsh-import-agents",
		"o": "Chang-Tong",
		"d": "Import pi / opencode / codex / claude-code sessions, chat history, and agents into DeepSeek Harness — one-click Sync button, slash commands, session-start migration prompt",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agents",
			"claude-code",
			"codex",
			"deepseek-harness",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"opencode",
			"pi-coding-agent",
			"plugin",
			"session-import",
			"session-migration"
		],
		"u": "2026-08-15T02:46:57Z",
		"h": "https://github.com/Chang-Tong/dsh-import-agents",
		"p": ""
	},
	{
		"f": "ArcanePivot/dsh-api-balance",
		"n": "dsh-api-balance",
		"o": "ArcanePivot",
		"d": "DeepSeek Harness Web UI widget for viewing DeepSeek API balance from the host side.",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"api-balance",
			"deepseek",
			"deepseek-api",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"macos",
			"windows"
		],
		"u": "2026-08-15T07:30:07Z",
		"h": "https://github.com/ArcanePivot/dsh-api-balance",
		"p": ""
	},
	{
		"f": "orxz/deepseek-harness-themes",
		"n": "deepseek-harness-themes",
		"o": "orxz",
		"d": "A collection of UI themes for deepseek-harness.",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T23:49:39Z",
		"h": "https://github.com/orxz/deepseek-harness-themes",
		"p": ""
	},
	{
		"f": "KirschBluteX/engineer-software",
		"n": "engineer-software",
		"o": "KirschBluteX",
		"d": "A runtime-neutral, evidence-driven software engineering workflow for Codex and DeepSeek Harness.",
		"s": 6,
		"k": 1,
		"l": "Python",
		"t": [
			"agent-skills",
			"agent-workflow",
			"ai-coding-agent",
			"codex-plugin",
			"codex-skills",
			"coding-agents",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"software-engineering"
		],
		"u": "2026-08-15T05:52:42Z",
		"h": "https://github.com/KirschBluteX/engineer-software",
		"p": "https://github.com/KirschBluteX/engineer-software"
	},
	{
		"f": "Dpf555/dsh-workbench",
		"n": "dsh-workbench",
		"o": "Dpf555",
		"d": "VS Code-style three-column Explorer + Monaco editor plugin for the DeepSeek Harness web GUI",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"web-ui"
		],
		"u": "2026-08-15T06:31:27Z",
		"h": "https://github.com/Dpf555/dsh-workbench",
		"p": "https://deepseek.com/harness"
	},
	{
		"f": "TwotwoPiggy/dsh-balance",
		"n": "dsh-balance",
		"o": "TwotwoPiggy",
		"d": "dsh余额插件. A DeepSeek Harness plugin for real-time token tracking and highly accurate session cost estimation, featuring dynamic peak/off-peak pricing support.",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"balance",
			"cost-track",
			"cost-tracker",
			"cost-tracking",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-web-ui"
		],
		"u": "2026-08-15T12:24:50Z",
		"h": "https://github.com/TwotwoPiggy/dsh-balance",
		"p": ""
	},
	{
		"f": "Letter2025/dsh-approval-llm",
		"n": "dsh-approval-llm",
		"o": "Letter2025",
		"d": "Model-based permission approval (approve-for-me) for DeepSeek Harness: an approval/request answerer backed by a separate reviewer model",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T02:27:58Z",
		"h": "https://github.com/Letter2025/dsh-approval-llm",
		"p": ""
	},
	{
		"f": "Toukaiteio/dsh-plugin-installer",
		"n": "dsh-plugin-installer",
		"o": "Toukaiteio",
		"d": "A marketplace plugin to quickly integrate your DeepSeek Harness into the GitHub plugin ecosystem.",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:19:49Z",
		"h": "https://github.com/Toukaiteio/dsh-plugin-installer",
		"p": ""
	},
	{
		"f": "zebbkira/dsh-skills-mcp-manager",
		"n": "dsh-skills-mcp-manager",
		"o": "zebbkira",
		"d": "面向 DeepSeek Harness Web GUI 的正式插件包：在设置页的「Web UI 插件」分组中新增一张「技能与 MCP」卡片，用于在浏览器里管理技能（skills）与 MCP 服务器。",
		"s": 6,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T21:56:15Z",
		"h": "https://github.com/zebbkira/dsh-skills-mcp-manager",
		"p": ""
	},
	{
		"f": "a179-sanae/dsh-auto-collapse",
		"n": "dsh-auto-collapse",
		"o": "a179-sanae",
		"d": "",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:08:09Z",
		"h": "https://github.com/a179-sanae/dsh-auto-collapse",
		"p": ""
	},
	{
		"f": "AtlasCloudAI/mcp-server",
		"n": "mcp-server",
		"o": "AtlasCloudAI",
		"d": "MCP server for Atlas Cloud - AI API aggregation platform for image/video generation and LLM",
		"s": 6,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai",
			"atlascloud",
			"claude",
			"dsh-plugin",
			"generative-ai",
			"image-generation",
			"llm",
			"mcp",
			"model-context-protocol",
			"video-generation"
		],
		"u": "2026-08-16T04:00:18Z",
		"h": "https://github.com/AtlasCloudAI/mcp-server",
		"p": "https://www.atlascloud.ai"
	},
	{
		"f": "Player-MINEPIG/dsh-tavern",
		"n": "dsh-tavern",
		"o": "Player-MINEPIG",
		"d": "A plugin which makes dsh compatible with SillyTavern artifacts.",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T06:34:03Z",
		"h": "https://github.com/Player-MINEPIG/dsh-tavern",
		"p": ""
	},
	{
		"f": "cyanfish-x/dsh-live2d-pets",
		"n": "dsh-live2d-pets",
		"o": "cyanfish-x",
		"d": "Live2D 桌宠插件 for DeepSeek Harness：Agent 状态镜像 + 互动陪伴，内置宽松许可预设模型 / Live2D pet plugin: agent state mirror + interactive companion with curated permissive-license presets",
		"s": 6,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"cubism",
			"deepseek-harness",
			"desktop-pet",
			"dsh",
			"dsh-plugin",
			"live2d",
			"mascot",
			"plugin",
			"webgl"
		],
		"u": "2026-08-16T08:15:44Z",
		"h": "https://github.com/cyanfish-x/dsh-live2d-pets",
		"p": ""
	},
	{
		"f": "Sev7een/ds-api-usage",
		"n": "ds-api-usage",
		"o": "Sev7een",
		"d": "",
		"s": 6,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:27:59Z",
		"h": "https://github.com/Sev7een/ds-api-usage",
		"p": ""
	},
	{
		"f": "iyllyt/dsh-btw",
		"n": "dsh-btw",
		"o": "iyllyt",
		"d": "个人很喜欢 Claude Code 的 /btw，于是为 DSH 做了复刻：共享当前上下文快速旁路提问，不中断主任务，也不写入主会话历史。",
		"s": 6,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"btw",
			"claude-code",
			"deepseek-harness",
			"dsh-plugin",
			"typescript"
		],
		"u": "2026-08-15T12:06:39Z",
		"h": "https://github.com/iyllyt/dsh-btw",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-interpreters",
		"n": "dsh-plugin-interpreters",
		"o": "HuanLinOTO",
		"d": "暴露 run_python/run_node 工具，通过 stdin 执行代码返回 stdout/stderr/exit，含解释器路径配置卡 | Exposes run_python/run_node tools that execute code via stdin and return stdout/stderr/exit, with interpreter-path config card",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T06:13:37Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-interpreters",
		"p": ""
	},
	{
		"f": "stevenx65/dsh-balance-plugin",
		"n": "dsh-balance-plugin",
		"o": "stevenx65",
		"d": "",
		"s": 6,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T16:55:24Z",
		"h": "https://github.com/stevenx65/dsh-balance-plugin",
		"p": ""
	},
	{
		"f": "DViridescent/dafy-whale-theme",
		"n": "dafy-whale-theme",
		"o": "DViridescent",
		"d": "DeepSeek Harness 蓝色大肥鱼主题插件：海洋配色、鱼群、气泡、吉祥物与品牌替换",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"theme"
		],
		"u": "2026-08-15T14:19:52Z",
		"h": "https://github.com/DViridescent/dafy-whale-theme",
		"p": ""
	},
	{
		"f": "zibo2025/dsh-orchestrator",
		"n": "dsh-orchestrator",
		"o": "zibo2025",
		"d": "【编排模式】为 DeepSeek Harness 提供多智能体编排模式：主智能体分解分派、worker 全网格互通，支持逐 worker 指定模型与思考强度",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T13:54:28Z",
		"h": "https://github.com/zibo2025/dsh-orchestrator",
		"p": ""
	},
	{
		"f": "HackSing/dsh-plugins",
		"n": "dsh-plugins",
		"o": "HackSing",
		"d": "A bilingual, continuously maintained directory of plugins for DeepSeek Harness (DSH).",
		"s": 5,
		"k": 3,
		"l": "Python",
		"t": [
			"ai-tools",
			"awesome",
			"awesome-list",
			"curated-list",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin-directory",
			"plugins"
		],
		"u": "2026-08-16T04:22:53Z",
		"h": "https://github.com/HackSing/dsh-plugins",
		"p": ""
	},
	{
		"f": "william-jin-cmu/dsh-companion",
		"n": "dsh-companion",
		"o": "william-jin-cmu",
		"d": "DeepSeek Harness 的常驻桌面助手：全局唤起、定时自动化、快捷回复、插件市场",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T09:37:21Z",
		"h": "https://github.com/william-jin-cmu/dsh-companion",
		"p": ""
	},
	{
		"f": "xiaoxianyu-office/dsh-router-flash",
		"n": "dsh-router-flash",
		"o": "xiaoxianyu-office",
		"d": "DSH bundle 插件：V4 Flash 神模式（opencode-go）agent preset 分发包，dsh plugin add 安装后自动同步 router-flash preset。DSH agent preset bundle for DeepSeek V4 Flash godmode.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:34:19Z",
		"h": "https://github.com/xiaoxianyu-office/dsh-router-flash",
		"p": ""
	},
	{
		"f": "wx-yss/dsh-message-rail",
		"n": "dsh-message-rail",
		"o": "wx-yss",
		"d": "Codex 风格左侧消息导航轨道：等距刻度 + 悬停预览 + 点击跳转用户消息 · DSH Web 插件",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:57:47Z",
		"h": "https://github.com/wx-yss/dsh-message-rail",
		"p": ""
	},
	{
		"f": "GLFzr/dsh-opencode-go-quota",
		"n": "dsh-opencode-go-quota",
		"o": "GLFzr",
		"d": "DSH 插件：OpenCode Go 额度圆环 —— 输入框模型选择器左侧的进度圆环，点击切换 5小时/每周/每月用量（OpenCode Go quota ring for DeepSeek Harness Web）",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agents",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"opencode",
			"quota",
			"web-ui"
		],
		"u": "2026-08-16T09:40:46Z",
		"h": "https://github.com/GLFzr/dsh-opencode-go-quota",
		"p": ""
	},
	{
		"f": "Solismuchengxue/dsh_plugin_swift_cycle",
		"n": "dsh_plugin_swift_cycle",
		"o": "Solismuchengxue",
		"d": "Swift Cycle governance skill adapter for DeepSeek Harness; user-invoked, version-pinned, and offline-verifiable.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"project-governance",
			"swift-cycle"
		],
		"u": "2026-08-16T09:10:05Z",
		"h": "https://github.com/Solismuchengxue/dsh_plugin_swift_cycle",
		"p": ""
	},
	{
		"f": "shaobeichen/dsh-pocket",
		"n": "dsh-pocket",
		"o": "shaobeichen",
		"d": "把 DeepSeek Harness 装进你的口袋：电脑上跑 dsh web，手机扫码即同步访问（局域网 + 公网，实时同屏）",
		"s": 5,
		"k": 5,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"mobile",
			"qr",
			"remote",
			"tunnel"
		],
		"u": "2026-08-16T09:25:24Z",
		"h": "https://github.com/shaobeichen/dsh-pocket",
		"p": ""
	},
	{
		"f": "lehhair/dsh-split-panes",
		"n": "dsh-split-panes",
		"o": "lehhair",
		"d": "",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:59:19Z",
		"h": "https://github.com/lehhair/dsh-split-panes",
		"p": ""
	},
	{
		"f": "JustGenius-s/DSH-Plugs",
		"n": "DSH-Plugs",
		"o": "JustGenius-s",
		"d": "DSH Plugins Cellection",
		"s": 5,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T08:38:47Z",
		"h": "https://github.com/JustGenius-s/DSH-Plugs",
		"p": ""
	},
	{
		"f": "jiangnanquan/dsh-ux",
		"n": "dsh-ux",
		"o": "jiangnanquan",
		"d": "DSH web UI 增强插件 + 无边框 Electron 桌面壳",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"desktop",
			"dsh",
			"dsh-plugin",
			"electron",
			"theme"
		],
		"u": "2026-08-15T14:30:07Z",
		"h": "https://github.com/jiangnanquan/dsh-ux",
		"p": ""
	},
	{
		"f": "liqichen/dsh-plugin-manager",
		"n": "dsh-plugin-manager",
		"o": "liqichen",
		"d": "DSH 插件管理器:在 DeepSeek Harness 设置面板内嵌 GUI,管理 MCP 服务 / Skills / 内置插件包,改动热生效无需重启",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:37:25Z",
		"h": "https://github.com/liqichen/dsh-plugin-manager",
		"p": ""
	},
	{
		"f": "cerebrixos-org/tuning-engines-cli",
		"n": "tuning-engines-cli",
		"o": "cerebrixos-org",
		"d": "CLI & MCP server for Tuning Engines — fine-tune LLMs on code repositories",
		"s": 5,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"ai",
			"cli",
			"dsh-plugin",
			"fine-tuning",
			"llm",
			"lora",
			"machine-learning",
			"mcp",
			"mcp-server",
			"model-context-protocol",
			"open-source",
			"qlora",
			"slm",
			"sovereign-ai"
		],
		"u": "2026-08-15T18:01:59Z",
		"h": "https://github.com/cerebrixos-org/tuning-engines-cli",
		"p": ""
	},
	{
		"f": "titanwings/dsh-plannotator",
		"n": "dsh-plannotator",
		"o": "titanwings",
		"d": "DSH 计划批注插件：选中计划原文、逐条批注，并把结构化反馈送回 Agent。 / A DSH plan-review plugin for anchored annotations and structured Agent feedback.",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plan-review",
			"plannotator"
		],
		"u": "2026-08-15T08:45:02Z",
		"h": "https://github.com/titanwings/dsh-plannotator",
		"p": ""
	},
	{
		"f": "yuko0331/DSH-telegram",
		"n": "DSH-telegram",
		"o": "yuko0331",
		"d": "通过 Telegram 私聊远程使用和查看 DeepSeek Harness",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T04:37:16Z",
		"h": "https://github.com/yuko0331/DSH-telegram",
		"p": ""
	},
	{
		"f": "Relistencode/dsh-extension-hub",
		"n": "dsh-extension-hub",
		"o": "Relistencode",
		"d": "Manage DSH（DeepSeek Harness)） skills and MCP servers: CLI + settings-page UI with zh/en i18n, Claude/Codex import, and update checks.",
		"s": 5,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"rules"
		],
		"u": "2026-08-16T09:23:46Z",
		"h": "https://github.com/Relistencode/dsh-extension-hub",
		"p": ""
	},
	{
		"f": "TQSY114514/dsh-ui-appearance",
		"n": "dsh-ui-appearance",
		"o": "TQSY114514",
		"d": "Appearance customization plugin for DeepSeek Harness: theme color palette, background image, opacity/blur, glass effect",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"customization",
			"deepseek-harness",
			"dsh-plugin",
			"plugin",
			"theme"
		],
		"u": "2026-08-16T07:09:44Z",
		"h": "https://github.com/TQSY114514/dsh-ui-appearance",
		"p": ""
	},
	{
		"f": "DDDFXYqiming/Agent_Extensions",
		"n": "Agent_Extensions",
		"o": "DDDFXYqiming",
		"d": "Agent Skills & DeepSeek Harness (DSH) 扩展库：通用智能体技能（General_skills）+ DSH 标准插件（dsh-plugin），开箱即用的 AI Agent 能力增强集合。",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"ai-agent",
			"deepseek-harness",
			"dsh-plugin",
			"prompt-engineering",
			"python",
			"skills",
			"translation"
		],
		"u": "2026-08-15T22:21:38Z",
		"h": "https://github.com/DDDFXYqiming/Agent_Extensions",
		"p": ""
	},
	{
		"f": "yuqingsh/dsh-image-subagent",
		"n": "dsh-image-subagent",
		"o": "yuqingsh",
		"d": "",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T01:00:03Z",
		"h": "https://github.com/yuqingsh/dsh-image-subagent",
		"p": ""
	},
	{
		"f": "121103qwq/dsh-vision-sidecar",
		"n": "dsh-vision-sidecar",
		"o": "121103qwq",
		"d": "Hosted free vision sidecar for DeepSeek Harness with durable session evidence",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"glm",
			"vision-language-model"
		],
		"u": "2026-08-15T05:35:15Z",
		"h": "https://github.com/121103qwq/dsh-vision-sidecar",
		"p": ""
	},
	{
		"f": "LJninse/dsh-open-in-ide",
		"n": "dsh-open-in-ide",
		"o": "LJninse",
		"d": "DeepSeek Harness Web UI plugin: add an IDE button that auto-detects local IDEs and opens the current workspace folder.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T16:07:15Z",
		"h": "https://github.com/LJninse/dsh-open-in-ide",
		"p": ""
	},
	{
		"f": "Fisfzy/zotero-harvest",
		"n": "zotero-harvest",
		"o": "Fisfzy",
		"d": "Zotero 文献采集入库插件（DSH external plugin）：多源检索（OpenAlex/arXiv/Crossref/Europe PMC/Semantic Scholar）+ OA 下载链接解析（Unpaywall）+ 充分性审计 + 入库本地 Zotero + 触发 zotero-wave-rag 重建",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dshx",
			"literature",
			"papers",
			"zotero"
		],
		"u": "2026-08-14T07:16:16Z",
		"h": "https://github.com/Fisfzy/zotero-harvest",
		"p": ""
	},
	{
		"f": "GrayCodeTeam/graycode-for-dsh",
		"n": "graycode-for-dsh",
		"o": "GrayCodeTeam",
		"d": "",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"agentic-ai",
			"ai-agents",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm-agents"
		],
		"u": "2026-08-15T20:53:09Z",
		"h": "https://github.com/GrayCodeTeam/graycode-for-dsh",
		"p": ""
	},
	{
		"f": "kc0ed/dsh-bottom-bar",
		"n": "dsh-bottom-bar",
		"o": "kc0ed",
		"d": "用于提供更丰富的DeepSeek Harness底栏信息显示插件",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:58:14Z",
		"h": "https://github.com/kc0ed/dsh-bottom-bar",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-stat",
		"n": "dsh-tool-stat",
		"o": "omdsh-dev",
		"d": "DSH 统计工具插件：描述统计/百分位数/频数分布/相关性，零依赖纯函数确定性",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"correlation",
			"data-analysis",
			"dsh",
			"dsh-plugin",
			"statistics"
		],
		"u": "2026-08-16T10:17:40Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-stat",
		"p": ""
	},
	{
		"f": "tensorlakeai/dsh-tensorlake-sandbox",
		"n": "dsh-tensorlake-sandbox",
		"o": "tensorlakeai",
		"d": "A deepseek harness plugin for tensorlake sandbox ",
		"s": 5,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"ai-infrastructure",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"harness",
			"sandbox",
			"sandbox-environment",
			"tensorlake"
		],
		"u": "2026-08-14T19:21:53Z",
		"h": "https://github.com/tensorlakeai/dsh-tensorlake-sandbox",
		"p": "https://tensorlake.ai"
	},
	{
		"f": "monk233/dsh-plugin-manager",
		"n": "dsh-plugin-manager",
		"o": "monk233",
		"d": "DSH 插件管理, 一键启用/禁用插件",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T14:18:56Z",
		"h": "https://github.com/monk233/dsh-plugin-manager",
		"p": ""
	},
	{
		"f": "yauntyour/DSH-for-VSC",
		"n": "DSH-for-VSC",
		"o": "yauntyour",
		"d": "把 DeepSeek Harness（DSH）的 WebUI 搬进 VS Code：编辑器内嵌面板 + 侧边栏控制台，服务离线自动拉起，日志随时可查。",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"harness"
		],
		"u": "2026-08-15T14:28:06Z",
		"h": "https://github.com/yauntyour/DSH-for-VSC",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-d399",
		"n": "dsh-plugin-d399",
		"o": "HuanLinOTO",
		"d": "模型生成时右下角弹出小游戏菜单（Wordle/消消乐/192 款参数化小游戏，可拓展注册表） | Pops up a mini-game menu while the model generates (Wordle/Match-3/192 parametric mini-games, extensible registry)",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T09:06:22Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-d399",
		"p": ""
	},
	{
		"f": "Vim0x3c/dsh-session-manager",
		"n": "dsh-session-manager",
		"o": "Vim0x3c",
		"d": "DeepSeek Harness 会话管理设置面板：列出本机全部会话（运行中/空闲/已归档），支持继续会话、预览大纲、删除会话 | Session management settings section for dsh web: resume, outline, and delete any session",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T20:35:54Z",
		"h": "https://github.com/Vim0x3c/dsh-session-manager",
		"p": ""
	},
	{
		"f": "0lidaxiang/dsh-plugin-greet",
		"n": "dsh-plugin-greet",
		"o": "0lidaxiang",
		"d": "DeepSeek Harness is a plugin-based system for building AI agents. Everything, from tools and models to the web UI, can be added or replaced as a plugin.",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T06:11:14Z",
		"h": "https://github.com/0lidaxiang/dsh-plugin-greet",
		"p": ""
	},
	{
		"f": "toolclub/dsh-agent-team-gui",
		"n": "dsh-agent-team-gui",
		"o": "toolclub",
		"d": "Persistent multi-model agent squads for DeepSeek Harness — reusable teams, per-agent model/tool policies, and ordinary-chat collaboration.",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"multi-agent",
			"orchestration"
		],
		"u": "2026-08-16T07:55:07Z",
		"h": "https://github.com/toolclub/dsh-agent-team-gui",
		"p": "https://github.com/toolclub/dsh-agent-team-gui#readme"
	},
	{
		"f": "huahai0202/dsh-better-archive",
		"n": "dsh-better-archive",
		"o": "huahai0202",
		"d": "DeepSeek Harness (DSH) web-GUI plugin: archived-session panel with unarchive & delete",
		"s": 5,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T03:16:37Z",
		"h": "https://github.com/huahai0202/dsh-better-archive",
		"p": ""
	},
	{
		"f": "TonyDua/dsh-web-search-exa",
		"n": "dsh-web-search-exa",
		"o": "TonyDua",
		"d": "Zero-config Exa web search provider for DeepSeek Harness (dsh): keyless anonymous MCP fallback (mcp.exa.ai/mcp) + keyed REST path, with a configurable providerId switch.",
		"s": 5,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"exa",
			"mcp",
			"web-search"
		],
		"u": "2026-08-15T16:06:22Z",
		"h": "https://github.com/TonyDua/dsh-web-search-exa",
		"p": ""
	},
	{
		"f": "xiongjiamu/dsh-atomgit",
		"n": "dsh-atomgit",
		"o": "xiongjiamu",
		"d": "AtomGit plugin bundle for DeepSeek Harness (dsh): atomgit-skills workflows + ag CLI + platform-hosted AtomGit/GitCode MCP tools",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"atomgit",
			"atomgit-cli",
			"dsh-plugin",
			"dsh-plugins",
			"gitcode",
			"gitcode-cli",
			"gitcode-mpc"
		],
		"u": "2026-08-15T11:04:32Z",
		"h": "https://github.com/xiongjiamu/dsh-atomgit",
		"p": ""
	},
	{
		"f": "nowledge-co/nowledge-mem-deepseek-harness",
		"n": "nowledge-mem-deepseek-harness",
		"o": "nowledge-co",
		"d": "One memory layer for every AI tool and agent, packaged for DeepSeek Harness",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"knowledge-graph",
			"mcp",
			"memory",
			"nowledge-mem",
			"ontology"
		],
		"u": "2026-08-16T02:23:02Z",
		"h": "https://github.com/nowledge-co/nowledge-mem-deepseek-harness",
		"p": "https://mem.nowledge.co/integrations/deepseek-harness"
	},
	{
		"f": "HarcoChen/dsh-vsc-integration",
		"n": "dsh-vsc-integration",
		"o": "HarcoChen",
		"d": "Deepseek-Harness Vscode Integration",
		"s": 5,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"vscode-extension"
		],
		"u": "2026-08-16T04:30:34Z",
		"h": "https://github.com/HarcoChen/dsh-vsc-integration",
		"p": ""
	},
	{
		"f": "feiyang-dev/DeepSeek-Harness-Desktop",
		"n": "DeepSeek-Harness-Desktop",
		"o": "feiyang-dev",
		"d": "一个 Electron 桌面壳，内嵌官方 DeepSeek Harness Web UI。启动时让用户选择安装模式，自动完成环境检测、安装、服务拉起，以百分比进度条展示各阶段，服务就绪后打开主界面。",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-ai",
			"deepseek-api",
			"deepseek-harness",
			"deepseek-v4",
			"deepseek-v4-pro",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:25:56Z",
		"h": "https://github.com/feiyang-dev/DeepSeek-Harness-Desktop",
		"p": ""
	},
	{
		"f": "PAKIKNOWLEDGE/dsh-client-ui-skin-claude",
		"n": "dsh-client-ui-skin-claude",
		"o": "PAKIKNOWLEDGE",
		"d": "Claude-style skin for DeepSeek Harness (dsh) Web GUI — warm-black canvas, Anthropic clay accent, serif UI",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"claude",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"skin",
			"theme",
			"ui"
		],
		"u": "2026-08-15T15:54:56Z",
		"h": "https://github.com/PAKIKNOWLEDGE/dsh-client-ui-skin-claude",
		"p": ""
	},
	{
		"f": "Jesse-njx/dsh-chatnode-wechat",
		"n": "dsh-chatnode-wechat",
		"o": "Jesse-njx",
		"d": "Chat with, monitor, and approve your DSH agents from WeChat — an iLink gateway + conversation node bundle for DeepSeek Harness",
		"s": 5,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"ilink",
			"wechat",
			"weixin"
		],
		"u": "2026-08-16T10:06:41Z",
		"h": "https://github.com/Jesse-njx/dsh-chatnode-wechat",
		"p": ""
	},
	{
		"f": "Luaphes/dsh-web-attention-badge",
		"n": "dsh-web-attention-badge",
		"o": "Luaphes",
		"d": "Attention reminders for the DeepSeek Harness Web UI: frame badge, (N) tab title and whale-favicon recolor for sessions waiting for input or finished unopened.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"badge",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"notification",
			"web"
		],
		"u": "2026-08-15T17:14:59Z",
		"h": "https://github.com/Luaphes/dsh-web-attention-badge",
		"p": ""
	},
	{
		"f": "errorcode7/dsh-prompt-manager",
		"n": "dsh-prompt-manager",
		"o": "errorcode7",
		"d": "DeepSeekHarness的提示词管理器插件",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-16T02:19:57Z",
		"h": "https://github.com/errorcode7/dsh-prompt-manager",
		"p": ""
	},
	{
		"f": "yun520-1/deepseek-heartflow",
		"n": "deepseek-heartflow",
		"o": "yun520-1",
		"d": "HeartFlow (心虫) as a DSH plugin — AGI 第1层辨别门禁: heartflow_check tool + automatic output supervision",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T07:05:06Z",
		"h": "https://github.com/yun520-1/deepseek-heartflow",
		"p": ""
	},
	{
		"f": "unnnnoooo/dsh-cue-plugin",
		"n": "dsh-cue-plugin",
		"o": "unnnnoooo",
		"d": "DeepSeek Harness 的跨会话引用(cue)插件",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T11:55:38Z",
		"h": "https://github.com/unnnnoooo/dsh-cue-plugin",
		"p": ""
	},
	{
		"f": "nonewind/dsh-spend",
		"n": "dsh-spend",
		"o": "nonewind",
		"d": "Token usage & cost monitor for DeepSeek Harness — floating widget with multi-dimensional stats, time-series charts, auto-detected billing plans (Code/Token) and estimated spend.",
		"s": 5,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T12:48:25Z",
		"h": "https://github.com/nonewind/dsh-spend",
		"p": ""
	},
	{
		"f": "UynajGI/dsh-ssh",
		"n": "dsh-ssh",
		"o": "UynajGI",
		"d": "SSH remote-execution plugin for DeepSeek Harness: ProxyJump chain, SFTP filesystem, subprocess and PTY over ssh2",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"plugin",
			"proxyjump",
			"remote-development",
			"sftp",
			"ssh"
		],
		"u": "2026-08-15T14:55:31Z",
		"h": "https://github.com/UynajGI/dsh-ssh",
		"p": ""
	},
	{
		"f": "GLFzr/dsh-file-upload",
		"n": "dsh-file-upload",
		"o": "GLFzr",
		"d": "DSH 拖拽文件转路径插件：Codex 式拖拽，路径自动插入输入框（Drop File to Path for DeepSeek Harness）",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-agents",
			"cordis",
			"deepseek-harness",
			"drag-drop",
			"dsh",
			"dsh-plugin",
			"web-ui"
		],
		"u": "2026-08-16T06:34:46Z",
		"h": "https://github.com/GLFzr/dsh-file-upload",
		"p": ""
	},
	{
		"f": "131CDA1/dsh-scrape-webpage",
		"n": "dsh-scrape-webpage",
		"o": "131CDA1",
		"d": "用于DeepSeek Harness的网页读取插件",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T00:57:53Z",
		"h": "https://github.com/131CDA1/dsh-scrape-webpage",
		"p": ""
	},
	{
		"f": "LaoYueHanNi/dsh-token-usage",
		"n": "dsh-token-usage",
		"o": "LaoYueHanNi",
		"d": "",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T07:37:35Z",
		"h": "https://github.com/LaoYueHanNi/dsh-token-usage",
		"p": ""
	},
	{
		"f": "mikeyoubeach/dsh-minimal-v3",
		"n": "dsh-minimal-v3",
		"o": "mikeyoubeach",
		"d": "Windows-friendly full-minimal DeepSeek Harness agent preset (Minimal V3): minimal persona, platform shell (pwsh/bash), common file/search tools, no auto-inject/compaction.",
		"s": 5,
		"k": 0,
		"l": "",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T10:30:13Z",
		"h": "https://github.com/mikeyoubeach/dsh-minimal-v3",
		"p": ""
	},
	{
		"f": "DGPisces/dsh-openai-oauth",
		"n": "dsh-openai-oauth",
		"o": "DGPisces",
		"d": "DeepSeek Harness provider for GPT models using managed ChatGPT OAuth through Codex app-server",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"chatgpt-oauth",
			"codex",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:55:20Z",
		"h": "https://github.com/DGPisces/dsh-openai-oauth",
		"p": ""
	},
	{
		"f": "sliverp/DeepSeek-harness-wecom",
		"n": "DeepSeek-harness-wecom",
		"o": "sliverp",
		"d": "WeCom AI Bot text and image bridge for DeepSeek Harness",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"chatbot",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"typescript",
			"wecom",
			"wework"
		],
		"u": "2026-08-16T04:27:04Z",
		"h": "https://github.com/sliverp/DeepSeek-harness-wecom",
		"p": ""
	},
	{
		"f": "tsonglew/dsh-workspace-search",
		"n": "dsh-workspace-search",
		"o": "tsonglew",
		"d": "VS Code-style workspace keyword search for DeepSeek Harness: a Search tab in dsh-better-sidebar",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"better-sidebar",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:49:44Z",
		"h": "https://github.com/tsonglew/dsh-workspace-search",
		"p": ""
	},
	{
		"f": "mudden2380078550-creator/write-chinese-long-screenplay",
		"n": "write-chinese-long-screenplay",
		"o": "mudden2380078550-creator",
		"d": "中文电影与剧集长剧本写作 skill",
		"s": 5,
		"k": 2,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-writing",
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"screenwriting"
		],
		"u": "2026-08-16T07:28:05Z",
		"h": "https://github.com/mudden2380078550-creator/write-chinese-long-screenplay",
		"p": ""
	},
	{
		"f": "Visol-456/dsh-llm-fallback",
		"n": "dsh-llm-fallback",
		"o": "Visol-456",
		"d": "DeepSeek Harness 回退链插件：主模型失败自动切换备用 provider，带 Web UI 配置面板 | Provider fallback chains for DeepSeek Harness",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"fallback"
		],
		"u": "2026-08-15T01:40:41Z",
		"h": "https://github.com/Visol-456/dsh-llm-fallback",
		"p": ""
	},
	{
		"f": "ltao0829/dsh-task-notify",
		"n": "dsh-task-notify",
		"o": "ltao0829",
		"d": "DeepSeek Harness task-completion reminder plugin",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"notifications"
		],
		"u": "2026-08-15T11:43:56Z",
		"h": "https://github.com/ltao0829/dsh-task-notify",
		"p": ""
	},
	{
		"f": "sorsama/deepseek-harness-mobile",
		"n": "deepseek-harness-mobile",
		"o": "sorsama",
		"d": "Android companion for DeepSeek Harness | chat, goals, approvals & notifications from your phone, over your LAN. Kotlin + Jetpack Compose.",
		"s": 5,
		"k": 0,
		"l": "Kotlin",
		"t": [
			"ai-agents",
			"cordis",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T22:37:41Z",
		"h": "https://github.com/sorsama/deepseek-harness-mobile",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-llm-fallbacks",
		"n": "dsh-llm-fallbacks",
		"o": "omdsh-dev",
		"d": "An dsh plugin for role-based LLM retry&fallback strategy. 基于角色的模型重试备用策略插件",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"fallbacks",
			"subagents"
		],
		"u": "2026-08-16T04:20:00Z",
		"h": "https://github.com/omdsh-dev/dsh-llm-fallbacks",
		"p": ""
	},
	{
		"f": "Leon0555/dsh-lan-access",
		"n": "dsh-lan-access",
		"o": "Leon0555",
		"d": "",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T06:24:03Z",
		"h": "https://github.com/Leon0555/dsh-lan-access",
		"p": ""
	},
	{
		"f": "hccccc01333/dsh-excel-chat",
		"n": "dsh-excel-chat",
		"o": "hccccc01333",
		"d": "dsh-excel-chat — talk to Excel in DeepSeek Harness: create, edit, repair, and verify spreadsheets by conversation (cells, formulas, styles, filters, tables, charts); every edit is auto-validated.",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"benchmark",
			"deepseek-harness",
			"dsh-plugin",
			"excel",
			"formula-validation",
			"spreadsheet",
			"xlsx"
		],
		"u": "2026-08-16T09:50:33Z",
		"h": "https://github.com/hccccc01333/dsh-excel-chat",
		"p": ""
	},
	{
		"f": "lanlandeli/dsh-usage-stats",
		"n": "dsh-usage-stats",
		"o": "lanlandeli",
		"d": "DeepSeek Harness 使用统计插件｜Token 总量与构成、7/30 天趋势、年度活跃热力图、模型占比、工作区/任务筛选、CSV/JSON 导出",
		"s": 5,
		"k": 4,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"token-usage",
			"typescript",
			"usage-statistics"
		],
		"u": "2026-08-16T02:30:16Z",
		"h": "https://github.com/lanlandeli/dsh-usage-stats",
		"p": ""
	},
	{
		"f": "Pheobe-Southwood/dsh-acp-paseo",
		"n": "dsh-acp-paseo",
		"o": "Pheobe-Southwood",
		"d": "dsh (DeepSeek Harness) ⇄ Paseo ACP integration bundle: auto-discovered model catalog, plan/execute modes, thinking levels, and native dsh slash commands in Paseo.",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"acp",
			"agent-client-protocol",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"paseo"
		],
		"u": "2026-08-16T02:57:18Z",
		"h": "https://github.com/Pheobe-Southwood/dsh-acp-paseo",
		"p": ""
	},
	{
		"f": "Karbo123/DSH-EvoResearch",
		"n": "DSH-EvoResearch",
		"o": "Karbo123",
		"d": "自进化科研工作流",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"autonomous-research",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins",
			"self-evolving"
		],
		"u": "2026-08-16T10:27:11Z",
		"h": "https://github.com/Karbo123/DSH-EvoResearch",
		"p": ""
	},
	{
		"f": "cakeni/harness-pet",
		"n": "harness-pet",
		"o": "cakeni",
		"d": "Harness Pet — an unofficial community pet for DeepSeek Harness. Not affiliated with, endorsed by, or maintained by DeepSeek.",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"desktop-pet",
			"dsh",
			"dsh-plugin",
			"typescript"
		],
		"u": "2026-08-15T13:50:35Z",
		"h": "https://github.com/cakeni/harness-pet",
		"p": ""
	},
	{
		"f": "opensetk/dsh-xiaohei",
		"n": "dsh-xiaohei",
		"o": "opensetk",
		"d": "dsh的罗小黑插件",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:03:10Z",
		"h": "https://github.com/opensetk/dsh-xiaohei",
		"p": ""
	},
	{
		"f": "chenw2759-wq/dsh-mindmap",
		"n": "dsh-mindmap",
		"o": "chenw2759-wq",
		"d": "DSH 思维导图模式插件：课件(PPT/PDF/Word)+电子书 → 打印级复习思维导图 HTML（A3 横向、每主干一页、大括号式横向、黑体、4 种风格、右侧笔记区、封面总览 + 交互式测试题）。建议配合 dsh-IDE 插件预览生成的 HTML。",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"chinese-education",
			"deepseek-harness",
			"dsh-plugin",
			"dshtool",
			"html-generator",
			"mindmap",
			"study-tool"
		],
		"u": "2026-08-15T12:29:06Z",
		"h": "https://github.com/chenw2759-wq/dsh-mindmap",
		"p": ""
	},
	{
		"f": "reshuibuduo/TMCRA-Agent-Memory",
		"n": "TMCRA-Agent-Memory",
		"o": "reshuibuduo",
		"d": "Scope-isolated, graph-based long-term memory engine for AI agents.",
		"s": 5,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-memory",
			"ai-agents",
			"claude-code",
			"codex-plugin",
			"deepseek-harness",
			"dsh-plugin",
			"long-term-memory",
			"longmemeval",
			"memory-graph",
			"openai-codex"
		],
		"u": "2026-08-16T04:51:30Z",
		"h": "https://github.com/reshuibuduo/TMCRA-Agent-Memory",
		"p": ""
	},
	{
		"f": "xylt369/dsh-browser",
		"n": "dsh-browser",
		"o": "xylt369",
		"d": "Browser capability for DeepSeek Harness: headed Edge/Playwright provider, SSRF-safe navigation, a11y-ref clicking, permission gate with auto-remember, gated evaluate",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"browser",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"playwright",
			"plugin"
		],
		"u": "2026-08-16T07:19:17Z",
		"h": "https://github.com/xylt369/dsh-browser",
		"p": ""
	},
	{
		"f": "skr311/dsh-codex-pet",
		"n": "dsh-codex-pet",
		"o": "skr311",
		"d": "dsh-codex-pet · DSH 桌面宠物插件 — 导入精灵图序列帧宠物，悬浮浮层渲染 + Agent 状态联动",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-external",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:57:47Z",
		"h": "https://github.com/skr311/dsh-codex-pet",
		"p": ""
	},
	{
		"f": "Cassius0924/dsh-usage-dashboard",
		"n": "dsh-usage-dashboard",
		"o": "Cassius0924",
		"d": "DeepSeek 额度与用量仪表盘 — DSH (DeepSeek Harness) 动态 Cordis 插件",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:17:39Z",
		"h": "https://github.com/Cassius0924/dsh-usage-dashboard",
		"p": ""
	},
	{
		"f": "6Mikao9/dsh-wsl-workspace",
		"n": "dsh-wsl-workspace",
		"o": "6Mikao9",
		"d": "WSL workspace support for DeepSeek Harness——无缝的 WSL 工作区使用体验，无需在 WSL 之中再安装一个dsh，安装该插件后在 GUI 里直接添加 WSL 工作区即可。WSL workspace support for DeepSeek Harness — Enjoy a seamless WSL workspace experience without needing to install dsh inside WSL. Once this plugin is installed, you can directly add a WSL workspace right from the GUI.",
		"s": 5,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:46:19Z",
		"h": "https://github.com/6Mikao9/dsh-wsl-workspace",
		"p": ""
	},
	{
		"f": "Chu-Xin-r/wanjiqi-meme",
		"n": "wanjiqi-meme",
		"o": "Chu-Xin-r",
		"d": "玩机器(6657直播间)烂梗 Skill：22771条真实弹幕烂梗蒸馏成AI Skill，生成玩机器式弹幕/解说吐槽/CS×DOTA双料梗",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agentskills",
			"claude-code",
			"cs2",
			"csgo",
			"deepseek-harness",
			"dsh-plugin",
			"meme",
			"skill",
			"wanjiqi"
		],
		"u": "2026-08-16T07:51:18Z",
		"h": "https://github.com/Chu-Xin-r/wanjiqi-meme",
		"p": ""
	},
	{
		"f": "chushixixin/dsh-harness-mcp-server",
		"n": "dsh-harness-mcp-server",
		"o": "chushixixin",
		"d": "Expose DeepSeek Harness agent capabilities as an MCP server (brain=Hermes, arms=Harness)",
		"s": 5,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"cordis",
			"deepseek-harness",
			"dsh-plugin",
			"mcp",
			"model-context-protocol"
		],
		"u": "2026-08-15T13:45:15Z",
		"h": "https://github.com/chushixixin/dsh-harness-mcp-server",
		"p": ""
	},
	{
		"f": "YTxue/dsh-skill-manager-ytxue",
		"n": "dsh-skill-manager-ytxue",
		"o": "YTxue",
		"d": "DSH web plugin: skill manager in the Settings sidebar - list/enable/disable, folder batch import with conflict prompts, state-driven one-click DSH-spec check & auto-fix, system/project scope labels.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"skill-manager",
			"skill-manager-ytxue"
		],
		"u": "2026-08-15T15:43:08Z",
		"h": "https://github.com/YTxue/dsh-skill-manager-ytxue",
		"p": ""
	},
	{
		"f": "kaziii/dsh-github-connector",
		"n": "dsh-github-connector",
		"o": "kaziii",
		"d": "DeepSeek Harness (dsh) 的 GitHub 连接器：一键授权，对话内创建/AI 审查/合并 PR | GitHub connector for dsh: one-click connect, create/review/merge PRs from the conversation",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"connector",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"github",
			"plugin"
		],
		"u": "2026-08-15T16:50:22Z",
		"h": "https://github.com/kaziii/dsh-github-connector",
		"p": ""
	},
	{
		"f": "buhuikongpan/dsh-pluginmanager",
		"n": "dsh-pluginmanager",
		"o": "buhuikongpan",
		"d": "DSH 分层插件管理器：原生插件按 系统层/WebUI 层/工具层 只读展示，用户扩展支持停用/启用、补登记、卸载与可编辑描述。",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T07:39:19Z",
		"h": "https://github.com/buhuikongpan/dsh-pluginmanager",
		"p": ""
	},
	{
		"f": "sugarforever/dsh-lark",
		"n": "dsh-lark",
		"o": "sugarforever",
		"d": "DeepSeek Harness Plugin for Lark Integration",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:09:39Z",
		"h": "https://github.com/sugarforever/dsh-lark",
		"p": ""
	},
	{
		"f": "flyemFSB/dsh-reasoning-effort-hdbzq",
		"n": "dsh-reasoning-effort-hdbzq",
		"o": "flyemFSB",
		"d": "滑动变祖器",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"slider-plugin"
		],
		"u": "2026-08-16T00:34:08Z",
		"h": "https://github.com/flyemFSB/dsh-reasoning-effort-hdbzq",
		"p": ""
	},
	{
		"f": "Hu9956/dsh-codex-provider",
		"n": "dsh-codex-provider",
		"o": "Hu9956",
		"d": "OpenAI Codex provider for DeepSeek Harness with device-code OAuth, Codex CLI import, token refresh, and a web settings panel.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"chatgpt",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"oauth",
			"openai"
		],
		"u": "2026-08-15T00:59:06Z",
		"h": "https://github.com/Hu9956/dsh-codex-provider",
		"p": ""
	},
	{
		"f": "cokiscarazo-rgb/dsh-session-management",
		"n": "dsh-session-management",
		"o": "cokiscarazo-rgb",
		"d": "",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"session-management"
		],
		"u": "2026-08-15T03:36:07Z",
		"h": "https://github.com/cokiscarazo-rgb/dsh-session-management",
		"p": ""
	},
	{
		"f": "taxueseek/dsh-files",
		"n": "dsh-files",
		"o": "taxueseek",
		"d": "DeepSeek Harness dual-face plugin: session-isolated file upload with colorful composer cards + read_document tool (text/PDF/DOCX/XLSX) with content sniffing and LRU caching",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:04:09Z",
		"h": "https://github.com/taxueseek/dsh-files",
		"p": ""
	},
	{
		"f": "Hakunm/dsh-android-app",
		"n": "dsh-android-app",
		"o": "Hakunm",
		"d": "一款专为 DeepSeek Harness 设计的原生 Android 客户端，支持聊天、审批、工作区、文件及模型管理。A native Android client for DeepSeek Harness with chat, approvals, workspace, file, and model management.",
		"s": 5,
		"k": 0,
		"l": "Kotlin",
		"t": [
			"android",
			"deepseek-harness",
			"dsh-plugin",
			"jetpack-compose",
			"material3",
			"vibe-coding"
		],
		"u": "2026-08-15T22:49:06Z",
		"h": "https://github.com/Hakunm/dsh-android-app",
		"p": ""
	},
	{
		"f": "2768651338/dsh-plugin-manager",
		"n": "dsh-plugin-manager",
		"o": "2768651338",
		"d": "DeepSeek Harness 的图形化插件管理插件：在 设置 → 插件 里新增「插件管家」标签页，用中文名和说明展示每个插件是做什么的，并提供一键启停开关与内置备注编辑——启停写入全局层补丁并实时热生效，备注保存到本地覆盖文件长期生效。",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-15T14:26:54Z",
		"h": "https://github.com/2768651338/dsh-plugin-manager",
		"p": ""
	},
	{
		"f": "wqty123/dsh-browser",
		"n": "dsh-browser",
		"o": "wqty123",
		"d": "Shared real browser plugin for DeepSeek Harness",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"browser",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:05:25Z",
		"h": "https://github.com/wqty123/dsh-browser",
		"p": ""
	},
	{
		"f": "PerryLink/dsh-mcp-panel",
		"n": "dsh-mcp-panel",
		"o": "PerryLink",
		"d": "Read-only runtime management panel for the official DeepSeek Harness MCP client: /mcp command + Settings MCP tab with status, tools, errors, reconnect counts, sanitized display and controlled patch suggestions (Apache-2.0, dsh-plugin).",
		"s": 5,
		"k": 3,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mcp",
			"mcp-client",
			"observability",
			"panel"
		],
		"u": "2026-08-16T09:47:15Z",
		"h": "https://github.com/PerryLink/dsh-mcp-panel",
		"p": "https://www.npmjs.com/package/dsh-mcp-panel"
	},
	{
		"f": "Cavan-Ou/hermes-dsh-collab",
		"n": "hermes-dsh-collab",
		"o": "Cavan-Ou",
		"d": "Battle-tested multi-agent collaboration playbook for DeepSeek Harness: model-tier routing, spec discipline, git single-writer rule — as an installable skill. 多 agent 管线里运行 DSH 的实战协作规范",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-harness",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multi-agent",
			"skill"
		],
		"u": "2026-08-16T06:39:11Z",
		"h": "https://github.com/Cavan-Ou/hermes-dsh-collab",
		"p": ""
	},
	{
		"f": "JuneLearn/dsh-reasoning-settings",
		"n": "dsh-reasoning-settings",
		"o": "JuneLearn",
		"d": "让 DeepSeek Harness 的第三方 API 支持低、中、高等推理强度，并可为每次子 Agent 调用选择模型｜Add Low, Medium, High, and other reasoning levels to third-party APIs, with model selection for each subagent call",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"model-provider",
			"openai-compatible",
			"reasoning-effort",
			"web-ui"
		],
		"u": "2026-08-16T04:54:03Z",
		"h": "https://github.com/JuneLearn/dsh-reasoning-settings",
		"p": ""
	},
	{
		"f": "YYTbit/awesome-dsh-bridges",
		"n": "awesome-dsh-bridges",
		"o": "YYTbit",
		"d": "Bridge your favorite AI coding tools into DeepSeek Harness",
		"s": 5,
		"k": 1,
		"l": "",
		"t": [
			"awesome-list",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-14T10:58:08Z",
		"h": "https://github.com/YYTbit/awesome-dsh-bridges",
		"p": ""
	},
	{
		"f": "xmanrui/dsh-feishu",
		"n": "dsh-feishu",
		"o": "xmanrui",
		"d": "通过扫码把飞书机器人接入DeepSeek Harness",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:08:42Z",
		"h": "https://github.com/xmanrui/dsh-feishu",
		"p": ""
	},
	{
		"f": "vvlife/awesome-deepseek-harness-plugins",
		"n": "awesome-deepseek-harness-plugins",
		"o": "vvlife",
		"d": "A curated list of plugins, tools, skins, and extensions for DeepSeek Harness (DSH).",
		"s": 5,
		"k": 13,
		"l": "Python",
		"t": [
			"ai-agents",
			"awesome-list",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugins"
		],
		"u": "2026-08-16T04:02:38Z",
		"h": "https://github.com/vvlife/awesome-deepseek-harness-plugins",
		"p": ""
	},
	{
		"f": "festoney8/deepseek-harness-GUI",
		"n": "deepseek-harness-GUI",
		"o": "festoney8",
		"d": "DeepSeek Harness 超级轻量桌面版 APP，基于 Tauri 封装，支持升级 DSH 内核、提供免安装便携版",
		"s": 5,
		"k": 0,
		"l": "Rust",
		"t": [
			"ai-agent",
			"deepseek",
			"deepseek-desktop",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"launcher"
		],
		"u": "2026-08-16T07:30:44Z",
		"h": "https://github.com/festoney8/deepseek-harness-GUI",
		"p": ""
	},
	{
		"f": "gameswu/dsh-plugin-vscode-sidebar",
		"n": "dsh-plugin-vscode-sidebar",
		"o": "gameswu",
		"d": "提供vscode风格和功能的侧栏",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:56:00Z",
		"h": "https://github.com/gameswu/dsh-plugin-vscode-sidebar",
		"p": ""
	},
	{
		"f": "MichengAI/dsh-skills-manager",
		"n": "dsh-skills-manager",
		"o": "MichengAI",
		"d": "DSH Skills Manager 基于 DeepSeek Harness 的Skills管理插件",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:40:58Z",
		"h": "https://github.com/MichengAI/dsh-skills-manager",
		"p": ""
	},
	{
		"f": "PerryLink/dsh-claude-move",
		"n": "dsh-claude-move",
		"o": "PerryLink",
		"d": "DeepSeek Harness (dsh) plugin: migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH with seamless resume (claude_scan / import_claude / resume-claude / web panel)",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"claude",
			"claude-code",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"migration",
			"resume",
			"session-import"
		],
		"u": "2026-08-16T09:47:18Z",
		"h": "https://github.com/PerryLink/dsh-claude-move",
		"p": "https://www.npmjs.com/package/dsh-claude-move"
	},
	{
		"f": "H1a3x/dsh-token-stats",
		"n": "dsh-token-stats",
		"o": "H1a3x",
		"d": "Floating draggable token usage statistics panel for DeepSeek Harness",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"web-ui"
		],
		"u": "2026-08-15T02:00:59Z",
		"h": "https://github.com/H1a3x/dsh-token-stats",
		"p": ""
	},
	{
		"f": "le-soleil-se-couche/dsh-token-cost",
		"n": "dsh-token-cost",
		"o": "le-soleil-se-couche",
		"d": "在对话页面直接查看消耗费用（嵌入官方底部状态条，点击看明细）；在设置中查看 Harness 消耗的总费用、缓存命中和输入输出",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T10:41:04Z",
		"h": "https://github.com/le-soleil-se-couche/dsh-token-cost",
		"p": ""
	},
	{
		"f": "BiBoyang/dsh-eval-harness",
		"n": "dsh-eval-harness",
		"o": "BiBoyang",
		"d": "DSH 插件评测工具：YAML 用例驱动真实 agent 回归评测 + baseline 对比 PASS/WARN/FAIL 门禁｜Regression eval harness for DeepSeek Harness plugins",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"evaluation",
			"regression-testing"
		],
		"u": "2026-08-15T14:15:33Z",
		"h": "https://github.com/BiBoyang/dsh-eval-harness",
		"p": ""
	},
	{
		"f": "STARDUSTLC666/dsh-codex-port",
		"n": "dsh-codex-port",
		"o": "STARDUSTLC666",
		"d": "DeepSeek Harness 技能移植插件：把 ~/.codex 的 Codex 官方插件（186+ 个、583+ 技能）一键移植为 DSH 技能（codex_list/port/status），frontmatter 自动转换、幂等跳过。· Batch-port the Codex plugin family into DSH skills.",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"skills"
		],
		"u": "2026-08-16T10:11:02Z",
		"h": "https://github.com/STARDUSTLC666/dsh-codex-port",
		"p": ""
	},
	{
		"f": "hnmrxz/dsh-plugin-deepseek-balance",
		"n": "dsh-plugin-deepseek-balance",
		"o": "hnmrxz",
		"d": "在 DeepSeek Harness (dsh) 底部状态栏实时显示 DeepSeek 账户余额。",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T02:38:46Z",
		"h": "https://github.com/hnmrxz/dsh-plugin-deepseek-balance",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-inspect",
		"n": "dsh-inspect",
		"o": "omdsh-dev",
		"d": "发现问题(checkup) → 修复交付(fix) → 质量复查(review) 的对抗式闭环插件：基于官方 workflow 引擎的检查/修复/复查工具集",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T03:22:31Z",
		"h": "https://github.com/omdsh-dev/dsh-inspect",
		"p": ""
	},
	{
		"f": "Apageoflove/DSH-changeproof",
		"n": "DSH-changeproof",
		"o": "Apageoflove",
		"d": "变更证明（ChangeProof）— DeepSeek Harness 插件：代码改动后确认改动的行真的被测试覆盖到",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent-tools",
			"changed-line-coverage",
			"changeproof",
			"code-verification",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"javascript",
			"jest",
			"llm-agent",
			"nodejs",
			"pytest",
			"quality-gate",
			"react",
			"test-coverage",
			"test-impact-analysis",
			"typescript",
			"verification",
			"vitest"
		],
		"u": "2026-08-16T03:37:01Z",
		"h": "https://github.com/Apageoflove/DSH-changeproof",
		"p": ""
	},
	{
		"f": "Gumiho12345/dsh-plugin-net-access",
		"n": "dsh-plugin-net-access",
		"o": "Gumiho12345",
		"d": "为 DeepSeek Harness(dsh) 新增 Net Access 模式，用于解决 Windows 沙箱内 curl.exe 无法访问 HTTPS 的问题，文件写保护不变。 / Adds a Net Access mode to DeepSeek Harness(dsh): curl.exe can access HTTPS inside the Windows sandbox again, with file-write protection unchanged.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"https"
		],
		"u": "2026-08-16T09:29:13Z",
		"h": "https://github.com/Gumiho12345/dsh-plugin-net-access",
		"p": ""
	},
	{
		"f": "0xsline/dsh-spotlight",
		"n": "dsh-spotlight",
		"o": "0xsline",
		"d": "Keyboard-first command palette for DeepSeek Harness Web",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T16:38:58Z",
		"h": "https://github.com/0xsline/dsh-spotlight",
		"p": ""
	},
	{
		"f": "kbpoyo/dsh-image-bridge",
		"n": "dsh-image-bridge",
		"o": "kbpoyo",
		"d": "DSH 插件：让纯文本模型也能看图。Web 端直接粘贴图片即可发送，无需指定图片路径；模型自主调用视觉技能查看，多模态模型原生直通，零skill绑定。",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins",
			"image",
			"ocr",
			"vision"
		],
		"u": "2026-08-15T15:50:44Z",
		"h": "https://github.com/kbpoyo/dsh-image-bridge",
		"p": ""
	},
	{
		"f": "x2802490130-prog/dsh-tool-writing",
		"n": "dsh-tool-writing",
		"o": "x2802490130-prog",
		"d": "Writing engine for DeepSeek Harness: long-form web-novel orchestration with a separate DeepSeek key, lore management, semantic retrieval, and a corpus library.",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"novel",
			"writing"
		],
		"u": "2026-08-16T03:24:05Z",
		"h": "https://github.com/x2802490130-prog/dsh-tool-writing",
		"p": ""
	},
	{
		"f": "MC5lan/dsh-multimodal",
		"n": "dsh-multimodal",
		"o": "MC5lan",
		"d": "给 DeepSeek 安装一双眼睛和一支画笔:会话里直接贴截图/图片,GLM 视觉模型先精确转写图片内容(报错信息、代码、界面逐字保留),然后 DeepSeek 继续处理你的问题——同一轮完成,全程无感;需要配图时,DeepSeek 自动调用文生图后端出图并显示在会话中。",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"multimodal",
			"multimodal-ai",
			"vision"
		],
		"u": "2026-08-16T08:42:50Z",
		"h": "https://github.com/MC5lan/dsh-multimodal",
		"p": ""
	},
	{
		"f": "KhalilYamber/dsh-envoy",
		"n": "dsh-envoy",
		"o": "KhalilYamber",
		"d": "Hana 插件：把 coding 任务外包给本机 DeepSeek Harness，审批同步回 Hana 内决策，结果以原生卡片带回",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"hana",
			"hanaagent",
			"oh-plugin"
		],
		"u": "2026-08-16T09:44:55Z",
		"h": "https://github.com/KhalilYamber/dsh-envoy",
		"p": ""
	},
	{
		"f": "STARDUSTLC666/dsh-email",
		"n": "dsh-email",
		"o": "STARDUSTLC666",
		"d": "DeepSeek Harness 邮件插件：email_list/read/search/send/folders/attachment 六工具，内置 QQ/163/126/新浪/阿里/Gmail/Outlook/iCloud 八个预设，多账号、附件收发、Web 设置页配置，纯 Node 全平台。· IMAP/SMTP email tools for DeepSeek Harness agents.",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"email",
			"imap"
		],
		"u": "2026-08-16T09:56:50Z",
		"h": "https://github.com/STARDUSTLC666/dsh-email",
		"p": ""
	},
	{
		"f": "wangshunnn/oh-my-dsh",
		"n": "oh-my-dsh",
		"o": "wangshunnn",
		"d": "🐋 All you need is oh-my-dsh ｜ DeepSeek Harness 社区插件索引与精选（自动更新）",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:50:34Z",
		"h": "https://github.com/wangshunnn/oh-my-dsh",
		"p": "oh-my-dsh.vercel.app"
	},
	{
		"f": "XavierMarquis93/dsh-plugin-conversation-outline",
		"n": "dsh-plugin-conversation-outline",
		"o": "XavierMarquis93",
		"d": "DeepSeek Harness conversation outline plugin (对话目录)",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:22Z",
		"h": "https://github.com/XavierMarquis93/dsh-plugin-conversation-outline",
		"p": ""
	},
	{
		"f": "Vim0x3c/dsh-skin-appearance",
		"n": "dsh-skin-appearance",
		"o": "Vim0x3c",
		"d": "DeepSeek Harness 外观定制插件：八套内置主题 + 自定义壁纸（透明度/模糊），Host 设置持久化 | Appearance plugin for dsh web",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T14:27:59Z",
		"h": "https://github.com/Vim0x3c/dsh-skin-appearance",
		"p": ""
	},
	{
		"f": "zsyu9779/dsh-desktop",
		"n": "dsh-desktop",
		"o": "zsyu9779",
		"d": "Unofficial cross-platform desktop app for DeepSeek Harness. Native Wails shell for the DSH Web UI on macOS, Windows, and Linux.",
		"s": 5,
		"k": 0,
		"l": "HTML",
		"t": [
			"ai-agent",
			"cross-platform",
			"deepseek",
			"deepseek-harness",
			"desktop",
			"dsh-plugin",
			"golang",
			"linux",
			"macos",
			"wails",
			"windows"
		],
		"u": "2026-08-15T15:25:58Z",
		"h": "https://github.com/zsyu9779/dsh-desktop",
		"p": "https://zsyu9779.github.io/dsh-desktop/"
	},
	{
		"f": "whitelonng/dsh-plugin-describe-image",
		"n": "dsh-plugin-describe-image",
		"o": "whitelonng",
		"d": "DeepSeek Harness plugin: describe_image — give a text-only model vision through an OpenAI-compatible VLM endpoint",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"describe-image",
			"dsh",
			"dsh-plugin",
			"image-understanding",
			"llm",
			"multimodal",
			"qwen-vl",
			"vision",
			"vlm"
		],
		"u": "2026-08-15T17:31:39Z",
		"h": "https://github.com/whitelonng/dsh-plugin-describe-image",
		"p": ""
	},
	{
		"f": "cocofhu/anime-find",
		"n": "anime-find",
		"o": "cocofhu",
		"d": "DeepSeek Harness 搜番插件：对话内多源搜索番剧，卡片展示 Bangumi 评分与详情，支持复制磁力。",
		"s": 5,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"anime",
			"anime-search",
			"bangumi",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"magnet",
			"mikan",
			"plugin",
			"torrent",
			"typescript"
		],
		"u": "2026-08-16T04:57:11Z",
		"h": "https://github.com/cocofhu/anime-find",
		"p": "https://github.com/cocofhu/anime-find#readme"
	},
	{
		"f": "hootandy321/dsh-Agentlink",
		"n": "dsh-Agentlink",
		"o": "hootandy321",
		"d": "Caller-side bridge from Codex and other agent frameworks to DeepSeek Harness, with observable sessions, follow-up, cancellation, and human-gated approvals.",
		"s": 5,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent-collaboration",
			"agent-harness",
			"agent-link",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mcp"
		],
		"u": "2026-08-16T07:24:06Z",
		"h": "https://github.com/hootandy321/dsh-Agentlink",
		"p": ""
	},
	{
		"f": "beancookie/dsh-plugin-anydoc",
		"n": "dsh-plugin-anydoc",
		"o": "beancookie",
		"d": "DSH 插件：基于 @firecrawl/anydoc 将 Word、PPT、Excel、PDF、EPUB、CSV 等文档转换为 GitHub-Flavored Markdown",
		"s": 5,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"document-conversion",
			"document-conversion-plugin",
			"dsh-plugin",
			"dsh-plugin-verify",
			"dsh-plugins",
			"markdown"
		],
		"u": "2026-08-15T05:53:58Z",
		"h": "https://github.com/beancookie/dsh-plugin-anydoc",
		"p": ""
	},
	{
		"f": "dream12347/dsh-delete-session",
		"n": "dsh-delete-session",
		"o": "dream12347",
		"d": "Delete DSH conversation sessions from a Settings panel/在设置面板中增加删除会话管理以便删除无用会话",
		"s": 5,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-worker",
			"deeepseek-harness-plugins",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T03:54:36Z",
		"h": "https://github.com/dream12347/dsh-delete-session",
		"p": ""
	},
	{
		"f": "Dbi-Eshuh/dsh-thinking-status-customizer",
		"n": "dsh-thinking-status-customizer",
		"o": "Dbi-Eshuh",
		"d": "Customize DSH Web thinking status with custom flowing text, animated GIF/APNG/WebP, or combined image-and-text modes.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"animated-gif",
			"cordis",
			"css",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gif",
			"i18n",
			"localization",
			"thinking-status",
			"web-ui"
		],
		"u": "2026-08-15T12:05:24Z",
		"h": "https://github.com/Dbi-Eshuh/dsh-thinking-status-customizer",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-minigames",
		"n": "dsh-minigames",
		"o": "omdsh-dev",
		"d": "DSH Web UI 右侧小游戏面板：18 款离线小游戏（恐龙跳一跳 / 俄罗斯方块 / 坦克大战 / 扫雷 / 2048 / 数独 / 吃豆人 / 跟枪练习等），可扩展游戏注册表，等待模型回复或修 bug 时的摸鱼神器",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T13:55:10Z",
		"h": "https://github.com/omdsh-dev/dsh-minigames",
		"p": ""
	},
	{
		"f": "tsonglew/dsh-media-preview",
		"n": "dsh-media-preview",
		"o": "tsonglew",
		"d": "Audio/video preview viewer for dsh-better-sidebar: native playback with Range-seeking streaming route",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"better-sidebar",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:49:36Z",
		"h": "https://github.com/tsonglew/dsh-media-preview",
		"p": ""
	},
	{
		"f": "HR2AY/DSH-Plan-Graph",
		"n": "DSH-Plan-Graph",
		"o": "HR2AY",
		"d": "another version of deepseek herness trajectory (DIY)",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"thread",
			"trajectory",
			"visualization"
		],
		"u": "2026-08-16T07:58:55Z",
		"h": "https://github.com/HR2AY/DSH-Plan-Graph",
		"p": ""
	},
	{
		"f": "AngelosZou/graphlint",
		"n": "graphlint",
		"o": "AngelosZou",
		"d": "",
		"s": 4,
		"k": 2,
		"l": "Python",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T09:41:22Z",
		"h": "https://github.com/AngelosZou/graphlint",
		"p": ""
	},
	{
		"f": "Electricitysheep/dsh-tool-turbo",
		"n": "dsh-tool-turbo",
		"o": "Electricitysheep",
		"d": "Per-round reasoning_effort optimizer for DeepSeek Harness (dsh): auto-downgrades tool-call reasoning for simple tool chains, lifting back for heavy work. Cuts thinking time between tool calls.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"harness",
			"optimization",
			"performance",
			"plugin",
			"reasoning",
			"speed"
		],
		"u": "2026-08-14T03:55:05Z",
		"h": "https://github.com/Electricitysheep/dsh-tool-turbo",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-fun-ticker",
		"n": "dsh-fun-ticker",
		"o": "omdsh-dev",
		"d": "DSH 行情跑马灯插件：可自选标的的加密/汇率/A股/指数/港美股跑马灯，免 key 数据源，宿主代理+缓存",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T13:47:55Z",
		"h": "https://github.com/omdsh-dev/dsh-fun-ticker",
		"p": ""
	},
	{
		"f": "cdxiaodong/dsh-guardian",
		"n": "dsh-guardian",
		"o": "cdxiaodong",
		"d": "",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"dsh",
			"dsh-plugin",
			"llm-security",
			"security"
		],
		"u": "2026-08-15T19:23:37Z",
		"h": "https://github.com/cdxiaodong/dsh-guardian",
		"p": ""
	},
	{
		"f": "MimicHunterZ/dsh-agent-compact",
		"n": "dsh-agent-compact",
		"o": "MimicHunterZ",
		"d": "DSH plugin for agent-driven span compaction: compress chosen conversation spans into self-written checkpoints instead of the official head-anchored full-context sweep.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"context-compression",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:47:20Z",
		"h": "https://github.com/MimicHunterZ/dsh-agent-compact",
		"p": ""
	},
	{
		"f": "dragonbaba/dsh-routing-suite",
		"n": "dsh-routing-suite",
		"o": "dragonbaba",
		"d": "Lightweight, localized task routing for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"task-routing"
		],
		"u": "2026-08-16T08:15:27Z",
		"h": "https://github.com/dragonbaba/dsh-routing-suite",
		"p": "https://www.npmjs.com/package/dsh-routing-suite"
	},
	{
		"f": "PerryLink/dsh-composer-history",
		"n": "dsh-composer-history",
		"o": "PerryLink",
		"d": "Terminal-style input history for the DeepSeek Harness web composer: edge-first arrows with exact draft/caret restore, browser-local persisted history, Ctrl+R reverse search, workspace recall - and sliding-context awareness (compaction summaries in recall/search, compaction notice with one-click /compact fill).",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"compaction",
			"composer",
			"context-window",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"input-history",
			"keyboard-shortcuts",
			"sliding-context",
			"terminal",
			"typescript",
			"ui",
			"web-gui"
		],
		"u": "2026-08-16T09:47:19Z",
		"h": "https://github.com/PerryLink/dsh-composer-history",
		"p": "https://www.npmjs.com/package/dsh-composer-history"
	},
	{
		"f": "akqwpeter-prog/dsh-media-skills",
		"n": "dsh-media-skills",
		"o": "akqwpeter-prog",
		"d": "Free vision & image generation for DeepSeek Harness — paste an image into any chat, even text-only sessions. GLM-4V-Flash / Qwen3-VL / Gemini failover chain, ModLens-style structured evidence, Kolors generation. 免费读图·生图 · 三引擎容错 · 无 Key 入库",
		"s": 4,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-skills",
			"deepseek-harness",
			"dsh-plugin",
			"image-generation",
			"skill",
			"vision"
		],
		"u": "2026-08-16T03:19:35Z",
		"h": "https://github.com/akqwpeter-prog/dsh-media-skills",
		"p": "https://github.com/akqwpeter-prog/dsh-media-skills"
	},
	{
		"f": "lhh010/dsh-input-history",
		"n": "dsh-input-history",
		"o": "lhh010",
		"d": "DSH Web 输入历史插件：Ctrl+Up / Ctrl+Down 像终端一样召回与切换已发送消息，零核心改动",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-14T02:52:08Z",
		"h": "https://github.com/lhh010/dsh-input-history",
		"p": ""
	},
	{
		"f": "f0909172434/dsh-deepseek-girl-pet",
		"n": "dsh-deepseek-girl-pet",
		"o": "f0909172434",
		"d": "Animated deepseek girl desktop pet plugin for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T00:59:34Z",
		"h": "https://github.com/f0909172434/dsh-deepseek-girl-pet",
		"p": ""
	},
	{
		"f": "LemCAE/dsh-balance",
		"n": "dsh-balance",
		"o": "LemCAE",
		"d": "一个适用于deepseek-harness的插件，功能是显示当前账户余额以及当前会话预估的费用消耗 | A plugin for deepseek-harness that displays the current account balance and the estimated cost consumption of the current session.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T13:46:18Z",
		"h": "https://github.com/LemCAE/dsh-balance",
		"p": ""
	},
	{
		"f": "Jiao-XXX/dsh-auto-approve",
		"n": "dsh-auto-approve",
		"o": "Jiao-XXX",
		"d": "为 DeepSeek Harness 增加介于 Workspace Write 与 Full access 之间的自动批准权限档，危险或不确定操作仍转人工审批。An auto-approval permission preset between workspace-write and full access for DeepSeek Harness.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T14:10:37Z",
		"h": "https://github.com/Jiao-XXX/dsh-auto-approve",
		"p": ""
	},
	{
		"f": "DoggyHU/dsh4vscode",
		"n": "dsh4vscode",
		"o": "DoggyHU",
		"d": "DSH Chat for VS Code — DeepSeek Harness chat windows inside VS Code (OpenCode-style independent sessions, model auto-routing)",
		"s": 4,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T06:47:56Z",
		"h": "https://github.com/DoggyHU/dsh4vscode",
		"p": ""
	},
	{
		"f": "Zalpha263/dsh-file-explorer",
		"n": "dsh-file-explorer",
		"o": "Zalpha263",
		"d": "可以像其他agent一样查看当前工作区的文件夹，并且可以预览文件",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T10:04:09Z",
		"h": "https://github.com/Zalpha263/dsh-file-explorer",
		"p": ""
	},
	{
		"f": "Xilin3/dsh-prompt-persona",
		"n": "dsh-prompt-persona",
		"o": "Xilin3",
		"d": "DSH plugin: edit the system prompt (deployment persona) from the Settings page, with live preview.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T21:04:03Z",
		"h": "https://github.com/Xilin3/dsh-prompt-persona",
		"p": ""
	},
	{
		"f": "drfccv/dsh-theme-neko",
		"n": "dsh-theme-neko",
		"o": "drfccv",
		"d": "A Nachoneko (甘城猫猫) themed skin for the DeepSeek Harness web GUI.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"themes"
		],
		"u": "2026-08-15T00:59:33Z",
		"h": "https://github.com/drfccv/dsh-theme-neko",
		"p": ""
	},
	{
		"f": "kunjinkao-os/dsh-mobile-gui-agent",
		"n": "dsh-mobile-gui-agent",
		"o": "kunjinkao-os",
		"d": "Android Mobile GUI Agent plugin for DeepSeek Harness with ADB control, iterative verification, approvals, and a Web mobile view",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"adb",
			"android",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gui-agent",
			"mobile-automation",
			"typescript"
		],
		"u": "2026-08-15T03:09:15Z",
		"h": "https://github.com/kunjinkao-os/dsh-mobile-gui-agent",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-csv",
		"n": "dsh-tool-csv",
		"o": "omdsh-dev",
		"d": "DSH CSV 数据工具插件：解析/查询/统计/转换 CSV 文本（RFC 4180），零依赖状态机解析器，注册 csv 工具",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"csv",
			"data-parsing",
			"dsh",
			"dsh-plugin",
			"rfc4180"
		],
		"u": "2026-08-14T16:17:41Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-csv",
		"p": ""
	},
	{
		"f": "Asaiuta/dsh-session-hub",
		"n": "dsh-session-hub",
		"o": "Asaiuta",
		"d": "Aggregate and natively control multiple remote DeepSeek Harness (DSH) servers' sessions from one official Web UI — hub gateway + official-UI bridge. 多服务器 DSH 会话聚合与原生操控",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multi-server",
			"session-management",
			"session-sync"
		],
		"u": "2026-08-15T21:46:56Z",
		"h": "https://github.com/Asaiuta/dsh-session-hub",
		"p": ""
	},
	{
		"f": "MrMu666/dsh-LAN",
		"n": "dsh-LAN",
		"o": "MrMu666",
		"d": "为DeepSeek  harness开启局域网访问及移动端页面的插件，移动端界面适配",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-desktop",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-16T05:01:17Z",
		"h": "https://github.com/MrMu666/dsh-LAN",
		"p": ""
	},
	{
		"f": "a903067276-rgb/dsh-hud",
		"n": "dsh-hud",
		"o": "a903067276-rgb",
		"d": "HUD status panel plugin for DeepSeek Harness (dsh) web: git status, MCP servers, skills, model & token usage in a floating panel",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T02:40:11Z",
		"h": "https://github.com/a903067276-rgb/dsh-hud",
		"p": ""
	},
	{
		"f": "poplarity/dsh-science-workbench",
		"n": "dsh-science-workbench",
		"o": "poplarity",
		"d": "A reproducible science workbench plugin for the DeepSeek Harness: agent-driven cells, inline figures with feedback/rerun, manifest provenance, and environment snapshots.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"bioinformatics",
			"deepseek-harness",
			"dsh-plugin",
			"jupyter",
			"reproducibility",
			"reproducible-research",
			"workbench"
		],
		"u": "2026-08-16T07:49:22Z",
		"h": "https://github.com/poplarity/dsh-science-workbench",
		"p": ""
	},
	{
		"f": "PerryLink/dsh-permission-rules",
		"n": "dsh-permission-rules",
		"o": "PerryLink",
		"d": "Claude Code-style declarative permission rules for DeepSeek Harness: ordered allow/deny/ask rules with tool-name, argument (glob/regex), and workspace-path matching on the tools/pre-execute waterfall, session-log audit, and HMR reload.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-safety",
			"allow-deny-ask",
			"approval",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"permission",
			"policy",
			"safety"
		],
		"u": "2026-08-16T09:56:07Z",
		"h": "https://github.com/PerryLink/dsh-permission-rules",
		"p": "https://www.npmjs.com/package/dsh-permission-rules"
	},
	{
		"f": "yunhuantian/dsh-plugin-hub",
		"n": "dsh-plugin-hub",
		"o": "yunhuantian",
		"d": "Plugin Store for DeepSeek Harness (DSH): a graphical app-store inside the Harness Web UI — browse, search and one-click install GitHub dsh-plugins (topic:dsh-plugin / #dsh-plugin repos), with local ratings, dependency impact graphs, audit logging and a plugin scaffold guide.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"plugin-hub"
		],
		"u": "2026-08-16T10:28:16Z",
		"h": "https://github.com/yunhuantian/dsh-plugin-hub",
		"p": ""
	},
	{
		"f": "030611/dsh-verification-receipt",
		"n": "dsh-verification-receipt",
		"o": "030611",
		"d": "Privacy-minimal heuristic per-turn verification summaries for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-infrastructure",
			"deepseek-harness",
			"developer-tools",
			"dsh-plugin",
			"verification"
		],
		"u": "2026-08-15T00:57:53Z",
		"h": "https://github.com/030611/dsh-verification-receipt",
		"p": ""
	},
	{
		"f": "bwndlct/dsh-session-audit",
		"n": "dsh-session-audit",
		"o": "bwndlct",
		"d": "Session execution analytics and audit reports for DeepSeek Harness — see how your agent actually worked",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"agent-observability",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T11:50:03Z",
		"h": "https://github.com/bwndlct/dsh-session-audit",
		"p": ""
	},
	{
		"f": "zhangzheng25/dsh-timeline",
		"n": "dsh-timeline",
		"o": "zhangzheng25",
		"d": "DSH 插件：极简提问时间线——每条提问一个圆点，点击跳转，悬停预览。Minimal question timeline for DeepSeek Harness.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T06:34:22Z",
		"h": "https://github.com/zhangzheng25/dsh-timeline",
		"p": ""
	},
	{
		"f": "AcidGr/dsh-web-mobile-fix",
		"n": "dsh-web-mobile-fix",
		"o": "AcidGr",
		"d": "DeepSeek Harness (dsh) Web plugin",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:39:58Z",
		"h": "https://github.com/AcidGr/dsh-web-mobile-fix",
		"p": ""
	},
	{
		"f": "Rianico/dsh-better-edit",
		"n": "dsh-better-edit",
		"o": "Rianico",
		"d": "Hash-anchored read/edit/batch_edit/undo_last_edit tools for DeepSeek Harness (dsh) — dsh port of pi-hashline-edit-lsz",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"hashline"
		],
		"u": "2026-08-16T10:14:43Z",
		"h": "https://github.com/Rianico/dsh-better-edit",
		"p": ""
	},
	{
		"f": "xiaohai-78/Top",
		"n": "Top",
		"o": "xiaohai-78",
		"d": "📊 Daily leaderboard for the dsh-external plugin ecosystem — tracks every repo, ranks by stars, archives daily snapshots, and shows the latest ranking on the homepage.",
		"s": 4,
		"k": 0,
		"l": "",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T13:53:26Z",
		"h": "https://github.com/xiaohai-78/Top",
		"p": ""
	},
	{
		"f": "Void0312Aurora/dsh-desktop-electron",
		"n": "dsh-desktop-electron",
		"o": "Void0312Aurora",
		"d": "Cross-platform Electron desktop shell for the DSH Web GUI: tray-resident standalone window over your own dsh web, no bundled Node runtime",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T10:55:15Z",
		"h": "https://github.com/Void0312Aurora/dsh-desktop-electron",
		"p": ""
	},
	{
		"f": "Jolly-J/dsh-deepseek-billing",
		"n": "dsh-deepseek-billing",
		"o": "Jolly-J",
		"d": "DSH WebUI 插件:DeepSeek 余额显示与按会话费用估算",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T15:50:17Z",
		"h": "https://github.com/Jolly-J/dsh-deepseek-billing",
		"p": ""
	},
	{
		"f": "cindyguyuehu123/dsh-webchatlike",
		"n": "dsh-webchatlike",
		"o": "cindyguyuehu123",
		"d": "Web-chat style message actions for DeepSeek Harness: edit your prompt, regenerate answers, and flip versions with a deepseek.com-style <i/N> pager. Deepseek网页版/app聊天体验插件",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:07:02Z",
		"h": "https://github.com/cindyguyuehu123/dsh-webchatlike",
		"p": ""
	},
	{
		"f": "xxxxxxxyu/dsh-notify-sound",
		"n": "dsh-notify-sound",
		"o": "xxxxxxxyu",
		"d": "DSH (DeepSeek Harness) web plugin: plays a sound when the agent finishes replying (turn/end). Sound, volume and on/off configurable in Settings.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"notification",
			"plugin",
			"sound",
			"typescript",
			"web"
		],
		"u": "2026-08-15T11:16:54Z",
		"h": "https://github.com/xxxxxxxyu/dsh-notify-sound",
		"p": ""
	},
	{
		"f": "jasonsun29/ds-balance-card",
		"n": "ds-balance-card",
		"o": "jasonsun29",
		"d": "DeepSeek Harness 常驻额度卡片插件:自动识别已配置的平台 API Key,显示余额与 Coding Plan 额度",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"balance",
			"coding-plan",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:01:24Z",
		"h": "https://github.com/jasonsun29/ds-balance-card",
		"p": ""
	},
	{
		"f": "Nwflower/dsh-file-claim",
		"n": "dsh-file-claim",
		"o": "Nwflower",
		"d": "File claim / protection for concurrent DeepSeek Harness (DSH) sessions working the same workspace: claim/release, heartbeat stale takeover, async pending merge area (git 3-way merge). DSH Host plugin.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"3-way-merge",
			"concurrency",
			"coordination",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"file-claim",
			"file-lock",
			"file-protection",
			"merge",
			"parallel-sessions",
			"plugin"
		],
		"u": "2026-08-15T15:24:48Z",
		"h": "https://github.com/Nwflower/dsh-file-claim",
		"p": ""
	},
	{
		"f": "echo-xianyu/dsh-go-rotator",
		"n": "dsh-go-rotator",
		"o": "echo-xianyu",
		"d": "A plugin for DSH to swich opencode Go subscription",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T03:16:01Z",
		"h": "https://github.com/echo-xianyu/dsh-go-rotator",
		"p": ""
	},
	{
		"f": "zhn1100/dsh-forge",
		"n": "dsh-forge",
		"o": "zhn1100",
		"d": "Reproducible DeepSeek Harness plugin development environment",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T12:05:56Z",
		"h": "https://github.com/zhn1100/dsh-forge",
		"p": ""
	},
	{
		"f": "omdsh-dev/7d7d",
		"n": "7d7d",
		"o": "omdsh-dev",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "HTML",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mini-games",
			"react",
			"typescript"
		],
		"u": "2026-08-15T13:54:02Z",
		"h": "https://github.com/omdsh-dev/7d7d",
		"p": ""
	},
	{
		"f": "unknowbug/anchorlaw",
		"n": "anchorlaw",
		"o": "unknowbug",
		"d": "Code verification protocol for vibe coding — every claim must have a verifiable practice anchor.",
		"s": 4,
		"k": 1,
		"l": "Python",
		"t": [
			"ai-assisted-development",
			"code-quality",
			"code-verification",
			"cpp",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"defensive-programming",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"llm",
			"protocol",
			"python",
			"static-analysis",
			"testing",
			"typescript",
			"verification",
			"vibe-coded",
			"vibe-coding"
		],
		"u": "2026-08-15T23:03:42Z",
		"h": "https://github.com/unknowbug/anchorlaw",
		"p": ""
	},
	{
		"f": "pitetow/dsh-notify-on-complete",
		"n": "dsh-notify-on-complete",
		"o": "pitetow",
		"d": "Desktop notifications for DeepSeek Harness (dsh) — run completion, questions, approvals. Zero-dependency Cordis plugin. ｜ DeepSeek Harness（dsh）桌面通知插件：运行结束 / 提问 / 审批时提醒，零依赖 Cordis 插件。",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-15T15:04:15Z",
		"h": "https://github.com/pitetow/dsh-notify-on-complete",
		"p": ""
	},
	{
		"f": "EdgeTypE/dsh-better-deepseek",
		"n": "dsh-better-deepseek",
		"o": "EdgeTypE",
		"d": "DeepSeek Harness bridge plugin for Better DeepSeek Chrome extension.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T08:45:31Z",
		"h": "https://github.com/EdgeTypE/dsh-better-deepseek",
		"p": "https://github.com/EdgeTypE/better-deepseek"
	},
	{
		"f": "STARDUSTLC666/dsh-docker",
		"n": "dsh-docker",
		"o": "STARDUSTLC666",
		"d": "DeepSeek Harness 容器管理插件：docker_ps/logs/inspect/exec/manage 五工具，官方 subprocess 服务、argv 无 shell 注入、exec 审批门、零运行时依赖。· Containers for DeepSeek Harness agents.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"devops",
			"docker",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:24:35Z",
		"h": "https://github.com/STARDUSTLC666/dsh-docker",
		"p": ""
	},
	{
		"f": "liliuCourier/dsh-chat-outline",
		"n": "dsh-chat-outline",
		"o": "liliuCourier",
		"d": "对话栏左侧常驻大纲：快速定位每次 user 提问与最后 assistant 回复（DeepSeek Harness 插件）",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"chat-outline",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T09:38:29Z",
		"h": "https://github.com/liliuCourier/dsh-chat-outline",
		"p": ""
	},
	{
		"f": "Thhoho/reSanity",
		"n": "reSanity",
		"o": "Thhoho",
		"d": "reSanity 散修 — 散户的认知组合管理：查证、避坑、记忆、复盘。一份 SKILL.md，零依赖。",
		"s": 4,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-skills",
			"ashare",
			"claude-code",
			"codex",
			"dsh",
			"dsh-plugin",
			"investment-analysis",
			"trade"
		],
		"u": "2026-08-13T16:41:34Z",
		"h": "https://github.com/Thhoho/reSanity",
		"p": ""
	},
	{
		"f": "ziyou979/dsh-llm-oauth",
		"n": "dsh-llm-oauth",
		"o": "ziyou979",
		"d": "DeepSeek Harness plugin: OAuth / subscription-plan LLM providers (Grok, GitHub Copilot, OpenAI Codex, Anthropic, OpenRouter)",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"github-copilot",
			"grok",
			"oauth",
			"openai-codex"
		],
		"u": "2026-08-15T14:13:33Z",
		"h": "https://github.com/ziyou979/dsh-llm-oauth",
		"p": ""
	},
	{
		"f": "zhtx2024/dsh-skin-switcher",
		"n": "dsh-skin-switcher",
		"o": "zhtx2024",
		"d": "DeepSeek Harness Web GUI 皮肤切换插件：设置界面一键切换已安装皮肤",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"skin",
			"webui"
		],
		"u": "2026-08-15T06:28:14Z",
		"h": "https://github.com/zhtx2024/dsh-skin-switcher",
		"p": ""
	},
	{
		"f": "DEEP-IOS/dsh-humanizer",
		"n": "dsh-humanizer",
		"o": "DEEP-IOS",
		"d": "DeepSeek Harness原生中文文本人工智能痕迹消除与多重审核对抗工作流",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"chinese-writing",
			"deai",
			"dsh-plugin",
			"humanizer",
			"novel-writing"
		],
		"u": "2026-08-15T11:41:34Z",
		"h": "https://github.com/DEEP-IOS/dsh-humanizer",
		"p": ""
	},
	{
		"f": "LingyeSoul/dsh-tavern",
		"n": "dsh-tavern",
		"o": "LingyeSoul",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:50:24Z",
		"h": "https://github.com/LingyeSoul/dsh-tavern",
		"p": ""
	},
	{
		"f": "JUANWANG-BUAA/dsh-full-remote",
		"n": "dsh-full-remote",
		"o": "JUANWANG-BUAA",
		"d": "dsh-plugin: Fix DeepSeek Harness 403s over tunnels. Token-gated reverse proxy restores settings.* / credentials.* / host.listDirectory remotely. Per-device sessions, WebSocket/SSE, mobile control panel.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai",
			"authentication",
			"cloudflared",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"home-server",
			"llm",
			"mobile",
			"mobile-ui",
			"ngrok",
			"nodejs",
			"proxy",
			"remote-access",
			"reverse-proxy",
			"security",
			"self-hosted",
			"tunnel",
			"typescript",
			"websocket"
		],
		"u": "2026-08-16T06:59:20Z",
		"h": "https://github.com/JUANWANG-BUAA/dsh-full-remote",
		"p": ""
	},
	{
		"f": "octoparse/agent-skills",
		"n": "agent-skills",
		"o": "octoparse",
		"d": "Collection of Octoparse agent skills",
		"s": 4,
		"k": 2,
		"l": "Python",
		"t": [
			"agent-native",
			"data-extraction",
			"dsh-plugin",
			"lead-generation",
			"market-research",
			"mcp",
			"octoparse",
			"price-monitoring",
			"review-analysis",
			"social-listening",
			"web-scraping"
		],
		"u": "2026-08-14T01:33:01Z",
		"h": "https://github.com/octoparse/agent-skills",
		"p": ""
	},
	{
		"f": "omdsh-dev/Qwen-MM-Plugins",
		"n": "Qwen-MM-Plugins",
		"o": "omdsh-dev",
		"d": "Qwen-MM-Plugins支持",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"qwen"
		],
		"u": "2026-08-14T11:39:24Z",
		"h": "https://github.com/omdsh-dev/Qwen-MM-Plugins",
		"p": ""
	},
	{
		"f": "Ceelog/dsh-plugins",
		"n": "dsh-plugins",
		"o": "Ceelog",
		"d": "deepseek harness plugins",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T17:45:48Z",
		"h": "https://github.com/Ceelog/dsh-plugins",
		"p": "https://www.npmjs.com/package/@opendsh/dsh-plugin-scheduled-tasks"
	},
	{
		"f": "badai147/dsh-global-rules",
		"n": "dsh-global-rules",
		"o": "badai147",
		"d": "在 DeepSeek Harness Web 设置面板中编辑 ~/.dsh/AGENTS.md 全局规则的插件",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin"
		],
		"u": "2026-08-15T17:16:14Z",
		"h": "https://github.com/badai147/dsh-global-rules",
		"p": ""
	},
	{
		"f": "NEXTINDIE/DeepSeek-Harness-for-VS-Code",
		"n": "DeepSeek-Harness-for-VS-Code",
		"o": "NEXTINDIE",
		"d": "DeepSeek Harness for VS Code: @dsh chat participant, sidebar & standalone chat, plan mode, goals, subagents, turn-level Git rollback, workspaces/jobs/settings panels, 13-language UI.",
		"s": 4,
		"k": 2,
		"l": "TypeScript",
		"t": [
			"ai",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"git"
		],
		"u": "2026-08-15T20:48:10Z",
		"h": "https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code",
		"p": ""
	},
	{
		"f": "loguhan/dsh-workshop",
		"n": "dsh-workshop",
		"o": "loguhan",
		"d": "Steam Workshop style plugin store for DeepSeek Harness Web UI: browse 850+ community plugins, one-click install with GitHub mirror acceleration, progress UI, security checks, Chinese descriptions",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"web-ui"
		],
		"u": "2026-08-16T07:34:44Z",
		"h": "https://github.com/loguhan/dsh-workshop",
		"p": ""
	},
	{
		"f": "MrWeiCodes/dsh-permgate",
		"n": "dsh-permgate",
		"o": "MrWeiCodes",
		"d": "为 DeepSeek Harness（DSH）提供的细粒度权限控制插件",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugins",
			"permissions"
		],
		"u": "2026-08-16T07:31:38Z",
		"h": "https://github.com/MrWeiCodes/dsh-permgate",
		"p": ""
	},
	{
		"f": "PerryLink/dsh-auto-review",
		"n": "dsh-auto-review",
		"o": "PerryLink",
		"d": "Second-model AI auto-review for DeepSeek Harness approval requests: a read-only reviewer subagent returns structured allow/deny verdicts with reasons, fail-closed by default, fully auditable from the session log (approval/asked -> autoReview/verdict -> approval/decided).",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-safety",
			"approval",
			"auto-review",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm",
			"sandbox",
			"second-model",
			"subagent"
		],
		"u": "2026-08-16T09:47:07Z",
		"h": "https://github.com/PerryLink/dsh-auto-review",
		"p": "https://www.npmjs.com/package/dsh-auto-review"
	},
	{
		"f": "brittanistrehlowll-oss/dsh-quota-panel",
		"n": "dsh-quota-panel",
		"o": "brittanistrehlowll-oss",
		"d": "Provider quota/balance corner panel for the dsh web surface (DeepSeek Harness plugin): server-side credential proxies plus a config-driven page badge.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:27Z",
		"h": "https://github.com/brittanistrehlowll-oss/dsh-quota-panel",
		"p": ""
	},
	{
		"f": "arcmosin/dsh-wordbox",
		"n": "dsh-wordbox",
		"o": "arcmosin",
		"d": "DSH Web GUI常用词箱子，方便项目常用词的存储和粘贴 | DSH Web GUI Common Words Box – for storing and pasting frequently used project terms.\"",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T00:59:25Z",
		"h": "https://github.com/arcmosin/dsh-wordbox",
		"p": ""
	},
	{
		"f": "dpskh/dsh-a2a",
		"n": "dsh-a2a",
		"o": "dpskh",
		"d": "Agent2Agent mesh for the Harness",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T04:01:08Z",
		"h": "https://github.com/dpskh/dsh-a2a",
		"p": ""
	},
	{
		"f": "sprite5/DshDesktopShell",
		"n": "DshDesktopShell",
		"o": "sprite5",
		"d": "deepseek Harness 桌面UI壳",
		"s": 4,
		"k": 0,
		"l": "Go",
		"t": [
			"dsh-plugin",
			"dsh-plugin-desktop",
			"dsh-plugins"
		],
		"u": "2026-08-15T13:25:36Z",
		"h": "https://github.com/sprite5/DshDesktopShell",
		"p": ""
	},
	{
		"f": "rpvvn/EasyDSH",
		"n": "EasyDSH",
		"o": "rpvvn",
		"d": "Lightweight one‑click launcher for DeepSeek Harness DeepSeek‑Harness(DSH)轻量一键启动器",
		"s": 4,
		"k": 0,
		"l": "C#",
		"t": [
			"agent-framework",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"launcher",
			"lightweight",
			"one-click",
			"quicklaunch"
		],
		"u": "2026-08-15T23:58:20Z",
		"h": "https://github.com/rpvvn/EasyDSH",
		"p": ""
	},
	{
		"f": "howmp/dsh-pentest",
		"n": "dsh-pentest",
		"o": "howmp",
		"d": "面向 DeepSeek Harness（dsh）的渗透测试模式  @CloverSecLabs",
		"s": 4,
		"k": 2,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins",
			"pentest"
		],
		"u": "2026-08-16T05:32:30Z",
		"h": "https://github.com/howmp/dsh-pentest",
		"p": ""
	},
	{
		"f": "Scorp1o117/dsh-tool-vision",
		"n": "dsh-tool-vision",
		"o": "Scorp1o117",
		"d": "Vision model for DeepSeek Harness | DeepSeek Harness 外置视觉模型插件",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T10:28:03Z",
		"h": "https://github.com/Scorp1o117/dsh-tool-vision",
		"p": ""
	},
	{
		"f": "boNeXY226/dsh-cost-chip",
		"n": "dsh-cost-chip",
		"o": "boNeXY226",
		"d": "DeepSeek Harness (dsh) 插件：/cost 查看每个会话花费 + 可拖拽的悬浮费用胶囊",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"cost-tracking",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"pricing",
			"slash-command",
			"token-usage"
		],
		"u": "2026-08-15T00:59:27Z",
		"h": "https://github.com/boNeXY226/dsh-cost-chip",
		"p": ""
	},
	{
		"f": "OK-wx/dsh-ocgo-lite",
		"n": "dsh-ocgo-lite",
		"o": "OK-wx",
		"d": "OpenCode Go 用量常驻条：套餐余量圆环 + token/花费实时统计（本次会话/全部范围 + 按模型联动，官方实时定价），一键复制 API Key。OpenCode Go usage bar for DeepSeek Harness.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"opencode-go-usage"
		],
		"u": "2026-08-16T07:17:59Z",
		"h": "https://github.com/OK-wx/dsh-ocgo-lite",
		"p": "https://github.com/OK-wx/dsh-ocgo-lite"
	},
	{
		"f": "PerryLink/dsh-lsp-actions",
		"n": "dsh-lsp-actions",
		"o": "PerryLink",
		"d": "LSP action surface for DeepSeek Harness: diagnostics, formatting, completion, code actions, symbols, signature help, inlay hints, and rename tools over language servers",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"code-action",
			"completion",
			"deepseek-harness",
			"diagnostics",
			"dsh",
			"dsh-plugin",
			"language-server",
			"lsp",
			"rename"
		],
		"u": "2026-08-16T09:46:44Z",
		"h": "https://github.com/PerryLink/dsh-lsp-actions",
		"p": "https://www.npmjs.com/package/dsh-lsp-actions"
	},
	{
		"f": "GooodWei/context-vista",
		"n": "context-vista",
		"o": "GooodWei",
		"d": "为 DeepSeek Harness 提供右侧悬浮栏以及 /context 命令，用环形图实时展示当前上下文 token 用量与分配，compact指令效果，同时支持估算费用消耗，对标 Claude Code 的 /context。",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseekharness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T02:36:58Z",
		"h": "https://github.com/GooodWei/context-vista",
		"p": ""
	},
	{
		"f": "Airmetro/dsh-update-checker",
		"n": "dsh-update-checker",
		"o": "Airmetro",
		"d": "DeepSeek Harness (DSH) 更新检测插件：自动检查 npm 最新版并在 GUI 顶部横幅提示，支持中英文跟随系统语言、一键安装更新并重启服务。Auto update checker for DeepSeek Harness with locale-aware banner and one-click update.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"update-checker"
		],
		"u": "2026-08-15T21:22:25Z",
		"h": "https://github.com/Airmetro/dsh-update-checker",
		"p": ""
	},
	{
		"f": "liustack/pptfast",
		"n": "pptfast",
		"o": "liustack",
		"d": "Stable, editable PPTX generation for AI agents — semantic IR in, native DrawingML out. DSH plugin + Claude Code plugin + CLI. | 给 AI agent 的稳定可编辑 PPTX 生成：语义 IR 进，原生 DrawingML 出。DSH 插件 / Claude Code 插件 / CLI。",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-skill",
			"agent-skills",
			"ai-agent",
			"claude-code",
			"claude-skills",
			"codex",
			"cordis",
			"deck-generation",
			"deepseek",
			"drawingml",
			"dsh",
			"dsh-plugin",
			"harness",
			"powerpoint",
			"pptx",
			"presentation",
			"slides"
		],
		"u": "2026-08-15T13:47:03Z",
		"h": "https://github.com/liustack/pptfast",
		"p": ""
	},
	{
		"f": "iamzcr/dsh-obsidian-assistant",
		"n": "dsh-obsidian-assistant",
		"o": "iamzcr",
		"d": "DeepSeek Harness 插件（Cordis toolset）：操作本地 Obsidian 知识库（vault），提供搜索、读写笔记、双向链接 / 关系图谱、批量整理，并通过 Obsidian 的 \"Local REST API\" 社区插件调用高级能力（高速全文搜索、触发命令 / 模板）。",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin"
		],
		"u": "2026-08-15T13:36:46Z",
		"h": "https://github.com/iamzcr/dsh-obsidian-assistant",
		"p": ""
	},
	{
		"f": "simon300000/dsh-auto",
		"n": "dsh-auto",
		"o": "simon300000",
		"d": "dsh Auto Approve",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T17:11:57Z",
		"h": "https://github.com/simon300000/dsh-auto",
		"p": ""
	},
	{
		"f": "Jonah-Wu23/oh-my-dsh",
		"n": "oh-my-dsh",
		"o": "Jonah-Wu23",
		"d": "Minimal-stable DeepSeek Harness preset with Linux-shaped persistent Bash, native Windows support, on-demand capability routing, and a low-cost V4 Flash router for DeepSeek V4 Pro coding workflows.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T14:31:16Z",
		"h": "https://github.com/Jonah-Wu23/oh-my-dsh",
		"p": ""
	},
	{
		"f": "wenzetan/dsh-llm-newapi",
		"n": "dsh-llm-newapi",
		"o": "wenzetan",
		"d": "NewAPI (OpenAI-compatible gateway) LLM provider plugin for DeepSeek Harness (dsh): chat-only model discovery + Web settings section. Zero dsh modifications.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"llm",
			"newapi",
			"openai-compatible"
		],
		"u": "2026-08-15T22:54:58Z",
		"h": "https://github.com/wenzetan/dsh-llm-newapi",
		"p": ""
	},
	{
		"f": "MicroMilo/upstream-radar",
		"n": "upstream-radar",
		"o": "MicroMilo",
		"d": "DSH plugin security and dependency monitoring for DeepSeek Harness: exact vulnerable paths, breaking updates, and Agent follow-up.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent-security",
			"ai-agents",
			"breaking-changes",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dependency-graph",
			"dependency-monitoring",
			"dependency-security",
			"dependency-vulnerabilities",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"npm",
			"osv",
			"plugin-security",
			"supply-chain-security",
			"typescript",
			"upstream-radar",
			"vulnerability-monitoring"
		],
		"u": "2026-08-15T23:25:10Z",
		"h": "https://github.com/MicroMilo/upstream-radar",
		"p": "https://www.npmjs.com/package/upstream-radar"
	},
	{
		"f": "tomowang/dsh-tui",
		"n": "dsh-tui",
		"o": "tomowang",
		"d": "An open-source terminal front door for DeepSeek Harness (dsh).",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"tui"
		],
		"u": "2026-08-16T02:58:18Z",
		"h": "https://github.com/tomowang/dsh-tui",
		"p": ""
	},
	{
		"f": "jarvis-intelligence/jarvis-index",
		"n": "jarvis-index",
		"o": "jarvis-intelligence",
		"d": "Public distribution surface for jarvis — local-first code intelligence MCP server (SCIP navigation + Zoekt search). Installer, Claude Code / Codex / Cursor plugins, and prebuilt binaries.",
		"s": 4,
		"k": 0,
		"l": "HTML",
		"t": [
			"ai-agents",
			"ai-tools",
			"claude-code",
			"code-intelligence",
			"code-navigation",
			"code-search",
			"codebase-analysis",
			"codex",
			"cursor",
			"developer-tools",
			"dsh-plugin",
			"llm-tools",
			"local-first",
			"mcp",
			"mcp-server",
			"model-context-protocol",
			"scip",
			"skills",
			"static-analysis",
			"zoekt"
		],
		"u": "2026-08-16T05:21:36Z",
		"h": "https://github.com/jarvis-intelligence/jarvis-index",
		"p": "https://jarvis-intelligence.github.io/jarvis-index/"
	},
	{
		"f": "Khorsheed/dsh-ankh-guard",
		"n": "dsh-ankh-guard",
		"o": "Khorsheed",
		"d": "防止 Agent 自我修改把服务改崩的守护插件（dsh 插件）：绿色构建凭证绑定 git HEAD，改坏不许重启；watchdog 无感重启 + canary 自动回滚",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"dsh",
			"dsh-plugin",
			"self-modification",
			"watchdog"
		],
		"u": "2026-08-16T07:39:10Z",
		"h": "https://github.com/Khorsheed/dsh-ankh-guard",
		"p": ""
	},
	{
		"f": "qichuang321/dsh-plugin-browser",
		"n": "dsh-plugin-browser",
		"o": "qichuang321",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T00:59:01Z",
		"h": "https://github.com/qichuang321/dsh-plugin-browser",
		"p": ""
	},
	{
		"f": "dongsheng123132/dsh-lineage",
		"n": "dsh-lineage",
		"o": "dongsheng123132",
		"d": "Content-addressed artifact, fact, action and report lineage for DeepSeek Harness",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"content-addressed-storage",
			"data-lineage",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"provenance"
		],
		"u": "2026-08-15T08:17:35Z",
		"h": "https://github.com/dongsheng123132/dsh-lineage",
		"p": ""
	},
	{
		"f": "bujue600-arch/dsh-testgen",
		"n": "dsh-testgen",
		"o": "bujue600-arch",
		"d": "Automated unit-test generation for DeepSeek Harness: /testgen command + generate_tests tool that scaffold, run, and fix unit tests until they pass.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai",
			"coding-agent",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"test-generation",
			"testing",
			"unit-test"
		],
		"u": "2026-08-15T00:59:27Z",
		"h": "https://github.com/bujue600-arch/dsh-testgen",
		"p": "https://github.com/bujue600-arch/dsh-testgen"
	},
	{
		"f": "fountunt/dsh-session-cleaner",
		"n": "dsh-session-cleaner",
		"o": "fountunt",
		"d": "为 DeepSeek Harness 提供会话删除能力，支持侧边栏 ⋮ 菜单入口",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"session-manager"
		],
		"u": "2026-08-15T13:32:28Z",
		"h": "https://github.com/fountunt/dsh-session-cleaner",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-book2skill",
		"n": "dsh-book2skill",
		"o": "omdsh-dev",
		"d": "DSH book-to-skill plugin: a 5-stage long task (fetch → parse → understand → generate → install) with 3 human gates, host tools for the agent and a browser timeline panel",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T12:58:39Z",
		"h": "https://github.com/omdsh-dev/dsh-book2skill",
		"p": ""
	},
	{
		"f": "havingautism/dsh-notebooks",
		"n": "dsh-notebooks",
		"o": "havingautism",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:03:08Z",
		"h": "https://github.com/havingautism/dsh-notebooks",
		"p": ""
	},
	{
		"f": "Sparrived/DSH-Deeptop",
		"n": "DSH-Deeptop",
		"o": "Sparrived",
		"d": "Deeptop, a lightweight native desktop client for DeepSeek Harness.",
		"s": 4,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T03:09:36Z",
		"h": "https://github.com/Sparrived/DSH-Deeptop",
		"p": ""
	},
	{
		"f": "Misaki14987/dsh-theme-taffy",
		"n": "dsh-theme-taffy",
		"o": "Misaki14987",
		"d": "我不是雏草姬（自用",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"theme"
		],
		"u": "2026-08-16T08:53:26Z",
		"h": "https://github.com/Misaki14987/dsh-theme-taffy",
		"p": ""
	},
	{
		"f": "Mochabafey/whale-notify",
		"n": "whale-notify",
		"o": "Mochabafey",
		"d": "鲸鱼通知——基于DeepSeek Harness的通知和鲸鱼娘人设插件",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin"
		],
		"u": "2026-08-16T08:51:11Z",
		"h": "https://github.com/Mochabafey/whale-notify",
		"p": ""
	},
	{
		"f": "Seryta/dsh-node-nav",
		"n": "dsh-node-nav",
		"o": "Seryta",
		"d": "对话节点导航：DSH Web GUI 右侧节点串，hover 预览、点击跳转、active 药丸跟随阅读位置",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"conversation-navigation",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T12:36:50Z",
		"h": "https://github.com/Seryta/dsh-node-nav",
		"p": ""
	},
	{
		"f": "MorGogh/widget-dock",
		"n": "widget-dock",
		"o": "MorGogh",
		"d": "DSH plugin: draggable widget panel (balance, tokens, stats, commands, goal, cost) for DeepSeek Harness",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T12:18:37Z",
		"h": "https://github.com/MorGogh/widget-dock",
		"p": ""
	},
	{
		"f": "pandashere/dsh-self-control-guard",
		"n": "dsh-self-control-guard",
		"o": "pandashere",
		"d": "Self-control guard plugin for DeepSeek Harness host exit and restart workflows.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T03:30:34Z",
		"h": "https://github.com/pandashere/dsh-self-control-guard",
		"p": ""
	},
	{
		"f": "PwnKY/dsh-session-link",
		"n": "dsh-session-link",
		"o": "PwnKY",
		"d": "DeepSeek Harness 的 Codex 式会话深度链接插件：dsh:// 深链，跨对话读取上下文",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"codex",
			"deep-link",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"session"
		],
		"u": "2026-08-16T08:12:17Z",
		"h": "https://github.com/PwnKY/dsh-session-link",
		"p": "https://www.npmjs.com/package/dsh-session-link"
	},
	{
		"f": "leavestring/awesome-dsh-background-plugin",
		"n": "awesome-dsh-background-plugin",
		"o": "leavestring",
		"d": "DSH Web 背景个性化插件：上传自己的图片（JPG / PNG / WEBP / GIF，浏览器端自动压缩到 1600px 以内）或一键切换极光、余烬、宣纸三种预设氛围；实时预览所见即所得，支持细调图像存在感、暗色遮罩、柔焦、适配方式与焦点位置；上传即自动保存到 DSH 设置，重启后原样恢复，浅色 / 深色主题均正常；侧栏、消息气泡、输入框保持原样不遮挡，浮层菜单不受影响；全程本地处理不上传任何服务器，关闭开关或一键恢复默认即可完全移除；内置中英文双语界面。",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"plugin",
			"webui"
		],
		"u": "2026-08-16T07:08:50Z",
		"h": "https://github.com/leavestring/awesome-dsh-background-plugin",
		"p": ""
	},
	{
		"f": "zdjmrq/dsh-user-plugins-manager",
		"n": "dsh-user-plugins-manager",
		"o": "zdjmrq",
		"d": "DSH 用户插件管理器:在 设置→插件 统一管理插件目录散件、运行树插件与 npm 插件包——挂载/卸载/启用/停用(cordis.patch.yml 补丁层 + HMR 热生效)",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:08:28Z",
		"h": "https://github.com/zdjmrq/dsh-user-plugins-manager",
		"p": ""
	},
	{
		"f": "wz-heng/dsh-feishu-bridge",
		"n": "dsh-feishu-bridge",
		"o": "wz-heng",
		"d": "Feishu (Lark) channel bridge for DeepSeek Harness (dsh) — message a Feishu bot, it runs a dsh agent turn, the reply comes back. Community plugin.",
		"s": 4,
		"k": 0,
		"l": "Python",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"feishu",
			"lark"
		],
		"u": "2026-08-16T07:02:31Z",
		"h": "https://github.com/wz-heng/dsh-feishu-bridge",
		"p": ""
	},
	{
		"f": "Degurechaff57/dsh-openapi",
		"n": "dsh-openapi",
		"o": "Degurechaff57",
		"d": "Safe OpenAPI 3.x discovery and API calling tools for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"openapi",
			"swagger"
		],
		"u": "2026-08-13T16:41:33Z",
		"h": "https://github.com/Degurechaff57/dsh-openapi",
		"p": ""
	},
	{
		"f": "buguoshixc/deepseek-harness-external-migration",
		"n": "deepseek-harness-external-migration",
		"o": "buguoshixc",
		"d": "**DeepSeek-Harness Migration Plugin** 是一款专为 [DeepSeek-Harness](https://github.com/deepseek-ai/deepseek-harness) 设计的插件，旨在帮助开发者无缝迁移其他主流 AI 编程助手（Codex、Claude Code、Qcoder、OpenCode）的个性化配置及历史会话记录。无需手动复制粘贴，即可在 DeepSeek-Harness 中继续之前的工作流，大幅降低切换成本。",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:27Z",
		"h": "https://github.com/buguoshixc/deepseek-harness-external-migration",
		"p": ""
	},
	{
		"f": "1514100951/dsh-usage-footer",
		"n": "dsh-usage-footer",
		"o": "1514100951",
		"d": "DSH web 用量/费用悬浮按钮插件：账户余额、峰谷时段、今日/本会话消费估算与 token 统计（含设置开关）",
		"s": 4,
		"k": 2,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-14T14:26:02Z",
		"h": "https://github.com/1514100951/dsh-usage-footer",
		"p": ""
	},
	{
		"f": "wingoo/codex-plugin-dsh",
		"n": "codex-plugin-dsh",
		"o": "wingoo",
		"d": "Use local Codex App Server as a model provider in DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"codex",
			"codex-app-server",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm-provider",
			"typescript"
		],
		"u": "2026-08-14T13:58:18Z",
		"h": "https://github.com/wingoo/codex-plugin-dsh",
		"p": ""
	},
	{
		"f": "labmimors/dsh-mcp-lens",
		"n": "dsh-mcp-lens",
		"o": "labmimors",
		"d": "DeepSeek Harness MCP tool search for large catalogs: 1,000 MCP tools behind 2 MCP-facing schemas, exact-schema calls, allow/deny controls, and a local calculator.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent-harness",
			"context-engineering",
			"context-optimization",
			"context-reduction",
			"context-window",
			"deepseek",
			"deepseek-harness",
			"deepseek-plugin",
			"deepseek-v4",
			"dsh-plugin",
			"mcp",
			"mcp-client",
			"mcp-gateway",
			"mcp-router",
			"mcp-tools",
			"progressive-disclosure",
			"tool-discovery",
			"tool-routing",
			"tool-search",
			"tool-selection"
		],
		"u": "2026-08-16T02:16:01Z",
		"h": "https://github.com/labmimors/dsh-mcp-lens",
		"p": "https://deepseek-harness-mcp-lens.charmingkla.chatgpt.site"
	},
	{
		"f": "sereinmono/dsh-desktop-pet",
		"n": "dsh-desktop-pet",
		"o": "sereinmono",
		"d": "A plugin that adds a desktop pet to your DeepSeek Harness, supporting the Codex pet format.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"desktop-pet",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"pet"
		],
		"u": "2026-08-15T14:02:43Z",
		"h": "https://github.com/sereinmono/dsh-desktop-pet",
		"p": ""
	},
	{
		"f": "NanmiCoder/dsh-plugin-market",
		"n": "dsh-plugin-market",
		"o": "NanmiCoder",
		"d": "Verified plugin marketplace for DeepSeek Harness — discover, inspect, install, and remove DSH plugins from the Web UI.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin-catalog",
			"plugin-manager",
			"plugin-marketplace",
			"typescript",
			"web-ui"
		],
		"u": "2026-08-16T09:57:47Z",
		"h": "https://github.com/NanmiCoder/dsh-plugin-market",
		"p": "https://www.npmjs.com/package/@nanmicoder/dsh-plugin-market"
	},
	{
		"f": "jkrandom-sudo/dsh-plugin-audit",
		"n": "dsh-plugin-audit",
		"o": "jkrandom-sudo",
		"d": "Security audit for DeepSeek Harness plugins: static permission profile with file/line evidence + a runtime sentinel gating credential access and unknown-host egress · DSH 插件安全审计：静态权限画像（附文件/行号证据）+ 运行时哨兵，触及凭证或向未知主机外发数据时先请你批准",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"audit",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"security"
		],
		"u": "2026-08-15T04:54:00Z",
		"h": "https://github.com/jkrandom-sudo/dsh-plugin-audit",
		"p": ""
	},
	{
		"f": "aceice01/dsh-whale-pet",
		"n": "dsh-whale-pet",
		"o": "aceice01",
		"d": "DeepSeek 鲸鱼娘桌宠：DSH Desktop 桌宠 + Web 版悬浮桌宠，晓伊神经网络语音、撒娇互动、任务完成提醒",
		"s": 4,
		"k": 0,
		"l": "HTML",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugin-desktop",
			"dsh-plugins"
		],
		"u": "2026-08-16T04:44:44Z",
		"h": "https://github.com/aceice01/dsh-whale-pet",
		"p": ""
	},
	{
		"f": "sandbaseai/sandbase-skills",
		"n": "sandbase-skills",
		"o": "sandbaseai",
		"d": "88 installable open-source Agent Skills for research, social intelligence, marketing, and business workflows—compatible with Codex, Claude Code, Cursor, Gemini CLI, and DeepSeek Harness.",
		"s": 4,
		"k": 1,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agents",
			"business-intelligence",
			"claude-code",
			"claude-code-marketplace",
			"claude-code-plugin",
			"codex-skills",
			"cursor-ai",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gemini-cli",
			"market-research",
			"marketing-automation",
			"mcp",
			"model-context-protocol",
			"research-tools",
			"skill-md",
			"social-listening"
		],
		"u": "2026-08-16T05:24:14Z",
		"h": "https://github.com/sandbaseai/sandbase-skills",
		"p": "https://skills.sh/sandbaseai/sandbase-skills/multi-source-search"
	},
	{
		"f": "huguangyu666/dsh-plugin-notify",
		"n": "dsh-plugin-notify",
		"o": "huguangyu666",
		"d": "DeepSeek Harness 插件：通知出口——agent 通过桌面通知 / 中文语音播报 / 提示音主动联系用户（长任务完成、出错、呼叫用户回来）。Windows 本机零依赖。",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"notification",
			"tts",
			"voice"
		],
		"u": "2026-08-15T14:30:50Z",
		"h": "https://github.com/huguangyu666/dsh-plugin-notify",
		"p": ""
	},
	{
		"f": "silencieuxzero/Better_Deepseek_Harness",
		"n": "Better_Deepseek_Harness",
		"o": "silencieuxzero",
		"d": "Better Deepseek Harness, with some functional extensions to webui and Deepseek Harness·更好的deepseek harness，对webui和deepseek harness进行了一些功能扩展",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"ai-tools",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:48:22Z",
		"h": "https://github.com/silencieuxzero/Better_Deepseek_Harness",
		"p": ""
	},
	{
		"f": "2031814001yuyue-tech/dsh-side-chat",
		"n": "dsh-side-chat",
		"o": "2031814001yuyue-tech",
		"d": "dsh-plugin",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:27:33Z",
		"h": "https://github.com/2031814001yuyue-tech/dsh-side-chat",
		"p": ""
	},
	{
		"f": "nanshan1995/DSH-Plugin-Market",
		"n": "DSH-Plugin-Market",
		"o": "nanshan1995",
		"d": "DeepSeek Harness 插件市场：精选目录 + GitHub 实时浏览、中英翻译搜索、安装前静态安全审计闸门。Plugin market for DeepSeek Harness with a pre-install security audit gate.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"marketplace",
			"plugin-market",
			"security-audit"
		],
		"u": "2026-08-16T09:20:21Z",
		"h": "https://github.com/nanshan1995/DSH-Plugin-Market",
		"p": ""
	},
	{
		"f": "rinDBeans/dsh-apex-standard",
		"n": "dsh-apex-standard",
		"o": "rinDBeans",
		"d": "DeepSeek V4 Pro/Flash unified anchored agent preset for DeepSeek Harness (official API & opencode-go): two-stage RL-aligned bootstrap, model-aware path routing, epoch-aware long-session stability",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-preset",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm",
			"opencode-go",
			"prompt-engineering"
		],
		"u": "2026-08-16T09:25:39Z",
		"h": "https://github.com/rinDBeans/dsh-apex-standard",
		"p": ""
	},
	{
		"f": "Zephyr-vibe/dsh-personalize",
		"n": "dsh-personalize",
		"o": "Zephyr-vibe",
		"d": "Per-host personalization for DSH: custom instructions, local long-term memory, and reply-tone presets.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"personalization",
			"plugin"
		],
		"u": "2026-08-15T00:59:24Z",
		"h": "https://github.com/Zephyr-vibe/dsh-personalize",
		"p": ""
	},
	{
		"f": "Scorp1o117/dsh-tdai-memory",
		"n": "dsh-tdai-memory",
		"o": "Scorp1o117",
		"d": "Agent memory for DeepSeek Harness | DeepSeek Harness 记忆插件",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T10:28:21Z",
		"h": "https://github.com/Scorp1o117/dsh-tdai-memory",
		"p": ""
	},
	{
		"f": "detpecca/dsh-llm-wiki",
		"n": "dsh-llm-wiki",
		"o": "detpecca",
		"d": "",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T16:59:41Z",
		"h": "https://github.com/detpecca/dsh-llm-wiki",
		"p": ""
	},
	{
		"f": "culture-flask/dsh-aemeath-pet",
		"n": "dsh-aemeath-pet",
		"o": "culture-flask",
		"d": "爱弥斯 · DeepSeek Harness 桌宠 — DeepSeek Harness Web GUI 的像素风宠物插件。",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T16:47:19Z",
		"h": "https://github.com/culture-flask/dsh-aemeath-pet",
		"p": ""
	},
	{
		"f": "noone89A/dsh-gauge",
		"n": "dsh-gauge",
		"o": "noone89A",
		"d": "为 DeepSeek Harness Web UI 提供精确缓存命中率、token 用量与费用估算",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cache-hit",
			"cost-estimate",
			"deepseek-harness",
			"dsh",
			"dsh-external",
			"dsh-plugin",
			"token-usage",
			"web-ui"
		],
		"u": "2026-08-15T16:25:59Z",
		"h": "https://github.com/noone89A/dsh-gauge",
		"p": ""
	},
	{
		"f": "lj970926/dsh-plugin-mermaid",
		"n": "dsh-plugin-mermaid",
		"o": "lj970926",
		"d": "DeepSeek Harness web client plugin: render mermaid code blocks with a chart/source toggle.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"diagrams",
			"dsh",
			"dsh-plugin",
			"mermaid"
		],
		"u": "2026-08-16T06:32:48Z",
		"h": "https://github.com/lj970926/dsh-plugin-mermaid",
		"p": ""
	},
	{
		"f": "DDDMUC/dsh-free-search",
		"n": "dsh-free-search",
		"o": "DDDMUC",
		"d": "Free web search provider for DeepSeek Harness - DuckDuckGo backend, no API key needed",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"bing",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"duckduckgo",
			"web-search"
		],
		"u": "2026-08-16T06:49:57Z",
		"h": "https://github.com/DDDMUC/dsh-free-search",
		"p": ""
	},
	{
		"f": "PicGo/dsh-plugin",
		"n": "dsh-plugin",
		"o": "PicGo",
		"d": "Upload images and files to your image host from DeepSeek Harness, powered by PicGo",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"image-upload",
			"picgo"
		],
		"u": "2026-08-14T13:54:19Z",
		"h": "https://github.com/PicGo/dsh-plugin",
		"p": "https://picgo.app/blog/2026/picgo-deepseek-harness-plugin/"
	},
	{
		"f": "MuziIsabel/dsh-win-notify",
		"n": "dsh-win-notify",
		"o": "MuziIsabel",
		"d": "DSH 插件：代理任务完成时弹出带声音的 Windows Toast 通知，点击通知即可直接切回并前台显示 DSH 标签页",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T09:10:30Z",
		"h": "https://github.com/MuziIsabel/dsh-win-notify",
		"p": ""
	},
	{
		"f": "Favio8/dsh-plugin-deepeye",
		"n": "dsh-plugin-deepeye",
		"o": "Favio8",
		"d": "DeepEye vision plugin for DeepSeek Harness (DSH): image description, OCR, VQA, UI layout, and clipboard analysis.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multimodal",
			"ocr",
			"vision"
		],
		"u": "2026-08-14T06:13:48Z",
		"h": "https://github.com/Favio8/dsh-plugin-deepeye",
		"p": ""
	},
	{
		"f": "kairoz9/dsh-mcp-admin",
		"n": "dsh-mcp-admin",
		"o": "kairoz9",
		"d": "dsh plugin for MCP status inspection and server management | dsh 的 MCP状态查看与服务管理插件",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"mcp",
			"mcp-client",
			"mcp-server",
			"model-context-protocol",
			"typert",
			"typescript"
		],
		"u": "2026-08-15T04:41:07Z",
		"h": "https://github.com/kairoz9/dsh-mcp-admin",
		"p": ""
	},
	{
		"f": "itmoqing/DeepSeek-Harness-Skill",
		"n": "DeepSeek-Harness-Skill",
		"o": "itmoqing",
		"d": "这是一个Codex/Claude来进行任务发布给DeepSeek Harness干活的工作流的Skill，能实现并发，多个工作区一起执行",
		"s": 4,
		"k": 0,
		"l": "PowerShell",
		"t": [
			"dsh-plugin",
			"dsh-plugin-verify",
			"dsh-plugins"
		],
		"u": "2026-08-15T10:25:34Z",
		"h": "https://github.com/itmoqing/DeepSeek-Harness-Skill",
		"p": ""
	},
	{
		"f": "vlln/dsh-loop",
		"n": "dsh-loop",
		"o": "vlln",
		"d": "DSH 插件：定时循环（/loop 命令 + loop 工具 + 活动状态条）。官方 bundle 插件，dsh plugin --profile web add 安装",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"plugin",
			"ui"
		],
		"u": "2026-08-15T16:07:50Z",
		"h": "https://github.com/vlln/dsh-loop",
		"p": ""
	},
	{
		"f": "aaravarr/dsh-subagent-max",
		"n": "dsh-subagent-max",
		"o": "aaravarr",
		"d": "DeepSeek Harness (DSH) plugin — a subagent_with_model tool plus a live multi-panel subagent viewer.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugins",
			"panel",
			"subagents"
		],
		"u": "2026-08-15T06:39:40Z",
		"h": "https://github.com/aaravarr/dsh-subagent-max",
		"p": ""
	},
	{
		"f": "KhanZou/Deepseek-Harness-as-Desktop",
		"n": "Deepseek-Harness-as-Desktop",
		"o": "KhanZou",
		"d": "Turn DeepSeek Harness into a Codex-style desktop app: native WebView2 shell, system tray, auto-start, Windows toasts, and a Desktop settings tab with a one-of-N skin center.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T08:39:32Z",
		"h": "https://github.com/KhanZou/Deepseek-Harness-as-Desktop",
		"p": ""
	},
	{
		"f": "longyu065/dsh-desktop",
		"n": "dsh-desktop",
		"o": "longyu065",
		"d": "Desktop shell for DeepSeek Harness Web GUI — auto-installs dsh, native macOS tray, packaged for macOS & Windows.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T08:00:58Z",
		"h": "https://github.com/longyu065/dsh-desktop",
		"p": ""
	},
	{
		"f": "rongzi5/dsh-whale-pet",
		"n": "dsh-whale-pet",
		"o": "rongzi5",
		"d": "",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T15:35:36Z",
		"h": "https://github.com/rongzi5/dsh-whale-pet",
		"p": ""
	},
	{
		"f": "libinyam/dsh-vision-provider",
		"n": "dsh-vision-provider",
		"o": "libinyam",
		"d": "Config-only DeepSeek Harness bundle for OpenAI-compatible vision models.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multimodal",
			"openai-compatible",
			"vision"
		],
		"u": "2026-08-15T04:05:45Z",
		"h": "https://github.com/libinyam/dsh-vision-provider",
		"p": ""
	},
	{
		"f": "147228/dsh-black-whale",
		"n": "dsh-black-whale",
		"o": "147228",
		"d": "DeepSeek Harness 黑鲸实验室主题：官网黑鲸 × 夕小瑶 IP，真实 profile 可安装的 Web UI 插件",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"skin",
			"theme",
			"xiaoyao"
		],
		"u": "2026-08-15T08:53:33Z",
		"h": "https://github.com/147228/dsh-black-whale",
		"p": ""
	},
	{
		"f": "xinCodes/deepseek-billing-plugin",
		"n": "deepseek-billing-plugin",
		"o": "xinCodes",
		"d": "DeepSeek Harness (DSH) 插件：DeepSeek 官方 API 余额与当前会话费用估算",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"billing",
			"deepseek",
			"deepseek-billing",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T07:22:19Z",
		"h": "https://github.com/xinCodes/deepseek-billing-plugin",
		"p": ""
	},
	{
		"f": "gameswu/dsh-notifacation-frame",
		"n": "dsh-notifacation-frame",
		"o": "gameswu",
		"d": "dsh通知消息统一管理框架",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:54:56Z",
		"h": "https://github.com/gameswu/dsh-notifacation-frame",
		"p": ""
	},
	{
		"f": "1HelloMan1/dsh-stats-dashboard",
		"n": "dsh-stats-dashboard",
		"o": "1HelloMan1",
		"d": "DSH plugin: provider/model usage stats dashboard with response speed, call log, token totals, cache rate, cost estimates, CSV export",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dashboard",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"usage-stats"
		],
		"u": "2026-08-15T00:58:55Z",
		"h": "https://github.com/1HelloMan1/dsh-stats-dashboard",
		"p": ""
	},
	{
		"f": "the-qian/dsh-commit-review",
		"n": "dsh-commit-review",
		"o": "the-qian",
		"d": "一个 DSH 插件：为 Web GUI 增加 /commit 与 /review 两个斜杠命令",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T00:59:55Z",
		"h": "https://github.com/the-qian/dsh-commit-review",
		"p": ""
	},
	{
		"f": "Thhoho/reSanity",
		"n": "reSanity",
		"o": "Thhoho",
		"d": "reSanity 散修 — 散户的认知组合管理：查证、避坑、记忆、复盘。一份 SKILL.md，零依赖。",
		"s": 4,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-skills",
			"ashare",
			"claude-code",
			"codex",
			"dsh",
			"dsh-plugin",
			"investment-analysis",
			"trade"
		],
		"u": "2026-08-13T16:41:34Z",
		"h": "https://github.com/Thhoho/reSanity",
		"p": ""
	},
	{
		"f": "zhtx2024/dsh-skin-switcher",
		"n": "dsh-skin-switcher",
		"o": "zhtx2024",
		"d": "DeepSeek Harness Web GUI 皮肤切换插件：设置界面一键切换已安装皮肤",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"skin",
			"webui"
		],
		"u": "2026-08-15T06:28:14Z",
		"h": "https://github.com/zhtx2024/dsh-skin-switcher",
		"p": ""
	},
	{
		"f": "DEEP-IOS/dsh-humanizer",
		"n": "dsh-humanizer",
		"o": "DEEP-IOS",
		"d": "DeepSeek Harness原生中文文本人工智能痕迹消除与多重审核对抗工作流",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"chinese-writing",
			"deai",
			"dsh-plugin",
			"humanizer",
			"novel-writing"
		],
		"u": "2026-08-15T11:41:34Z",
		"h": "https://github.com/DEEP-IOS/dsh-humanizer",
		"p": ""
	},
	{
		"f": "ziyou979/dsh-llm-oauth",
		"n": "dsh-llm-oauth",
		"o": "ziyou979",
		"d": "DeepSeek Harness plugin: OAuth / subscription-plan LLM providers (Grok, GitHub Copilot, OpenAI Codex, Anthropic, OpenRouter)",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"github-copilot",
			"grok",
			"oauth",
			"openai-codex"
		],
		"u": "2026-08-15T14:13:33Z",
		"h": "https://github.com/ziyou979/dsh-llm-oauth",
		"p": ""
	},
	{
		"f": "JUANWANG-BUAA/dsh-full-remote",
		"n": "dsh-full-remote",
		"o": "JUANWANG-BUAA",
		"d": "dsh-plugin: Fix DeepSeek Harness 403s over tunnels. Token-gated reverse proxy restores settings.* / credentials.* / host.listDirectory remotely. Per-device sessions, WebSocket/SSE, mobile control panel.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai",
			"authentication",
			"cloudflared",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"home-server",
			"llm",
			"mobile",
			"mobile-ui",
			"ngrok",
			"nodejs",
			"proxy",
			"remote-access",
			"reverse-proxy",
			"security",
			"self-hosted",
			"tunnel",
			"typescript",
			"websocket"
		],
		"u": "2026-08-16T06:59:20Z",
		"h": "https://github.com/JUANWANG-BUAA/dsh-full-remote",
		"p": ""
	},
	{
		"f": "LingyeSoul/dsh-tavern",
		"n": "dsh-tavern",
		"o": "LingyeSoul",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:50:24Z",
		"h": "https://github.com/LingyeSoul/dsh-tavern",
		"p": ""
	},
	{
		"f": "xxxxxxxyu/dsh-notify-sound",
		"n": "dsh-notify-sound",
		"o": "xxxxxxxyu",
		"d": "DSH (DeepSeek Harness) web plugin: plays a sound when the agent finishes replying (turn/end). Sound, volume and on/off configurable in Settings.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"notification",
			"plugin",
			"sound",
			"typescript",
			"web"
		],
		"u": "2026-08-15T11:16:54Z",
		"h": "https://github.com/xxxxxxxyu/dsh-notify-sound",
		"p": ""
	},
	{
		"f": "jasonsun29/ds-balance-card",
		"n": "ds-balance-card",
		"o": "jasonsun29",
		"d": "DeepSeek Harness 常驻额度卡片插件:自动识别已配置的平台 API Key,显示余额与 Coding Plan 额度",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"balance",
			"coding-plan",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:01:24Z",
		"h": "https://github.com/jasonsun29/ds-balance-card",
		"p": ""
	},
	{
		"f": "Nwflower/dsh-file-claim",
		"n": "dsh-file-claim",
		"o": "Nwflower",
		"d": "File claim / protection for concurrent DeepSeek Harness (DSH) sessions working the same workspace: claim/release, heartbeat stale takeover, async pending merge area (git 3-way merge). DSH Host plugin.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"3-way-merge",
			"concurrency",
			"coordination",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"file-claim",
			"file-lock",
			"file-protection",
			"merge",
			"parallel-sessions",
			"plugin"
		],
		"u": "2026-08-15T15:24:48Z",
		"h": "https://github.com/Nwflower/dsh-file-claim",
		"p": ""
	},
	{
		"f": "echo-xianyu/dsh-go-rotator",
		"n": "dsh-go-rotator",
		"o": "echo-xianyu",
		"d": "A plugin for DSH to swich opencode Go subscription",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T03:16:01Z",
		"h": "https://github.com/echo-xianyu/dsh-go-rotator",
		"p": ""
	},
	{
		"f": "shinelon/eyes-for-deepseek",
		"n": "eyes-for-deepseek",
		"o": "shinelon",
		"d": "",
		"s": 4,
		"k": 2,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-13T15:04:48Z",
		"h": "https://github.com/shinelon/eyes-for-deepseek",
		"p": ""
	},
	{
		"f": "morlay/session-persistence-rdb",
		"n": "session-persistence-rdb",
		"o": "morlay",
		"d": "session 关系型数据库持久化",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-session-persistence",
			"rdb"
		],
		"u": "2026-08-15T07:37:43Z",
		"h": "https://github.com/morlay/session-persistence-rdb",
		"p": ""
	},
	{
		"f": "nekogpt/dsh-ui-quote-selection",
		"n": "dsh-ui-quote-selection",
		"o": "nekogpt",
		"d": "Codex-style select-to-quote for DeepSeek Harness Web: quote any chat text into the composer as a native reference chip.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"quote-selection"
		],
		"u": "2026-08-15T00:59:47Z",
		"h": "https://github.com/nekogpt/dsh-ui-quote-selection",
		"p": ""
	},
	{
		"f": "gezi-wen/sage-mem",
		"n": "sage-mem",
		"o": "gezi-wen",
		"d": "",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:35:18Z",
		"h": "https://github.com/gezi-wen/sage-mem",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-science",
		"n": "dsh-science",
		"o": "omdsh-dev",
		"d": "Reproducible Python and R work on DeepSeek Harness, built as plugins.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"conda",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"python",
			"r-language",
			"scientific-computing",
			"typescript"
		],
		"u": "2026-08-15T17:55:10Z",
		"h": "https://github.com/omdsh-dev/dsh-science",
		"p": ""
	},
	{
		"f": "jiezeng2004-design/dsh-requirements-alignment",
		"n": "dsh-requirements-alignment",
		"o": "jiezeng2004-design",
		"d": "Lightweight requirement alignment for DeepSeek Harness — align important decisions before execution without a full spec workflow.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"ai-agent",
			"cordis",
			"deepseek-harness",
			"dsh-plugin",
			"requirement-alignment"
		],
		"u": "2026-08-16T07:28:14Z",
		"h": "https://github.com/jiezeng2004-design/dsh-requirements-alignment",
		"p": "https://www.npmjs.com/package/dsh-requirements-alignment"
	},
	{
		"f": "yyh-001/dsh-expression",
		"n": "dsh-expression",
		"o": "yyh-001",
		"d": "找得到、发得出 —— DSH 表情包插件：语义搜图，只发真实文件，走 companion QQ 通道",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"meme",
			"qq-bot",
			"selfloom",
			"semantic-search"
		],
		"u": "2026-08-16T09:55:25Z",
		"h": "https://github.com/yyh-001/dsh-expression",
		"p": "https://github.com/yyh-001/dsh-companion"
	},
	{
		"f": "3274375092/dsh-voice",
		"n": "dsh-voice",
		"o": "3274375092",
		"d": "Voice input plugin for DeepSeek Harness: mic → local/browser speech recognition → text submitted as a normal chat message. Input-only and preset-agnostic.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T09:40:08Z",
		"h": "https://github.com/3274375092/dsh-voice",
		"p": ""
	},
	{
		"f": "lusipad/RocketX",
		"n": "RocketX",
		"o": "lusipad",
		"d": "以原版 Rocket.Chat 为内核、集成 Codex App Server、Deepseek Harness、Azure DevOps、体验对标飞书的团队协作客户端。",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"rocket-chat",
			"rocketchat"
		],
		"u": "2026-08-16T10:23:46Z",
		"h": "https://github.com/lusipad/RocketX",
		"p": ""
	},
	{
		"f": "boNeXY226/dsh-cost-chip",
		"n": "dsh-cost-chip",
		"o": "boNeXY226",
		"d": "DeepSeek Harness (dsh) 插件：/cost 查看每个会话花费 + 可拖拽的悬浮费用胶囊",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"cost-tracking",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"pricing",
			"slash-command",
			"token-usage"
		],
		"u": "2026-08-15T00:59:27Z",
		"h": "https://github.com/boNeXY226/dsh-cost-chip",
		"p": ""
	},
	{
		"f": "OK-wx/dsh-ocgo-lite",
		"n": "dsh-ocgo-lite",
		"o": "OK-wx",
		"d": "OpenCode Go 用量常驻条：套餐余量圆环 + token/花费实时统计（本次会话/全部范围 + 按模型联动，官方实时定价），一键复制 API Key。OpenCode Go usage bar for DeepSeek Harness.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"opencode-go-usage"
		],
		"u": "2026-08-16T07:17:59Z",
		"h": "https://github.com/OK-wx/dsh-ocgo-lite",
		"p": "https://github.com/OK-wx/dsh-ocgo-lite"
	},
	{
		"f": "PerryLink/dsh-lsp-actions",
		"n": "dsh-lsp-actions",
		"o": "PerryLink",
		"d": "LSP action surface for DeepSeek Harness: diagnostics, formatting, completion, code actions, symbols, signature help, inlay hints, and rename tools over language servers",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"code-action",
			"completion",
			"deepseek-harness",
			"diagnostics",
			"dsh",
			"dsh-plugin",
			"language-server",
			"lsp",
			"rename"
		],
		"u": "2026-08-16T09:46:44Z",
		"h": "https://github.com/PerryLink/dsh-lsp-actions",
		"p": "https://www.npmjs.com/package/dsh-lsp-actions"
	},
	{
		"f": "Dbi-Eshuh/dsh-thinking-status-customizer",
		"n": "dsh-thinking-status-customizer",
		"o": "Dbi-Eshuh",
		"d": "Customize DSH Web thinking status with custom flowing text, animated GIF/APNG/WebP, or combined image-and-text modes.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"animated-gif",
			"cordis",
			"css",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gif",
			"i18n",
			"localization",
			"thinking-status",
			"web-ui"
		],
		"u": "2026-08-15T12:05:24Z",
		"h": "https://github.com/Dbi-Eshuh/dsh-thinking-status-customizer",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-minigames",
		"n": "dsh-minigames",
		"o": "omdsh-dev",
		"d": "DSH Web UI 右侧小游戏面板：18 款离线小游戏（恐龙跳一跳 / 俄罗斯方块 / 坦克大战 / 扫雷 / 2048 / 数独 / 吃豆人 / 跟枪练习等），可扩展游戏注册表，等待模型回复或修 bug 时的摸鱼神器",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T13:55:10Z",
		"h": "https://github.com/omdsh-dev/dsh-minigames",
		"p": ""
	},
	{
		"f": "HR2AY/DSH-Plan-Graph",
		"n": "DSH-Plan-Graph",
		"o": "HR2AY",
		"d": "another version of deepseek herness trajectory (DIY)",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"thread",
			"trajectory",
			"visualization"
		],
		"u": "2026-08-16T07:58:55Z",
		"h": "https://github.com/HR2AY/DSH-Plan-Graph",
		"p": ""
	},
	{
		"f": "tsonglew/dsh-media-preview",
		"n": "dsh-media-preview",
		"o": "tsonglew",
		"d": "Audio/video preview viewer for dsh-better-sidebar: native playback with Range-seeking streaming route",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"better-sidebar",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:49:36Z",
		"h": "https://github.com/tsonglew/dsh-media-preview",
		"p": ""
	},
	{
		"f": "AngelosZou/graphlint",
		"n": "graphlint",
		"o": "AngelosZou",
		"d": "",
		"s": 4,
		"k": 2,
		"l": "Python",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T09:41:22Z",
		"h": "https://github.com/AngelosZou/graphlint",
		"p": ""
	},
	{
		"f": "Electricitysheep/dsh-tool-turbo",
		"n": "dsh-tool-turbo",
		"o": "Electricitysheep",
		"d": "Per-round reasoning_effort optimizer for DeepSeek Harness (dsh): auto-downgrades tool-call reasoning for simple tool chains, lifting back for heavy work. Cuts thinking time between tool calls.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent",
			"deepseek",
			"dsh",
			"dsh-plugin",
			"harness",
			"optimization",
			"performance",
			"plugin",
			"reasoning",
			"speed"
		],
		"u": "2026-08-14T03:55:05Z",
		"h": "https://github.com/Electricitysheep/dsh-tool-turbo",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-fun-ticker",
		"n": "dsh-fun-ticker",
		"o": "omdsh-dev",
		"d": "DSH 行情跑马灯插件：可自选标的的加密/汇率/A股/指数/港美股跑马灯，免 key 数据源，宿主代理+缓存",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T13:47:55Z",
		"h": "https://github.com/omdsh-dev/dsh-fun-ticker",
		"p": ""
	},
	{
		"f": "cdxiaodong/dsh-guardian",
		"n": "dsh-guardian",
		"o": "cdxiaodong",
		"d": "",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"agent",
			"dsh",
			"dsh-plugin",
			"llm-security",
			"security"
		],
		"u": "2026-08-15T19:23:37Z",
		"h": "https://github.com/cdxiaodong/dsh-guardian",
		"p": ""
	},
	{
		"f": "akqwpeter-prog/dsh-media-skills",
		"n": "dsh-media-skills",
		"o": "akqwpeter-prog",
		"d": "Free vision & image generation for DeepSeek Harness — paste an image into any chat, even text-only sessions. GLM-4V-Flash / Qwen3-VL / Gemini failover chain, ModLens-style structured evidence, Kolors generation. 免费读图·生图 · 三引擎容错 · 无 Key 入库",
		"s": 4,
		"k": 0,
		"l": "Python",
		"t": [
			"agent-skills",
			"deepseek-harness",
			"dsh-plugin",
			"image-generation",
			"skill",
			"vision"
		],
		"u": "2026-08-16T03:19:35Z",
		"h": "https://github.com/akqwpeter-prog/dsh-media-skills",
		"p": "https://github.com/akqwpeter-prog/dsh-media-skills"
	},
	{
		"f": "dragonbaba/dsh-routing-suite",
		"n": "dsh-routing-suite",
		"o": "dragonbaba",
		"d": "Lightweight, localized task routing for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"task-routing"
		],
		"u": "2026-08-16T08:15:27Z",
		"h": "https://github.com/dragonbaba/dsh-routing-suite",
		"p": "https://www.npmjs.com/package/dsh-routing-suite"
	},
	{
		"f": "PerryLink/dsh-composer-history",
		"n": "dsh-composer-history",
		"o": "PerryLink",
		"d": "Terminal-style input history for the DeepSeek Harness web composer: edge-first arrows with exact draft/caret restore, browser-local persisted history, Ctrl+R reverse search, workspace recall - and sliding-context awareness (compaction summaries in recall/search, compaction notice with one-click /compact fill).",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"compaction",
			"composer",
			"context-window",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"input-history",
			"keyboard-shortcuts",
			"sliding-context",
			"terminal",
			"typescript",
			"ui",
			"web-gui"
		],
		"u": "2026-08-16T09:47:19Z",
		"h": "https://github.com/PerryLink/dsh-composer-history",
		"p": "https://www.npmjs.com/package/dsh-composer-history"
	},
	{
		"f": "MimicHunterZ/dsh-agent-compact",
		"n": "dsh-agent-compact",
		"o": "MimicHunterZ",
		"d": "DSH plugin for agent-driven span compaction: compress chosen conversation spans into self-written checkpoints instead of the official head-anchored full-context sweep.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"context-compression",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-16T08:47:20Z",
		"h": "https://github.com/MimicHunterZ/dsh-agent-compact",
		"p": ""
	},
	{
		"f": "MaimoryLab/dib",
		"n": "dib",
		"o": "MaimoryLab",
		"d": "DSH-in-Box: A DSH runtime and plugin packager",
		"s": 4,
		"k": 0,
		"l": "Go",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-14T10:30:26Z",
		"h": "https://github.com/MaimoryLab/dib",
		"p": ""
	},
	{
		"f": "Khellendros97/dsh-subscription-auth",
		"n": "dsh-subscription-auth",
		"o": "Khellendros97",
		"d": "dsh对接openai、grok、anthropic、kimi订阅渠道",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T05:03:17Z",
		"h": "https://github.com/Khellendros97/dsh-subscription-auth",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-markdown",
		"n": "dsh-tool-markdown",
		"o": "omdsh-dev",
		"d": "DSH Markdown 工具插件：HTML↔Markdown 转换、GFM 表格规范化、目录生成，零依赖轻量解析器，注册 markdown 工具",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"html-conversion",
			"markdown"
		],
		"u": "2026-08-15T14:41:50Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-markdown",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-diff",
		"n": "dsh-tool-diff",
		"o": "omdsh-dev",
		"d": "DSH Diff 工具插件：文本/JSON/CSV/Markdown 结构化比较与 unified diff，零依赖只读，注册 diff 工具",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"data-comparison",
			"diff",
			"dsh",
			"dsh-plugin",
			"unified-diff"
		],
		"u": "2026-08-15T08:39:51Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-diff",
		"p": ""
	},
	{
		"f": "SaiSenBox/dsh-boot-guard",
		"n": "dsh-boot-guard",
		"o": "SaiSenBox",
		"d": "A loader-independent rescue console for DeepSeek Harness when a broken plugin prevents the Web UI from starting.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"plugin-recovery",
			"safe-mode"
		],
		"u": "2026-08-15T07:07:51Z",
		"h": "https://github.com/SaiSenBox/dsh-boot-guard",
		"p": ""
	},
	{
		"f": "happyren/dsh-agent-messaging",
		"n": "dsh-agent-messaging",
		"o": "happyren",
		"d": "Cross-session verification, claims and a decision ledger for DeepSeek Harness — so two agent sessions don't repeat, contradict or deadlock each other.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-communication",
			"agent-coordination",
			"agent-verification",
			"ai-agents",
			"cordis",
			"cross-session-messaging",
			"decision-ledger",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multi-agent",
			"plugin",
			"typescript"
		],
		"u": "2026-08-15T13:05:07Z",
		"h": "https://github.com/happyren/dsh-agent-messaging",
		"p": "https://github.com/topics/dsh-plugin"
	},
	{
		"f": "AnkoCD/dsh-server-deployment",
		"n": "dsh-server-deployment",
		"o": "AnkoCD",
		"d": "服务器端部署：DeepSeek Harness Web 多用户网关（登录门户 / 每用户实例隔离 / 交付文件抽屉）。部署于远程服务器，用户通过浏览器访问，非本机工具。",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T12:35:20Z",
		"h": "https://github.com/AnkoCD/dsh-server-deployment",
		"p": ""
	},
	{
		"f": "yyxcnasd/amadeus-for-dsh",
		"n": "amadeus-for-dsh",
		"o": "yyxcnasd",
		"d": "Amadeus (AI assistant from Steins;Gate 0) for DeepSeek Harness",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai",
			"ai-agents",
			"dsh",
			"dsh-plugin",
			"makise-kurisu",
			"steins-gate"
		],
		"u": "2026-08-16T09:25:16Z",
		"h": "https://github.com/yyxcnasd/amadeus-for-dsh",
		"p": ""
	},
	{
		"f": "wink-run/dsh-plugin-store",
		"n": "dsh-plugin-store",
		"o": "wink-run",
		"d": "deepseek harness  plugin store",
		"s": 4,
		"k": 1,
		"l": "Python",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T10:17:09Z",
		"h": "https://github.com/wink-run/dsh-plugin-store",
		"p": ""
	},
	{
		"f": "pandashere/dsh-self-control-guard",
		"n": "dsh-self-control-guard",
		"o": "pandashere",
		"d": "Self-control guard plugin for DeepSeek Harness host exit and restart workflows.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T03:30:34Z",
		"h": "https://github.com/pandashere/dsh-self-control-guard",
		"p": ""
	},
	{
		"f": "MorGogh/widget-dock",
		"n": "widget-dock",
		"o": "MorGogh",
		"d": "DSH plugin: draggable widget panel (balance, tokens, stats, commands, goal, cost) for DeepSeek Harness",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T12:18:37Z",
		"h": "https://github.com/MorGogh/widget-dock",
		"p": ""
	},
	{
		"f": "Seryta/dsh-node-nav",
		"n": "dsh-node-nav",
		"o": "Seryta",
		"d": "对话节点导航：DSH Web GUI 右侧节点串，hover 预览、点击跳转、active 药丸跟随阅读位置",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"conversation-navigation",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T12:36:50Z",
		"h": "https://github.com/Seryta/dsh-node-nav",
		"p": ""
	},
	{
		"f": "PwnKY/dsh-session-link",
		"n": "dsh-session-link",
		"o": "PwnKY",
		"d": "DeepSeek Harness 的 Codex 式会话深度链接插件：dsh:// 深链，跨对话读取上下文",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"codex",
			"deep-link",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"session"
		],
		"u": "2026-08-16T08:12:17Z",
		"h": "https://github.com/PwnKY/dsh-session-link",
		"p": "https://www.npmjs.com/package/dsh-session-link"
	},
	{
		"f": "wz-heng/dsh-feishu-bridge",
		"n": "dsh-feishu-bridge",
		"o": "wz-heng",
		"d": "Feishu (Lark) channel bridge for DeepSeek Harness (dsh) — message a Feishu bot, it runs a dsh agent turn, the reply comes back. Community plugin.",
		"s": 4,
		"k": 0,
		"l": "Python",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"feishu",
			"lark"
		],
		"u": "2026-08-16T07:02:31Z",
		"h": "https://github.com/wz-heng/dsh-feishu-bridge",
		"p": ""
	},
	{
		"f": "zdjmrq/dsh-user-plugins-manager",
		"n": "dsh-user-plugins-manager",
		"o": "zdjmrq",
		"d": "DSH 用户插件管理器:在 设置→插件 统一管理插件目录散件、运行树插件与 npm 插件包——挂载/卸载/启用/停用(cordis.patch.yml 补丁层 + HMR 热生效)",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:08:28Z",
		"h": "https://github.com/zdjmrq/dsh-user-plugins-manager",
		"p": ""
	},
	{
		"f": "leavestring/awesome-dsh-background-plugin",
		"n": "awesome-dsh-background-plugin",
		"o": "leavestring",
		"d": "DSH Web 背景个性化插件：上传自己的图片（JPG / PNG / WEBP / GIF，浏览器端自动压缩到 1600px 以内）或一键切换极光、余烬、宣纸三种预设氛围；实时预览所见即所得，支持细调图像存在感、暗色遮罩、柔焦、适配方式与焦点位置；上传即自动保存到 DSH 设置，重启后原样恢复，浅色 / 深色主题均正常；侧栏、消息气泡、输入框保持原样不遮挡，浮层菜单不受影响；全程本地处理不上传任何服务器，关闭开关或一键恢复默认即可完全移除；内置中英文双语界面。",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"plugin",
			"webui"
		],
		"u": "2026-08-16T07:08:50Z",
		"h": "https://github.com/leavestring/awesome-dsh-background-plugin",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-time",
		"n": "dsh-tool-time",
		"o": "omdsh-dev",
		"d": "DSH 时间工具插件：严格 ISO 8601 解析、IANA 时区转换、UTC 日历运算、固定时长差，零依赖",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"iso8601",
			"time",
			"timezone"
		],
		"u": "2026-08-14T13:05:03Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-time",
		"p": ""
	},
	{
		"f": "seamas0825-lab/dsh-youmind-plugin",
		"n": "dsh-youmind-plugin",
		"o": "seamas0825-lab",
		"d": "YouMind OpenAPI tools and skill bundle for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"deepseek-harness",
			"dsh-plugin",
			"openapi",
			"youmind"
		],
		"u": "2026-08-15T04:22:16Z",
		"h": "https://github.com/seamas0825-lab/dsh-youmind-plugin",
		"p": "https://youmind.com/"
	},
	{
		"f": "oitsukiii/deepseek-harness-lan",
		"n": "deepseek-harness-lan",
		"o": "oitsukiii",
		"d": "Run DeepSeek Harness Web UI on your home LAN — 4 minimal patches + one-click apply/revert scripts | 让 DeepSeek Harness 的 Web UI 在局域网跑起来",
		"s": 4,
		"k": 0,
		"l": "Shell",
		"t": [
			"agent",
			"bash",
			"deepseek-harness",
			"dsh-plugin",
			"home-network"
		],
		"u": "2026-08-15T08:25:33Z",
		"h": "https://github.com/oitsukiii/deepseek-harness-lan",
		"p": ""
	},
	{
		"f": "yu2025-luo/dsh-file-panel",
		"n": "dsh-file-panel",
		"o": "yu2025-luo",
		"d": "Right-side file panel for DeepSeek Harness — auto-popup when the agent creates or downloads files, with image/text preview, reveal-in-folder and open actions. Bilingual · MIT",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"file-preview",
			"plugin"
		],
		"u": "2026-08-15T19:37:53Z",
		"h": "https://github.com/yu2025-luo/dsh-file-panel",
		"p": ""
	},
	{
		"f": "Vncntvx/dsh-zotero",
		"n": "dsh-zotero",
		"o": "Vncntvx",
		"d": "Let agents search, read, and cite your local Zotero library: find papers, browse notes and annotations, pull evidence by question, open the source document, generate citations.",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"cordis",
			"dsh",
			"dsh-plugin",
			"zotero"
		],
		"u": "2026-08-16T03:36:33Z",
		"h": "https://github.com/Vncntvx/dsh-zotero",
		"p": ""
	},
	{
		"f": "mytianyi0712/dsh-tui-plugin-OhMyPi",
		"n": "dsh-tui-plugin-OhMyPi",
		"o": "mytianyi0712",
		"d": "一个dsh的终端样式插件，灵感来自Oh My Pi",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T06:09:58Z",
		"h": "https://github.com/mytianyi0712/dsh-tui-plugin-OhMyPi",
		"p": ""
	},
	{
		"f": "lxj808624/dsh-tool-git",
		"n": "dsh-tool-git",
		"o": "lxj808624",
		"d": "Structured safe Git tools for DeepSeek Harness (dsh): git_status/diff/log/branch/stage/commit/stash/show + destructive-command guard",
		"s": 4,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"git",
			"tool"
		],
		"u": "2026-08-16T06:18:21Z",
		"h": "https://github.com/lxj808624/dsh-tool-git",
		"p": ""
	},
	{
		"f": "madage/dsh-self-improved",
		"n": "dsh-self-improved",
		"o": "madage",
		"d": "DeepSeek Harness long-term memory & self-evolving plugin: L0 capture -> L1 memory extraction -> L2 scene grouping -> L3 user persona, auto recall injection + skill synthesis, fully local.",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-memory",
			"ai-agent",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"fts5",
			"long-term-memory",
			"memory",
			"privacy",
			"self-improvement",
			"skill-synthesis",
			"sqlite"
		],
		"u": "2026-08-16T09:53:28Z",
		"h": "https://github.com/madage/dsh-self-improved",
		"p": "https://github.com/madage/dsh-self-improved"
	},
	{
		"f": "Blank-not-black/dsh-Remote",
		"n": "dsh-Remote",
		"o": "Blank-not-black",
		"d": "DSH Remote · 口袋里的 DSH 控制台 会话 · 审批 · 提问 · 文件传输，局域网 / Tailscale 直连 多服务器自动选优，聊天记录离线可看 带 Token 鉴权，数据只在你的设备之间流动 Sessions · approvals · questions · file transfer over LAN / Tailscale. Automatic fastest-server selection. Chat history available offline. Token-authenticated — your data flows only between your devices.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mobile",
			"remote-control"
		],
		"u": "2026-08-16T10:28:58Z",
		"h": "https://github.com/Blank-not-black/dsh-Remote",
		"p": ""
	},
	{
		"f": "MJ-Chang/dsh-vscode",
		"n": "dsh-vscode",
		"o": "MJ-Chang",
		"d": "DeepSeek Harness for VS Code: right-side chat agent that reads, edits, and runs your project — like Claude Code / Codex / Copilot.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"dsh",
			"dsh-plugin",
			"vscode"
		],
		"u": "2026-08-15T07:36:22Z",
		"h": "https://github.com/MJ-Chang/dsh-vscode",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-hub",
		"n": "dsh-hub",
		"o": "omdsh-dev",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"nodejs",
			"plugin-manager",
			"plugin-marketplace",
			"registry"
		],
		"u": "2026-08-14T11:39:28Z",
		"h": "https://github.com/omdsh-dev/dsh-hub",
		"p": ""
	},
	{
		"f": "030611/qiushi-dsh-evidence-audit",
		"n": "qiushi-dsh-evidence-audit",
		"o": "030611",
		"d": "Observe-only hash-chained evidence receipts for DeepSeek Harness",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-infrastructure",
			"ai-agents",
			"audit",
			"deepseek-harness",
			"dsh-plugin",
			"evidence"
		],
		"u": "2026-08-14T15:16:01Z",
		"h": "https://github.com/030611/qiushi-dsh-evidence-audit",
		"p": ""
	},
	{
		"f": "cendaifeng/dsh-learn-everything",
		"n": "dsh-learn-everything",
		"o": "cendaifeng",
		"d": "",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T10:34:55Z",
		"h": "https://github.com/cendaifeng/dsh-learn-everything",
		"p": ""
	},
	{
		"f": "huguangyu666/dsh-plugin-notify",
		"n": "dsh-plugin-notify",
		"o": "huguangyu666",
		"d": "DeepSeek Harness 插件：通知出口——agent 通过桌面通知 / 中文语音播报 / 提示音主动联系用户（长任务完成、出错、呼叫用户回来）。Windows 本机零依赖。",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"notification",
			"tts",
			"voice"
		],
		"u": "2026-08-15T14:30:50Z",
		"h": "https://github.com/huguangyu666/dsh-plugin-notify",
		"p": ""
	},
	{
		"f": "Zephyr-vibe/dsh-personalize",
		"n": "dsh-personalize",
		"o": "Zephyr-vibe",
		"d": "Per-host personalization for DSH: custom instructions, local long-term memory, and reply-tone presets.",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-plugin",
			"personalization",
			"plugin"
		],
		"u": "2026-08-15T00:59:24Z",
		"h": "https://github.com/Zephyr-vibe/dsh-personalize",
		"p": ""
	},
	{
		"f": "jkrandom-sudo/dsh-plugin-audit",
		"n": "dsh-plugin-audit",
		"o": "jkrandom-sudo",
		"d": "Security audit for DeepSeek Harness plugins: static permission profile with file/line evidence + a runtime sentinel gating credential access and unknown-host egress · DSH 插件安全审计：静态权限画像（附文件/行号证据）+ 运行时哨兵，触及凭证或向未知主机外发数据时先请你批准",
		"s": 4,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"audit",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"security"
		],
		"u": "2026-08-15T04:54:00Z",
		"h": "https://github.com/jkrandom-sudo/dsh-plugin-audit",
		"p": ""
	},
	{
		"f": "silencieuxzero/Better_Deepseek_Harness",
		"n": "Better_Deepseek_Harness",
		"o": "silencieuxzero",
		"d": "Better Deepseek Harness, with some functional extensions to webui and Deepseek Harness·更好的deepseek harness，对webui和deepseek harness进行了一些功能扩展",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"ai-tools",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:48:22Z",
		"h": "https://github.com/silencieuxzero/Better_Deepseek_Harness",
		"p": ""
	},
	{
		"f": "nanshan1995/DSH-Plugin-Market",
		"n": "DSH-Plugin-Market",
		"o": "nanshan1995",
		"d": "DeepSeek Harness 插件市场：精选目录 + GitHub 实时浏览、中英翻译搜索、安装前静态安全审计闸门。Plugin market for DeepSeek Harness with a pre-install security audit gate.",
		"s": 4,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"marketplace",
			"plugin-market",
			"security-audit"
		],
		"u": "2026-08-16T09:20:21Z",
		"h": "https://github.com/nanshan1995/DSH-Plugin-Market",
		"p": ""
	},
	{
		"f": "aceice01/dsh-whale-pet",
		"n": "dsh-whale-pet",
		"o": "aceice01",
		"d": "DeepSeek 鲸鱼娘桌宠：DSH Desktop 桌宠 + Web 版悬浮桌宠，晓伊神经网络语音、撒娇互动、任务完成提醒",
		"s": 4,
		"k": 0,
		"l": "HTML",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugin-desktop",
			"dsh-plugins"
		],
		"u": "2026-08-16T04:44:44Z",
		"h": "https://github.com/aceice01/dsh-whale-pet",
		"p": ""
	},
	{
		"f": "2031814001yuyue-tech/dsh-side-chat",
		"n": "dsh-side-chat",
		"o": "2031814001yuyue-tech",
		"d": "dsh-plugin",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:27:33Z",
		"h": "https://github.com/2031814001yuyue-tech/dsh-side-chat",
		"p": ""
	},
	{
		"f": "sandbaseai/sandbase-skills",
		"n": "sandbase-skills",
		"o": "sandbaseai",
		"d": "88 installable open-source Agent Skills for research, social intelligence, marketing, and business workflows—compatible with Codex, Claude Code, Cursor, Gemini CLI, and DeepSeek Harness.",
		"s": 4,
		"k": 1,
		"l": "Python",
		"t": [
			"agent-skills",
			"ai-agents",
			"business-intelligence",
			"claude-code",
			"claude-code-marketplace",
			"claude-code-plugin",
			"codex-skills",
			"cursor-ai",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"gemini-cli",
			"market-research",
			"marketing-automation",
			"mcp",
			"model-context-protocol",
			"research-tools",
			"skill-md",
			"social-listening"
		],
		"u": "2026-08-16T05:24:14Z",
		"h": "https://github.com/sandbaseai/sandbase-skills",
		"p": "https://skills.sh/sandbaseai/sandbase-skills/multi-source-search"
	},
	{
		"f": "rinDBeans/dsh-apex-standard",
		"n": "dsh-apex-standard",
		"o": "rinDBeans",
		"d": "DeepSeek V4 Pro/Flash unified anchored agent preset for DeepSeek Harness (official API & opencode-go): two-stage RL-aligned bootstrap, model-aware path routing, epoch-aware long-session stability",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-preset",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm",
			"opencode-go",
			"prompt-engineering"
		],
		"u": "2026-08-16T09:25:39Z",
		"h": "https://github.com/rinDBeans/dsh-apex-standard",
		"p": ""
	},
	{
		"f": "Scorp1o117/dsh-tdai-memory",
		"n": "dsh-tdai-memory",
		"o": "Scorp1o117",
		"d": "Agent memory for DeepSeek Harness | DeepSeek Harness 记忆插件",
		"s": 4,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-16T10:28:21Z",
		"h": "https://github.com/Scorp1o117/dsh-tdai-memory",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-regex",
		"n": "dsh-tool-regex",
		"o": "omdsh-dev",
		"d": "DSH 正则工具插件：测试匹配/提取捕获组/安全替换/静态解释正则（不执行代码），零依赖，注册 regex 工具",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"redos-protection",
			"regex"
		],
		"u": "2026-08-14T16:17:43Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-regex",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-tool-schema",
		"n": "dsh-tool-schema",
		"o": "omdsh-dev",
		"d": "DSH JSON Schema 验证工具插件：validate/paths/explain/normalize，零网络零动态执行",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"json-schema",
			"validation"
		],
		"u": "2026-08-14T16:17:43Z",
		"h": "https://github.com/omdsh-dev/dsh-tool-schema",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-voice-funasr",
		"n": "dsh-voice-funasr",
		"o": "omdsh-dev",
		"d": "",
		"s": 3,
		"k": 1,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T11:39:26Z",
		"h": "https://github.com/omdsh-dev/dsh-voice-funasr",
		"p": ""
	},
	{
		"f": "Zachary7456/dsh-voice-mic",
		"n": "dsh-voice-mic",
		"o": "Zachary7456",
		"d": "DeepSeek Harness (dsh) 语音输入插件：麦克风按钮/快捷键录音，实时转写回填输入框。三种识别引擎：浏览器 Web Speech、本地 SenseVoice/Paraformer 离线后端（一键部署）、OpenAI 兼容云端 ASR API。",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"asr",
			"deepseek-harness",
			"dsh-plugin",
			"funasr",
			"microphone",
			"sherpa-onnx",
			"speech-to-text",
			"voice-input"
		],
		"u": "2026-08-15T09:43:22Z",
		"h": "https://github.com/Zachary7456/dsh-voice-mic",
		"p": ""
	},
	{
		"f": "zhang66633/dsh-pixel-ui",
		"n": "dsh-pixel-ui",
		"o": "zhang66633",
		"d": "DeepSeek Harness 像素皮肤（Agent Xi 风格）：四个主题一键切换——像素·木屋 / 像素·羊皮纸 / 像素·暖阳 / 像素·终端绿，随时可切回现代默认 UI。",
		"s": 3,
		"k": 1,
		"l": "CSS",
		"t": [
			"crt",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"pixel-art",
			"pixel-font",
			"pixel-skin",
			"retro",
			"skin",
			"stardew-valley",
			"theme"
		],
		"u": "2026-08-15T09:22:05Z",
		"h": "https://github.com/zhang66633/dsh-pixel-ui",
		"p": ""
	},
	{
		"f": "Luke-Yong/dsh-plugin-knowledge-graph",
		"n": "dsh-plugin-knowledge-graph",
		"o": "Luke-Yong",
		"d": "dsh-plugin-knowledge-graph for Deepseek Harness",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T03:59:38Z",
		"h": "https://github.com/Luke-Yong/dsh-plugin-knowledge-graph",
		"p": ""
	},
	{
		"f": "0xKcyzz/dsh-plugin-store",
		"n": "dsh-plugin-store",
		"o": "0xKcyzz",
		"d": "DeepSeek Harness 插件商店：浏览、搜索、筛选并一键安装 dsh-plugin 生态插件",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"marketplace",
			"plugin-manager",
			"plugin-store"
		],
		"u": "2026-08-15T15:21:17Z",
		"h": "https://github.com/0xKcyzz/dsh-plugin-store",
		"p": ""
	},
	{
		"f": "ximengxiaolan/dsh-vision-bridge",
		"n": "dsh-vision-bridge",
		"o": "ximengxiaolan",
		"d": "Composer-attached images are auto-described by an OpenAI-compatible vision model and handed to text-only models (DeepSeek) as text. ???????????",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T02:12:32Z",
		"h": "https://github.com/ximengxiaolan/dsh-vision-bridge",
		"p": ""
	},
	{
		"f": "Toukaiteio/dsh-effort-tweak",
		"n": "dsh-effort-tweak",
		"o": "Toukaiteio",
		"d": "A DeepSeek Harness plugin that allows you to change the reasoning effort of custom models in WebUI.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T00:59:20Z",
		"h": "https://github.com/Toukaiteio/dsh-effort-tweak",
		"p": ""
	},
	{
		"f": "x2802490130-prog/dsh-balance-float",
		"n": "dsh-balance-float",
		"o": "x2802490130-prog",
		"d": "DSH 悬浮余额/一键退出插件",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T00:59:59Z",
		"h": "https://github.com/x2802490130-prog/dsh-balance-float",
		"p": ""
	},
	{
		"f": "le-soleil-se-couche/dsh-skin-claude-code",
		"n": "dsh-skin-claude-code",
		"o": "le-soleil-se-couche",
		"d": "完美复刻 Claude Code 皮肤，纪念我的 Vibe Coding 白月光。",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"skin",
			"terminal",
			"theme",
			"warm"
		],
		"u": "2026-08-15T00:59:42Z",
		"h": "https://github.com/le-soleil-se-couche/dsh-skin-claude-code",
		"p": ""
	},
	{
		"f": "lco117/dsh-think-any-lang",
		"n": "dsh-think-any-lang",
		"o": "lco117",
		"d": "DeepSeek Harness (DSH) plugin: a \"Thinking Language\" selector under Settings → General that tells the model which language to reason in (chain of thought) via a system-prompt section. Zero extra calls, zero latency, 12 languages.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cot",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"dsh-plugins",
			"llm",
			"plugin",
			"reasoning"
		],
		"u": "2026-08-15T00:59:42Z",
		"h": "https://github.com/lco117/dsh-think-any-lang",
		"p": ""
	},
	{
		"f": "tzy168/dsh-web-theme-packs",
		"n": "dsh-web-theme-packs",
		"o": "tzy168",
		"d": "This is a dsh-pulgin for change theme by yourself.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T00:59:55Z",
		"h": "https://github.com/tzy168/dsh-web-theme-packs",
		"p": ""
	},
	{
		"f": "LvienOeria/dsh-launcher",
		"n": "dsh-launcher",
		"o": "LvienOeria",
		"d": "一个轻量的 dsh（DeepSeek Harness）插件：安装一个终端命令，输入 dsh-go 即可启动 harness 并自动打开浏览器。零依赖，约 9 KB。（桌面双击版在独立的 dsh-desktop-launcher 包）",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"bundle",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"launcher",
			"plugin",
			"terminal"
		],
		"u": "2026-08-15T00:59:10Z",
		"h": "https://github.com/LvienOeria/dsh-launcher",
		"p": ""
	},
	{
		"f": "zouyuanqing/dsh-vision-primitives",
		"n": "dsh-vision-primitives",
		"o": "zouyuanqing",
		"d": "Native interactive visual-reasoning plugin for DeepSeek Harness: precise pixel grounding (SOM grid / zoom / annotate / measure / diff / color / OCR) + MiMo V2.5 multimodal backend, zero external MCP servers.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agents",
			"computer-vision",
			"cordis",
			"deepseek-harness",
			"dsh-plugin",
			"ocr",
			"vision"
		],
		"u": "2026-08-15T16:15:28Z",
		"h": "https://github.com/zouyuanqing/dsh-vision-primitives",
		"p": ""
	},
	{
		"f": "Hoshino-Yumetsuki/dsh-onebot",
		"n": "dsh-onebot",
		"o": "Hoshino-Yumetsuki",
		"d": "OneBot Adapter For DSH",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T16:16:39Z",
		"h": "https://github.com/Hoshino-Yumetsuki/dsh-onebot",
		"p": ""
	},
	{
		"f": "IAMLieutenant/dsh-tool-user-memory",
		"n": "dsh-tool-user-memory",
		"o": "IAMLieutenant",
		"d": "DeepSeek Harness 用户记忆插件",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T16:43:17Z",
		"h": "https://github.com/IAMLieutenant/dsh-tool-user-memory",
		"p": ""
	},
	{
		"f": "sundusk/dsh-waterball-pet",
		"n": "dsh-waterball-pet",
		"o": "sundusk",
		"d": "A floating water-ball pet plugin for the DeepSeek Harness Web UI.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"pet",
			"react",
			"typescript",
			"waterball",
			"web-ui"
		],
		"u": "2026-08-16T02:41:04Z",
		"h": "https://github.com/sundusk/dsh-waterball-pet",
		"p": ""
	},
	{
		"f": "maxiaovivi/dsh-cloak-browser",
		"n": "dsh-cloak-browser",
		"o": "maxiaovivi",
		"d": "Native CloakBrowser tools for DeepSeek Harness: isolated browser sessions, snapshots, interaction, screenshots, and safe Agent routing.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"browser-automation",
			"cloakbrowser",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"playwright"
		],
		"u": "2026-08-16T08:31:30Z",
		"h": "https://github.com/maxiaovivi/dsh-cloak-browser",
		"p": "https://github.com/maxiaovivi/dsh-cloak-browser#readme"
	},
	{
		"f": "PerryLink/dsh-plugin-guide",
		"n": "dsh-plugin-guide",
		"o": "PerryLink",
		"d": "Installable DSH bundle: the dsh-plugin-guide plugin-development knowledge base as an on-demand agent skill. Official docs archive (EN/ZH), Cordis primer, 114-repo community archive, 1654 archived Discussions, 20+ battle-tested pitfalls.",
		"s": 3,
		"k": 0,
		"l": "PowerShell",
		"t": [
			"agent-skill",
			"cordis",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"knowledge-base",
			"plugin-development"
		],
		"u": "2026-08-16T09:46:43Z",
		"h": "https://github.com/PerryLink/dsh-plugin-guide",
		"p": "https://www.npmjs.com/package/dsh-plugin-guide"
	},
	{
		"f": "reimu-create/dsh-vision",
		"n": "dsh-vision",
		"o": "reimu-create",
		"d": "DSH plugin: text-only models (e.g. DeepSeek-V4) automatically see images via a vision model. Official surface-replace, cache-friendly, human transcript untouched. 纯文本模型自动识图桥",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"multimodal",
			"vision"
		],
		"u": "2026-08-16T09:21:10Z",
		"h": "https://github.com/reimu-create/dsh-vision",
		"p": ""
	},
	{
		"f": "YYTbit/dsh-plugin-opencode-bridge",
		"n": "dsh-plugin-opencode-bridge",
		"o": "YYTbit",
		"d": "Bridge opencode skills and config into DeepSeek Harness",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"opencode"
		],
		"u": "2026-08-14T10:14:33Z",
		"h": "https://github.com/YYTbit/dsh-plugin-opencode-bridge",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-fun-weather",
		"n": "dsh-fun-weather",
		"o": "omdsh-dev",
		"d": "DSH weather tab and weather-following themes powered by Open-Meteo",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T11:39:27Z",
		"h": "https://github.com/omdsh-dev/dsh-fun-weather",
		"p": ""
	},
	{
		"f": "JoukoPuro/dsh-prompt-polish",
		"n": "dsh-prompt-polish",
		"o": "JoukoPuro",
		"d": "一个 DeepSeek Harness（DSH）插件： 在 Web 输入框的工具行中添加一个 ✨ 图标按钮。点击后选择打磨风格，已接入的大模型 会把你草稿中的提示词改写得更专业、更易被 AI 理解 。A DeepSeek Harness plugin: icon-only composer button that rewrites your prompt via the connected LLM (balanced/concise/detailed/code styles, i18n)",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm",
			"prompt"
		],
		"u": "2026-08-15T05:59:49Z",
		"h": "https://github.com/JoukoPuro/dsh-prompt-polish",
		"p": ""
	},
	{
		"f": "lglglglgy/dsh-whale-pet",
		"n": "dsh-whale-pet",
		"o": "lglglglgy",
		"d": "dsh-whale-pet",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-15T00:59:43Z",
		"h": "https://github.com/lglglglgy/dsh-whale-pet",
		"p": ""
	},
	{
		"f": "AKS1st/dsh-sysmon",
		"n": "dsh-sysmon",
		"o": "AKS1st",
		"d": "DSH Web 系统状态悬浮窗：实时 CPU/内存/磁盘占用率 | System-status overlay showing live CPU, memory and disk usage for DSH Web",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin",
			"system-monitoring"
		],
		"u": "2026-08-15T15:35:26Z",
		"h": "https://github.com/AKS1st/dsh-sysmon",
		"p": ""
	},
	{
		"f": "yoke233/dsh-openai-codex-auth",
		"n": "dsh-openai-codex-auth",
		"o": "yoke233",
		"d": "OpenAI Codex OAuth login and usage card plugin for DeepSeek Harness",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"openai-codex"
		],
		"u": "2026-08-15T09:02:38Z",
		"h": "https://github.com/yoke233/dsh-openai-codex-auth",
		"p": ""
	},
	{
		"f": "riffkit/skill",
		"n": "skill",
		"o": "riffkit",
		"d": "Official Riffkit skill — riff a winning TikTok into your own short video from your AI agent (Claude Code, Cursor) or the browser. Riff the formula, not the video.",
		"s": 3,
		"k": 0,
		"l": "",
		"t": [
			"ad-creative",
			"agent-skill",
			"agent-skills",
			"ai-agents",
			"ai-video",
			"claude-code",
			"claude-skill",
			"claude-skills",
			"cursor",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-skill",
			"riffkit",
			"short-video",
			"tiktok",
			"ugc",
			"video-generation"
		],
		"u": "2026-08-16T07:02:21Z",
		"h": "https://github.com/riffkit/skill",
		"p": "https://riffkit.ai"
	},
	{
		"f": "brunhildzhou/dsh-all-warmup",
		"n": "dsh-all-warmup",
		"o": "brunhildzhou",
		"d": "Global frictionless warm-up layer plugin for DeepSeek Harness | DeepSeek Harness 全局无感热身层插件：任何会话首轮自动热身，第二轮起恢复完整模式",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-16T07:18:57Z",
		"h": "https://github.com/brunhildzhou/dsh-all-warmup",
		"p": ""
	},
	{
		"f": "laosji/clamicro",
		"n": "clamicro",
		"o": "laosji",
		"d": "在手机上审批 Claude Code 、DeepSeek Harness 的操作。局域网直连，零依赖。",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agents",
			"claude-code",
			"deepseek-harness",
			"dsh-plugin",
			"mobile",
			"self-hosted"
		],
		"u": "2026-08-16T07:39:11Z",
		"h": "https://github.com/laosji/clamicro",
		"p": ""
	},
	{
		"f": "ThreeBody6666/dsh-im-hub",
		"n": "dsh-im-hub",
		"o": "ThreeBody6666",
		"d": "Multi-platform IM gateway for DeepSeek Harness: Feishu (Lark), WeCom (WeChat Work), and Telegram. One agent per chat, whitelist access, no public endpoint needed (Feishu long connection / Telegram long polling).",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent",
			"ai-agents",
			"chatbot",
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"feishu",
			"lark",
			"telegram",
			"wechat-work",
			"wecom"
		],
		"u": "2026-08-16T02:54:58Z",
		"h": "https://github.com/ThreeBody6666/dsh-im-hub",
		"p": ""
	},
	{
		"f": "SnowCrescenter-tech/dsh-desktop",
		"n": "dsh-desktop",
		"o": "SnowCrescenter-tech",
		"d": "DeepSeek Harness 桌面版 — 原生 Windows 桌面壳（无边框窗口 / 系统托盘 / 原生通知 / 单实例 / 开机自启）| Native Windows desktop shell for DeepSeek Harness (frameless window, tray, native notifications, single-instance, auto-launch)",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"desktop",
			"dsh",
			"dsh-plugin",
			"electron",
			"windows"
		],
		"u": "2026-08-14T05:06:00Z",
		"h": "https://github.com/SnowCrescenter-tech/dsh-desktop",
		"p": ""
	},
	{
		"f": "RYun601/dsh-launcher",
		"n": "dsh-launcher",
		"o": "RYun601",
		"d": "Windows 下 DeepSeek Harness Web 的启动与管理工具：deepseek 命令一键前台/后台启动、自动打开浏览器、状态查询、停止服务与更新检查，支持一行命令安装",
		"s": 3,
		"k": 0,
		"l": "PowerShell",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"launcher",
			"windows"
		],
		"u": "2026-08-14T07:31:58Z",
		"h": "https://github.com/RYun601/dsh-launcher",
		"p": "https://github.com/deepseek-ai/deepseek-harness "
	},
	{
		"f": "Terry12138qy/dsh-vision",
		"n": "dsh-vision",
		"o": "Terry12138qy",
		"d": "DeepSeek Harness 识图插件：为不具备原生识图能力的模型提供识图能力（阿里云百炼 qwen3.5-omni-plus，失败自动切换智谱 glm-4.6v-flash）。由 claude-vision-skill 移植适配。 | Vision tool for DeepSeek Harness",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"image-description",
			"vision"
		],
		"u": "2026-08-15T00:59:19Z",
		"h": "https://github.com/Terry12138qy/dsh-vision",
		"p": ""
	},
	{
		"f": "SeverusZh/dsh-yolo-mode",
		"n": "dsh-yolo-mode",
		"o": "SeverusZh",
		"d": "dsh-yolo-mode - an LLM-powered auto-approval plugin for DeepSeek Harness sandbox escalations (built-in presets + custom permission levels, fail-closed)",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"approval",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"llm",
			"sandbox"
		],
		"u": "2026-08-15T00:59:17Z",
		"h": "https://github.com/SeverusZh/dsh-yolo-mode",
		"p": ""
	},
	{
		"f": "kezboardpj/dsh-skill-loader",
		"n": "dsh-skill-loader",
		"o": "kezboardpj",
		"d": "Per-conversation skill catalog picker for DeepSeek Harness (dsh) — choose which skills are loaded into each conversation. Unselected skills are unavailable in that conversation.",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugin-verify",
			"dsh-plugins",
			"skill",
			"skills"
		],
		"u": "2026-08-15T03:36:44Z",
		"h": "https://github.com/kezboardpj/dsh-skill-loader",
		"p": ""
	},
	{
		"f": "zhaoscsc/dsh-wikilink",
		"n": "dsh-wikilink",
		"o": "zhaoscsc",
		"d": "Obsidian-style [[wikilink]] mentions for the DeepSeek Harness web GUI: fuzzy-search note titles and attach their contents to the prompt",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T17:35:53Z",
		"h": "https://github.com/zhaoscsc/dsh-wikilink",
		"p": ""
	},
	{
		"f": "hucj09/dsh-file-mention",
		"n": "dsh-file-mention",
		"o": "hucj09",
		"d": "DSH (DeepSeek Harness) Web GUI 插件：输入 @ 引用工作区文件，体验类似 Claude Code 的 @file。",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-15T16:56:31Z",
		"h": "https://github.com/hucj09/dsh-file-mention",
		"p": ""
	},
	{
		"f": "fan969690/dsh-desktop-tools",
		"n": "dsh-desktop-tools",
		"o": "fan969690",
		"d": "DeepSeek Harness 工具集导航:Web 插件集(dsh-web-plugins)/ Windows 桌面端(dsh-desktop-app)/ AI 知识库模板(ai-knowledge-base)",
		"s": 3,
		"k": 1,
		"l": "",
		"t": [
			"agent",
			"agent-presets",
			"deepseek-harness",
			"desktop",
			"dsh",
			"dsh-plugin",
			"open-source",
			"plugin",
			"plugin-store",
			"tray"
		],
		"u": "2026-08-15T15:07:54Z",
		"h": "https://github.com/fan969690/dsh-desktop-tools",
		"p": ""
	},
	{
		"f": "acefun29/dsh-file-mount",
		"n": "dsh-file-mount",
		"o": "acefun29",
		"d": "",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"context",
			"cordis",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T15:54:07Z",
		"h": "https://github.com/acefun29/dsh-file-mount",
		"p": ""
	},
	{
		"f": "LQ-1123/paste-to-workspace",
		"n": "paste-to-workspace",
		"o": "LQ-1123",
		"d": "DSH 插件：把粘贴/拖入聊天框的图片与任意文件保存为会话工作区文件。官方 bundle 插件，安装：dsh plugin --profile web add github:LQ-1123/paste-to-workspace",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"file-upload",
			"productivity"
		],
		"u": "2026-08-16T01:24:00Z",
		"h": "https://github.com/LQ-1123/paste-to-workspace",
		"p": ""
	},
	{
		"f": "HaoyueQin/deepseek-harness-desktop",
		"n": "deepseek-harness-desktop",
		"o": "HaoyueQin",
		"d": "A desktop shell for DeepSeek Harness — the pluggable AI agent harness from DeepSeek. Wrap the official dsh web UI into a native-feeling, always-on desktop app. / 为 DeepSeek Harness（DeepSeek 开源的可插拔 AI Agent harness）打造的桌面应用壳，把官方 dsh web 界面包装成原生质感、常驻后台的桌面应用。",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-ai",
			"deepseek-harness",
			"deepseek-v4",
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T21:50:23Z",
		"h": "https://github.com/HaoyueQin/deepseek-harness-desktop",
		"p": ""
	},
	{
		"f": "liguobao/deepseek-harness-remote",
		"n": "deepseek-harness-remote",
		"o": "liguobao",
		"d": "基于 DeepSeek Harness 插件机制的多端远程访问方案，让桌面端与 Android 端安全连接并操作远程 Harness。（A multi-device remote access solution built on the DeepSeek Harness plugin system, enabling desktop and Android clients to securely connect to and operate a remote Harness.）",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T08:49:33Z",
		"h": "https://github.com/liguobao/deepseek-harness-remote",
		"p": ""
	},
	{
		"f": "yyh-001/dsh-companion",
		"n": "dsh-companion",
		"o": "yyh-001",
		"d": "DeepSeek 陪伴模式插件 —— 人设、记忆、聊得下去：SOUL 人格 + Hermes 长期记忆，可选 QQ 通道",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"companion",
			"companion-mode",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"memory",
			"persona",
			"qq-bot",
			"selfloom"
		],
		"u": "2026-08-13T16:41:55Z",
		"h": "https://github.com/yyh-001/dsh-companion",
		"p": "https://github.com/yyh-001/dsh-expression"
	},
	{
		"f": "030611/dsh-telemetry-redactor",
		"n": "dsh-telemetry-redactor",
		"o": "030611",
		"d": "Fail-closed export-copy redaction for DeepSeek Harness session telemetry",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"privacy",
			"redaction",
			"security",
			"telemetry"
		],
		"u": "2026-08-15T00:57:53Z",
		"h": "https://github.com/030611/dsh-telemetry-redactor",
		"p": ""
	},
	{
		"f": "WindLX/paper_plane_x",
		"n": "paper_plane_x",
		"o": "WindLX",
		"d": "Paper Plane X 是一个面向科研阅读、论文处理和综述写作的本地优先工作台。它把 PDF 解析、结构化论文抽取、事实核查、项目文件、文献检索和外部 Agent 工具串成一条可复用的研究流水线。",
		"s": 3,
		"k": 1,
		"l": "Python",
		"t": [
			"agent",
			"ai",
			"claude-code",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"paper",
			"python",
			"research",
			"uv"
		],
		"u": "2026-08-14T05:50:23Z",
		"h": "https://github.com/WindLX/paper_plane_x",
		"p": ""
	},
	{
		"f": "YLifeOnlyOnce/dsh-smarthome",
		"n": "dsh-smarthome",
		"o": "YLifeOnlyOnce",
		"d": "Home Assistant control for DeepSeek Harness agents — approval-gated lights, switches, climate.                                     给 DeepSeek Harness agent 的 Home Assistant 控制插件，一键接入智能家居，一键接入智能生活。",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"home-assistant"
		],
		"u": "2026-08-15T00:59:22Z",
		"h": "https://github.com/YLifeOnlyOnce/dsh-smarthome",
		"p": ""
	},
	{
		"f": "Uddoo/dsh-dashboard",
		"n": "dsh-dashboard",
		"o": "Uddoo",
		"d": "Symphony-inspired multi-provider task orchestrator and native operations dashboard for DeepSeek Harness. Supports Linear, GitHub, Jira, Asana, GitLab, and local tasks. 受 Symphony 启发的 DeepSeek Harness 多任务源编排与原生运维仪表盘，支持 Linear、GitHub、Jira、Asana、GitLab 及本地任务。",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"dashboard",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"linear",
			"symphony"
		],
		"u": "2026-08-15T06:36:23Z",
		"h": "https://github.com/Uddoo/dsh-dashboard",
		"p": ""
	},
	{
		"f": "dongsheng123132/dsh-benchmark",
		"n": "dsh-benchmark",
		"o": "dongsheng123132",
		"d": "Deterministic revision-pinned benchmarks and regression evidence for DeepSeek Harness",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"benchmark",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"regression-testing",
			"reproducibility"
		],
		"u": "2026-08-15T06:15:32Z",
		"h": "https://github.com/dongsheng123132/dsh-benchmark",
		"p": ""
	},
	{
		"f": "baaai123/solo-memory",
		"n": "solo-memory",
		"o": "baaai123",
		"d": "",
		"s": 3,
		"k": 0,
		"l": "Python",
		"t": [
			"ai-agent",
			"dsh-plugin",
			"mcp",
			"memory",
			"opencode"
		],
		"u": "2026-08-15T12:13:03Z",
		"h": "https://github.com/baaai123/solo-memory",
		"p": ""
	},
	{
		"f": "ArvinQi/dsh-mcp",
		"n": "dsh-mcp",
		"o": "ArvinQi",
		"d": "DeepSeek Harness 的 MCP 服务器管理插件：可视化界面管理 + 按需 tool search 热注入，省 token。",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T07:36:05Z",
		"h": "https://github.com/ArvinQi/dsh-mcp",
		"p": ""
	},
	{
		"f": "WTStarMark/QAQ",
		"n": "QAQ",
		"o": "WTStarMark",
		"d": "QAQ: a launch resilience guard for DeepSeek Harness (DSH). Supervises dsh web, reads the real DOM via headless Chrome + CDP to catch host crashes and UI red-screens, and auto-rolls-back to the last known-good config. DSH 启动容灾守卫，检测宿主崩溃与 UI 红屏，自动回滚到最近一次成功配置。非侵入、一键懒人脚本、结构化日志。",
		"s": 3,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"dsh-plugin-verify",
			"dsh-plugins"
		],
		"u": "2026-08-15T15:59:13Z",
		"h": "https://github.com/WTStarMark/QAQ",
		"p": ""
	},
	{
		"f": "Meredith2328/dsh-sidebar-mode",
		"n": "dsh-sidebar-mode",
		"o": "Meredith2328",
		"d": "把默认的四种模式切换塞进「新会话」按钮里，新会话创建更方便（标准/PTC/创造/极简，与设置双向同步）",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-presets",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T16:37:27Z",
		"h": "https://github.com/Meredith2328/dsh-sidebar-mode",
		"p": ""
	},
	{
		"f": "RangeKing/vibemeter",
		"n": "vibemeter",
		"o": "RangeKing",
		"d": "See what your agents are doing. Understand how you work together.",
		"s": 3,
		"k": 1,
		"l": "Rust",
		"t": [
			"ai",
			"claude-code",
			"codex",
			"dsh-plugin"
		],
		"u": "2026-08-16T03:11:00Z",
		"h": "https://github.com/RangeKing/vibemeter",
		"p": ""
	},
	{
		"f": "litestartup-com/litestartup-skills",
		"n": "litestartup-skills",
		"o": "litestartup-com",
		"d": "Publish blog, docs, website, changelog, send campaign email directly from your AI agent. Write content, run one prompt, go live in seconds.",
		"s": 3,
		"k": 1,
		"l": "Shell",
		"t": [
			"claude-code-skill",
			"codex-skill",
			"deepseek-harness",
			"deepseek-harness-plugin",
			"deepseek-harness-plugins",
			"dsh-plugin",
			"dsh-plugins",
			"litestartup-skill",
			"publish-content",
			"send-campaign-email",
			"skills"
		],
		"u": "2026-08-16T04:36:45Z",
		"h": "https://github.com/litestartup-com/litestartup-skills",
		"p": "https://www.litestartup.com/products/litestartup-skills"
	},
	{
		"f": "PerryLink/dsh-background-agents",
		"n": "dsh-background-agents",
		"o": "PerryLink",
		"d": "Interactive long-session background agents for DeepSeek Harness: start a durable continuable child agent, watch its progress in the Web UI sidebar, message it any time, and interrupt it - all through the official subagent seam.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"background-agent",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"subagent"
		],
		"u": "2026-08-16T09:47:06Z",
		"h": "https://github.com/PerryLink/dsh-background-agents",
		"p": ""
	},
	{
		"f": "CyberryRe/lx_music-for-dsh",
		"n": "lx_music-for-dsh",
		"o": "CyberryRe",
		"d": "This is a plugin that allows deepseek harness own the ability of lx music.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins",
			"music-player"
		],
		"u": "2026-08-16T09:43:55Z",
		"h": "https://github.com/CyberryRe/lx_music-for-dsh",
		"p": ""
	},
	{
		"f": "banlanzs/dsh-web-enhanced",
		"n": "dsh-web-enhanced",
		"o": "banlanzs",
		"d": "[building……] DeepSeek Harness's web enhancement plugin—brings task dashboards, Git graphs, workspace file panels, balance displays, and graph recognition into the DSH web interface.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-16T08:23:35Z",
		"h": "https://github.com/banlanzs/dsh-web-enhanced",
		"p": ""
	},
	{
		"f": "songoao25/dsh-bottom-info-bar",
		"n": "dsh-bottom-info-bar",
		"o": "songoao25",
		"d": "Bottom Info Bar — an information bar plugin for DeepSeek Harness: provider/model, live balance, peak/off-peak pricing with countdown, and real persisted per-session spend in a single line.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"awesome-dsh-plugin",
			"balance",
			"deepseek-harness",
			"deepseekharness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"plugin",
			"usage-tracking",
			"web"
		],
		"u": "2026-08-16T10:22:43Z",
		"h": "https://github.com/songoao25/dsh-bottom-info-bar",
		"p": ""
	},
	{
		"f": "lee259/dsh-workbench",
		"n": "dsh-workbench",
		"o": "lee259",
		"d": "Right-side file workspace for DeepSeek Harness Web.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"diff",
			"dsh",
			"dsh-plugin",
			"file-preview",
			"file-tree",
			"workbench"
		],
		"u": "2026-08-16T10:25:15Z",
		"h": "https://github.com/lee259/dsh-workbench",
		"p": "https://www.npmjs.com/package/dsh-workbench"
	},
	{
		"f": "omdsh-dev/dsh-paddle-ocr",
		"n": "dsh-paddle-ocr",
		"o": "omdsh-dev",
		"d": "",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T11:39:25Z",
		"h": "https://github.com/omdsh-dev/dsh-paddle-ocr",
		"p": ""
	},
	{
		"f": "omdsh-dev/dsh-fun-typewriter",
		"n": "dsh-fun-typewriter",
		"o": "omdsh-dev",
		"d": "DSH Typewriter: WebAudio typing ambience with a plugin-owned settings API and zero audio assets",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-14T11:39:27Z",
		"h": "https://github.com/omdsh-dev/dsh-fun-typewriter",
		"p": ""
	},
	{
		"f": "HuanLinOTO/dsh-plugin-spur",
		"n": "dsh-plugin-spur",
		"o": "HuanLinOTO",
		"d": "聊天流中悬挂皮鞭，甩动鞭梢（>2.0 px/ms）即向 agent 发送 go work 消息 | A whip hanging in the chat stream; flick the tip (>2.0 px/ms) to send the agent a \"go work!\" message",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T05:06:50Z",
		"h": "https://github.com/HuanLinOTO/dsh-plugin-spur",
		"p": ""
	},
	{
		"f": "V1ki/dsh-plugin-subscriptions",
		"n": "dsh-plugin-subscriptions",
		"o": "V1ki",
		"d": "Use ChatGPT (Codex), Claude, and Grok (X Premium) subscriptions as DeepSeek Harness LLM providers — OAuth login in the web UI, no API keys",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"chatgpt",
			"claude",
			"codex",
			"deepseek-harness",
			"dsh-plugin",
			"grok",
			"llm",
			"oauth",
			"typescript"
		],
		"u": "2026-08-15T02:22:01Z",
		"h": "https://github.com/V1ki/dsh-plugin-subscriptions",
		"p": ""
	},
	{
		"f": "forrestahha/dsh-voice-input",
		"n": "dsh-voice-input",
		"o": "forrestahha",
		"d": "Voice-to-text input plugin for the DeepSeek Harness Web UI",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"voice-input"
		],
		"u": "2026-08-15T00:59:35Z",
		"h": "https://github.com/forrestahha/dsh-voice-input",
		"p": ""
	},
	{
		"f": "TtTRz/dsh-wecom",
		"n": "dsh-wecom",
		"o": "TtTRz",
		"d": "WeCom AI Bot channel for DeepSeek Harness — every chat runs a persistent, preset-backed agent with real tools.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"wecom",
			"wecom-bot"
		],
		"u": "2026-08-15T00:59:20Z",
		"h": "https://github.com/TtTRz/dsh-wecom",
		"p": ""
	},
	{
		"f": "leechen298/Code2Skill",
		"n": "Code2Skill",
		"o": "leechen298",
		"d": "Generate Function, MCP, Agent Skill, and offline test packages from existing code; installable as a DeepSeek Harness bundle.",
		"s": 3,
		"k": 1,
		"l": "Python",
		"t": [
			"agent-skills",
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T14:40:56Z",
		"h": "https://github.com/leechen298/Code2Skill",
		"p": ""
	},
	{
		"f": "lwmxiaobei/dsh-plugins",
		"n": "dsh-plugins",
		"o": "lwmxiaobei",
		"d": "DeepSeek Harness 社区插件目录，自动汇总并基础校验 GitHub 插件，支持搜索、筛选、双语详情与最新版本安装命令复制。Community directory for DeepSeek Harness plugins with automated discovery, basic validation, search, filters, bilingual details, and latest version install commands.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugins"
		],
		"u": "2026-08-16T02:35:32Z",
		"h": "https://github.com/lwmxiaobei/dsh-plugins",
		"p": "https://dsh-plugins.org"
	},
	{
		"f": "deCOLE118/dsh-sitemap",
		"n": "dsh-sitemap",
		"o": "deCOLE118",
		"d": "站点地图（Yakit 风格）：DeepSeek Harness 侧边栏树形接口地图，搜索 / 接口详情 / 一键复制 curl，数据实时同步",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"sitemap"
		],
		"u": "2026-08-16T04:28:24Z",
		"h": "https://github.com/deCOLE118/dsh-sitemap",
		"p": ""
	},
	{
		"f": "STARDUSTLC666/dsh-dingtalk",
		"n": "dsh-dingtalk",
		"o": "STARDUSTLC666",
		"d": "DeepSeek Harness 钉钉群机器人通知插件：dingtalk_notify/dingtalk_text 两工具，自定义机器人 webhook + HMAC 加签安全模式，手写签名实现、零运行时依赖；纯 Node 全平台。· DingTalk group-robot notifications for DeepSeek Harness agents.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dingtalk",
			"dsh-plugin"
		],
		"u": "2026-08-16T10:11:34Z",
		"h": "https://github.com/STARDUSTLC666/dsh-dingtalk",
		"p": ""
	},
	{
		"f": "vinyumao/dsh-opencode-usage",
		"n": "dsh-opencode-usage",
		"o": "vinyumao",
		"d": "DSH plugin: OpenCode Go 套餐用量显示（滚动/每周/每月用量百分比与重置倒计时 + Agent 工具 opencode_go_usage）。官方 bundle 插件，安装: dsh plugin --profile web add github:vinyumao/dsh-opencode-usage#<ref>",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-bundle",
			"dsh-plugin",
			"quota",
			"tool",
			"ui",
			"usage"
		],
		"u": "2026-08-15T02:56:18Z",
		"h": "https://github.com/vinyumao/dsh-opencode-usage",
		"p": ""
	},
	{
		"f": "securstack/securstack-dsh-plugin",
		"n": "securstack-dsh-plugin",
		"o": "securstack",
		"d": "SecurStack adapter for DeepSeek Harness: run repository security scans, policy gates, doctor diagnostics, and JSON CLI results from safe AI-agent tools.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"container-security",
			"dast",
			"deepseek-harness",
			"dsh-plugin",
			"sast",
			"secrets",
			"security",
			"securstack"
		],
		"u": "2026-08-15T00:59:52Z",
		"h": "https://github.com/securstack/securstack-dsh-plugin",
		"p": "https://securstack.io"
	},
	{
		"f": "golitter/dsh-deepseek-billing",
		"n": "dsh-deepseek-billing",
		"o": "golitter",
		"d": "在 DSH 中查看 DeepSeek API 账户余额及计费信息",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T12:24:03Z",
		"h": "https://github.com/golitter/dsh-deepseek-billing",
		"p": ""
	},
	{
		"f": "ch1bug/dsh-mimo-agent-tools",
		"n": "dsh-mimo-agent-tools",
		"o": "ch1bug",
		"d": "Xiaomi MiMo search + multimodal tools for DeepSeek Harness agents: mimo_search/vision/audio/video/asr/tts",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T07:56:37Z",
		"h": "https://github.com/ch1bug/dsh-mimo-agent-tools",
		"p": ""
	},
	{
		"f": "Letter2025/dsh-tool-search",
		"n": "dsh-tool-search",
		"o": "Letter2025",
		"d": "Tool search & slimming for DeepSeek Harness: Hermes-style progressive disclosure — search, describe, and call long-tail tools on demand",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh-plugin",
			"hermes",
			"tool-search"
		],
		"u": "2026-08-14T13:05:02Z",
		"h": "https://github.com/Letter2025/dsh-tool-search",
		"p": ""
	},
	{
		"f": "Jinsong-Zhou/safe-find-dsh-plugins",
		"n": "safe-find-dsh-plugins",
		"o": "Jinsong-Zhou",
		"d": "Discover and install the best DeepSeek Harness plugins for a user's task",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-skills",
			"deepseek-harness",
			"dsh-plugin",
			"plugin-discovery"
		],
		"u": "2026-08-15T16:04:36Z",
		"h": "https://github.com/Jinsong-Zhou/safe-find-dsh-plugins",
		"p": "https://github.com/topics/dsh-plugin"
	},
	{
		"f": "Wechsels/dsh-zotero-wiki",
		"n": "dsh-zotero-wiki",
		"o": "Wechsels",
		"d": "DeepSeekHarness × Zotero 插件：自动同步文献库，MinerU 解析 PDF，DeepSeek 全文阅读生成结构化笔记，编译成可检索的 Obsidian LLM Wiki。",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agent",
			"cordis",
			"dsh",
			"dsh-plugin",
			"dsh-plugin-market"
		],
		"u": "2026-08-15T01:46:47Z",
		"h": "https://github.com/Wechsels/dsh-zotero-wiki",
		"p": ""
	},
	{
		"f": "luoyu-xingu/dsh-background",
		"n": "dsh-background",
		"o": "luoyu-xingu",
		"d": "DeepSeek Harness Web 背景图片插件:本地图片路径替换网页背景,外观设置行 + 实时预览",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T00:59:45Z",
		"h": "https://github.com/luoyu-xingu/dsh-background",
		"p": ""
	},
	{
		"f": "invalidnaaaame/dsh-scroll-timeline",
		"n": "dsh-scroll-timeline",
		"o": "invalidnaaaame",
		"d": "DSH web plugin: ChatGPT-style scroll timeline on the chat sidebar — magnetic mountain hover, click to jump to user messages. Derived from vlln/dsh-navbar (MIT). ",
		"s": 3,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"chatgpt",
			"deepseek-harness",
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins",
			"scroll-timeline"
		],
		"u": "2026-08-15T00:59:39Z",
		"h": "https://github.com/invalidnaaaame/dsh-scroll-timeline",
		"p": ""
	},
	{
		"f": "Yihong89/dsh-teacher",
		"n": "dsh-teacher",
		"o": "Yihong89",
		"d": "DSH teacher plugin: Socratic tutor that leads you to answers from a markdown question set, tracks knowledge gaps in-session, and retests them on a spaced-repetition schedule.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T09:14:18Z",
		"h": "https://github.com/Yihong89/dsh-teacher",
		"p": ""
	},
	{
		"f": "morluto/smokinggun",
		"n": "smokinggun",
		"o": "morluto",
		"d": "Help your agents find the smoking gun they're looking for. Optimization evidence for agents: find complexity hotspots.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"ai-agents",
			"benchmarks",
			"code-optimization",
			"code-quality",
			"code-scanning",
			"command-line",
			"complexity-analysis",
			"cordis",
			"developer-productivity",
			"developer-tools",
			"dsh",
			"dsh-plugin",
			"performance",
			"performance-optimization",
			"program-analysis",
			"sarif",
			"software-engineering",
			"static-analysis",
			"tree-sitter",
			"typescript"
		],
		"u": "2026-08-13T18:22:35Z",
		"h": "https://github.com/morluto/smokinggun",
		"p": ""
	},
	{
		"f": "kxSenlin/dsh-whale-font",
		"n": "dsh-whale-font",
		"o": "kxSenlin",
		"d": "把 DeepSeek Harness 对话里的主语人称「我/你/I/me」渲染成 DeepSeek 蓝鲸图标（DSH 插件）",
		"s": 3,
		"k": 0,
		"l": "Python",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"whale"
		],
		"u": "2026-08-15T05:00:31Z",
		"h": "https://github.com/kxSenlin/dsh-whale-font",
		"p": ""
	},
	{
		"f": "yangyongzhen/dsh-article-publish",
		"n": "dsh-article-publish",
		"o": "yangyongzhen",
		"d": "Publish articles from DeepSeek Harness to CSDN / Juejin / CNBlog. dsh plugin.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T01:55:43Z",
		"h": "https://github.com/yangyongzhen/dsh-article-publish",
		"p": ""
	},
	{
		"f": "SeverusZh/dsh-plugin-subagent-director",
		"n": "dsh-plugin-subagent-director",
		"o": "SeverusZh",
		"d": "Subagent Director: per-subagent LLM provider/model selection with role templates for DeepSeek Harness (dsh plugin)",
		"s": 3,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"plugin",
			"subagent"
		],
		"u": "2026-08-15T00:59:17Z",
		"h": "https://github.com/SeverusZh/dsh-plugin-subagent-director",
		"p": ""
	},
	{
		"f": "Han-1413141/dsh-sticky-disclosure",
		"n": "dsh-sticky-disclosure",
		"o": "Han-1413141",
		"d": "DSH Web client plugin: collapse every expanded section (Think / tool cards) in the conversation in one click, with a customizable hotkey.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"client-plugin",
			"deepseek",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T10:40:23Z",
		"h": "https://github.com/Han-1413141/dsh-sticky-disclosure",
		"p": ""
	},
	{
		"f": "xwh-01/dsh-mediacrawler",
		"n": "dsh-mediacrawler",
		"o": "xwh-01",
		"d": "Installable DeepSeek Harness profile bundle and bounded MCP adapter for MediaCrawler.",
		"s": 3,
		"k": 0,
		"l": "Python",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"mcp",
			"mediacrawler",
			"python",
			"web-crawler"
		],
		"u": "2026-08-15T09:36:09Z",
		"h": "https://github.com/xwh-01/dsh-mediacrawler",
		"p": ""
	},
	{
		"f": "harryopo/dsh-remote-ide",
		"n": "dsh-remote-ide",
		"o": "harryopo",
		"d": "SSH Remote IDE for DeepSeek Harness: connect via SSH and the IDE goes remote — explorer browses the server, editor reads/writes over SFTP, terminal is a live SSH PTY. Dual-face DSH plugin.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"remote-development",
			"sftp",
			"ssh",
			"web-terminal"
		],
		"u": "2026-08-15T08:56:49Z",
		"h": "https://github.com/harryopo/dsh-remote-ide",
		"p": ""
	},
	{
		"f": "xuan-ao-1/deepseek-harness-workbench",
		"n": "deepseek-harness-workbench",
		"o": "xuan-ao-1",
		"d": "DeepSeek Harness 官方架构的 Windows 桌面发行版 (Desktop distribution of the official DeepSeek Harness)",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-framework",
			"deepseek",
			"deepseek-harness",
			"desktop-app",
			"dsh",
			"dsh-plugin",
			"electron",
			"electron-app",
			"windows"
		],
		"u": "2026-08-15T13:33:32Z",
		"h": "https://github.com/xuan-ao-1/deepseek-harness-workbench",
		"p": "https://github.com/xuan-ao-1/deepseek-harness-workbench"
	},
	{
		"f": "LeslieWylie/dsh-task-relay",
		"n": "dsh-task-relay",
		"o": "LeslieWylie",
		"d": "DSH 跨会话任务接力板：task_push/list/claim/done + handoff_write/read",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"agent-tools",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"multi-agent"
		],
		"u": "2026-08-15T13:01:24Z",
		"h": "https://github.com/LeslieWylie/dsh-task-relay",
		"p": ""
	},
	{
		"f": "WSL043/dsh-codex-subscription",
		"n": "dsh-codex-subscription",
		"o": "WSL043",
		"d": "在 DeepSeek Harness 中直接使用 ChatGPT/Codex 订阅，无需 OpenAI API Key 或 Codex CLI，支持 OAuth 登录、订阅搜索与额度显示 | ChatGPT/Codex subscription plugin for DSH",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"ai-agent",
			"chatgpt",
			"chatgpt-plus",
			"codex",
			"codex-cli",
			"codex-subscription",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"llm",
			"oauth",
			"oauth2",
			"openai-codex",
			"quota",
			"quota-monitor",
			"typescript",
			"web-search"
		],
		"u": "2026-08-16T02:48:17Z",
		"h": "https://github.com/WSL043/dsh-codex-subscription",
		"p": ""
	},
	{
		"f": "Yihong89/dsh-usage-plugin",
		"n": "dsh-usage-plugin",
		"o": "Yihong89",
		"d": "DeepSeek Harness (DSH) plugins. First: dsh-usage-report — per-session token usage & estimated cost (/usage + usage_report), priced from the DeepSeek pricing table.",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh-plugin", "dsh-plugins"],
		"u": "2026-08-16T05:09:37Z",
		"h": "https://github.com/Yihong89/dsh-usage-plugin",
		"p": ""
	},
	{
		"f": "wly8691-jpg/knowlp-rag",
		"n": "knowlp-rag",
		"o": "wly8691-jpg",
		"d": "KnowLP-RAG: dual knowledge-graph RAG for Markdown notes — dsh plugin add @eqman00003/knowlp-rag · MCP + native Cordis plugin for DeepSeek Harness (dsh) & Claude Code",
		"s": 3,
		"k": 0,
		"l": "Python",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"knowledge-graph",
			"mcp",
			"obsidian",
			"rag",
			"retrieval",
			"second-brain"
		],
		"u": "2026-08-16T07:16:30Z",
		"h": "https://github.com/wly8691-jpg/knowlp-rag",
		"p": ""
	},
	{
		"f": "Sorwcyra/ds-vision-plugin",
		"n": "ds-vision-plugin",
		"o": "Sorwcyra",
		"d": "Paste images into DeepSeek Harness with a four-model vision race, OCR, and an automatic text bridge.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"dsh-plugin",
			"image-to-text",
			"multimodal",
			"ocr",
			"typescript",
			"vision",
			"vlm"
		],
		"u": "2026-08-16T08:41:28Z",
		"h": "https://github.com/Sorwcyra/ds-vision-plugin",
		"p": ""
	},
	{
		"f": "crayonlu/dsh-web-search-tavily",
		"n": "dsh-web-search-tavily",
		"o": "crayonlu",
		"d": "Tavily-backed web search provider for DeepSeek Harness (ctx.web) — no DeepSeek API key required",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"tavily",
			"web-search"
		],
		"u": "2026-08-14T17:17:05Z",
		"h": "https://github.com/crayonlu/dsh-web-search-tavily",
		"p": ""
	},
	{
		"f": "YYTbit/dsh-plugin-cost-tracker",
		"n": "dsh-plugin-cost-tracker",
		"o": "YYTbit",
		"d": "Token cost tracker for DeepSeek Harness",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-13T16:42:06Z",
		"h": "https://github.com/YYTbit/dsh-plugin-cost-tracker",
		"p": ""
	},
	{
		"f": "Leeaoyin/dr-agent-skills",
		"n": "dr-agent-skills",
		"o": "Leeaoyin",
		"d": "Structured, reusable skill modules for AI coding agents — covering engineering workflows, reliability evaluation, and production readiness.",
		"s": 3,
		"k": 0,
		"l": "",
		"t": [
			"coding",
			"dsh",
			"dsh-plugin",
			"harness-engineering",
			"skills"
		],
		"u": "2026-08-14T08:37:14Z",
		"h": "https://github.com/Leeaoyin/dr-agent-skills",
		"p": ""
	},
	{
		"f": "chu557/douyin-plugin-dsh-plugin",
		"n": "douyin-plugin-dsh-plugin",
		"o": "chu557",
		"d": "在使用dsh等待的过程中刷抖音",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh-plugin",
			"dsh-plugin-market",
			"dsh-plugins"
		],
		"u": "2026-08-15T00:59:29Z",
		"h": "https://github.com/chu557/douyin-plugin-dsh-plugin",
		"p": ""
	},
	{
		"f": "kinyokun/dsh-session-import",
		"n": "dsh-session-import",
		"o": "kinyokun",
		"d": "DSH 会话日志导入插件:解析 /export 的 zip/jsonl,结构真实性验证 + SHA-256 指纹校验,同步模型/预设/权限等状态,导入/删除实时推送免刷新",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"cordis-plugin",
			"deepseek-harness",
			"deepseek-plugin",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"session-log"
		],
		"u": "2026-08-15T00:59:42Z",
		"h": "https://github.com/kinyokun/dsh-session-import",
		"p": ""
	},
	{
		"f": "sharkymew/dsh-utility-tools",
		"n": "dsh-utility-tools",
		"o": "sharkymew",
		"d": "DSH（DeepSeek Harness）对话工具插件：拖拽任意文件进入对话 + 选中文本引用。",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-15T00:59:52Z",
		"h": "https://github.com/sharkymew/dsh-utility-tools",
		"p": ""
	},
	{
		"f": "astra3294/dsh-doctor",
		"n": "dsh-doctor",
		"o": "astra3294",
		"d": "Deterministic diagnostics and recovery for DeepSeek Harness",
		"s": 3,
		"k": 1,
		"l": "TypeScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"diagnostics",
			"dsh-plugin",
			"dsh-plugins",
			"recovery"
		],
		"u": "2026-08-16T06:57:45Z",
		"h": "https://github.com/astra3294/dsh-doctor",
		"p": ""
	},
	{
		"f": "HOFO-GYG/dsh-quote-reply",
		"n": "dsh-quote-reply",
		"o": "HOFO-GYG",
		"d": "DSH Web 插件：把选中的文字或整条回复以 Markdown 引用块填入输入框。DSH web plugin: quote selected conversation fragments into the composer as a Markdown blockquote.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"plugin"
		],
		"u": "2026-08-15T00:59:05Z",
		"h": "https://github.com/HOFO-GYG/dsh-quote-reply",
		"p": ""
	},
	{
		"f": "wuwuzhige-sudo/dsh-terminal-panel",
		"n": "dsh-terminal-panel",
		"o": "wuwuzhige-sudo",
		"d": "A manual Terminal tab for the DeepSeek Harness (dsh) web UI — run commands on the host machine, persistent cwd, sudo password prompt, command history.现在可以在web界面内直接执行命令行了",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"dsh-plugins",
			"dsh-terminal",
			"terminal"
		],
		"u": "2026-08-15T00:59:58Z",
		"h": "https://github.com/wuwuzhige-sudo/dsh-terminal-panel",
		"p": ""
	},
	{
		"f": "agentic-control-plane/dsh-acp-plugin",
		"n": "dsh-acp-plugin",
		"o": "agentic-control-plane",
		"d": "Agentic Control Plane for DeepSeek Harness — policy-check every tool call before it runs",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-security",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T00:59:24Z",
		"h": "https://github.com/agentic-control-plane/dsh-acp-plugin",
		"p": ""
	},
	{
		"f": "akira399/dsh-stall-guard",
		"n": "dsh-stall-guard",
		"o": "akira399",
		"d": "DeepSeek Harness watchdog plugin: detects truly stalled agent turns (never killing in-progress tasks — in-flight operations are exempt), nudges/terminates only on real silence, records every event to JSONL with a loopback status route",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"automation",
			"deepseek-harness",
			"dsh-plugin",
			"reliability",
			"timeout",
			"watchdog"
		],
		"u": "2026-08-15T00:59:25Z",
		"h": "https://github.com/akira399/dsh-stall-guard",
		"p": ""
	},
	{
		"f": "hellosky983/dsh-qrcode",
		"n": "dsh-qrcode",
		"o": "hellosky983",
		"d": "DSH plugin: offline QR code (SVG/PNG/ASCII) and barcode (Code128/EAN-13) generator, no network, no shell.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-15T00:59:36Z",
		"h": "https://github.com/hellosky983/dsh-qrcode",
		"p": ""
	},
	{
		"f": "hellosky983/dsh-skillradar",
		"n": "dsh-skillradar",
		"o": "hellosky983",
		"d": "DSH plugin: scans session-visible skills and ranks them by relevance to the recent conversation.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["deepseek-harness", "dsh-plugin"],
		"u": "2026-08-15T00:59:36Z",
		"h": "https://github.com/hellosky983/dsh-skillradar",
		"p": ""
	},
	{
		"f": "cyber-moshen/dsh-plugin-market",
		"n": "dsh-plugin-market",
		"o": "cyber-moshen",
		"d": "DSH插件市场，自动更新，热重载插件，多种排序方案，快速管理和安装插件",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"marketplace",
			"open-source",
			"plugin",
			"plugin-market",
			"web-ui"
		],
		"u": "2026-08-15T15:26:26Z",
		"h": "https://github.com/cyber-moshen/dsh-plugin-market",
		"p": ""
	},
	{
		"f": "xiaoxianyu-office/dsh-image-tools",
		"n": "dsh-image-tools",
		"o": "xiaoxianyu-office",
		"d": "DSH bundle plugin: chat-image bridge + read_image deny + conversational image_recognize for text-only main models | 纯文本主模型识图桥接与识图工具",
		"s": 3,
		"k": 1,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T11:15:45Z",
		"h": "https://github.com/xiaoxianyu-office/dsh-image-tools",
		"p": ""
	},
	{
		"f": "zhangzujian/dsh-same-mode-sandbox-noop",
		"n": "dsh-same-mode-sandbox-noop",
		"o": "zhangzujian",
		"d": "DSH compatibility plugin for redundant same-mode sandbox escalation requests",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"cordis",
			"deepseek-harness",
			"dsh-plugin"
		],
		"u": "2026-08-15T21:42:31Z",
		"h": "https://github.com/zhangzujian/dsh-same-mode-sandbox-noop",
		"p": ""
	},
	{
		"f": "gameswu/dsh-pref-kit",
		"n": "dsh-pref-kit",
		"o": "gameswu",
		"d": "缓解部分dsh性能问题的插件",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"dsh",
			"dsh-plugin",
			"dsh-plugins"
		],
		"u": "2026-08-16T07:55:50Z",
		"h": "https://github.com/gameswu/dsh-pref-kit",
		"p": ""
	},
	{
		"f": "CAOGGL/dsh-ding",
		"n": "dsh-ding",
		"o": "CAOGGL",
		"d": "",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-16T07:40:12Z",
		"h": "https://github.com/CAOGGL/dsh-ding",
		"p": ""
	},
	{
		"f": "zhxqc/dsh-oh-my-theme",
		"n": "dsh-oh-my-theme",
		"o": "zhxqc",
		"d": "DeepSeek Harness (dsh) web plugin with themes, global typography, @file mentions, project file tree, and Markdown preview.",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"at-mentions",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"file-explorer",
			"file-system",
			"file-tree",
			"markdown-preview",
			"theme"
		],
		"u": "2026-08-16T09:57:46Z",
		"h": "https://github.com/zhxqc/dsh-oh-my-theme",
		"p": ""
	},
	{
		"f": "devLythen/dsh-docker",
		"n": "dsh-docker",
		"o": "devLythen",
		"d": "Docker image for DeepSeek Harness, with self-hosted deployment supported",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"docker",
			"dsh",
			"dsh-plugin",
			"self-hosted",
			"server"
		],
		"u": "2026-08-15T06:21:14Z",
		"h": "https://github.com/devLythen/dsh-docker",
		"p": ""
	},
	{
		"f": "dongsheng123132/dsh-cad-review",
		"n": "dsh-cad-review",
		"o": "dongsheng123132",
		"d": "Evidence-first ASCII DXF inspection and deterministic CAD rule review for DeepSeek Harness",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"2origin",
			"ai-agent",
			"cad",
			"deepseek-harness",
			"drawing-review",
			"dsh",
			"dsh-plugin",
			"dxf"
		],
		"u": "2026-08-15T00:59:32Z",
		"h": "https://github.com/dongsheng123132/dsh-cad-review",
		"p": ""
	},
	{
		"f": "xiaoxiaosrm/dsh-mattpocock-skills",
		"n": "dsh-mattpocock-skills",
		"o": "xiaoxiaosrm",
		"d": "Unofficial DSH port of mattpocock/skills — Engineering (18) + Productivity (7) skills as a DeepSeek Harness bundle plugin. MIT, © Matt Pocock. Star the upstream repo!",
		"s": 3,
		"k": 0,
		"l": "Shell",
		"t": [
			"claude-code",
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"engineering",
			"matt-pocock",
			"productivity",
			"skills"
		],
		"u": "2026-08-15T01:00:00Z",
		"h": "https://github.com/xiaoxiaosrm/dsh-mattpocock-skills",
		"p": ""
	},
	{
		"f": "zeroa234/dsh-preset-minimal-windows",
		"n": "dsh-preset-minimal-windows",
		"o": "zeroa234",
		"d": "Minimal Windows agent preset + Git Bash tool for DeepSeek Harness: gitbash & pwsh & str_replace_editor, drop-in replacement for the official minimal preset on win32 / DeepSeek Harness 极简模式（Windows）Agent 预设 + Git Bash 工具：Git Bash + PowerShell + str_replace_editor 三工具，官方 minimal 预设的 win32 平替",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"agent-preset",
			"deepseek",
			"deepseek-harness",
			"dsh",
			"dsh-external",
			"dsh-plugin",
			"git-bash",
			"windows"
		],
		"u": "2026-08-15T01:00:03Z",
		"h": "https://github.com/zeroa234/dsh-preset-minimal-windows",
		"p": ""
	},
	{
		"f": "CZX2244/dsh-bilibili",
		"n": "dsh-bilibili",
		"o": "CZX2244",
		"d": "",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": ["dsh-plugin"],
		"u": "2026-08-15T02:35:53Z",
		"h": "https://github.com/CZX2244/dsh-bilibili",
		"p": ""
	},
	{
		"f": "030611/dsh-context-provenance",
		"n": "dsh-context-provenance",
		"o": "030611",
		"d": "Observe-only provenance ledger over public DeepSeek Harness runtime evidence",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"observability",
			"privacy",
			"provenance"
		],
		"u": "2026-08-15T00:57:53Z",
		"h": "https://github.com/030611/dsh-context-provenance",
		"p": ""
	},
	{
		"f": "MAXeaglet/dsh-plugin-manager",
		"n": "dsh-plugin-manager",
		"o": "MAXeaglet",
		"d": "DSH 插件管理器：桌面 GUI + CLI，管理 dsh 的 profile、插件与一键启动 dsh web (Tauri 2 + Node CLI)",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"dsh-plugin",
			"tauri"
		],
		"u": "2026-08-15T10:14:56Z",
		"h": "https://github.com/MAXeaglet/dsh-plugin-manager",
		"p": ""
	},
	{
		"f": "pig1et7/DeepSeek-Harness-Desktop",
		"n": "DeepSeek-Harness-Desktop",
		"o": "pig1et7",
		"d": "",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek",
			"deepseek-harness",
			"desktop-app",
			"dsh-plugin",
			"electron",
			"plugin",
			"windows"
		],
		"u": "2026-08-15T12:04:23Z",
		"h": "https://github.com/pig1et7/DeepSeek-Harness-Desktop",
		"p": ""
	},
	{
		"f": "beijingwahw/dsh-conv-search",
		"n": "dsh-conv-search",
		"o": "beijingwahw",
		"d": "dsh-conv-search（对话内文本搜索）— in-conversation text search plugin for DeepSeek Harness (Ctrl+F, match case, whole word, streaming-aware)",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin",
			"in-conversation-search"
		],
		"u": "2026-08-15T12:25:49Z",
		"h": "https://github.com/beijingwahw/dsh-conv-search",
		"p": ""
	},
	{
		"f": "mervyn-teo/dsh-plugin-qr-connect",
		"n": "dsh-plugin-qr-connect",
		"o": "mervyn-teo",
		"d": "DeepSeek Harness dynamic plugin: QR-code sidebar button for connecting mobile devices to the web UI",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh-plugin",
			"qr-code"
		],
		"u": "2026-08-15T12:18:54Z",
		"h": "https://github.com/mervyn-teo/dsh-plugin-qr-connect",
		"p": ""
	},
	{
		"f": "PixLunaLab/dsh-pixluna",
		"n": "dsh-pixluna",
		"o": "PixLunaLab",
		"d": "dsh-plugin-pixluna | 让 DSH 自己看涩图！",
		"s": 3,
		"k": 0,
		"l": "TypeScript",
		"t": ["dsh", "dsh-plugin"],
		"u": "2026-08-15T16:48:08Z",
		"h": "https://github.com/PixLunaLab/dsh-pixluna",
		"p": ""
	},
	{
		"f": "crTnT/dsh-plugin-suite",
		"n": "dsh-plugin-suite",
		"o": "crTnT",
		"d": "DeepSeek Harness 社区插件套件：插件中心与自动更新器",
		"s": 3,
		"k": 0,
		"l": "JavaScript",
		"t": [
			"deepseek-harness",
			"dsh",
			"dsh-plugin"
		],
		"u": "2026-08-15T16:55:45Z",
		"h": "https://github.com/crTnT/dsh-plugin-suite",
		"p": ""
	}
];
//#endregion
//#region src/index.ts
/**
* Zat-DSH Engine — host half.
*
* A Typert Remote service (`pluginMarket` namespace) that powers the browser
* marketplace: GitHub `dsh-plugin` discovery with a China mirror fallback,
* bilingual intros (999 pre-translated entries bundled, plus an LLM fallback
* for new plugins), and one-click install/update/uninstall through the dsh
* profile's pnpm forwarder.
*
* The Gateway discovers the `@Remote`-marked methods at runtime (SRC mode):
* parameter names are the wire field names, so the client half's descriptors
* must keep the same names and order.
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Host platform facts (this package is a plain Node ESM module). */
const IS_WIN = process.platform === "win32";
/**
* The dsh loader's `cordis.patch.yml` dialect: `!!js` scalars round-trip as
* `{ __jsExpr }` nodes. We mirror the harness's own `entryListSchema`
* (JSON_SCHEMA + one `!!js` type) so reading/writing the profile patch layer
* can never drift from what the include mounts or corrupt a user's `!!js`
* entries.
*/
function isJsExpr(value) {
	return value instanceof Object && "__jsExpr" in value;
}
const JS_EXPR_TYPE = new yaml.Type("tag:yaml.org,2002:js", {
	kind: "scalar",
	resolve: (data) => typeof data === "string",
	construct: (data) => ({ __jsExpr: data }),
	predicate: isJsExpr,
	represent: (data) => data.__jsExpr
});
const PATCH_SCHEMA = yaml.JSON_SCHEMA.extend(JS_EXPR_TYPE);
/** Repositories that ARE the DeepSeek Harness itself (never installable). */
const HARNESS_REPOS = ["deepseek-ai/deepseek-harness"];
/**
* Marketplace / plugin-manager plugins. Two of these running at once
* register conflicting pages and services and crash the Web UI — a
* beginner trap that has already bricked real profiles. The install gate
* refuses to install a second one.
*/
const KNOWN_MARKET_REPOS = {
	"mishibeikejie/zat-dsh-engine": "zat-dsh-engine",
	"lx2000wasd/dsh-web-plugin-manager": "dsh-web-plugin-manager",
	"sanqi-normal/dsh-webui-market-plugin": "@sanqi-normal/dsh-webui-market-plugin"
};
/** Heuristic: does a package/repo name look like a market/manager plugin? */
function isMarketishName(name) {
	return /(?:plugin|dsh|harness)[-_ .]*(?:market|manager)|(?:market|manager)[-_ .]*(?:plugin|dsh|harness)/i.test(String(name));
}
/**
* Behavior-based market detection: plugin-management machinery in the host
* half (pnpm / dsh plugin / GitHub plugin search) plus a market-style UI in
* the client half. Names are irrelevant — only what the code does.
*/
function isMarketPluginText(hostText, clientText) {
	const machinery = /pnpm\s+(?:add|remove|install)|dsh\s+plugin|search\/repositories|topic:dsh-plugin|api\.github\.com/.test(hostText || "");
	const marketUi = /plugin\s*market|marketplace|插件市场|插件商店/i.test(clientText || "") && /slots\.register|settings\./.test(clientText || "");
	return machinery && marketUi;
}
/** Names a plugin REGISTERS: host services/provides, client slot registrations. */
function extractRegisteredNames(text, side) {
	const names = /* @__PURE__ */ new Set();
	const src = String(text || "");
	if (side === "host") {
		const re = /(?:provide|service)\s*\(\s*['"]([^'"]{3,})['"]/g;
		let m;
		while ((m = re.exec(src)) !== null) names.add(m[1]);
	} else {
		const reStr = /register\s*\(\s*['"]([^'"]{3,})['"]/g;
		let m;
		while ((m = reStr.exec(src)) !== null) names.add(m[1]);
		const reId = /register\s*\(\s*\{[\s\S]{0,200}?\bid\s*:\s*['"]([^'"]{2,})['"]/g;
		while ((m = reId.exec(src)) !== null) names.add(m[1]);
	}
	return names;
}
/** 包有没有会触发 pnpm 构建拦截的脚本(prepare/preinstall/install/postinstall)。 */
function hasBuildScript(scripts) {
	if (!scripts) return false;
	return [
		"prepare",
		"preinstall",
		"install",
		"postinstall"
	].some((k) => Boolean(scripts[k]));
}
/** 从 pnpm 的 PREPARE_NOT_ALLOWED 报错里抠出被拦的包名。 */
function extractBuildName(errText) {
	const m1 = /prepare\s+script of\s+(?:dependency\s+)?["']?([^"'\s,]+)/i.exec(errText);
	if (m1?.[1]) return m1[1].trim();
	const m2 = /Ignored build scripts:\s*([^\n.]+)/i.exec(errText);
	if (m2?.[1]) {
		const first = m2[1].split(",")[0].trim();
		if (first) return first;
	}
	return null;
}
/**
* 发布在 npm 上的 @deepseek-ai 辅助库(不是宿主挂载的核心服务包)。
* 直接依赖它们可以正常安装;host 核心包(cordis、dsh 系、typert 系)必须走 peer。
*/
const ALLOWED_OFFICIAL_DEPS = /* @__PURE__ */ new Set(["@deepseek-ai/schemastery", "@deepseek-ai/cosmokit"]);
/** 判断一个 @deepseek-ai/* 包是不是宿主核心(必须 peer 引用,不能直接依赖)。 */
function isHostCorePackage(name) {
	if (!name.startsWith("@deepseek-ai/")) return false;
	if (ALLOWED_OFFICIAL_DEPS.has(name)) return false;
	const bare = name.slice(13);
	return /^cordis$/i.test(bare) || /^dsh-/.test(bare) || /^typert/.test(bare) || /^invariants$/i.test(bare);
}
/** 从宿主/界面代码里提取"这个插件装完怎么用"的可读提示。 */
function describeUsage(hostText, clientText) {
	const out = [];
	const tools = /* @__PURE__ */ new Set();
	const toolRe = /defineTool\s*\(\s*\{[\s\S]{0,300}?name\s*:\s*['"]([^'"]{2,48})['"]/g;
	let m;
	while ((m = toolRe.exec(String(hostText || ""))) !== null) tools.add(m[1]);
	if (tools.size > 0) out.push(`模型工具:${[...tools].slice(0, 6).join("、")} — 对话里直接说需求,模型会自动调用`);
	const userFacing = [...extractRegisteredNames(String(clientText || ""), "client")].filter((r) => /command|settings|slot|conversation|sidebar|toolbar|menu|panel|\.tab/.test(r));
	if (userFacing.length > 0) out.push(`界面/命令:${userFacing.slice(0, 6).join("、")} — 重启后到对应菜单或设置里找`);
	if (out.length === 0) out.push("没检测到工具/界面注册,用法见简介(README)。");
	return out;
}
const TTL = 864e5;
const ZH_TTL = 31536e6;
const MIRROR = "https://gh-proxy.com/";
const SELF_REPO = "mishibeikejie/zat-dsh-engine";
const SELF_VERSION = "0.6.3";
const CATEGORY_QUERY = {
	"全部": "",
	"皮肤 / 主题": "theme",
	"工具 / 终端": "tool",
	"浏览器 / 自动化": "browser",
	"技能 Skills": "skill",
	"视觉 / 多媒体": "vision",
	"网络 / MCP": "network",
	"多智能体 / 编排": "agent",
	"数据 / 存储 / 记忆": "data",
	"硬件 / 桌面": "desktop",
	"设计 / 文档": "design",
	"安全 / 通知": "security"
};
function encodeQueryPart(s) {
	return encodeURIComponent(String(s).replace(/["\\()]/g, " ").replace(/:/g, " ").replace(/\b(?:OR|AND|NOT)\b/gi, " ")).replace(/%20/g, "+");
}
/** Reject anything that is not a plain GitHub owner/repo segment. */
function safeSegment(value) {
	const v = String(value || "").trim();
	return /^[\w.-]+$/.test(v) ? v : "";
}
/** Resolve a repo-relative path against the host entry's directory (POSIX). */
function resolveRel(dir, ref) {
	const out = [];
	for (const part of (dir + "/" + ref).split("/")) {
		if (part === "" || part === ".") continue;
		if (part === "..") out.pop();
		else out.push(part);
	}
	return out.join("/");
}
/** Extract loader row ids from a patch YAML text (line-based, tolerant). */
function extractPatchIds(yaml) {
	const ids = /* @__PURE__ */ new Set();
	for (const rawLine of String(yaml).split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const m = line.match(/(?:^|\s)id:\s*['"]?([^'"#,\s}]+)/);
		if (m) ids.add(m[1]);
	}
	return ids;
}
/** True when a simple `^x`/`x`/`x.y`/`x.y.z` range wants a different major than installed. */
function simpleMajorConflict(range, installed) {
	const m = String(range).trim().match(/^\^?(\d+)(?:\.\d+){0,2}$/);
	if (!m) return false;
	const want = Number(m[1]);
	const have = Number(String(installed).split(".")[0]);
	return Number.isFinite(want) && Number.isFinite(have) && want !== have;
}
/**
* Compare two dotted versions (numeric triple, optional leading v).
* Returns -1 when a<b, 0 when equal, 1 when a>b. Unparseable versions fall
* back to numeric-aware string comparison.
*/
function compareVersions(a, b) {
	const parse = (s) => {
		const m = String(s).trim().replace(/^v/i, "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
		if (!m) return null;
		return [
			Number(m[1]),
			Number(m[2] ?? 0),
			Number(m[3] ?? 0)
		];
	};
	const pa = parse(a);
	const pb = parse(b);
	if (!pa || !pb) return String(a).localeCompare(String(b), void 0, { numeric: true });
	for (let i = 0; i < 3; i++) {
		if (pa[i] < pb[i]) return -1;
		if (pa[i] > pb[i]) return 1;
	}
	return 0;
}
/**
* npm `os`/`cpu` field semantics: entries starting with `!` form a blocklist
* (support everything except these), otherwise the array is an allowlist.
* An empty/absent field means "no restriction".
*/
function fieldSupports(field, current) {
	if (!Array.isArray(field) || field.length === 0) return true;
	const negated = field.filter((e) => e.startsWith("!")).map((e) => e.slice(1));
	const allowed = field.filter((e) => !e.startsWith("!"));
	if (negated.length > 0) return !negated.includes(current);
	return allowed.includes(current);
}
/** Subdirectory spec: nested path segments, no traversal, no shell chars. */
function safeSubdir(value) {
	const v = String(value || "").trim().replace(/^\/+/, "");
	if (v === "") return "";
	return /^[\w.-]+(?:\/[\w.-]+)*$/.test(v) ? v : null;
}
/** npm package name (scoped or bare). */
function safePackageName(value) {
	const v = String(value || "").trim();
	return /^@?[\w.-]+(?:\/[\w.-]+)?$/.test(v) ? v : null;
}
/** 读取 SKILL.md / 平铺 .md 的 frontmatter `name`;与 dsh 的发现规则一致,必须同时有 name + description。 */
function skillNameFrom(file) {
	let text;
	try {
		text = readFileSync(file, "utf8");
	} catch {
		return null;
	}
	const m = text.match(/^\uFEFF?---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
	if (!m) return null;
	const fm = m[1] || "";
	const name = fm.match(/^name:\s*(.+?)\s*$/m);
	const desc = fm.match(/^description:\s*(.+?)\s*$/m);
	if (!name || !desc) return null;
	return String(name[1]).replace(/^['"]|['"]$/g, "").trim();
}
/** 扫描一个仓库工作树里的 dsh 技能:顶层 `x/SKILL.md` 目录包,或顶层 `x.md` 平铺技能(跳过 README)。 */
function scanSkills(root) {
	const out = [];
	let entries;
	try {
		entries = readdirSync(root, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const e of entries) {
		if (!safeSkillEntryName(e.name)) continue;
		if (e.isDirectory()) {
			const nm = skillNameFrom(join(root, e.name, "SKILL.md"));
			if (nm) out.push({
				dir: e.name,
				name: nm
			});
		} else if (e.isFile() && e.name.endsWith(".md") && !/^readme(\.|$)/i.test(e.name)) {
			const nm = skillNameFrom(join(root, e.name));
			if (nm) out.push({
				dir: e.name,
				name: nm
			});
		}
	}
	return out;
}
/** 技能目录/文件名必须是单一安全段(无 / 或 \、不为 . / ..、不以 . 开头),防清单被手改后删到别处。 */
function safeSkillEntryName(v) {
	return v.length > 0 && v !== "." && v !== ".." && !v.includes("/") && !v.includes("\\") && !v.startsWith(".");
}
/** 单个候选的体检时间上限,超时按 unknown 处理(模型调用不能被网络拖死)。 */
const HEALTH_TIMEOUT_MS = 12e3;
/** 最多对前几个候选做体检,避免一次工具调用打爆 GitHub 配额。 */
const HEALTH_MAX = 5;
/** 常见系统命令不算"外部依赖";其余被 spawn/resolveExecutable 调用的都提示。 */
const COMMON_BINS = /* @__PURE__ */ new Set([
	"node",
	"npm",
	"pnpm",
	"yarn",
	"npx",
	"git",
	"cmd",
	"powershell",
	"pwsh",
	"sh",
	"bash",
	"curl",
	"wget",
	"tar",
	"unzip",
	"7z",
	"python",
	"python3"
]);
/** 知名服务的域名:出现了不报警,只属于"正常业务去向"。 */
const ALLOWED_HOSTS = /* @__PURE__ */ new Set([
	"github.com",
	"api.github.com",
	"raw.githubusercontent.com",
	"objects.githubusercontent.com",
	"githubusercontent.com",
	"gh-proxy.com",
	"ghfast.top",
	"gitee.com",
	"deepseek.com",
	"api.deepseek.com",
	"platform.deepseek.com",
	"chat.deepseek.com",
	"status.deepseek.com",
	"openai.com",
	"api.openai.com",
	"anthropic.com",
	"api.anthropic.com",
	"claude.ai",
	"openrouter.ai",
	"groq.com",
	"api.groq.com",
	"mistral.ai",
	"api.mistral.ai",
	"googleapis.com",
	"generativelanguage.googleapis.com",
	"huggingface.co",
	"hf.co",
	"npmjs.com",
	"npmjs.org",
	"registry.npmjs.org",
	"unpkg.com",
	"jsdelivr.net",
	"cdn.jsdelivr.net",
	"aliyuncs.com",
	"aliyun.com",
	"dashscope.aliyuncs.com",
	"baidu.com",
	"aip.baidubce.com",
	"qcloud.com",
	"tencentcloud.com",
	"tencentcloudapi.com",
	"siliconflow.cn",
	"api.siliconflow.cn",
	"bigmodel.cn",
	"open.bigmodel.cn",
	"moonshot.cn",
	"api.moonshot.cn",
	"deepinfra.com",
	"api.deepinfra.com",
	"volces.com",
	"ark.cn-beijing.volces.com",
	"zhipuai.cn",
	"open.zhipuai.cn",
	"qwen.ai",
	"dashscope-intl.aliyuncs.com",
	"localhost",
	"127.0.0.1",
	"0.0.0.0",
	"::1",
	"example.com",
	"w3.org",
	"www.w3.org",
	"json-schema.org",
	"schemastore.org",
	"nodejs.org",
	"crates.io",
	"pypi.org",
	"githubassets.com",
	"opengraph.githubassets.com",
	"avatars.githubusercontent.com",
	"camo.githubusercontent.com",
	"reactjs.org",
	"react.dev",
	"mozilla.org",
	"developer.mozilla.org",
	"mdn.io",
	"jsfiddle.net",
	"codepen.io",
	"stackoverflow.com",
	"typescriptlang.org"
]);
/** 一次性域名/裸 IP/免费可疑顶级域 —— 正常插件不会把数据发到这里。 */
function isSuspiciousHost(host) {
	const h = host.toLowerCase();
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) return true;
	if (!h.includes(".")) return true;
	const tld = h.split(".").pop() || "";
	if ([
		"tk",
		"ml",
		"ga",
		"cf",
		"gq",
		"top",
		"xyz",
		"cc",
		"pw",
		"click",
		"link",
		"buzz",
		"monster",
		"icu",
		"lol",
		"work",
		"rest",
		"ru",
		"su"
	].includes(tld)) return true;
	return /pastebin|paste\.ee|termbin|0x0\.st|hastebin|requestbin|webhook|ngrok|serveo|localtunnel|trycloudflare|duckdns|nip\.io/i.test(h);
}
/** 收集代码文本里出现的全部外部主机(不含允许名单)。 */
function extractHosts(text) {
	const hosts = /* @__PURE__ */ new Set();
	const re = /https?:\/\/[A-Za-z0-9._-]+/g;
	let m;
	while ((m = re.exec(text)) !== null) {
		let h = m[0].slice(m[0].indexOf("//") + 2).toLowerCase();
		h = h.replace(/\.+$/, "");
		if (h && !ALLOWED_HOSTS.has(h)) hosts.add(h);
	}
	return [...hosts];
}
/**
* 对一段插件代码做静态安全扫描。返回的 findings 里 error 级是"几乎不可能是
* 正常插件"的模式(安装门直接拦截);warn 级是透明度提示(装前人工确认)。
*/
function scanSecurity(text, where) {
	const out = [];
	if (!text) return out;
	if (/\beval\s*\(|new\s+Function\s*\(|atob\s*\(|fromCharCode\s*\(\s*(?:\d+\s*,\s*){40,}|Buffer\.from\s*\(\s*['"][A-Za-z0-9+/=]{200,}/i.test(text)) out.push({
		level: "error",
		title: `${where}包含混淆/动态执行代码`,
		detail: "检测到 eval/new Function/超长 base64 块。正常插件不会这样写,混淆常用来藏恶意行为,建议不要安装。"
	});
	const ioRe = /(?:readFileSync|readFile|createReadStream|openSync|accessSync|statSync|copyFileSync|renameSync|cpSync|rmSync|existsSync|execSync|execFileSync|spawnSync|spawn)\s*\(/g;
	const sensPath = /~\/\.(?:ssh|aws)|\.git-credentials|id_rsa|id_ed25519|known_hosts|(?:AppData|Application Support)[^'"\n]{0,40}(?:Chrome|Edge|Firefox|Chromium)/i;
	let iom;
	while ((iom = ioRe.exec(text)) !== null) if (sensPath.test(text.slice(iom.index, iom.index + 200))) {
		out.push({
			level: "error",
			title: `${where}有读取敏感凭据的痕迹`,
			detail: "代码在读写文件/执行命令的同时引用了 SSH 私钥、云凭据、浏览器数据等敏感路径;插件功能几乎用不到这些,极可能是偷凭据,建议不要安装。"
		});
		break;
	}
	if (/discord(?:app)?\.com\/api\/webhooks|api\.telegram\.org\/bot|pastebin\.com|paste\.ee|termbin\.com|0x0\.st|hastebin\.com|webhook\.site|requestbin\.com/i.test(text)) out.push({
		level: "error",
		title: `${where}包含可疑的数据外发地址`,
		detail: "代码里有消息机器人钩子或匿名粘贴板地址,常被用来把数据静默发走,建议不要安装。"
	});
	if (/reg\s+(?:add|import)|schtasks\s|netsh\s+firewall|Set-ItemProperty[^;]{0,60}Registry/i.test(text)) out.push({
		level: "warn",
		title: `${where}会修改系统设置(注册表/计划任务/防火墙)`,
		detail: "插件一般不需要动系统级配置;装前确认这是它功能的一部分。"
	});
	const hosts = extractHosts(text);
	const placeholders = hosts.filter((h) => !h.includes(".") || /^(?:your|my|example|xxx|test|demo)[-_]/i.test(h));
	const suspicious = hosts.filter((h) => !placeholders.includes(h) && isSuspiciousHost(h));
	if (suspicious.length > 0) out.push({
		level: "error",
		title: `${where}可疑网络去向:${suspicious.slice(0, 5).join("、")}`,
		detail: "裸 IP、一次性域名或可疑顶级域,不像正规服务;插件可能把数据发往这里,建议不要安装。"
	});
	else if (placeholders.length > 0) out.push({
		level: "warn",
		title: `${where}有占位/无效域名:${placeholders.slice(0, 5).join("、")}`,
		detail: "代码里的这个地址是占位符,没有真实域名——说明功能还没配置好,装完不配置就用不了;不是外发风险。"
	});
	else if (hosts.length > 0) out.push({
		level: "warn",
		title: `${where}会连接外部服务:${hosts.slice(0, 10).join("、")}`,
		detail: "装之前确认这些服务器就是插件功能要用的;数量很多或和功能对不上时要警惕。"
	});
	return out;
}
let ZatMarketGateway = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _taskStatus_decorators;
	let _list_decorators;
	let _versions_decorators;
	let _translate_decorators;
	let _installed_decorators;
	let _detail_decorators;
	let _osMap_decorators;
	let _selfupdate_decorators;
	let _subpackages_decorators;
	let _install_decorators;
	let _update_decorators;
	let _updateNpm_decorators;
	let _uninstall_decorators;
	let _listSessions_decorators;
	let _deleteSession_decorators;
	let _installedList_decorators;
	let _setEnabled_decorators;
	let _healthCheck_decorators;
	let _repair_decorators;
	let _starToggle_decorators;
	let _starredList_decorators;
	let _setToken_decorators;
	return class ZatMarketGateway extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_taskStatus_decorators = [Remote("taskStatus")];
			_list_decorators = [Remote("list")];
			_versions_decorators = [Remote("versions")];
			_translate_decorators = [Remote("translate")];
			_installed_decorators = [Remote("installed")];
			_detail_decorators = [Remote("detail")];
			_osMap_decorators = [Remote("osMap")];
			_selfupdate_decorators = [Remote("selfupdate")];
			_subpackages_decorators = [Remote("subpackages")];
			_install_decorators = [Remote("installPlugin")];
			_update_decorators = [Remote("update")];
			_updateNpm_decorators = [Remote("updateNpm")];
			_uninstall_decorators = [Remote("uninstall")];
			_listSessions_decorators = [Remote("listSessions")];
			_deleteSession_decorators = [Remote("deleteSession")];
			_installedList_decorators = [Remote("installedList")];
			_setEnabled_decorators = [Remote("setEnabled")];
			_healthCheck_decorators = [Remote("healthCheck")];
			_repair_decorators = [Remote("repair")];
			_starToggle_decorators = [Remote("star")];
			_starredList_decorators = [Remote("starredList")];
			_setToken_decorators = [Remote("setToken")];
			__esDecorate(this, null, _taskStatus_decorators, {
				kind: "method",
				name: "taskStatus",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskStatus" in obj,
					get: (obj) => obj.taskStatus
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _list_decorators, {
				kind: "method",
				name: "list",
				static: false,
				private: false,
				access: {
					has: (obj) => "list" in obj,
					get: (obj) => obj.list
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _versions_decorators, {
				kind: "method",
				name: "versions",
				static: false,
				private: false,
				access: {
					has: (obj) => "versions" in obj,
					get: (obj) => obj.versions
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _translate_decorators, {
				kind: "method",
				name: "translate",
				static: false,
				private: false,
				access: {
					has: (obj) => "translate" in obj,
					get: (obj) => obj.translate
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _installed_decorators, {
				kind: "method",
				name: "installed",
				static: false,
				private: false,
				access: {
					has: (obj) => "installed" in obj,
					get: (obj) => obj.installed
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _detail_decorators, {
				kind: "method",
				name: "detail",
				static: false,
				private: false,
				access: {
					has: (obj) => "detail" in obj,
					get: (obj) => obj.detail
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _osMap_decorators, {
				kind: "method",
				name: "osMap",
				static: false,
				private: false,
				access: {
					has: (obj) => "osMap" in obj,
					get: (obj) => obj.osMap
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _selfupdate_decorators, {
				kind: "method",
				name: "selfupdate",
				static: false,
				private: false,
				access: {
					has: (obj) => "selfupdate" in obj,
					get: (obj) => obj.selfupdate
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _subpackages_decorators, {
				kind: "method",
				name: "subpackages",
				static: false,
				private: false,
				access: {
					has: (obj) => "subpackages" in obj,
					get: (obj) => obj.subpackages
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _install_decorators, {
				kind: "method",
				name: "install",
				static: false,
				private: false,
				access: {
					has: (obj) => "install" in obj,
					get: (obj) => obj.install
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _update_decorators, {
				kind: "method",
				name: "update",
				static: false,
				private: false,
				access: {
					has: (obj) => "update" in obj,
					get: (obj) => obj.update
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _updateNpm_decorators, {
				kind: "method",
				name: "updateNpm",
				static: false,
				private: false,
				access: {
					has: (obj) => "updateNpm" in obj,
					get: (obj) => obj.updateNpm
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _uninstall_decorators, {
				kind: "method",
				name: "uninstall",
				static: false,
				private: false,
				access: {
					has: (obj) => "uninstall" in obj,
					get: (obj) => obj.uninstall
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _listSessions_decorators, {
				kind: "method",
				name: "listSessions",
				static: false,
				private: false,
				access: {
					has: (obj) => "listSessions" in obj,
					get: (obj) => obj.listSessions
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _deleteSession_decorators, {
				kind: "method",
				name: "deleteSession",
				static: false,
				private: false,
				access: {
					has: (obj) => "deleteSession" in obj,
					get: (obj) => obj.deleteSession
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _installedList_decorators, {
				kind: "method",
				name: "installedList",
				static: false,
				private: false,
				access: {
					has: (obj) => "installedList" in obj,
					get: (obj) => obj.installedList
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _setEnabled_decorators, {
				kind: "method",
				name: "setEnabled",
				static: false,
				private: false,
				access: {
					has: (obj) => "setEnabled" in obj,
					get: (obj) => obj.setEnabled
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _healthCheck_decorators, {
				kind: "method",
				name: "healthCheck",
				static: false,
				private: false,
				access: {
					has: (obj) => "healthCheck" in obj,
					get: (obj) => obj.healthCheck
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _repair_decorators, {
				kind: "method",
				name: "repair",
				static: false,
				private: false,
				access: {
					has: (obj) => "repair" in obj,
					get: (obj) => obj.repair
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _starToggle_decorators, {
				kind: "method",
				name: "starToggle",
				static: false,
				private: false,
				access: {
					has: (obj) => "starToggle" in obj,
					get: (obj) => obj.starToggle
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _starredList_decorators, {
				kind: "method",
				name: "starredList",
				static: false,
				private: false,
				access: {
					has: (obj) => "starredList" in obj,
					get: (obj) => obj.starredList
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _setToken_decorators, {
				kind: "method",
				name: "setToken",
				static: false,
				private: false,
				access: {
					has: (obj) => "setToken" in obj,
					get: (obj) => obj.setToken
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		static inject = ["subprocess"];
		subprocess = __runInitializers(this, _instanceExtraInitializers);
		home = null;
		profileDirValue = null;
		profileNameValue = null;
		zhCacheFile = null;
		cacheDirty = false;
		listCacheFile = null;
		listCacheLoaded = false;
		/** 缓存世代:安装/卸载等变更时 +1,后台刷新/写盘发现世代变了就丢弃,避免旧状态回写。 */
		cacheEpoch = 0;
		mirrorDown = false;
		directDown = false;
		zhLoaded = false;
		caches = /* @__PURE__ */ new Map();
		zhCache = /* @__PURE__ */ new Map();
		/** Repo kind (plugin/nonplugin/multi/skill) merged from bundled data + live scan. */
		kindCache = /* @__PURE__ */ new Map();
		/** 装前体检结果缓存(20 分钟),模型重复问同一批插件时不重复打网络。 */
		healthCache = /* @__PURE__ */ new Map();
		/** GitHub 搜索结果缓存(10 分钟),模型连发相近查询时不烧匿名配额。 */
		searchCache = /* @__PURE__ */ new Map();
		/** 每个仓库声明的 os/cpu 支持范围缓存(30 分钟),给卡片打"支持系统"标签。 */
		osCache = /* @__PURE__ */ new Map();
		/** 市场自己最近报过的错(安装失败/网络/pnpm 等),一键检测会把这些也列出来。 */
		recentIssues = [];
		kindScanStarted = false;
		constructor(ctx) {
			super(ctx, "pluginMarket");
			this.subprocess = this.ctx.get("subprocess");
			const tools = this.ctx.get("tools");
			if (tools !== void 0) this.ctx.effect(() => {
				const dispose = tools.register(this.buildFindPluginTool());
				return () => dispose();
			}, "zat-market: find_plugin tool");
		}
		buildFindPluginTool() {
			return defineTool({
				name: "find_plugin",
				description: "在 DeepSeek Harness 插件市场里按需求搜索插件(中文或英文)。返回候选列表:名称、星数、简介、中文简介、是否可直接安装、安装命令,以及每个候选的「装前体检」(health)结果——体检检查入口文件是否真的存在、挂载补丁是否缺失、官方依赖是否写错、peer 依赖本机是否有、安装脚本是否要联网下载、是否依赖外部命令、仓库是否归档/停更,并对宿主和界面代码做安全扫描(混淆/动态执行、读取 SSH/云凭据/浏览器数据、可疑外发地址、外部网络去向清单)。用户描述一个能力需求时调用;用户选定后,用返回的 install 命令安装(装完提示重启 dsh),并建议用户在插件市场里点「一键检测」确认与已装插件没有冲突。重要:体检结果是让你判断\"能不能推荐\"用的——带 ❌/[error] 硬伤(包括安全问题)的候选,装了大概率用不了或根本不该装,必须把问题如实告诉用户,不要盲目推荐安装。",
				parameters: {
					query: {
						type: "string",
						required: true,
						description: "能力需求,例如\"OCR 截图转文字\"或\"终端 TUI\"。"
					},
					limit: {
						type: "number",
						description: "最多返回几个候选,1-10,默认 5。"
					}
				},
				output: {
					schema: {
						type: "object",
						additionalProperties: false,
						properties: {
							items: {
								type: "array",
								required: true,
								items: {
									type: "object",
									additionalProperties: false,
									properties: {
										fullName: {
											type: "string",
											required: true
										},
										name: {
											type: "string",
											required: true
										},
										stars: { type: "number" },
										description: { type: "string" },
										zhIntro: { type: "string" },
										kind: { type: "string" },
										installable: { type: "boolean" },
										install: { type: "string" },
										url: { type: "string" },
										health: {
											type: "object",
											additionalProperties: false,
											properties: {
												status: {
													type: "string",
													required: true
												},
												summary: {
													type: "string",
													required: true
												},
												checks: {
													type: "array",
													required: true,
													items: {
														type: "object",
														additionalProperties: false,
														properties: {
															level: {
																type: "string",
																required: true
															},
															title: {
																type: "string",
																required: true
															},
															detail: {
																type: "string",
																required: true
															}
														}
													}
												}
											}
										}
									}
								}
							},
							notice: { type: "string" }
						}
					},
					render: (_args, value) => {
						const v = value;
						const lines = [];
						for (const [i, it] of (v.items || []).entries()) {
							const zh = it.zhIntro ? ` · ${String(it.zhIntro)}` : "";
							const desc = String(it.description || "") + zh;
							lines.push(`${i + 1}. ${String(it.fullName)} — ${Number(it.stars)}★ [${String(it.kind)}]${it.installable ? " 可安装" : " 不可直接安装"}`);
							if (desc.trim()) lines.push(`   ${desc.slice(0, 200)}`);
							const health = it.health;
							const status = health?.status || "unknown";
							const mark = status === "ok" ? "✅" : status === "warn" ? "⚠️" : status === "error" ? "❌" : "❓";
							lines.push(`   体检: ${mark} ${String(health?.summary || "未完成")}`);
							for (const c of health?.checks || []) lines.push(`      [${String(c.level)}] ${String(c.title)} — ${String(c.detail || "").slice(0, 140)}`);
							if (it.installable && typeof it.install === "string" && String(it.install).trim()) lines.push(`   安装: ${String(it.install)}`);
							else if (it.installable) lines.push("   安装: 多子包仓库,请在插件市场页面里选好子包再装");
							lines.push(`   详情: ${String(it.url)}`);
						}
						if (v.notice) lines.push(String(v.notice));
						return [{
							type: "text",
							text: lines.join("\n")
						}];
					}
				},
				isConcurrencySafe: () => true,
				execute: async (args) => {
					const query = String(args.query || "").trim();
					const limitRaw = Number(args.limit);
					const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10, Math.floor(limitRaw))) : 5;
					if (!query) return {
						items: [],
						notice: "需求描述是空的,请说明想要什么功能的插件"
					};
					const url = `https://api.github.com/search/repositories?q=${"topic:dsh-plugin+" + encodeQueryPart(query)}&sort=stars&order=desc&per_page=${limit}&page=1`;
					const r = await this.ghSearch(url);
					if (r.status !== 200) {
						const why = r.status === 403 || r.status === 429 ? "搜索太频繁被限流,稍后再试。" : r.status === 400 || r.status === 422 ? "搜索词无效,换个说法试试。" : "连不上 GitHub,请开代理或稍后重试。";
						return {
							items: [],
							notice: `搜索失败(${r.status})。${why}`
						};
					}
					let raw = [];
					try {
						raw = JSON.parse(r.body).items ?? [];
					} catch {}
					let broadUsed = false;
					if (raw.length === 0) {
						const broad = `https://api.github.com/search/repositories?q=${encodeQueryPart(query)}+dsh-plugin&sort=stars&order=desc&per_page=${limit}&page=1`;
						const br = await this.ghSearch(broad);
						if (br.status === 200) {
							try {
								raw = JSON.parse(br.body).items ?? [];
							} catch {}
							broadUsed = raw.length > 0;
						}
					}
					await this.loadZhCache();
					const picked = raw.slice(0, limit).map((entry) => {
						const it = entry;
						const fullName = String(it.full_name || "");
						const seg = fullName.split("/");
						return {
							fullName,
							name: String(it.name || fullName),
							owner: safeSegment(seg[0] || ""),
							repo: safeSegment(seg.slice(1).join("/")),
							stars: Number(it.stargazers_count || 0),
							description: String(it.description || ""),
							url: String(it.html_url || `https://github.com/${fullName}`)
						};
					}).filter((it) => it.fullName.toLowerCase() !== SELF_REPO);
					await Promise.all(picked.map(async (it) => {
						if (!it.owner || !it.repo) return;
						const lower = it.fullName.toLowerCase();
						if (this.kindOf(lower) !== "unknown") return;
						try {
							const kind = await this.detectKind(it.owner, it.repo);
							this.kindCache.set(lower, kind);
						} catch {}
					}));
					const healths = [];
					for (let i = 0; i < picked.length; i += 3) {
						const batch = picked.slice(i, i + 3);
						const results = await Promise.all(batch.map((it, j) => {
							const lower = it.fullName.toLowerCase();
							const cached = this.healthCacheGet(lower);
							if (cached) return cached;
							if (!it.owner || !it.repo) return {
								status: "skip",
								summary: "仓库名无法识别,跳过体检",
								checks: []
							};
							if (i + j >= HEALTH_MAX) return {
								status: "skip",
								summary: `候选较多,本次只对前 ${HEALTH_MAX} 个做了体检;这个装前没查过,先在插件市场详情页确认`,
								checks: []
							};
							const kind = this.kindOf(lower);
							if (kind !== "plugin" && kind !== "multi" && kind !== "client" && kind !== "unknown") return {
								status: "skip",
								summary: kind === "skill" ? "技能包:无需代码体检,可在插件市场直接点「安装」装进 skills 目录" : "不是可直接安装的插件,跳过体检",
								checks: []
							};
							return this.withHealthTimeout(this.analyzeCandidateHealth(it.owner, it.repo, kind), lower);
						}));
						healths.push(...results);
					}
					const profileName = await this.profileForCommand();
					const items = picked.map((it, i) => {
						const kind = this.kindOf(it.fullName.toLowerCase());
						const cachedZh = this.zhCache.get(it.fullName.toLowerCase());
						const installable = kind === "plugin" || kind === "multi" || kind === "client" || kind === "skill";
						return {
							fullName: it.fullName,
							name: it.name,
							stars: it.stars,
							description: it.description,
							zhIntro: cachedZh && cachedZh.zh || "",
							kind,
							installable,
							install: kind === "plugin" ? `dsh plugin --profile ${profileName} add github:${it.fullName}` : kind === "client" ? "在插件市场点「安装」一键装(主题/界面插件,刷新页面生效)" : kind === "skill" ? "在插件市场点「安装」一键装(技能包,装进 ~/.dsh/skills 立即生效)" : "",
							url: it.url,
							health: healths[i]
						};
					});
					const risky = items.filter((it) => it.health.status === "error").length;
					const broadPrefix = broadUsed ? "没有打 dsh-plugin 标签的精确匹配,以下是放宽搜索后的结果(可能不是一键式插件,以体检结果为准)。" : "";
					return {
						items,
						notice: items.length === 0 ? (broadUsed ? broadPrefix : "") + "没有找到匹配的插件,换个说法试试" : broadPrefix + `找到 ${items.length} 个候选,已对可安装的候选做装前体检。规则:带 ❌/[error] 硬伤的候选装了大概率用不了,别推荐安装,把问题如实告诉用户;带 ⚠️/[warn] 的提醒用户注意;✅ 的可以放心推荐。装完仍建议在插件市场点「一键检测」查与已装插件的冲突。` + (risky > 0 ? ` 本批有 ${risky} 个候选存在硬伤。` : "")
					};
				}
			});
		}
		shellCwd() {
			return IS_WIN ? "C:\\" : "/";
		}
		/** Spawn one shell command line; returns the live handle for streaming reads. */
		async spawnShell(command, cwd, graceMs = 12e4) {
			let argv;
			if (IS_WIN) {
				let exe = "powershell.exe";
				try {
					exe = await this.subprocess.resolveExecutable("powershell.exe");
				} catch {}
				argv = [
					exe,
					"-NoProfile",
					"-NonInteractive",
					"-Command",
					command
				];
			} else {
				let sh = "/bin/sh";
				try {
					sh = await this.subprocess.resolveExecutable("sh");
				} catch {}
				argv = [
					sh,
					"-c",
					command
				];
			}
			return this.subprocess.spawn({
				argv,
				cwd: cwd || this.shellCwd(),
				stdio: {
					stdin: "ignore",
					stdout: { maxBytes: 8388608 },
					stderr: { maxBytes: 1048576 }
				},
				graceMs
			});
		}
		/** Run one shell command line on the host platform. */
		async runShell(command, cwd, graceMs) {
			const handle = await this.spawnShell(command, cwd, graceMs);
			const outcome = await handle.done;
			let stdout = "";
			let stderr = "";
			if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || "";
			if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || "";
			return {
				outcome,
				stdout,
				stderr
			};
		}
		/**
		* Classify one repository: plugin (root bundle), nonplugin (root manifest
		* without a bundle), multi (subdirectory bundles), skill (no installable
		* plugin declaration at all).
		*/
		async detectKind(owner, repo) {
			const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`);
			if (rootPkg.status === 200) try {
				const meta = JSON.parse(rootPkg.body);
				return meta.dsh?.bundle?.patch ? "plugin" : meta.dsh?.client ? "client" : "nonplugin";
			} catch {
				return "nonplugin";
			}
			const sub = await this.subpackages(owner, repo);
			if (sub.ok && Array.isArray(sub.packages) && sub.packages.length > 0) return "multi";
			return "skill";
		}
		/** Look up a repo kind: live scan wins, then the bundled snapshot. */
		kindOf(fullNameLower) {
			const live = this.kindCache.get(fullNameLower);
			if (live !== void 0) return live;
			const bundled = kinds_default[fullNameLower];
			if (bundled) {
				this.kindCache.set(fullNameLower, bundled);
				return bundled;
			}
			return "unknown";
		}
		/** Background scan of repos the bundled snapshot does not know yet. */
		async startKindScan(items) {
			if (this.kindScanStarted) return;
			this.kindScanStarted = true;
			const queue = items.filter((it) => this.kindOf(it.fullName.toLowerCase()) === "unknown");
			if (queue.length === 0) return;
			let next = 0;
			const worker = async () => {
				while (next < queue.length) {
					const it = queue[next++];
					try {
						const kind = await this.detectKind(it.owner, it.name);
						this.kindCache.set(it.fullName.toLowerCase(), kind);
					} catch {}
				}
			};
			const workers = [];
			for (let w = 0; w < 4; w++) workers.push(worker());
			Promise.all(workers);
		}
		/** Write a file directly through node:fs (this package is trusted Node code). */
		async writeFileText(path, content) {
			writeFileSync(path, content, "utf8");
		}
		/** Parse the profile's cordis.patch.yml into a patch-entry array ([] when absent/empty). */
		async readPatches() {
			try {
				const dir = await this.getProfileDir();
				const content = readFileSync(join(dir, "cordis.patch.yml"), "utf8");
				const parsed = yaml.load(content, { schema: PATCH_SCHEMA });
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		/** Persist a patch-entry array back to cordis.patch.yml (same `!!js` dialect). */
		async writePatches(patches) {
			const dir = await this.getProfileDir();
			await this.writeFileText(join(dir, "cordis.patch.yml"), yaml.dump(patches, {
				schema: PATCH_SCHEMA,
				noRefs: true
			}));
		}
		/** Package names currently registered as client-only `insert` rows in the patch layer. */
		async clientInsertNames() {
			const set = /* @__PURE__ */ new Set();
			for (const patch of await this.readPatches()) {
				if (!patch || typeof patch !== "object") continue;
				const insert = patch.insert;
				if (!Array.isArray(insert)) continue;
				for (const row of insert) if (row && typeof row === "object" && typeof row.name === "string") set.add(row.name);
			}
			return set;
		}
		/** True when a package declares `dsh.client` (a client-only surface plugin). */
		async isClientOnlyPackage(name) {
			try {
				const dir = await this.getProfileDir();
				const meta = JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"));
				return Boolean(meta.dsh?.client) && !meta.dsh?.bundle?.patch;
			} catch {
				return false;
			}
		}
		/** Ensure a client-only plugin has an `insert` row (auto-enable); returns true when it was added. */
		async upsertClientInsert(pkgName) {
			if ((await this.clientInsertNames()).has(pkgName)) return false;
			const patches = await this.readPatches();
			patches.push({ insert: [{
				id: pkgName,
				name: pkgName
			}] });
			await this.writePatches(patches);
			return true;
		}
		/** Remove every `insert` row that loads `pkgName`; returns true when anything changed. */
		async removeClientInsert(pkgName) {
			const patches = await this.readPatches();
			let changed = false;
			for (const patch of patches) {
				if (!patch || typeof patch !== "object") continue;
				const insert = patch.insert;
				if (!Array.isArray(insert)) continue;
				const before = insert.length;
				patch.insert = insert.filter((row) => !(row && typeof row === "object" && row.name === pkgName));
				if (insert.length !== before) changed = true;
			}
			const cleaned = patches.filter((patch) => {
				if (!patch || typeof patch !== "object") return true;
				const insert = patch.insert;
				const hasOtherKeys = Object.keys(patch).some((k) => k !== "insert");
				if (!Array.isArray(insert)) return true;
				if (insert.length === 0 && !hasOtherKeys) return false;
				return true;
			});
			if (changed || cleaned.length !== patches.length) {
				await this.writePatches(cleaned);
				return true;
			}
			return false;
		}
		/** 把包名加进 pnpm-workspace.yaml 的 allowBuilds,让它的构建脚本能跑。幂等。 */
		async ensureAllowBuilds(name) {
			try {
				const dir = await this.getProfileDir();
				const wsPath = join(dir, "pnpm-workspace.yaml");
				let ws = {};
				try {
					const parsed = yaml.load(readFileSync(wsPath, "utf8"), { schema: PATCH_SCHEMA });
					if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ws = parsed;
				} catch {}
				const allow = Array.isArray(ws.allowBuilds) ? ws.allowBuilds : [];
				if (allow.includes(name)) return;
				ws.allowBuilds = [...allow, name];
				await this.writeFileText(wsPath, yaml.dump(ws, {
					schema: PATCH_SCHEMA,
					noRefs: true
				}));
			} catch {}
		}
		/**
		* Quality gate: snapshot the profile manifest files before a mutating
		* operation, restore them when it fails. Keeps the profile bootable.
		*/
		async snapshotProfile(dir) {
			const files = [
				"package.json",
				"cordis.patch.yml",
				"pnpm-lock.yaml"
			];
			const out = {};
			for (const f of files) try {
				out[f] = readFileSync(join(dir, f), "utf8");
			} catch {
				out[f] = null;
			}
			return out;
		}
		async restoreProfile(dir, snap) {
			for (const f of Object.keys(snap)) {
				const content = snap[f];
				if (content === null) try {
					unlinkSync(join(dir, f));
				} catch {}
				else await this.writeFileText(join(dir, f), content);
			}
		}
		/**
		* Keep a copy of the profile manifest files after every successful
		* mutation. When a later plugin breaks the profile at startup, a beginner
		* can restore this copy in one command — see the README recovery section.
		*/
		async saveLastKnownGood() {
			try {
				const dir = await this.getProfileDir();
				const backupDir = join(dir, "zat-backup");
				mkdirSync(backupDir, { recursive: true });
				const snap = await this.snapshotProfile(dir);
				for (const f of Object.keys(snap)) {
					const content = snap[f];
					if (content === null) try {
						unlinkSync(join(backupDir, f));
					} catch {}
					else await this.writeFileText(join(backupDir, f), content);
				}
			} catch {}
		}
		/**
		* Refuse to install a second marketplace/manager plugin next to an
		* existing one: two of them register conflicting pages and services and
		* take the profile down. Returns a user-facing reason, or null to allow.
		*/
		async checkMarketConflict(owner, repo) {
			const candidateRepo = (owner + "/" + repo).toLowerCase();
			const candidatePkg = KNOWN_MARKET_REPOS[candidateRepo];
			const candidateMarketish = isMarketishName(repo);
			if (!candidatePkg && !candidateMarketish) return null;
			try {
				const p = await this.readProfile();
				const inst = await this.installedMap(p);
				for (const rec of new Set(Object.values(inst))) {
					if ((rec.owner + "/" + rec.repo).toLowerCase() === candidateRepo) return null;
					if (candidatePkg && rec.name === candidatePkg) return null;
				}
				const conflicts = [];
				for (const rec of new Set(Object.values(inst))) if ((KNOWN_MARKET_REPOS[(rec.owner + "/" + rec.repo).toLowerCase()] !== void 0 || Object.values(KNOWN_MARKET_REPOS).includes(rec.name) || isMarketishName(rec.name)) && !conflicts.includes(rec.name)) conflicts.push(rec.name);
				if (conflicts.length > 0) return `已拦截:装了市场类插件 ${conflicts.join("、")},再装会互相冲突导致 dsh 起不来。想换用请先卸载它。`;
				return null;
			} catch {
				return null;
			}
		}
		tasks = /* @__PURE__ */ new Map();
		taskSeq = 0;
		async taskStatus(taskId) {
			const t = this.tasks.get(String(taskId || ""));
			if (!t) return {
				ok: false,
				message: "task not found"
			};
			const task = {
				step: t.step,
				message: t.message,
				progress: t.progress,
				done: t.done
			};
			if (t.ok !== void 0) task.ok = t.ok;
			if (t.result !== void 0) task.result = t.result;
			return {
				ok: true,
				task
			};
		}
		setTaskStep(id, step, message) {
			const t = this.tasks.get(id);
			if (t) {
				t.step = step;
				t.message = message;
			}
		}
		setTaskProgress(id, pct, message) {
			const t = this.tasks.get(id);
			if (t) {
				t.progress = Math.max(1, Math.min(99, Math.round(pct)));
				t.message = message;
			}
		}
		finishTask(id, result) {
			const t = this.tasks.get(id);
			if (t) {
				t.done = true;
				t.progress = 100;
				t.ok = Boolean(result.ok);
				t.result = result;
			}
			setTimeout(() => {
				this.tasks.delete(id);
			}, 6e5);
		}
		launchTask(work, subject) {
			const id = "task-" + ++this.taskSeq;
			this.tasks.set(id, {
				step: "start",
				message: "准备中…",
				progress: 1,
				done: false,
				...subject ? { subject } : {}
			});
			work(id).then((result) => this.finishTask(id, result)).catch((err) => {
				this.finishTask(id, {
					ok: false,
					message: String(err?.message || err)
				});
			});
			return id;
		}
		/** Does this package's own code do plugin-management work? */
		marketishCache = /* @__PURE__ */ new Map();
		localTextsCache = /* @__PURE__ */ new Map();
		/** Read an installed plugin's host/client texts once, from its declared entries. */
		async readLocalTexts(name) {
			const hit = this.localTextsCache.get(name);
			if (hit) return hit;
			let hostText = "";
			let clientText = "";
			try {
				const dir = await this.getProfileDir();
				const pkgPath = join(dir, "node_modules", name, "package.json");
				const meta = JSON.parse(readFileSync(pkgPath, "utf8"));
				const candidates = [meta.main];
				const exp = meta.exports || {};
				for (const v of Object.values(exp)) if (typeof v === "string") candidates.push(v);
				else if (v && typeof v === "object" && typeof v.default === "string") candidates.push(v.default);
				candidates.push("lib/host.js", "lib/index.js", "dist/index.js", "lib/client.js", "dist/client.js");
				for (const rel of candidates) {
					if (!rel || rel.includes("*")) continue;
					try {
						const text = readFileSync(join(dir, "node_modules", name, rel), "utf8");
						if (/client/i.test(rel)) clientText += "\n" + text;
						else hostText += "\n" + text;
					} catch {}
				}
				if (meta.dsh?.bundle?.patch) try {
					hostText += "\n" + readFileSync(join(dir, "node_modules", name, meta.dsh.bundle.patch), "utf8");
				} catch {}
			} catch {}
			const out = {
				hostText,
				clientText
			};
			this.localTextsCache.set(name, out);
			return out;
		}
		async scanLocalMarketish(name) {
			const hit = this.marketishCache.get(name);
			if (hit !== void 0) return hit;
			const texts = await this.readLocalTexts(name);
			const result = isMarketPluginText(texts.hostText, texts.clientText);
			this.marketishCache.set(name, result);
			return result;
		}
		async scanLocalNames(name) {
			const texts = await this.readLocalTexts(name);
			return {
				host: extractRegisteredNames(texts.hostText, "host"),
				client: extractRegisteredNames(texts.clientText, "client")
			};
		}
		/** Fetch a candidate repo's manifest and code files (network, mirror-backed). */
		async fetchCandidateTexts(owner, repo, subdir) {
			const base = subdir ? `${subdir}/` : "";
			const pkgRes = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}package.json`);
			if (pkgRes.status !== 200) return null;
			let meta = {};
			try {
				meta = JSON.parse(pkgRes.body);
			} catch {
				return null;
			}
			const declared = [];
			if (typeof meta.main === "string" && meta.main) declared.push(meta.main);
			for (const v of Object.values(meta.exports || {})) if (typeof v === "string") declared.push(v);
			else if (v && typeof v === "object" && typeof v.default === "string") declared.push(v.default);
			const declaredSet = new Set(declared.filter((r) => r && !r.includes("*") && !r.startsWith("http")));
			const candidates = [
				...declaredSet,
				"lib/host.js",
				"lib/index.js",
				"dist/index.js",
				"lib/client.js",
				"dist/client.js"
			];
			let hostText = "";
			let clientText = "";
			const missingEntries = [];
			for (const rel of [...new Set(candidates)]) {
				if (!rel || rel.includes("*") || rel.startsWith("http")) continue;
				const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}${rel}`);
				if (r.status === 200) {
					if (/client/i.test(rel)) clientText += "\n" + r.body;
					else hostText += "\n" + r.body;
				} else if (declaredSet.has(rel)) missingEntries.push(rel.replace(/^\.\//, ""));
			}
			if (meta.dsh?.bundle?.patch) {
				const pr = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${base}${meta.dsh.bundle.patch}`);
				if (pr.status === 200) hostText += "\n" + pr.body;
			}
			return {
				hostText,
				clientText,
				missingEntries,
				meta
			};
		}
		/** Deep scan of a candidate repo's files (network) — used before pnpm runs. */
		async analyzeMarketishCandidate(owner, repo, subdir) {
			const f = await this.fetchCandidateTexts(owner, repo, subdir);
			if (!f) return isMarketishName(repo);
			return isMarketPluginText(f.hostText, f.clientText) || isMarketishName(repo);
		}
		async anyInstalledMarketish() {
			try {
				const p = await this.readProfile();
				const inst = await this.installedMap(p);
				for (const rec of new Set(Object.values(inst))) if (KNOWN_MARKET_REPOS[(rec.owner + "/" + rec.repo).toLowerCase()] !== void 0 || Object.values(KNOWN_MARKET_REPOS).includes(rec.name) || isMarketishName(rec.name) || await this.scanLocalMarketish(rec.name)) return rec.name;
			} catch {}
			return null;
		}
		/**
		* Roots where a module may actually live: the profile's own node_modules,
		* the `profiles/node_modules` installation fallback (where DSH's own
		* @deepseek-ai packages sit), and every node_modules above ctx.baseUrl
		* (the installation/app layout, e.g. react under apps/web).
		*/
		async resolveModuleRoots() {
			const roots = [];
			try {
				const dir = await this.getProfileDir();
				roots.push(join(dir, "node_modules"));
				roots.push(join(dirname(dir), "node_modules"));
			} catch {}
			try {
				const start = this.ctx.baseUrl;
				if (start) {
					let current = start;
					for (let i = 0; i < 8; i++) {
						roots.push(join(current, "node_modules"));
						const parent = dirname(current);
						if (parent === current) break;
						current = parent;
					}
				}
			} catch {}
			return roots;
		}
		async installedVersionOf(name) {
			for (const root of await this.resolveModuleRoots()) try {
				const pkg = JSON.parse(readFileSync(join(root, name, "package.json"), "utf8"));
				if (pkg.version) return pkg.version;
			} catch {}
			return null;
		}
		/** True when a module is reachable through the profile or the installation. */
		async moduleProvided(name) {
			try {
				const p = await this.readProfile();
				if (Object.keys(p.dependencies || {}).includes(name)) return true;
			} catch {}
			return await this.installedVersionOf(name) !== null;
		}
		/**
		* True when an installed package declares `dsh.bundle.patch` — i.e. it is a
		* profile bundle that may join `dsh.profile.bundles`. A package without that
		* declaration (e.g. a client-only theme) must NEVER be pushed into bundles:
		* the dsh loader reads every bundles entry expecting `dsh.bundle`, and one
		* that lacks it makes dsh refuse to start ("declares no dsh.bundle"). This
		* mirrors the official `dsh plugin` reconcile rule.
		*/
		async isBundlePackage(name) {
			try {
				const dir = await this.getProfileDir();
				const meta = JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"));
				return Boolean(meta.dsh?.bundle?.patch);
			} catch {
				return false;
			}
		}
		/** Every loader row id declared by an installed bundle, mapped to its package. */
		async installedPatchIds() {
			const map = /* @__PURE__ */ new Map();
			try {
				const dir = await this.getProfileDir();
				const p = await this.readProfile();
				const deps = Object.keys(p.dependencies || {});
				for (const name of deps) try {
					const meta = JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"));
					if (!meta.dsh?.bundle?.patch) continue;
					const ids = extractPatchIds(readFileSync(join(dir, "node_modules", name, meta.dsh.bundle.patch), "utf8"));
					for (const id of ids) if (!map.has(id)) map.set(id, name);
				} catch {}
			} catch {}
			return map;
		}
		/**
		* Pre-install conflict analysis against the candidate repo's manifest and
		* code. Hard problems block the install; soft problems become warnings.
		*/
		async analyzeCandidateConflicts(owner, repo, subdir) {
			const block = [];
			const warn = [];
			const f = await this.fetchCandidateTexts(owner, repo, subdir);
			if (!f) return {
				block,
				warn,
				usage: []
			};
			const meta = f.meta;
			if (f.missingEntries.length > 0) {
				if (hasBuildScript(meta.scripts)) warn.push(`入口文件缺失(${f.missingEntries.join("、")}),但声明了构建脚本会在安装时现场生成 — 会自动放行构建脚本,装完重启生效`);
				else block.push(`入口文件缺失:${f.missingEntries.join("、")} — 构建产物没提交到仓库,装了也加载不起来`);
			}
			for (const d of Object.keys(meta.dependencies || {})) if (isHostCorePackage(d)) block.push(`官方包${d}应为peer依赖`);
			if (!fieldSupports(meta.os, process.platform)) block.push(`不支持当前系统:该插件仅支持 ${(meta.os || []).join("、")},你当前是 ${process.platform},装了 dsh 大概率起不来`);
			if (!fieldSupports(meta.cpu, process.arch)) block.push(`不支持当前 CPU:该插件仅支持 ${(meta.cpu || []).join("、")},你当前是 ${process.arch}`);
			const candIds = extractPatchIds(f.hostText);
			const installedIds = await this.installedPatchIds();
			for (const id of candIds) {
				const holder = installedIds.get(id);
				if (holder && holder !== meta.name) block.push(`挂载行${id}与${holder}重复`);
			}
			for (const [dep, range] of [...Object.entries(meta.dependencies || {}), ...Object.entries(meta.peerDependencies || {})]) {
				if (dep.startsWith("@deepseek-ai/")) continue;
				const installedVer = await this.installedVersionOf(dep);
				if (installedVer && simpleMajorConflict(String(range), installedVer)) warn.push(`依赖 ${dep}:插件要求 ${range},本机已装 v${installedVer},大版本不一致`);
			}
			for (const [pd, range] of Object.entries(meta.peerDependencies || {})) {
				if (!pd.startsWith("@deepseek-ai/")) continue;
				const installedVer = await this.installedVersionOf(pd);
				if (installedVer && simpleMajorConflict(String(range), installedVer)) warn.push(`官方包 ${pd}:插件要求 ${range},本机是 v${installedVer},大版本不一致可能不兼容`);
			}
			const candHost = extractRegisteredNames(f.hostText, "host");
			const candClient = extractRegisteredNames(f.clientText, "client");
			try {
				const p = await this.readProfile();
				const bundles = Array.isArray(p.dsh?.profile && p.dsh.profile.bundles) ? p.dsh.profile.bundles : [];
				for (const dname of Object.keys(p.dependencies || {})) {
					if (!bundles.includes(dname)) continue;
					const names = await this.scanLocalNames(dname);
					for (const nm of candHost) if (names.host.has(nm)) block.push(`服务名${nm}与${dname}重复注册`);
					for (const nm of candClient) if (names.client.has(nm)) warn.push(`界面注册名${nm}与${dname}重复,可能互相覆盖`);
				}
			} catch {}
			for (const sec of scanSecurity(f.hostText, "宿主代码")) warn.push(`安全提示:${sec.title}`);
			for (const sec of scanSecurity(f.clientText, "界面代码")) warn.push(`安全提示:${sec.title}`);
			return {
				block,
				warn,
				usage: describeUsage(f.hostText, f.clientText),
				name: meta.name,
				scripts: meta.scripts
			};
		}
		healthCacheGet(key) {
			const hit = this.healthCache.get(key);
			if (hit && Date.now() - hit.at < 12e5) return hit.data;
			return null;
		}
		healthCacheSet(key, data) {
			this.healthCache.set(key, {
				at: Date.now(),
				data
			});
		}
		/** 给体检加整体超时:网络慢时宁可返回 unknown,也不能拖死模型调用。 */
		withHealthTimeout(p, key) {
			const fallback = {
				status: "unknown",
				summary: "网络较慢,体检没跑完;装之前先在插件市场详情页确认一下",
				checks: []
			};
			return Promise.race([p.then((res) => {
				if (res.status !== "unknown") this.healthCacheSet(key, res);
				return res;
			}), new Promise((resolve) => {
				setTimeout(() => resolve(fallback), HEALTH_TIMEOUT_MS);
			})]);
		}
		/**
		* 装前体检:判断一个候选仓库是不是"一装就能用"。只读操作,不发安装命令。
		* 检查:入口文件真实存在、挂载补丁存在、官方包依赖写法、peer 依赖本机
		* 有着落、安装脚本联网下载、宿主代码调用外部程序、仓库归档/停更状态。
		*/
		async analyzeCandidateHealth(owner, repo, kind) {
			const checks = [];
			const base = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
			try {
				const pkgRes = await this.ghGet(base + "package.json");
				if (pkgRes.status !== 200) {
					if (kind === "multi") {
						checks.push({
							level: "warn",
							title: "根目录没有 package.json",
							detail: "这是多插件仓库,插件都在子目录里;直接装根仓库会失败,需要在插件市场里选定子包再装。"
						});
						return {
							status: "warn",
							summary: "多插件仓库:需要先选子包",
							checks
						};
					}
					if (kind === "plugin") {
						checks.push({
							level: "error",
							title: "读不到 package.json",
							detail: "仓库标的是插件,但根目录读不到 package.json,按现在的安装方式会装不上。"
						});
						return {
							status: "error",
							summary: "package.json 缺失,装不上",
							checks
						};
					}
					return {
						status: "unknown",
						summary: "读不到 package.json,无法体检",
						checks
					};
				}
				let meta;
				try {
					meta = JSON.parse(pkgRes.body);
				} catch {
					checks.push({
						level: "error",
						title: "package.json 不是合法 JSON",
						detail: "pnpm/loader 解析会失败,装完直接报错。"
					});
					return {
						status: "error",
						summary: "package.json 无法解析",
						checks
					};
				}
				if (kind === "unknown") this.kindCache.set((owner + "/" + repo).toLowerCase(), meta.dsh?.bundle?.patch ? "plugin" : meta.dsh?.client ? "client" : "nonplugin");
				const canon = (rel) => rel.replace(/^\.\//, "");
				const entries = /* @__PURE__ */ new Set();
				if (typeof meta.main === "string" && meta.main && !meta.main.includes("*") && !meta.main.startsWith("http")) entries.add(canon(meta.main));
				for (const v of Object.values(meta.exports || {})) {
					const rel = typeof v === "string" ? v : v && typeof v === "object" && typeof v.default === "string" ? v.default : "";
					if (rel && !rel.includes("*") && !rel.startsWith("http")) entries.add(canon(rel));
					if (entries.size >= 2) break;
				}
				const hostEntry = entries.size > 0 ? [...entries][0] : "lib/index.js";
				const wantPatch = meta.dsh?.bundle?.patch || "";
				const [missingEntries, patchMissing, hostText, clientText, repoMeta] = await Promise.all([
					(async () => {
						const miss = [];
						for (const rel of entries) if ((await this.ghGet(base + rel)).status !== 200) miss.push(rel);
						return miss;
					})(),
					(async () => {
						if (!wantPatch) return false;
						return (await this.ghGet(base + wantPatch)).status !== 200;
					})(),
					(async () => {
						if (kind !== "plugin" && kind !== "unknown") return "";
						const hr = await this.ghGet(base + hostEntry);
						return hr.status === 200 ? hr.body : "";
					})(),
					(async () => {
						const clientRel = Object.values(meta.exports || {}).map((v) => typeof v === "string" ? v : v && typeof v === "object" && typeof v.default === "string" ? v.default : "").find((rel) => rel && /client/i.test(rel));
						if (!clientRel) return "";
						const cr = await this.ghGet(base + canon(clientRel));
						return cr.status === 200 ? cr.body : "";
					})(),
					(async () => {
						const token = await this.resolveConfiguredToken();
						if (!token) return null;
						const mr = await this.ghApi("GET", `/repos/${owner}/${repo}`, token);
						if (mr.status !== 200) return null;
						try {
							return JSON.parse(mr.body);
						} catch {
							return null;
						}
					})()
				]);
				if (missingEntries.length > 0) {
					if (hasBuildScript(meta.scripts)) checks.push({
						level: "warn",
						title: `入口文件缺失:${missingEntries.join("、")}(有构建脚本会现场生成)`,
						detail: "构建产物没提交到 git,但声明了 prepare/preinstall 等构建脚本,安装时会自动放行构建并生成;若构建失败再重试即可。"
					});
					else checks.push({
						level: "error",
						title: `入口文件缺失:${missingEntries.join("、")}`,
						detail: "package.json 声明的入口在仓库里不存在——最常见的原因是构建产物(dist)没有提交到 git。装完 dsh 加载就会报错,插件等于用不了。"
					});
				}
				if (patchMissing) checks.push({
					level: "error",
					title: `挂载补丁缺失:${wantPatch}`,
					detail: "dsh.bundle.patch 指向的文件不在仓库里,插件装完也不会被挂载,等于没装。"
				});
				const officialDeps = Object.keys(meta.dependencies || {}).filter((d) => isHostCorePackage(d));
				if (officialDeps.length > 0) checks.push({
					level: "error",
					title: `官方核心包写进了 dependencies(共 ${officialDeps.length} 个)`,
					detail: `必须用 peerDependencies 引用:${officialDeps.join("、")}。写成直接依赖会装出第二份拷贝并劫持官方 loader 行,可能让 dsh 起不来。`
				});
				if (!fieldSupports(meta.os, process.platform)) checks.push({
					level: "error",
					title: `不支持当前系统:仅支持 ${(meta.os || []).join("、")}`,
					detail: `这个插件声明了操作系统限制(你当前是 ${process.platform}),装上去大概率起不来或直接报错。`
				});
				if (!fieldSupports(meta.cpu, process.arch)) checks.push({
					level: "error",
					title: `不支持当前 CPU:仅支持 ${(meta.cpu || []).join("、")}`,
					detail: `这个插件声明了 CPU 架构限制(你当前是 ${process.arch}),装上去大概率起不来。`
				});
				const peers = meta.peerDependencies || {};
				for (const pd of Object.keys(peers)) {
					if (meta.peerDependenciesMeta?.[pd]?.optional) continue;
					const range = String(peers[pd]);
					if (pd.startsWith("@deepseek-ai/")) {
						const iv = await this.installedVersionOf(pd);
						if (iv && simpleMajorConflict(range, iv)) checks.push({
							level: "warn",
							title: `官方包 ${pd} 版本可能不兼容`,
							detail: `插件要求 ${range},本机是 v${iv},大版本不一致时运行可能报错。`
						});
					} else if (!await this.moduleProvided(pd)) checks.push({
						level: "warn",
						title: `需要 peer 依赖 ${pd},本机还没装`,
						detail: "profile 默认不自动补装 peer;缺了它,插件运行时大概率直接报错。装完先看「一键检测」提示补什么。"
					});
				}
				for (const key of ["install", "postinstall"]) {
					const s = String((meta.scripts || {})[key] || "");
					if (s && /curl|wget|Invoke-WebRequest|download|https?:\/\/|node\s+(?:scripts?\/|\.\/scripts)/i.test(s)) checks.push({
						level: "warn",
						title: `${key} 脚本要从网络下载外部组件`,
						detail: `安装时会执行「${s.slice(0, 90)}」;网络不稳或没有代理时,安装可能卡住或失败。`
					});
				}
				if (hostText) {
					const externals = /* @__PURE__ */ new Set();
					const re = /(?:resolveExecutable|spawn)\s*\(\s*['"]([^'"]{1,40})['"]/g;
					let m;
					while ((m = re.exec(hostText)) !== null) {
						const bin = String(m[1] || "").toLowerCase().replace(/\.(?:exe|cmd|bat)$/i, "");
						if (bin && !COMMON_BINS.has(bin)) externals.add(bin);
					}
					if (externals.size > 0) checks.push({
						level: "warn",
						title: `运行时依赖外部程序:${[...externals].join("、")}`,
						detail: "这些命令不在 npm 依赖里,需要另外安装配置;没有它们插件装上了,对应功能也用不了。"
					});
					const refRe = /new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)|from\s+['"](\.\.?\/[^'"]+)['"]/g;
					const refs = /* @__PURE__ */ new Set();
					let rm;
					while ((rm = refRe.exec(hostText)) !== null) {
						const ref = String(rm[1] || rm[2] || "");
						if (ref && !ref.startsWith("http") && !ref.includes("*")) refs.add(resolveRel(dirname(hostEntry), ref));
					}
					const missingRefs = [];
					for (const ref of [...refs].slice(0, 3)) if ((await this.ghGet(base + ref)).status !== 200) missingRefs.push(ref);
					if (missingRefs.length > 0) {
						const engineLike = missingRefs.some((r) => /(?:^|\/)dist\//i.test(r) || /(?:main|cli|engine|server|worker|index)\.(?:m?js|cjs)$/i.test(r));
						checks.push({
							level: engineLike ? "error" : "warn",
							title: `宿主代码引用的文件在仓库里不存在:${missingRefs.join("、")}`,
							detail: engineLike ? "入口代码引用了没提交到 git 的构建产物(常见 dist/main.js),装完后运行时 spawn/import 一个不存在的文件,插件功能直接失效。" : "入口代码引用的资源文件不在仓库里,运行时读取可能报错。"
						});
					}
					const cfgRe = /~\/\.[A-Za-z0-9._-]+/g;
					const cfgs = /* @__PURE__ */ new Set();
					let cm;
					while ((cm = cfgRe.exec(hostText)) !== null) cfgs.add(cm[0]);
					if (cfgs.size > 0) checks.push({
						level: "warn",
						title: `依赖用户目录配置文件:${[...cfgs].slice(0, 3).join("、")}`,
						detail: "插件要读用户目录下的配置文件;全新安装时这个文件不存在,功能可能直接失效,需要先按 README 生成配置。"
					});
				}
				for (const f of scanSecurity(hostText, "宿主代码")) checks.push(f.level === "error" ? {
					level: "warn",
					title: f.title,
					detail: f.detail
				} : f);
				for (const f of scanSecurity(clientText, "界面代码")) checks.push(f.level === "error" ? {
					level: "warn",
					title: f.title,
					detail: f.detail
				} : f);
				if (repoMeta) {
					if (repoMeta.disabled) checks.push({
						level: "error",
						title: "仓库已被 GitHub 停用",
						detail: "git 安装会直接失败,不要推荐。"
					});
					if (repoMeta.archived) checks.push({
						level: "error",
						title: "仓库已归档(archived)",
						detail: "作者标记不再维护,出了问题不会修。"
					});
					if (repoMeta.fork) checks.push({
						level: "warn",
						title: "这是一个 fork 仓库",
						detail: "上游更新不会自动同步过来;原仓库更活跃的话,优先装原仓库。"
					});
					const pushed = repoMeta.pushed_at ? Date.parse(repoMeta.pushed_at) : 0;
					if (pushed > 0 && Date.now() - pushed > 31536e6) checks.push({
						level: "warn",
						title: "最后更新超过一年",
						detail: "可能已停止维护,和新版本 dsh 的兼容性没有保障。"
					});
				}
				const errors = checks.filter((c) => c.level === "error");
				const warns = checks.filter((c) => c.level === "warn");
				if (errors.length > 0) return {
					status: "error",
					summary: `${errors.length} 个硬伤:${errors.map((c) => c.title).join(";").slice(0, 140)}`,
					checks
				};
				if (warns.length > 0) return {
					status: "warn",
					summary: `${warns.length} 个风险点:${warns.map((c) => c.title).join(";").slice(0, 140)}`,
					checks
				};
				return {
					status: "ok",
					summary: "仓库结构、入口、依赖声明正常",
					checks
				};
			} catch (err) {
				return {
					status: "unknown",
					summary: `体检异常:${String(err?.message || err).slice(0, 80)}`,
					checks
				};
			}
		}
		/**
		* Probe for the running DeepSeek Harness version by walking up from the
		* config tree's baseUrl and reading the installation package.json.
		* Returns null when the installation cannot be located.
		*/
		harnessVersion() {
			try {
				const start = this.ctx.baseUrl;
				if (!start) return null;
				let current = start;
				for (let i = 0; i < 8; i++) {
					const pkgPath = join(current, "package.json");
					if (existsSync(pkgPath)) try {
						const meta = JSON.parse(readFileSync(pkgPath, "utf8"));
						const name = String(meta.name || "");
						if ((name.startsWith("@deepseek-ai/dsh") || name === "deepseek-harness") && meta.version) return meta.version;
					} catch {}
					const parent = dirname(current);
					if (parent === current) break;
					current = parent;
				}
			} catch {}
			return null;
		}
		/**
		* Run a pnpm command with the user's proxy inherited (Windows reads the
		* system proxy from the registry and exports it; Linux inherits HTTP_PROXY
		* from the environment naturally). When direct GitHub is known to be down
		* (this.directDown), the mirror rewrite is applied from the start so users
		* without a VPN do not burn a doomed direct attempt; otherwise the mirror
		* retry runs only after the direct attempt fails. The mirror rewrite maps
		* github.com URLs onto gh-proxy.com through per-process GIT_CONFIG_*
		* variables, touching no global git configuration.
		* When onProgress is given, stdout is streamed to it while pnpm runs.
		*/
		async pnpmShell(command, dir, onProgress) {
			const mirrorWin = "$env:GIT_CONFIG_COUNT=1; $env:GIT_CONFIG_KEY_0='url.https://gh-proxy.com/https://github.com/.insteadOf'; $env:GIT_CONFIG_VALUE_0='https://github.com/';";
			const registryWin = "$env:npm_config_registry='https://registry.npmmirror.com';";
			const body = command.replace(/^pnpm\s+/, "");
			let full;
			if (IS_WIN) {
				const proxySetup = [
					"$p=Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -ErrorAction SilentlyContinue;",
					"if($p -and $p.ProxyEnable -eq 1 -and $p.ProxyServer){",
					"  $s=''+$p.ProxyServer;",
					"  if($s -notmatch '^https?://'){ $s='http://'+$s };",
					"  $env:HTTPS_PROXY=$s; $env:HTTP_PROXY=$s; $env:ALL_PROXY=$s;",
					"  $env:NO_PROXY='localhost,127.0.0.1';",
					"};"
				].join(" ");
				const pnpmSetup = [
					"$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue;",
					"if (-not $pnpm) {",
					"  $cands = @((Join-Path $env:APPDATA 'npm\\pnpm.cmd'), (Join-Path $env:LOCALAPPDATA 'pnpm\\pnpm.cmd'), (Join-Path $env:ProgramFiles 'nodejs\\pnpm.cmd'));",
					"  $nodeSrc = (Get-Command node -ErrorAction SilentlyContinue).Source;",
					"  if ($nodeSrc) { $cands += (Join-Path (Split-Path $nodeSrc) 'pnpm.cmd') };",
					"  $found = $cands | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1;",
					"  if ($found) { $env:PATH = (Split-Path $found) + ';' + $env:PATH; $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue };",
					"};",
					"if (-not $pnpm) { $pnpm = 'corepack'; $pnpmArgs = 'pnpm' } else { $pnpmArgs = '' };"
				].join(" ");
				const run = "& $pnpm $pnpmArgs " + body;
				full = proxySetup + registryWin + pnpmSetup + mirrorWin + run + "; if ($LASTEXITCODE -ne 0) { Remove-Item Env:GIT_CONFIG_COUNT,Env:GIT_CONFIG_KEY_0,Env:GIT_CONFIG_VALUE_0 -ErrorAction SilentlyContinue;" + run + " }";
			} else full = "export npm_config_registry='https://registry.npmmirror.com';export GIT_CONFIG_COUNT=1; export GIT_CONFIG_KEY_0='url.https://gh-proxy.com/https://github.com/.insteadOf'; export GIT_CONFIG_VALUE_0='https://github.com/';" + command + " || { unset GIT_CONFIG_COUNT GIT_CONFIG_KEY_0 GIT_CONFIG_VALUE_0 2>/dev/null;" + command + " }";
			if (!onProgress) return this.runShell(full, dir);
			const handle = await this.spawnShell(full, dir);
			let offset = 0;
			let done = false;
			while (!done) {
				const settled = await Promise.race([handle.done.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 600))]);
				if (handle.collected?.stdout) {
					const text = handle.collected.stdout.readFrom(offset).text || "";
					if (text) {
						offset += text.length;
						onProgress(text);
					}
				}
				done = settled;
			}
			const outcome = await handle.done;
			let stdout = "";
			let stderr = "";
			if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || "";
			if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || "";
			return {
				outcome,
				stdout,
				stderr
			};
		}
		async getHome() {
			if (this.home) return this.home;
			const env = process.env.DSH_HOME;
			const base = env && env.trim() ? env.trim() : join(process.env.HOME || process.env.USERPROFILE || (IS_WIN ? "C:\\Users" : "/root"), ".dsh");
			this.home = base;
			return this.home;
		}
		/**
		* 桌面封装端(如 Deepseek Harness EAC)跑在专属 profile(如 web-desktop)上,
		* 通过环境变量 DSH_DESKTOP_PROFILE 导出其 profile 名(生态惯例,见
		* @sanqi-normal/dsh-webui-market-plugin);原生 CLI/web 不设置它,回退 DSH_PROFILE。
		* 两者取值都做格式校验(防路径穿越/空白)。见 issue #6。
		*/
		envProfileName() {
			for (const key of ["DSH_DESKTOP_PROFILE", "DSH_PROFILE"]) {
				const v = process.env[key];
				if (v && /^[A-Za-z0-9_-]+$/.test(v.trim())) return v.trim();
			}
			return null;
		}
		/** 给用户看的 `dsh plugin --profile <名>` 命令里用的 profile 名;探测失败回退 web,仅影响展示文案。 */
		async profileForCommand() {
			try {
				return await this.getProfileName();
			} catch {
				return "web";
			}
		}
		async getProfileName() {
			if (this.profileNameValue) return this.profileNameValue;
			const envProfile = this.envProfileName();
			if (envProfile) {
				this.profileNameValue = envProfile;
				return this.profileNameValue;
			}
			const h = await this.getHome();
			const dir = join(h, "profiles");
			let names = [];
			try {
				names = readdirSync(dir);
			} catch {
				names = [];
			}
			const candidates = names.filter((n) => n !== "node_modules" && n !== "plugins");
			const ordered = candidates.includes("web") ? ["web", ...candidates.filter((n) => n !== "web")] : candidates;
			for (const n of ordered) try {
				if (existsSync(join(dir, n, "package.json"))) {
					this.profileNameValue = n;
					break;
				}
			} catch {}
			if (!this.profileNameValue) throw new Error("no dsh profile found");
			return this.profileNameValue;
		}
		async getProfileDir() {
			if (this.profileDirValue) return this.profileDirValue;
			const h = await this.getHome();
			const p = await this.getProfileName();
			this.profileDirValue = join(h, "profiles", p);
			return this.profileDirValue;
		}
		/** dsh 用户级技能根目录:<DSH_HOME>/skills(dsh-skill-filesystem 的默认 user-dsh 根)。 */
		async getSkillsDir() {
			return join(await this.getHome(), "skills");
		}
		async skillManifestPath() {
			return join(await this.getHome(), "zat-skill-installs.json");
		}
		/** 技能安装清单:owner/repo → 复制进 skills 目录的条目(用于显示已安装 + 一键卸载)。 */
		async readSkillManifest() {
			try {
				const raw = readFileSync(await this.skillManifestPath(), "utf8").replace(/^\uFEFF/, "");
				const obj = JSON.parse(raw);
				const out = {};
				for (const [k, v] of Object.entries(obj)) {
					if (!v || typeof v !== "object") continue;
					const e = v;
					if (typeof e.owner !== "string" || typeof e.repo !== "string") continue;
					out[k.toLowerCase()] = {
						owner: e.owner,
						repo: e.repo,
						dirs: Array.isArray(e.dirs) ? e.dirs.filter((d) => typeof d === "string" && safeSkillEntryName(d)) : [],
						names: Array.isArray(e.names) ? e.names.filter((d) => typeof d === "string") : [],
						stars: typeof e.stars === "number" && e.stars > 0 ? e.stars : void 0
					};
				}
				return out;
			} catch {
				return {};
			}
		}
		async writeSkillManifest(manifest) {
			try {
				await this.writeFileText(await this.skillManifestPath(), JSON.stringify(manifest, null, 2));
			} catch {}
		}
		/** 技能(skill)包安装:clone 到临时目录 → 扫描 SKILL.md → 复制进 ~/.dsh/skills(立即生效,无需重启)。 */
		async installSkillsTask(owner, repo, taskId) {
			const o = safeSegment(owner);
			const r = safeSegment(repo);
			if (!o || !r) return {
				ok: false,
				message: "invalid repository name"
			};
			const staging = mkdtempSync(join(await this.getHome(), "zat-skill-"));
			let lastErr = "";
			try {
				this.setTaskStep(taskId, "download", `正在下载 ${o}/${r}…`);
				this.setTaskProgress(taskId, 8, `正在下载 ${o}/${r}…(网络慢时可能较久,请稍候)`);
				const cloneDir = join(staging, "repo");
				const urls = [
					`https://gh-proxy.com/https://github.com/${o}/${r}.git`,
					`https://ghfast.top/https://github.com/${o}/${r}.git`,
					`https://github.com/${o}/${r}.git`
				];
				let cloned = false;
				for (const u of urls) {
					const res = await this.runShell(`git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 clone --depth 1 --quiet "${u}" "${cloneDir}"`, void 0, 3e4);
					lastErr = String(res.stderr || res.stdout || "").trim();
					if (res.outcome.exitCode === 0) {
						cloned = true;
						break;
					}
				}
				if (!cloned) {
					if (/git[^\n]*(?:不是内部或外部命令|无法识别|command not found|is not recognized)/i.test(lastErr)) {
						this.recordIssue("没装 git", "装技能(skill)靠 git clone。解决:装 git(如 winget install Git.Git),再重试。");
						return {
							ok: false,
							message: "没装 git。先装 git(如 winget install Git.Git),再重试。"
						};
					}
					this.recordIssue("技能安装失败", `${o}/${r} 下载失败(网络)。`);
					return {
						ok: false,
						message: "下载失败:连不上 GitHub。请换个网络或稍后重试。"
					};
				}
				this.setTaskStep(taskId, "verify", "下载完成,正在扫描技能…");
				const skills = scanSkills(cloneDir);
				if (skills.length === 0) return {
					ok: false,
					notPlugin: true,
					kind: "none",
					message: "这个仓库里既没有插件声明,也没有可安装的技能(SKILL.md)。它不是 dsh 插件或技能,无法通过市场安装。"
				};
				const skillsDir = await this.getSkillsDir();
				mkdirSync(skillsDir, { recursive: true });
				const dirs = [];
				const names = [];
				for (const s of skills) {
					rmSync(join(skillsDir, s.dir), {
						recursive: true,
						force: true
					});
					cpSync(join(cloneDir, s.dir), join(skillsDir, s.dir), { recursive: true });
					dirs.push(s.dir);
					names.push(s.name);
				}
				const manifest = await this.readSkillManifest();
				let stars;
				try {
					const metaRes = await this.ghGet(`https://api.github.com/repos/${o}/${r}`);
					if (metaRes.status === 200) stars = JSON.parse(metaRes.body).stargazers_count;
				} catch {}
				manifest[(o + "/" + r).toLowerCase()] = {
					owner: o,
					repo: r,
					dirs,
					names,
					stars
				};
				await this.writeSkillManifest(manifest);
				this.invalidateListCache();
				this.setTaskProgress(taskId, 97, "安装完成");
				const first = names[0] || "";
				return {
					ok: true,
					packageName: o + "/" + r,
					kind: "skill",
					skills: names,
					message: `已安装技能 ${names.join("、")} — 立即生效(无需重启)。${first ? `用 /${first} 或在对话里让它按技能名调用。` : ""}`
				};
			} finally {
				rmSync(staging, {
					recursive: true,
					force: true
				});
			}
		}
		/**
		* Read the effective HTTP proxy once. Windows: the system proxy from the
		* registry (what a VPN's system-proxy mode sets); other platforms: the
		* HTTP(S)_PROXY environment the process inherited.
		*/
		proxyUrl = null;
		proxyLoaded = false;
		/** 代理(VPN)断开/失效后置真:后续 httpGet 直接跳过代理,不再每请求傻等它超时。 */
		proxyDown = false;
		async loadProxy() {
			if (this.proxyLoaded) return this.proxyUrl;
			this.proxyLoaded = true;
			if (IS_WIN) try {
				const r = await this.runShell("$p=Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -ErrorAction SilentlyContinue; if($p -and $p.ProxyEnable -eq 1 -and $p.ProxyServer){ $s=''+$p.ProxyServer; if($s -notmatch '^https?://'){ $s='http://'+$s }; Write-Output $s }", this.shellCwd());
				this.proxyUrl = (r.stdout || "").trim() || null;
			} catch {
				this.proxyUrl = null;
			}
			else this.proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
			return this.proxyUrl;
		}
		/**
		* Fetch one URL with a fallback chain that works without a VPN:
		* 1. curl through the configured proxy (system-proxy VPN mode);
		* 2. curl direct — fixes stale/dead proxy registry entries and networks
		*    that reach GitHub directly;
		* 3. wget direct (some Linux distributions ship only wget);
		* 4. Node's built-in fetch — needs no external tool at all.
		* A definitive HTTP answer (status ≥ 100) stops the chain.
		*/
		async httpGet(url) {
			let lastError = "";
			const proxy = await this.loadProxy();
			if (proxy && !this.proxyDown) {
				const r = await this.curlGet(url, proxy, "2");
				if (r.status > 0) return r;
				this.proxyDown = true;
				lastError = r.error || "";
			}
			const direct = await this.curlGet(url, null, "3");
			if (direct.status > 0) {
				this.proxyDown = false;
				return direct;
			}
			lastError = direct.error || lastError;
			const viaWget = await this.wgetGet(url);
			if (viaWget.status > 0) return viaWget;
			lastError = viaWget.error || lastError;
			const viaFetch = await this.fetchGet(url);
			if (viaFetch.status > 0) return viaFetch;
			return {
				status: 0,
				body: "",
				error: lastError || viaFetch.error || "all request methods failed"
			};
		}
		/** One curl attempt; proxy is an explicit --proxy URL or null for direct. */
		async curlGet(url, proxy, maxTime) {
			let curl = "curl";
			try {
				curl = await this.subprocess.resolveExecutable("curl");
			} catch {
				curl = "";
			}
			if (!curl) return {
				status: 0,
				body: "",
				error: "curl not available"
			};
			const argv = [
				curl,
				...proxy ? ["--proxy", proxy] : [],
				"-s",
				"-L",
				"--max-time",
				maxTime,
				"-w",
				"\n%{http_code}",
				"-H",
				"User-Agent: zat-dsh-engine/0.3.1",
				url
			];
			const handle = this.subprocess.spawn({
				argv,
				cwd: this.shellCwd(),
				stdio: {
					stdin: "ignore",
					stdout: { maxBytes: 16777216 },
					stderr: { maxBytes: 1048576 }
				},
				graceMs: 6e4
			});
			const outcome = await handle.done;
			let stdout = "";
			let stderr = "";
			if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || "";
			if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || "";
			if (outcome.exitCode === 0) {
				const lines = String(stdout).trimEnd().split("\n");
				const status = Number(lines.pop());
				if (Number.isFinite(status) && status > 0) return {
					status,
					body: lines.join("\n")
				};
				return {
					status: 200,
					body: lines.join("\n")
				};
			}
			if (stderr.trim()) return {
				status: 0,
				body: "",
				error: stderr.trim().slice(0, 200)
			};
			return {
				status: 0,
				body: "",
				error: "curl exited with code " + outcome.exitCode
			};
		}
		/** One wget attempt (direct; inherits the environment on non-Windows). */
		async wgetGet(url) {
			let wget = "wget";
			try {
				wget = await this.subprocess.resolveExecutable("wget");
			} catch {
				wget = "";
			}
			if (!wget) return {
				status: 0,
				body: "",
				error: "wget not available"
			};
			const handle = this.subprocess.spawn({
				argv: [
					wget,
					"-q",
					"-O-",
					"--server-response",
					"--timeout=5",
					"--max-redirect=5",
					"-U",
					"zat-dsh-engine/0.3.1",
					url
				],
				cwd: this.shellCwd(),
				stdio: {
					stdin: "ignore",
					stdout: { maxBytes: 16777216 },
					stderr: { maxBytes: 1048576 }
				},
				graceMs: 6e4
			});
			const outcome = await handle.done;
			let stdout = "";
			let stderr = "";
			if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || "";
			if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || "";
			const statusMatch = stderr.match(/HTTP\/\d(?:\.\d)?\s+(\d{3})/);
			if (statusMatch) return {
				status: Number(statusMatch[1]),
				body: stdout
			};
			if (outcome.exitCode === 0) return {
				status: 200,
				body: stdout
			};
			if (stderr.trim()) return {
				status: 0,
				body: "",
				error: stderr.trim().slice(0, 200)
			};
			return {
				status: 0,
				body: "",
				error: "wget exited with code " + outcome.exitCode
			};
		}
		/** Node built-in fetch — the final fallback that needs no external tool. */
		async fetchGet(url) {
			try {
				const controller = new AbortController();
				const timer = setTimeout(() => controller.abort(), 5e3);
				try {
					const res = await fetch(url, {
						signal: controller.signal,
						headers: { "User-Agent": "zat-dsh-engine/0.3.1" }
					});
					return {
						status: res.status,
						body: await res.text()
					};
				} finally {
					clearTimeout(timer);
				}
			} catch (err) {
				return {
					status: 0,
					body: "",
					error: String(err?.message || err).slice(0, 200)
				};
			}
		}
		async ghGet(url) {
			let lastError = "";
			if (!this.mirrorDown) {
				const mr = await this.curlGet(MIRROR + url, null, "4");
				if (mr.status === 200) return mr;
				if (mr.status >= 400) return mr;
				lastError = mr.error || "";
				this.mirrorDown = true;
			}
			const r = await this.httpGet(url);
			if (r.status === 200) {
				this.mirrorDown = false;
				return r;
			}
			if (r.status >= 400) return r;
			return {
				status: 0,
				body: "",
				error: r.error || lastError
			};
		}
		/**
		* GitHub 搜索优先走 token(配额 5000/h,模型连发查询也扛得住),失败再退回
		* 匿名通道;成功的响应体缓存 10 分钟,相近的重复查询直接命中缓存。
		*/
		async ghSearch(url) {
			const hit = this.searchCache.get(url);
			if (hit && Date.now() - hit.at < 6e5) return {
				status: 200,
				body: hit.body
			};
			let r = {
				status: 0,
				body: "",
				error: ""
			};
			const token = await this.resolveConfiguredToken();
			if (token) {
				const path = url.slice(22);
				r = await this.ghApi("GET", path, token);
			}
			if (r.status !== 200) r = await this.ghGet(url);
			if (r.status === 403 || r.status === 429) {
				const mr = await this.httpGet(MIRROR + url);
				if (mr.status === 200) r = mr;
			}
			if (r.status === 200) {
				if (this.searchCache.size > 300) {
					const first = this.searchCache.keys().next().value;
					if (first !== void 0) this.searchCache.delete(first);
				}
				this.searchCache.set(url, {
					at: Date.now(),
					body: r.body
				});
			}
			return r;
		}
		async readProfile() {
			const dir = await this.getProfileDir();
			return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
		}
		async writeProfile(obj) {
			const dir = await this.getProfileDir();
			await this.writeFileText(join(dir, "package.json"), JSON.stringify(obj, null, 2));
		}
		async installedMap(p) {
			const map = {};
			const deps = p.dependencies || {};
			const bundles = Array.isArray(p.dsh?.profile && p.dsh.profile.bundles) ? p.dsh.profile.bundles : [];
			const clientInserts = await this.clientInsertNames();
			for (const key of Object.keys(deps)) {
				const spec = String(deps[key] || "");
				const rec = {
					name: key,
					spec,
					enabled: bundles.includes(key) || clientInserts.has(key)
				};
				map[key.toLowerCase()] = rec;
				const bare = key.replace(/^@[\w.-]+\//, "");
				if (!map[bare.toLowerCase()]) map[bare.toLowerCase()] = rec;
				const gitMatch = spec.match(/(?:github\.com[\/:]|github:|git@github\.com:)([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[#/].*)?$/i);
				if (gitMatch) {
					rec.owner = gitMatch[1];
					rec.repo = gitMatch[2];
					const pathMatch = spec.match(/#(?:[^&]*&)?path:([^&]+)/);
					if (pathMatch) rec.subdir = decodeURIComponent(pathMatch[1]).replace(/^\/+/, "");
					map[(gitMatch[1] + "/" + gitMatch[2]).toLowerCase()] = rec;
				}
			}
			const skillManifest = await this.readSkillManifest();
			for (const key of Object.keys(skillManifest)) {
				const entry = skillManifest[key];
				if (entry.dirs.length === 0) continue;
				map[key.toLowerCase()] = {
					name: entry.owner + "/" + entry.repo,
					spec: "skill:" + key,
					owner: entry.owner,
					repo: entry.repo,
					enabled: true,
					stars: entry.stars
				};
			}
			return map;
		}
		cacheGet(key) {
			const c = this.caches.get(key);
			if (c && Date.now() - c.at < TTL) return c.data;
			return null;
		}
		cacheSet(key, data) {
			this.caches.set(key, {
				at: Date.now(),
				data
			});
		}
		/** Mutating operations must drop stale list snapshots or cards show outdated install state. */
		invalidateListCache() {
			this.caches.clear();
			this.cacheEpoch++;
			if (this.listCacheFile) try {
				unlinkSync(this.listCacheFile);
			} catch {}
		}
		/** 列表缓存持久化到 profile 目录:重启后同查询直接读磁盘,不再消耗 GitHub 配额。 */
		async loadListCache() {
			if (this.listCacheLoaded) return;
			this.listCacheLoaded = true;
			try {
				const dir = await this.getProfileDir();
				this.listCacheFile = join(dir, "plugin-market-list.json");
			} catch {
				return;
			}
			try {
				const raw = readFileSync(this.listCacheFile, "utf8");
				const obj = JSON.parse(raw);
				for (const [k, v] of Object.entries(obj)) if (v && typeof v === "object" && typeof v.at === "number" && "data" in v) this.caches.set(k, {
					at: v.at,
					data: v.data
				});
			} catch {}
		}
		/** 把当前列表缓存写回磁盘(小文件,调用频率低,直接写)。epoch 变化(安装/卸载清过缓存)就放弃。 */
		async saveListCache(epoch) {
			if (!this.listCacheFile) return;
			try {
				const obj = {};
				for (const [k, v] of this.caches) obj[k] = {
					at: v.at,
					data: v.data
				};
				if (epoch !== void 0 && epoch !== this.cacheEpoch) return;
				await this.writeFileText(this.listCacheFile, JSON.stringify(obj));
			} catch {}
		}
		async loadZhCache() {
			if (this.zhLoaded) return;
			this.zhLoaded = true;
			const bundled = zh_intro_default;
			for (const key of Object.keys(bundled)) {
				const v = bundled[key];
				if (typeof v === "string" && v.trim()) this.zhCache.set(key.toLowerCase(), {
					at: Date.now(),
					zh: v.trim()
				});
				else if (v && typeof v === "object" && v.zh) this.zhCache.set(key.toLowerCase(), {
					at: v.at || 0,
					zh: v.zh
				});
			}
			try {
				const dir = await this.getProfileDir();
				this.zhCacheFile = join(dir, "plugin-market-zh.json");
				const raw = readFileSync(this.zhCacheFile, "utf8");
				const data = JSON.parse(String(raw).replace(/^\uFEFF/, ""));
				for (const key of Object.keys(data)) {
					const v = data[key];
					if (typeof v === "string" && v.trim()) this.zhCache.set(key.toLowerCase(), {
						at: Date.now(),
						zh: v.trim()
					});
					else if (v && typeof v === "object" && v.zh) this.zhCache.set(key.toLowerCase(), {
						at: v.at || 0,
						zh: v.zh
					});
				}
			} catch {
				this.zhCacheFile = null;
			}
		}
		async saveZhCache() {
			if (!this.zhCacheFile || !this.cacheDirty) return;
			this.cacheDirty = false;
			try {
				const obj = {};
				for (const [k, v] of this.zhCache) obj[k] = {
					at: v.at,
					zh: v.zh
				};
				await this.writeFileText(this.zhCacheFile, JSON.stringify(obj));
			} catch {}
		}
		async remoteVersion(owner, repo, subdir) {
			const path = subdir ? `${subdir}/package.json` : "package.json";
			const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`);
			if (r.status !== 200) return null;
			try {
				return JSON.parse(r.body).version || null;
			} catch {
				return null;
			}
		}
		async localVersion(name) {
			try {
				const dir = await this.getProfileDir();
				return JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8")).version || null;
			} catch {
				return null;
			}
		}
		/** gh-proxy mirror URL for a `github:owner/repo` spec, preserving the `#path:` subdir. */
		mirrorSpecFor(spec) {
			const m = String(spec).match(/^github:([\w.-]+)\/([\w.-]+?)(#.*)?$/i);
			if (!m) return null;
			return `https://gh-proxy.com/https://github.com/${m[1]}/${m[2]}.git${m[3] || ""}`;
		}
		/** All mirror install specs (gh-proxy, then ghfast.top) for a github spec. */
		mirrorSpecs(spec) {
			const m = String(spec).match(/^github:([\w.-]+)\/([\w.-]+?)(#.*)?$/i);
			if (!m) return [];
			const out = [];
			for (const host of ["https://gh-proxy.com/", "https://ghfast.top/"]) out.push(`${host}https://github.com/${m[1]}/${m[2]}.git${m[3] || ""}`);
			return out;
		}
		/** 记录市场自己报过的错(24h 内),一键检测会把这些也一起列出来。 */
		recordIssue(title, detail, level = "error") {
			const now = Date.now();
			while (this.recentIssues.length && now - this.recentIssues[0].at > 864e5) this.recentIssues.shift();
			if (!this.recentIssues.some((i) => i.title === title)) this.recentIssues.push({
				at: now,
				level,
				title,
				detail
			});
			while (this.recentIssues.length > 30) this.recentIssues.shift();
		}
		async addSpec(owner, repo, subdir, taskId, preAnalysis) {
			const o = safeSegment(owner);
			const repoName = safeSegment(repo);
			const s = subdir === void 0 ? void 0 : safeSubdir(subdir);
			if (!o || !repoName || s === null) return {
				ok: false,
				packageName: null,
				message: "invalid repository name or subdirectory"
			};
			const spec = s ? `github:${o}/${repoName}#path:${s}` : "github:" + o + "/" + repoName;
			const dir = await this.getProfileDir();
			const gate = await this.checkMarketConflict(o, repoName);
			if (gate) return {
				ok: false,
				packageName: null,
				message: gate
			};
			const analysis = preAnalysis || await this.analyzeCandidateConflicts(o, repoName, s || void 0);
			if (analysis.block.length > 0) return {
				ok: false,
				packageName: null,
				message: `安装已拦截:${analysis.block.join(";")}。确要强制安装请用官方命令。`
			};
			const warnings = analysis.warn.length > 0 ? analysis.warn.join("; ") : void 0;
			this.invalidateListCache();
			const snap = await this.snapshotProfile(dir);
			if (analysis.name && hasBuildScript(analysis.scripts)) await this.ensureAllowBuilds(analysis.name);
			if (taskId) {
				this.setTaskStep(taskId, "download", "正在下载安装包…");
				this.setTaskProgress(taskId, 12, "正在下载安装包…(已进行 0 秒)");
			}
			const startedAt = Date.now();
			const progress = taskId ? (text) => {
				const lines = String(text).split(/\r?\n/).filter(Boolean);
				let counts = "";
				for (let i = lines.length - 1; i >= 0; i--) {
					const line = lines[i];
					if (line.includes("Progress:")) {
						counts = line.slice(line.indexOf("Progress:")).trim().slice(0, 70);
						break;
					}
				}
				const secs = Math.floor((Date.now() - startedAt) / 1e3);
				const pct = Math.min(82, 12 + secs * 2);
				this.setTaskProgress(taskId, pct, `正在下载安装包…(已进行 ${secs} 秒)${counts ? " · " + counts : ""}`);
			} : void 0;
			const candidates = this.directDown ? [...this.mirrorSpecs(spec), spec] : [spec, ...this.mirrorSpecs(spec)];
			let pnpmResult = await this.pnpmShell("pnpm add " + candidates[0], dir, progress);
			for (let i = 1; i < candidates.length && pnpmResult.outcome.exitCode !== 0; i++) {
				const alt = await this.pnpmShell("pnpm add " + candidates[i], dir, progress);
				if (alt.outcome.exitCode === 0) pnpmResult = alt;
			}
			if (pnpmResult.outcome.exitCode !== 0) {
				const firstErr = String(pnpmResult.stderr || pnpmResult.stdout || "");
				if (/PREPARE_NOT_ALLOWED|allowBuilds|build script/i.test(firstErr)) {
					const allowedName = extractBuildName(firstErr) || analysis.name || null;
					if (allowedName) {
						await this.restoreProfile(dir, snap);
						await this.ensureAllowBuilds(allowedName);
						pnpmResult = await this.pnpmShell("pnpm add " + candidates[0], dir, progress);
						for (let i = 1; i < candidates.length && pnpmResult.outcome.exitCode !== 0; i++) {
							const alt = await this.pnpmShell("pnpm add " + candidates[i], dir, progress);
							if (alt.outcome.exitCode === 0) pnpmResult = alt;
						}
					}
				}
			}
			if (pnpmResult.outcome.exitCode !== 0) {
				await this.restoreProfile(dir, snap);
				const errText = String(pnpmResult.stderr || pnpmResult.stdout || "");
				if (/pnpm[^\n]*(?:不是内部或外部命令|无法识别|command not found|is not recognized)|corepack[^\n]*(?:不是内部或外部命令|无法识别|command not found|is not recognized)/i.test(errText)) {
					this.recordIssue("没装 pnpm", "装/更新插件都靠它。解决:终端跑 corepack enable(或 npm i -g pnpm)。");
					return {
						ok: false,
						packageName: null,
						message: "没装 pnpm。先跑一条: corepack enable(或 npm i -g pnpm),再重试。"
					};
				}
				if (errText.includes("PREPARE_NOT_ALLOWED") || errText.includes("allowBuilds") || errText.includes("build script")) {
					this.recordIssue("插件要跑构建脚本被拦截", "已自动尝试放行该插件的构建脚本,仍被拦;请手动检查 pnpm-workspace.yaml 的 allowBuilds 是否有该包名。", "warn");
					return {
						ok: false,
						packageName: null,
						message: "安装失败:插件要跑构建脚本,已自动放行仍被拦(已还原)。可手动在 pnpm-workspace.yaml 的 allowBuilds 里确认该包名后重试。"
					};
				}
				const lastLine = errText.trim().split(/\r?\n/).filter(Boolean).pop() || "";
				const accessDenied = /UnauthorizedAccess|EACCES|EPERM|access is denied|access denied|拒绝访问|没有权限|权限不够|Permission Denied/i.test(errText);
				const networkish = /UND_ERR|ECONN|ETIMEDOUT|Failed to connect|ENOTFOUND|network|fetch/i.test(errText);
				const reason = accessDenied ? "文件被占用或没有写权限(多半是文件被别的程序锁住、目录只读,或需要管理员权限)" : networkish ? "连不上 GitHub/npm(网络问题)" : lastLine.slice(0, 120) || "未知原因";
				const advice = accessDenied ? "解决:关掉占用它的程序(先停 DSH)、确认目录不是只读、必要时用管理员运行,再重试。" : "换个网络或稍后重试。";
				this.recordIssue("安装/更新失败", reason);
				return {
					ok: false,
					packageName: null,
					message: `安装失败:${reason}。已自动回滚。${advice}`
				};
			}
			if (taskId) {
				this.setTaskStep(taskId, "verify", "下载完成,正在校验并写入启用名单…");
				this.setTaskProgress(taskId, 87, "下载完成,正在校验并写入启用名单…");
			}
			const after = await this.readProfile();
			const deps = Object.keys(after.dependencies || {});
			const bundles = Array.isArray(after.dsh?.profile && after.dsh.profile.bundles) ? [...after.dsh.profile.bundles] : [];
			let added = null;
			let matched = false;
			let missingBundle = false;
			let clientOnly = false;
			let matchedName = null;
			for (const name of deps) {
				if (bundles.includes(name)) continue;
				if (!String((after.dependencies || {})[name] || "").toLowerCase().includes(o.toLowerCase() + "/" + repoName.toLowerCase())) continue;
				matched = true;
				matchedName = name;
				try {
					const meta = JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"));
					if (meta.dsh?.bundle?.patch) {
						bundles.push(name);
						added = name;
					} else {
						missingBundle = true;
						if (meta.dsh?.client) clientOnly = true;
					}
				} catch {}
			}
			if (added) {
				after.dsh = after.dsh || {};
				after.dsh.profile = after.dsh.profile || {};
				after.dsh.profile.bundles = bundles;
				await this.writeProfile(after);
				try {
					const checkBundles = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).dsh?.profile?.bundles;
					if (!Array.isArray(checkBundles) || !checkBundles.includes(added)) throw new Error("bundles not persisted");
				} catch {
					await this.restoreProfile(dir, snap);
					return {
						ok: false,
						packageName: null,
						message: "安装成功但启用名单写入校验失败,已自动回滚到安装前状态。请重试或手动编辑 profile。"
					};
				}
				await this.saveLastKnownGood();
				if (taskId) this.setTaskProgress(taskId, 97, "写入完成,收尾中…");
				return {
					ok: true,
					packageName: added,
					warning: warnings
				};
			}
			if (missingBundle) {
				if (clientOnly && matchedName) {
					await this.upsertClientInsert(matchedName);
					try {
						if (!(await this.clientInsertNames()).has(matchedName)) throw new Error("insert not persisted");
					} catch {
						await this.restoreProfile(dir, snap);
						return {
							ok: false,
							packageName: null,
							message: "安装成功但自动注册写入校验失败,已回滚。请重试或手动在 cordis.patch.yml 里加 insert 行。"
						};
					}
					await this.saveLastKnownGood();
					if (taskId) this.setTaskProgress(taskId, 97, "写入完成,收尾中…");
					return {
						ok: true,
						packageName: matchedName,
						warning: warnings,
						hotReload: true
					};
				}
				return {
					ok: false,
					packageName: matchedName,
					installedAsDisabled: true,
					message: "安装完成,但该仓库没有声明 dsh.bundle,无法作为插件加载——它可能只是普通库或代码仓库,不是 dsh 插件。已作为普通依赖保留,重启也不会生效。"
				};
			}
			if (matched) return {
				ok: false,
				packageName: null,
				message: "安装记录已写入,但未能定位到已安装的包文件。请稍后重试,或检查 profile 的 node_modules。"
			};
			return {
				ok: false,
				packageName: null,
				message: "pnpm 报告成功,但依赖列表里没有出现该仓库。安装可能未完成,请重试。"
			};
		}
		async list(page, sort, q, category) {
			try {
				const sortKey = sort === "updated" ? "updated" : "stars";
				const pageNum = Math.max(1, Number(page) || 1);
				const qText = String(q || "").trim();
				const cat = String(category || "全部");
				const catQuery = CATEGORY_QUERY[cat] || "";
				await this.loadListCache();
				const cacheKey = `list:${sortKey}:${pageNum}:${qText}:${cat}`;
				let profile = null;
				try {
					profile = await this.readProfile();
				} catch {
					profile = null;
				}
				const inst = profile ? await this.installedMap(profile) : {};
				const cached = this.cacheGet(cacheKey);
				if (cached) return Array.isArray(cached.items) ? {
					...cached,
					items: this.restampInstalled(cached.items, inst)
				} : cached;
				const query = "topic:dsh-plugin" + (catQuery ? "+" + encodeQueryPart(catQuery) : "") + (qText ? "+" + encodeQueryPart(qText) : "");
				await this.loadZhCache();
				const seed = this.seedList(sortKey, qText, catQuery, inst, pageNum);
				if (seed) {
					if (pageNum === 1) this.refreshListFromGitHub(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst);
					return {
						ok: true,
						items: seed.items,
						total: seed.total,
						hasMore: pageNum * 100 < seed.total,
						page: pageNum,
						llmUsable: false,
						source: "seed"
					};
				}
				return await this.fetchListPage(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst);
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/** 从 GitHub 拉一页并构造列表(缓存 miss 与后台刷新共用)。epoch 非空时,期间发生安装/卸载就丢弃结果。 */
		async fetchListPage(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst, epoch) {
			const url = `https://api.github.com/search/repositories?q=${query}&sort=${sortKey}&order=desc&per_page=100&page=${pageNum}`;
			let r = await this.ghSearch(url);
			if (r.status === 200 && qText) try {
				const j = JSON.parse(r.body);
				if (j && Array.isArray(j.items) && j.items.length === 0) {
					const broad = `https://api.github.com/search/repositories?q=${encodeQueryPart(qText)}+dsh-plugin&sort=${sortKey}&order=desc&per_page=100&page=${pageNum}`;
					r = await this.ghSearch(broad);
				}
			} catch {}
			if (r.status !== 200) {
				const why = r.status === 403 || r.status === 429 ? "搜索太频繁被限流,稍后再试。" : r.status === 400 || r.status === 422 ? "搜索词无效,换个说法试试。" : "连不上 GitHub,请开代理或稍后重试。";
				return {
					ok: false,
					message: `搜索失败(${r.status})。${why}`
				};
			}
			let json = null;
			try {
				json = JSON.parse(r.body);
			} catch {
				json = null;
			}
			if (json === null || !Array.isArray(json.items)) return {
				ok: false,
				message: "unexpected GitHub response"
			};
			const items = json.items.map((raw) => this.mapRawItem(raw, inst)).filter((item) => item.fullName.toLowerCase() !== SELF_REPO);
			const data = {
				ok: true,
				items,
				total: json.total_count || 0,
				hasMore: pageNum * 100 < (json.total_count || 0),
				page: pageNum,
				llmUsable: false,
				source: this.directDown ? "mirror" : "direct"
			};
			if (epoch !== void 0 && epoch !== this.cacheEpoch) return data;
			this.cacheSet(cacheKey, data);
			await this.saveListCache(epoch);
			this.startKindScan(items.map((item) => ({
				owner: item.owner,
				name: item.name,
				fullName: item.fullName
			})));
			return data;
		}
		/** 一条 GitHub 搜索结果 → 列表项(含已装状态/中文简介/类型)。 */
		mapRawItem(raw, inst) {
			const it = raw;
			const fullName = it.full_name || "";
			const cachedZh = this.zhCache.get(fullName.toLowerCase());
			const zhIntro = cachedZh && Date.now() - cachedZh.at < ZH_TTL ? cachedZh.zh : "";
			const rec = inst[fullName.toLowerCase()] || inst[String(it.name || "").toLowerCase()];
			const isHarness = HARNESS_REPOS.includes(fullName.toLowerCase());
			const kind = this.kindOf(fullName.toLowerCase());
			return {
				fullName,
				owner: it.owner ? it.owner.login : "",
				name: it.name || "",
				description: it.description || "",
				zhIntro: zhIntro || "",
				needZh: !zhIntro,
				stars: it.stargazers_count || 0,
				forks: it.forks_count || 0,
				language: it.language || "",
				topics: Array.isArray(it.topics) ? it.topics : [],
				updatedAt: it.updated_at || "",
				htmlUrl: it.html_url || "",
				homepage: it.homepage || "",
				installed: isHarness || (rec ? rec.enabled : false),
				installedName: isHarness ? null : rec ? rec.name : null,
				installedVersion: isHarness ? this.harnessVersion() : null,
				isHarness: Boolean(isHarness),
				disabled: Boolean(rec && !rec.enabled),
				kind,
				cover: "https://opengraph.githubassets.com/1/" + fullName
			};
		}
		/** 缓存命中时,用当前 installedMap 重盖每张卡的 installed/installedName/disabled。 */
		restampInstalled(items, inst) {
			return items.map((it) => {
				if (it.isHarness) return it;
				const rec = inst[it.fullName.toLowerCase()] || inst[String(it.name || "").toLowerCase()];
				if (rec) {
					const installed = rec.enabled;
					const installedName = rec.name;
					const disabled = !rec.enabled;
					if (it.installed === installed && it.installedName === installedName && it.disabled === disabled) return it;
					return {
						...it,
						installed,
						installedName,
						disabled
					};
				}
				if (it.installed || it.disabled) return {
					...it,
					installed: false,
					installedName: null,
					disabled: false
				};
				return it;
			});
		}
		/** 内置快照按查询过滤+排序,返回可渲染列表(首次加载零网络秒开);匹配不到返回 null。 */
		/** 内置快照按查询过滤+排序,按页返回(与真实分页行为一致,本地秒翻页);匹配不到返回 null。 */
		seedList(sortKey, qText, catQuery, inst, pageNum) {
			const src = market_snapshot_default;
			if (!Array.isArray(src) || src.length === 0) return null;
			const terms = [];
			if (qText) terms.push(...qText.toLowerCase().split(/\s+/).filter(Boolean));
			if (catQuery) terms.push(catQuery.toLowerCase());
			let matched = src;
			if (terms.length > 0) matched = src.filter((it) => {
				const hay = (it.n + " " + it.d).toLowerCase();
				return terms.every((t) => hay.includes(t));
			});
			if (matched.length === 0) return null;
			const sorted = [...matched].sort((a, b) => sortKey === "updated" ? b.u > a.u ? 1 : -1 : b.s - a.s);
			const total = sorted.length;
			const slice = sorted.slice((pageNum - 1) * 100, pageNum * 100);
			if (slice.length === 0) return null;
			const items = slice.map((e) => this.mapRawItem({
				full_name: e.f,
				name: e.n,
				description: e.d,
				stargazers_count: e.s,
				forks_count: e.k,
				language: e.l,
				topics: e.t,
				updated_at: e.u,
				html_url: e.h,
				homepage: e.p,
				owner: { login: e.o }
			}, inst)).filter((item) => item.fullName.toLowerCase() !== SELF_REPO);
			return items.length > 0 ? {
				items,
				total
			} : null;
		}
		refreshingList = /* @__PURE__ */ new Set();
		/** 快照顶上后,后台静默拉真实数据替换缓存;失败无碍(快照继续用)。 */
		async refreshListFromGitHub(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst) {
			if (this.refreshingList.has(cacheKey)) return;
			this.refreshingList.add(cacheKey);
			const epoch = this.cacheEpoch;
			try {
				await this.fetchListPage(cacheKey, sortKey, pageNum, qText, cat, catQuery, query, inst, epoch);
			} catch {} finally {
				this.refreshingList.delete(cacheKey);
			}
		}
		async versions() {
			const map = {};
			try {
				const p = await this.readProfile();
				const inst = await this.installedMap(p);
				const seen = {};
				for (const key of Object.keys(inst)) {
					const entry = inst[key];
					if (!entry.owner || !entry.repo) {
						const name = entry.name;
						if (!name || name.startsWith("@deepseek-ai/")) continue;
						const bare = name.replace(/^@[\w.-]+\//, "").toLowerCase();
						if (seen["npm:" + bare]) continue;
						seen["npm:" + bare] = true;
						try {
							const local = await this.localVersion(name);
							let remote = null;
							const reg = await this.httpGet(`https://registry.npmjs.org/${name.replace("/", "%2F")}`);
							if (reg.status === 200) try {
								remote = JSON.parse(reg.body)["dist-tags"]?.latest || null;
							} catch {
								remote = null;
							}
							map[name.toLowerCase()] = {
								local,
								remote,
								hasUpdate: !!(local && remote && compareVersions(remote, local) > 0)
							};
						} catch {}
						continue;
					}
					const full = entry.owner + "/" + entry.repo;
					if (seen[full]) continue;
					seen[full] = true;
					const local = await this.localVersion(entry.name);
					const remote = await this.remoteVersion(entry.owner, entry.repo, entry.subdir);
					map[full.toLowerCase()] = {
						local,
						remote,
						hasUpdate: !!(local && remote && compareVersions(remote, local) > 0)
					};
				}
			} catch {}
			return {
				ok: true,
				map
			};
		}
		async translate(items) {
			const list = Array.isArray(items) ? items : [];
			const map = {};
			await this.loadZhCache();
			for (const it of list) {
				const key = String(it.fullName || "").toLowerCase();
				if (!key) continue;
				const cached = this.zhCache.get(key);
				if (cached && Date.now() - cached.at < ZH_TTL) map[it.fullName || key] = cached.zh;
			}
			return {
				ok: true,
				map,
				llmUsable: false,
				pending: 0
			};
		}
		async installed() {
			try {
				const p = await this.readProfile();
				const inst = await this.installedMap(p);
				const seen = /* @__PURE__ */ new Set();
				const entries = [];
				for (const key of Object.keys(inst)) {
					const entry = inst[key];
					if (seen.has(entry.name)) continue;
					seen.add(entry.name);
					entries.push({
						key,
						name: entry.name,
						spec: entry.spec
					});
				}
				const profile = p.dsh?.profile || {};
				return {
					ok: true,
					profileName: await this.getProfileName(),
					home: await this.getHome(),
					profileDir: await this.getProfileDir(),
					bundles: profile.bundles || [],
					dependencies: p.dependencies || {},
					entries
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		async detail(owner, repo) {
			try {
				const o = safeSegment(owner);
				const r = safeSegment(repo);
				if (!o || !r) return {
					ok: false,
					message: "invalid repository name"
				};
				const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`);
				const isMonorepo = rootPkg.status !== 200;
				let notPlugin = false;
				if (isMonorepo) {
					const sub = await this.subpackages(o, r);
					notPlugin = !(sub.ok && Array.isArray(sub.packages) && sub.packages.length > 0);
				}
				const files = [
					"README.zh.md",
					"README_zh.md",
					"README.md",
					"readme.md",
					"README.en.md"
				];
				let readme = "";
				let image = null;
				for (const file of files) {
					const res = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/${file}`);
					if (res.status === 200 && res.body) {
						readme = res.body;
						break;
					}
				}
				let summary = "";
				if (readme) summary = readme.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\(([^)\s]+)\)/g, (_all, u) => {
					if (!image) image = u;
					return " ";
				}).replace(/[#>*`|_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
				const isHarness = HARNESS_REPOS.includes((o + "/" + r).toLowerCase());
				const harnessLocal = isHarness ? this.harnessVersion() : null;
				const harnessRemote = isHarness ? await this.remoteVersion(o, r) : null;
				let detailOs = [];
				let detailCpu = [];
				if (rootPkg.status === 200) try {
					const pkgMeta = JSON.parse(rootPkg.body);
					detailOs = Array.isArray(pkgMeta.os) ? pkgMeta.os : [];
					detailCpu = Array.isArray(pkgMeta.cpu) ? pkgMeta.cpu : [];
				} catch {}
				let usage = [];
				const texts = await this.fetchCandidateTexts(o, r);
				if (texts) usage = describeUsage(texts.hostText, texts.clientText);
				return {
					ok: true,
					readme,
					summary,
					image,
					isMonorepo,
					notPlugin: Boolean(notPlugin),
					isHarness: Boolean(isHarness),
					harnessVersion: harnessLocal,
					harnessRemote,
					harnessHasUpdate: isHarness && !!(harnessLocal && harnessRemote && compareVersions(harnessRemote, harnessLocal) > 0),
					os: detailOs,
					cpu: detailCpu,
					usage
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/** Read one repo's declared os/cpu support (cached 30 min; [] = cross-platform). */
		async fetchOs(owner, repo) {
			const key = (owner + "/" + repo).toLowerCase();
			const hit = this.osCache.get(key);
			if (hit && Date.now() - hit.at < 18e5) return {
				os: hit.os,
				cpu: hit.cpu
			};
			const r = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`);
			if (r.status !== 200) return null;
			try {
				const meta = JSON.parse(r.body);
				const os = Array.isArray(meta.os) ? meta.os : [];
				const cpu = Array.isArray(meta.cpu) ? meta.cpu : [];
				this.osCache.set(key, {
					at: Date.now(),
					os,
					cpu
				});
				return {
					os,
					cpu
				};
			} catch {
				return null;
			}
		}
		/** Batch: resolve declared os/cpu for a list of repos (for card labels). */
		async osMap(fullNames) {
			const map = {};
			const jobs = (Array.isArray(fullNames) ? fullNames.slice(0, 100) : []).map((full) => async () => {
				const seg = String(full).split("/");
				const owner = safeSegment(seg[0] || "");
				const repo = safeSegment(seg.slice(1).join("/"));
				if (!owner || !repo) return;
				const res = await this.fetchOs(owner, repo);
				if (res) map[String(full).toLowerCase()] = res;
			});
			let next = 0;
			const worker = async () => {
				while (next < jobs.length) {
					const j = jobs[next++];
					await j();
				}
			};
			const workers = [];
			for (let w = 0; w < 6; w++) workers.push(worker());
			await Promise.all(workers);
			return {
				ok: true,
				map
			};
		}
		/** True when this market is installed from a local path (link:/file:/workspace:) — a dev checkout. */
		async isSelfLinkInstalled() {
			try {
				const deps = (await this.readProfile()).dependencies || {};
				for (const [name, spec] of Object.entries(deps)) if (name === "zat-dsh-engine" || /zat-dsh-engine/i.test(String(spec))) {
					if (/^(?:link|file|workspace):/i.test(String(spec))) return true;
				}
			} catch {}
			return false;
		}
		async selfupdate(doUpdate, zhLocale) {
			const parts = SELF_REPO.split("/");
			const owner = parts[0];
			const repo = parts[1];
			if (await this.isSelfLinkInstalled()) return {
				ok: !doUpdate,
				hasUpdate: false,
				current: SELF_VERSION,
				latestVersion: null,
				devLink: true,
				message: doUpdate ? "当前是本地链接安装(link:)的开发版,不能从 GitHub 覆盖更新;想换回 GitHub 版请先卸载再重装。" : "当前是本地链接安装(link:)的开发版,市场不检查 GitHub 更新,本地代码即最新。"
			};
			if (!doUpdate) {
				const remote = await this.remoteVersion(owner, repo);
				if (!remote || compareVersions(remote, SELF_VERSION) <= 0) return {
					ok: true,
					hasUpdate: false,
					current: SELF_VERSION,
					latestVersion: remote
				};
				let changes = [];
				try {
					const readmeLang = zhLocale ? "README.zh.md" : "README.md";
					const readme = await this.ghGet(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${readmeLang}`);
					if (readme.status === 200) {
						const lines = readme.body.split(/\r?\n/);
						let inBlock = false;
						for (const line of lines) {
							const isVersionHeading = /^###\s+v/.test(line);
							if (inBlock) {
								if (/^#{2,3}\s/.test(line)) break;
								if (line.startsWith("- ")) {
									changes.push(line.slice(2).trim());
									if (changes.length >= 6) break;
								}
							} else if (isVersionHeading) inBlock = true;
						}
					}
				} catch {}
				return {
					ok: true,
					hasUpdate: true,
					current: SELF_VERSION,
					latestVersion: remote,
					changes
				};
			}
			const spec = "github:" + owner + "/" + repo;
			const candidates = this.directDown ? [...this.mirrorSpecs(spec), spec] : [spec, ...this.mirrorSpecs(spec)];
			return {
				ok: true,
				taskId: this.launchTask(async (id) => {
					this.setTaskStep(id, "update", "正在下载市场新版本…");
					this.setTaskProgress(id, 8, "正在下载市场新版本…(网络慢时可能较久,请稍候)");
					const dir = await this.getProfileDir();
					const startedAt = Date.now();
					const progress = () => {
						const secs = Math.floor((Date.now() - startedAt) / 1e3);
						this.setTaskProgress(id, Math.min(80, 8 + secs * 2), `正在下载市场新版本…(已进行 ${secs} 秒)`);
					};
					let r = await this.pnpmShell("pnpm add " + candidates[0], dir, progress);
					for (let i = 1; i < candidates.length && r.outcome.exitCode !== 0; i++) {
						const alt = await this.pnpmShell("pnpm add " + candidates[i], dir, progress);
						if (alt.outcome.exitCode === 0) r = alt;
					}
					if (r.outcome.exitCode !== 0) {
						const p = await this.profileForCommand();
						this.recordIssue("市场自更新失败", `点更新没成功(网络或 pnpm)。手动一条命令: dsh plugin --profile ${p} add https://gh-proxy.com/https://github.com/${owner}/${repo}.git`);
						return {
							ok: false,
							message: `升级失败。手动一条命令搞定: dsh plugin --profile ${p} add https://gh-proxy.com/https://github.com/${owner}/${repo}.git`
						};
					}
					this.invalidateListCache();
					await this.saveLastKnownGood();
					this.setTaskProgress(id, 97, "下载完成,收尾中…");
					return {
						ok: true,
						message: "已更新到 v" + await this.remoteVersion(owner, repo) + " — 重启 dsh 后生效"
					};
				})
			};
		}
		async subpackages(owner, repo) {
			try {
				const o = safeSegment(owner);
				const r = safeSegment(repo);
				if (!o || !r) return {
					ok: false,
					kind: "none",
					packages: [],
					message: "invalid repository name"
				};
				const rootPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`);
				if (rootPkg.status === 200) try {
					const meta = JSON.parse(rootPkg.body);
					if (meta.dsh?.bundle?.patch) return {
						ok: true,
						kind: "single",
						packages: [{
							dir: "",
							name: meta.name || r,
							version: meta.version || ""
						}]
					};
				} catch {}
				const listing = await this.ghGet(`https://api.github.com/repos/${o}/${r}/contents/`);
				if (listing.status !== 200) return {
					ok: false,
					kind: "none",
					packages: [],
					message: "cannot list repository contents"
				};
				let entries = [];
				try {
					entries = JSON.parse(listing.body);
				} catch {}
				if (!Array.isArray(entries)) return {
					ok: false,
					kind: "none",
					packages: [],
					message: "unexpected repository listing"
				};
				const pkgs = [];
				for (const raw of entries) {
					const entry = raw;
					if (!entry || entry.type !== "dir" || !entry.name) continue;
					const subPkg = await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/${entry.name}/package.json`);
					if (subPkg.status !== 200) continue;
					try {
						const meta = JSON.parse(subPkg.body);
						if (meta.dsh?.bundle?.patch) pkgs.push({
							dir: entry.name,
							name: meta.name || entry.name,
							version: meta.version || ""
						});
					} catch {}
				}
				return {
					ok: true,
					kind: pkgs.length > 0 ? "multi" : "none",
					packages: pkgs
				};
			} catch (err) {
				return {
					ok: false,
					kind: "none",
					packages: [],
					message: String(err?.message || err)
				};
			}
		}
		async install(owner, repo, subdir) {
			try {
				const o = safeSegment(owner);
				const r = safeSegment(repo);
				const s = safeSubdir(subdir);
				if (!o || !r || s === null) return {
					ok: false,
					message: "invalid repository name or subdirectory"
				};
				const gate = await this.checkMarketConflict(o, r);
				if (gate) return {
					ok: false,
					packageName: null,
					message: gate
				};
				if (!s) {
					if ((await this.ghGet(`https://raw.githubusercontent.com/${o}/${r}/HEAD/package.json`)).status !== 200) {
						const sub = await this.subpackages(o, r);
						if (sub.ok && Array.isArray(sub.packages) && sub.packages.length > 0) {
							if (sub.packages.length === 1) {
								const only = sub.packages[0];
								return {
									ok: true,
									taskId: this.launchTask(async (id) => {
										this.setTaskStep(id, "check", "正在做安装前检查(冲突/依赖)…");
										const holder = await this.anyInstalledMarketish();
										if (holder && await this.analyzeMarketishCandidate(o, r, only.dir)) return {
											ok: false,
											packageName: null,
											message: `已拦截:装了市场类插件 ${holder},再装会互相冲突导致 dsh 起不来。想换用请先卸载它。`
										};
										this.setTaskStep(id, "download", `正在下载安装 ${only.name || o + "/" + r}…(网络慢时可能较久,请稍候)`);
										const res = await this.addSpec(o, r, only.dir, id);
										return res.ok ? {
											ok: true,
											packageName: res.packageName,
											message: res.hotReload ? `已安装 ${only.name || o + "/" + r}(主题/界面插件)— 刷新页面即可生效${res.warning ? "。风险提示:" + res.warning : ""}` : `已安装 ${only.name || o + "/" + r} — 重启 dsh 生效${res.warning ? "。风险提示:" + res.warning : ""}`
										} : {
											ok: false,
											packageName: res.packageName,
											installedAsDisabled: res.installedAsDisabled === true,
											message: res.message
										};
									}, {
										owner: o,
										repo: r
									})
								};
							}
							return {
								ok: false,
								kind: "multi",
								packages: sub.packages,
								message: "这个插件包含多个部分,请选择要安装的:"
							};
						}
						return {
							ok: true,
							taskId: this.launchTask((id) => this.installSkillsTask(o, r, id), {
								owner: o,
								repo: r
							})
						};
					}
				}
				return {
					ok: true,
					taskId: this.launchTask(async (id) => {
						this.setTaskStep(id, "check", "正在做安装前检查(冲突/依赖)…");
						const holder = await this.anyInstalledMarketish();
						if (holder && await this.analyzeMarketishCandidate(o, r, s || void 0)) return {
							ok: false,
							packageName: null,
							message: `已拦截:装了市场类插件 ${holder},再装会互相冲突导致 dsh 起不来。想换用请先卸载它。`
						};
						const analysis = await this.analyzeCandidateConflicts(o, r, s || void 0);
						if (analysis.block.length > 0) return {
							ok: false,
							packageName: null,
							message: `安装已拦截:${analysis.block.join(";")}。确要强制安装请用官方命令。`
						};
						if (analysis.warn.length > 0) this.setTaskProgress(id, 10, `检查完成:发现风险 — ${analysis.warn.join("; ")}。不拦截,继续安装…`);
						this.setTaskStep(id, "download", "正在下载安装包…(网络慢时可能较久,请稍候)");
						const res = await this.addSpec(o, r, s || void 0, id, analysis);
						return res.ok ? {
							ok: true,
							packageName: res.packageName,
							message: res.hotReload ? `已安装(主题/界面插件)— 刷新页面即可生效。${res.warning ? "。风险提示:" + res.warning : ""}` : `已安装 github:${o}/${r}${s ? `#path:${s}` : ""} — 重启 dsh 后生效。${analysis.usage[0] || ""}${res.warning ? "。风险提示:" + res.warning : ""}`
						} : {
							ok: false,
							packageName: res.packageName,
							installedAsDisabled: res.installedAsDisabled === true,
							message: res.message
						};
					}, {
						owner: o,
						repo: r
					})
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		async update(owner, repo, subdir) {
			try {
				const o = safeSegment(owner);
				const r = safeSegment(repo);
				const s = safeSubdir(subdir);
				if (!o || !r || s === null) return {
					ok: false,
					message: "invalid repository name or subdirectory"
				};
				const gate = await this.checkMarketConflict(o, r);
				if (gate) return {
					ok: false,
					message: gate
				};
				return {
					ok: true,
					taskId: this.launchTask(async (id) => {
						this.setTaskStep(id, "check", "正在做更新前检查(冲突/依赖)…");
						const analysis = await this.analyzeCandidateConflicts(o, r, s || void 0);
						if (analysis.block.length > 0) return {
							ok: false,
							message: `更新已拦截:${analysis.block.join(";")}。确要强制更新请用官方命令。`
						};
						if (analysis.warn.length > 0) this.setTaskProgress(id, 10, `检查完成:发现风险 — ${analysis.warn.join("; ")}。不拦截,继续更新…`);
						this.setTaskStep(id, "download", "正在下载新版本…(网络慢时可能较久,请稍候)");
						const res = await this.addSpec(o, r, s || void 0, id, analysis);
						const version = await this.remoteVersion(o, r, s || void 0);
						return res.ok ? {
							ok: true,
							version,
							message: `已更新 github:${o}/${r}${s ? `#path:${s}` : ""} 到 v${version || "?"} — 重启 dsh 后生效。${analysis.usage[0] || ""}${res.warning ? "。风险提示:" + res.warning : ""}`
						} : {
							ok: false,
							packageName: res.packageName,
							installedAsDisabled: res.installedAsDisabled === true,
							message: res.message
						};
					}, {
						owner: o,
						repo: r
					})
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/** 更新一个纯 npm / 本地安装的插件(没有 GitHub 仓库地址)。 */
		async updateNpm(name) {
			try {
				const n = safePackageName(name);
				if (!n) return {
					ok: false,
					message: "invalid package name"
				};
				const dir = await this.getProfileDir();
				this.invalidateListCache();
				const snap = await this.snapshotProfile(dir);
				const r = await this.pnpmShell("pnpm update " + n, dir);
				if (r.outcome.exitCode !== 0) {
					await this.restoreProfile(dir, snap);
					return {
						ok: false,
						message: `更新失败,已还原。${(r.stderr || r.stdout || "").trim().slice(-160)}`
					};
				}
				await this.saveLastKnownGood();
				return {
					ok: true,
					message: `已更新 ${n} — 重启 dsh 后生效`
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		async uninstall(name) {
			const n = safePackageName(name);
			if (!n) return {
				ok: false,
				message: "invalid package name"
			};
			if (n === "zat-dsh-engine") return {
				ok: false,
				message: "市场不能卸载自己,已阻止。如需移除,请用官方命令: dsh plugin --profile <你的profile> remove zat-dsh-engine"
			};
			const skillManifest = await this.readSkillManifest();
			const skillEntry = skillManifest[n.toLowerCase()];
			if (skillEntry && skillEntry.dirs.length > 0) {
				const skillsDir = await this.getSkillsDir();
				const removed = [];
				for (const d of skillEntry.dirs) {
					const p = join(skillsDir, d);
					if (existsSync(p)) {
						rmSync(p, {
							recursive: true,
							force: true
						});
						removed.push(d);
					}
				}
				delete skillManifest[n.toLowerCase()];
				await this.writeSkillManifest(skillManifest);
				this.invalidateListCache();
				return {
					ok: true,
					message: `已卸载技能 ${removed.join("、") || name} — 立即生效`
				};
			}
			return {
				ok: true,
				taskId: this.launchTask(async (id) => {
					try {
						this.setTaskStep(id, "uninstall", `正在卸载 ${n}…`);
						this.setTaskProgress(id, 8, `正在卸载 ${n}…`);
						const dir = await this.getProfileDir();
						this.invalidateListCache();
						const snap = await this.snapshotProfile(dir);
						const startedAt = Date.now();
						const r = await this.pnpmShell("pnpm remove " + n, dir, (text) => {
							const secs = Math.floor((Date.now() - startedAt) / 1e3);
							this.setTaskProgress(id, Math.min(80, 8 + secs * 2), `正在卸载 ${n}…(已进行 ${secs} 秒)`);
						});
						if (r.outcome.exitCode !== 0) {
							await this.restoreProfile(dir, snap);
							return {
								ok: false,
								message: (r.stderr || r.stdout || "pnpm failed").slice(0, 2e3) + " — profile 配置已自动回滚"
							};
						}
						this.setTaskProgress(id, 87, "卸载完成,正在清理启用名单…");
						const after = await this.readProfile();
						const profile = after.dsh?.profile || {};
						const bundles = Array.isArray(profile.bundles) ? profile.bundles.filter((b) => b !== n) : [];
						if (bundles.length !== (profile.bundles || []).length) {
							after.dsh = after.dsh || {};
							after.dsh.profile = after.dsh.profile || {};
							after.dsh.profile.bundles = bundles;
							await this.writeProfile(after);
						}
						await this.removeClientInsert(n);
						await this.saveLastKnownGood();
						this.setTaskProgress(id, 97, "清理完成,收尾中…");
						return {
							ok: true,
							message: `已卸载 ${n} — 重启 dsh 后不再加载`
						};
					} catch (err) {
						return {
							ok: false,
							message: String(err?.message || err)
						};
					}
				})
			};
		}
		/** Soft faces: the session panel degrades gracefully where services differ. */
		get persistenceFace() {
			return this.ctx.get("sessionPersistence");
		}
		get workspaceRegistryFace() {
			return this.ctx.get("workspaceRegistry");
		}
		get agentsFace() {
			return this.ctx.get("agents");
		}
		get storageDomainFace() {
			return this.ctx.get("storageDomain");
		}
		get sessionsRegistryFace() {
			return this.ctx.get("sessions");
		}
		get sessionTitleFace() {
			return this.ctx.get("sessionTitle");
		}
		async listSessions() {
			try {
				const persistence = this.persistenceFace;
				if (!persistence) return {
					ok: false,
					message: "当前环境不支持会话管理"
				};
				const registry = this.workspaceRegistryFace;
				const agents = this.agentsFace;
				const headers = await persistence.list();
				const archived = registry ? registry.archivedSessionIds : [];
				const workspaces = registry ? registry.list() : [];
				const sessionsRegistry = this.sessionsRegistryFace;
				const titleService = this.sessionTitleFace;
				const projTable = (this.storageDomainFace?.get("session_projcache"))?.table("sessions");
				const sessions = [];
				for (const h of headers) {
					const live = Boolean(agents && agents.get(h.id) !== void 0 && agents.get(h.id).status === "running");
					let title = "";
					if (sessionsRegistry !== void 0 && titleService !== void 0) {
						const liveSession = sessionsRegistry.get(h.id);
						if (liveSession !== void 0) {
							const snap = titleService.get(liveSession);
							if (snap && snap.title) title = String(snap.title);
						}
					}
					if (!title && projTable !== void 0) try {
						const t = (await projTable.get(h.id))?.rows?.["title"]?.val;
						if (typeof t === "string" && t.trim()) title = t.trim();
					} catch {}
					sessions.push({
						id: h.id,
						title,
						createdAt: h.createdAt || 0,
						live,
						subagent: Boolean(h.origin === "subagent"),
						archived: archived.includes(h.id),
						inWorkspace: workspaces.some((w) => w.sessionIds.includes(h.id))
					});
				}
				const mains = sessions.filter((s) => !s.subagent);
				mains.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
				return {
					ok: true,
					sessions: mains
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		async deleteSession(sessionId) {
			try {
				const id = String(sessionId || "").trim();
				if (!/^[\w-]+$/.test(id)) return {
					ok: false,
					message: "invalid session id"
				};
				const persistence = this.persistenceFace;
				if (!persistence) return {
					ok: false,
					message: "当前环境不支持删除会话"
				};
				const agents = this.agentsFace;
				const agent = agents ? agents.get(id) : void 0;
				if (agent !== void 0 && agent.status === "running") return {
					ok: false,
					message: "这个会话正在运行,不能删除。等它跑完再删。"
				};
				if (agent !== void 0) try {
					const agentCtx = agent.ctx;
					if (agentCtx && typeof agentCtx.dispose === "function") agentCtx.dispose();
				} catch {}
				const header = (await persistence.list()).find((c) => c.id === id);
				const registry = this.workspaceRegistryFace;
				if (header === void 0) {
					if (!(registry !== void 0 && (registry.archivedSessionIds.includes(id) || registry.list().some((w) => w.sessionIds.includes(id))))) return {
						ok: false,
						message: "没有找到这个会话"
					};
					await this.forgetSessionCompat(registry, id);
					return {
						ok: true,
						message: `已清理会话 ${id} 的记账记录`
					};
				}
				if (header.origin === "subagent") return {
					ok: false,
					message: "子代理会话不能直接删除"
				};
				const location = persistence.locate(header);
				if (location === void 0) return {
					ok: false,
					message: "这个会话没有可删除的本地文件"
				};
				try {
					rmSync(dirname(location.path), {
						recursive: true,
						force: true
					});
				} catch (err) {
					return {
						ok: false,
						message: `删除会话文件失败:${err?.message || String(err)}`
					};
				}
				let warning = "";
				if (registry !== void 0) warning = await this.forgetSessionCompat(registry, id);
				try {
					const domain = this.storageDomainFace?.get("session_projcache");
					if (domain) await domain.table("sessions").delete(id);
				} catch {}
				const sessionsStore = this.ctx.get("sessions");
				const liveSession = sessionsStore ? sessionsStore.get(id) : void 0;
				if (liveSession !== void 0 && sessionsStore?.store !== void 0) try {
					sessionsStore.store.delete(id);
					this.ctx.emit("session/disposed", liveSession);
					const agentsRegistry = this.ctx.get("agents");
					const liveAgent = agentsRegistry ? agentsRegistry.get(id) : void 0;
					if (liveAgent !== void 0 && agentsRegistry?.store !== void 0) {
						agentsRegistry.store.delete(id);
						this.ctx.emit("agent/disposed", liveAgent);
					}
				} catch {}
				let removedDescendants = 0;
				for (const d of await this.subagentDescendants(id)) {
					await this.purgeSubagent(d.id, d.header);
					removedDescendants++;
				}
				return {
					ok: true,
					message: `已删除会话 ${id}${removedDescendants > 0 ? ` 及其 ${removedDescendants} 个子代理` : ""}${warning ? "。" + warning : ""}`
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/** Forget a session everywhere: patched dsh has forgetSession; stock dsh falls back to per-workspace detach. */
		async forgetSessionCompat(registry, id) {
			if (typeof registry.forgetSession === "function") {
				await registry.forgetSession(id);
				return "";
			}
			for (const w of registry.list()) if (w.sessionIds.includes(id) && typeof w.detachSession === "function") try {
				await w.detachSession(id);
			} catch {}
			return "此版本 dsh 缺少清理归档记录的方法,归档集合里可能残留一条记录(不影响使用)";
		}
		/** 收集某主会话的全部子代理后代(按 parentSession 链,含孙辈)。只跟子代理节点,不动 fork 等普通子会话。 */
		async subagentDescendants(rootId) {
			const persistence = this.persistenceFace;
			if (!persistence) return [];
			const headers = await persistence.list();
			const childrenOf = /* @__PURE__ */ new Map();
			for (const h of headers) {
				if (h.origin !== "subagent") continue;
				const pid = h.parentSession;
				if (!pid) continue;
				const list = childrenOf.get(pid) ?? [];
				list.push({
					id: h.id,
					header: h
				});
				childrenOf.set(pid, list);
			}
			const out = [];
			const seen = /* @__PURE__ */ new Set([rootId]);
			const queue = [...childrenOf.get(rootId) ?? []];
			while (queue.length) {
				const node = queue.shift();
				if (seen.has(node.id)) continue;
				seen.add(node.id);
				out.push(node);
				for (const child of childrenOf.get(node.id) ?? []) queue.push(child);
			}
			return out;
		}
		/** 删除一个子代理会话(文件 + 记账 + 内存),尽力而为,单个失败不中断级联。 */
		async purgeSubagent(id, header) {
			const agents = this.agentsFace;
			const agent = agents ? agents.get(id) : void 0;
			if (agent !== void 0) try {
				if (agent.ctx && typeof agent.ctx.dispose === "function") agent.ctx.dispose();
			} catch {}
			const persistence = this.persistenceFace;
			const location = persistence ? persistence.locate(header) : void 0;
			if (location !== void 0) try {
				rmSync(dirname(location.path), {
					recursive: true,
					force: true
				});
			} catch {}
			const registry = this.workspaceRegistryFace;
			if (registry !== void 0) await this.forgetSessionCompat(registry, id);
			try {
				const domain = this.storageDomainFace?.get("session_projcache");
				if (domain) await domain.table("sessions").delete(id);
			} catch {}
			const sessionsStore = this.ctx.get("sessions");
			const liveSession = sessionsStore ? sessionsStore.get(id) : void 0;
			if (liveSession !== void 0 && sessionsStore?.store !== void 0) try {
				sessionsStore.store.delete(id);
				this.ctx.emit("session/disposed", liveSession);
				const agentsRegistry = this.ctx.get("agents");
				const liveAgent = agentsRegistry ? agentsRegistry.get(id) : void 0;
				if (liveAgent !== void 0 && agentsRegistry?.store !== void 0) {
					agentsRegistry.store.delete(id);
					this.ctx.emit("agent/disposed", liveAgent);
				}
			} catch {}
		}
		/**
		* The "installed" filter is served by this endpoint instead of paging
		* through star-sorted search results: every installed plugin with a known
		* repo is returned in one shot.
		*/
		async installedList() {
			try {
				await this.loadZhCache();
				const p = await this.readProfile();
				const inst = await this.installedMap(p);
				const unique = [];
				const noRepo = [];
				const seen = /* @__PURE__ */ new Set();
				for (const rec of new Set(Object.values(inst))) {
					let owner = rec.owner;
					let repo = rec.repo;
					if (!owner || !repo) {
						const known = Object.entries(KNOWN_MARKET_REPOS).find(([, pkg]) => pkg === rec.name);
						if (known) {
							const [full] = known;
							owner = full.split("/")[0];
							repo = full.split("/")[1];
						}
					}
					if (!owner || !repo) {
						const bare = rec.name.replace(/^@[\w.-]+\//, "");
						if (seen.has("npm:" + bare.toLowerCase())) continue;
						seen.add("npm:" + bare.toLowerCase());
						noRepo.push({
							name: rec.name,
							enabled: rec.enabled
						});
						continue;
					}
					const key = (owner + "/" + repo).toLowerCase();
					if (key === SELF_REPO) continue;
					if (seen.has(key)) continue;
					seen.add(key);
					unique.push({
						name: rec.name,
						owner,
						repo,
						enabled: rec.enabled,
						spec: rec.spec,
						stars: rec.stars
					});
				}
				for (const [taskId, task] of this.tasks) {
					if (task.done || !task.subject) continue;
					const fullName = task.subject.owner + "/" + task.subject.repo;
					if (fullName.toLowerCase() === SELF_REPO) continue;
					if (seen.has(fullName.toLowerCase())) continue;
					seen.add(fullName.toLowerCase());
					unique.push({
						name: fullName,
						owner: task.subject.owner,
						repo: task.subject.repo,
						enabled: false,
						installing: true,
						taskId
					});
				}
				const items = [];
				for (const rec of noRepo) {
					const version = await this.localVersion(rec.name);
					items.push({
						fullName: rec.name,
						owner: "",
						name: rec.name,
						description: "",
						zhIntro: "",
						needZh: false,
						stars: 0,
						forks: 0,
						language: "",
						topics: [],
						updatedAt: "",
						htmlUrl: "",
						homepage: "",
						installed: rec.enabled,
						installedName: rec.name,
						installedVersion: version,
						isHarness: false,
						disabled: !rec.enabled,
						kind: "plugin",
						noRepo: true,
						cover: ""
					});
				}
				const snapById = /* @__PURE__ */ new Map();
				for (const e of market_snapshot_default) snapById.set(String(e.f || "").toLowerCase(), e);
				for (const rec of unique) {
					const fullName = rec.owner + "/" + rec.repo;
					const snap = snapById.get(fullName.toLowerCase());
					const cachedZh = this.zhCache.get(fullName.toLowerCase());
					const zhIntro = cachedZh && Date.now() - cachedZh.at < ZH_TTL ? cachedZh.zh : "";
					const item = {
						fullName,
						owner: rec.owner,
						name: snap?.n || rec.repo,
						description: snap?.d || "",
						zhIntro: zhIntro || "",
						needZh: !zhIntro,
						stars: snap?.s || rec.stars || 0,
						forks: snap?.k || 0,
						language: snap?.l || "",
						topics: snap?.t || [],
						updatedAt: snap?.u || "",
						htmlUrl: snap?.h || `https://github.com/${fullName}`,
						homepage: snap?.p || "",
						installed: rec.enabled,
						installedName: rec.name,
						installedVersion: null,
						isHarness: Boolean(HARNESS_REPOS.includes(fullName.toLowerCase())),
						disabled: Boolean(!rec.enabled),
						kind: rec.spec && String(rec.spec).startsWith("skill:") ? "skill" : this.kindOf(fullName.toLowerCase()),
						cover: "https://opengraph.githubassets.com/1/" + fullName
					};
					if (rec.installing) item.installing = true;
					if (rec.taskId) item.taskId = rec.taskId;
					items.push(item);
				}
				return {
					ok: true,
					items,
					total: items.length,
					hasMore: false,
					page: 1
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/** Enable or disable one installed plugin (add/remove its bundle entry). */
		async setEnabled(name, enabled) {
			try {
				const n = safePackageName(name);
				if (!n) return {
					ok: false,
					message: "invalid package name"
				};
				const dir = await this.getProfileDir();
				this.invalidateListCache();
				const p = await this.readProfile();
				const profile = p.dsh?.profile || {};
				const bundles = Array.isArray(profile.bundles) ? [...profile.bundles] : [];
				if (await this.isClientOnlyPackage(n)) {
					if (enabled) {
						if ((await this.clientInsertNames()).has(n)) return {
							ok: true,
							enabled: true,
							message: `${n} 已经在启用`
						};
						await this.upsertClientInsert(n);
						if (!(await this.clientInsertNames()).has(n)) return {
							ok: false,
							message: "启用写入校验失败,请重试"
						};
						await this.saveLastKnownGood();
						return {
							ok: true,
							enabled: true,
							message: `${n} 已启用 — 重启 dsh 后生效`
						};
					}
					const removed = await this.removeClientInsert(n);
					await this.saveLastKnownGood();
					return removed ? {
						ok: true,
						enabled: false,
						message: `${n} 已停用 — 重启 dsh 后生效`
					} : {
						ok: true,
						enabled: false,
						message: `${n} 本来就没启用`
					};
				}
				if (enabled) {
					if (bundles.includes(n)) return {
						ok: true,
						enabled: true,
						message: `${n} 已经在启用列表中`
					};
					if (!await this.isBundlePackage(n)) return {
						ok: false,
						message: `${n} 没有声明 dsh.bundle,也不是 client-only 插件,市场不能自动启用。请按它的 README 手动注册。`
					};
					bundles.push(n);
				} else {
					if (!bundles.includes(n)) return {
						ok: true,
						enabled: false,
						message: `${n} 本来就不在启用列表中`
					};
					if (n.startsWith("@deepseek-ai/")) return {
						ok: false,
						message: `${n} 是官方基础组件,停用会导致 dsh 无法启动,已阻止`
					};
					bundles.splice(bundles.indexOf(n), 1);
				}
				const snap = await this.snapshotProfile(dir);
				p.dsh = p.dsh || {};
				p.dsh.profile = p.dsh.profile || {};
				p.dsh.profile.bundles = bundles;
				await this.writeProfile(p);
				try {
					const checkBundles = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).dsh?.profile?.bundles;
					if (!(enabled ? Array.isArray(checkBundles) && checkBundles.includes(n) : Array.isArray(checkBundles) && !checkBundles.includes(n))) throw new Error("bundle state not persisted");
				} catch {
					await this.restoreProfile(dir, snap);
					return {
						ok: false,
						message: "启用名单写入校验失败,已自动回滚"
					};
				}
				await this.saveLastKnownGood();
				let dependents = "";
				if (!enabled) try {
					const pDeps = Object.keys(p.dependencies || {});
					for (const dname of pDeps) {
						if (dname === n || !bundles.includes(dname)) continue;
						try {
							const meta = JSON.parse(readFileSync(join(dir, "node_modules", dname, "package.json"), "utf8"));
							if ([...Object.keys(meta.dependencies || {}), ...Object.keys(meta.peerDependencies || {})].includes(n)) dependents += (dependents ? "、" : "") + dname;
						} catch {}
					}
				} catch {}
				return {
					ok: true,
					enabled,
					message: enabled ? `${n} 已启用 — 重启 dsh 后生效` : `${n} 已停用 — 重启 dsh 后生效${dependents ? `。注意:${dependents} 依赖它,重启后可能加载失败` : ""}`
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/**
		* One-click health scan of every installed plugin: hard conflicts
		* (official deps, duplicate loader ids, multiple markets), soft risks
		* (version majors, missing peers) and informational items.
		*/
		/** pnpm 是否可用(装/更新/修复都靠它)。 */
		async pnpmAvailable() {
			try {
				await this.subprocess.resolveExecutable("pnpm");
				return true;
			} catch {}
			try {
				await this.subprocess.resolveExecutable("corepack");
				return true;
			} catch {}
			for (const cand of [
				join(process.env.APPDATA || "", "npm", "pnpm.cmd"),
				join(process.env.LOCALAPPDATA || "", "pnpm", "pnpm.cmd"),
				join(process.env.ProgramFiles || "", "nodejs", "pnpm.cmd")
			]) if (existsSync(cand)) return true;
			return false;
		}
		async healthCheck() {
			const issues = [];
			try {
				const dir = await this.getProfileDir();
				const p = await this.readProfile();
				const deps = Object.keys(p.dependencies || {});
				const bundles = Array.isArray(p.dsh?.profile && p.dsh.profile.bundles) ? p.dsh.profile.bundles : [];
				if (!await this.pnpmAvailable()) issues.push({
					level: "error",
					title: "没装 pnpm",
					detail: "装/更新插件都靠它。解决:点「一键修复」会自动装,或终端跑 corepack enable / npm i -g pnpm。",
					fixable: true
				});
				if ((await this.ghGet("https://raw.githubusercontent.com/mishibeikejie/zat-dsh-engine/HEAD/package.json")).status === 0) issues.push({
					level: "error",
					title: "连不上 GitHub",
					detail: "装/更新插件拉不到代码。解决:开 VPN/系统代理,或确认网络后再试。"
				});
				const scanned = [];
				const clientInserts = await this.clientInsertNames();
				for (const name of deps) try {
					const meta = JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"));
					let patchIds = /* @__PURE__ */ new Set();
					if (meta.dsh?.bundle?.patch) try {
						patchIds = extractPatchIds(readFileSync(join(dir, "node_modules", name, meta.dsh.bundle.patch), "utf8"));
					} catch {}
					const enabled = bundles.includes(name) || name.startsWith("@deepseek-ai/") || clientInserts.has(name);
					scanned.push({
						name,
						enabled,
						meta,
						patchIds
					});
					if (bundles.includes(name) && !meta.dsh?.bundle?.patch) issues.push({
						level: "error",
						title: `${name} 在启用名单里但没有声明 dsh.bundle`,
						detail: "dsh 启动时读到这种条目会直接报错拒绝启动。解决:点「一键修复」自动把它移出启用名单(依赖保留),再按它的 README 在 cordis.patch.yml 里手动注册。",
						fixable: true
					});
					for (const d of Object.keys(meta.dependencies || {})) if (isHostCorePackage(d)) issues.push({
						level: "error",
						title: `${name} 把官方核心包 ${d} 写进了 dependencies`,
						detail: "官方核心包应使用 peerDependencies 引用;直接依赖会装出第二份拷贝并劫持官方 loader 行,可能让 dsh 起不来。建议反馈给插件作者。"
					});
					for (const pd of Object.keys(meta.peerDependencies || {})) {
						if (meta.peerDependenciesMeta?.[pd]?.optional) continue;
						if (!await this.moduleProvided(pd)) issues.push({
							level: "warn",
							title: `${name} 需要的 peer 依赖 ${pd} 未安装`,
							detail: "这个依赖缺失时插件运行会报错。解决:点「一键修复」自动补装。",
							fixable: true
						});
					}
					const entryCands = [];
					if (typeof meta.main === "string" && meta.main) entryCands.push(meta.main);
					for (const v of Object.values(meta.exports || {})) if (typeof v === "string") entryCands.push(v);
					else if (v && typeof v === "object" && typeof v.default === "string") entryCands.push(v.default);
					const missingEntries = [];
					for (const rel of [...new Set(entryCands)].slice(0, 3)) {
						if (!rel || rel.includes("*") || rel.startsWith("http")) continue;
						if (!existsSync(join(dir, "node_modules", name, rel.replace(/^\.\//, "")))) missingEntries.push(rel.replace(/^\.\//, ""));
					}
					if (missingEntries.length > 0) issues.push({
						level: "error",
						title: `${name} 入口文件缺失:${missingEntries.join("、")}`,
						detail: "这个插件没提交构建产物,装了也加载不起来。解决:卸载它(它本身是坏的)。"
					});
					if (!fieldSupports(meta.os, process.platform)) issues.push({
						level: "error",
						title: `${name} 不支持当前系统(仅支持 ${(meta.os || []).join("、")})`,
						detail: `它不支持你当前的系统(${process.platform}),装了会导致 dsh 起不来。解决:卸载它。`
					});
					if (!fieldSupports(meta.cpu, process.arch)) issues.push({
						level: "error",
						title: `${name} 不支持当前 CPU(仅支持 ${(meta.cpu || []).join("、")})`,
						detail: "解决:卸载它。"
					});
					if (!enabled && !name.startsWith("@deepseek-ai/")) {
						if (Boolean(meta.dsh?.bundle?.patch) || Boolean(meta.dsh?.client)) issues.push({
							level: "info",
							title: `${name} 已停用`,
							detail: "已安装但未启用。解决:点「一键修复」自动启用。",
							fixable: true
						});
						else issues.push({
							level: "info",
							title: `${name} 已安装但不会被加载`,
							detail: "它既没有 dsh.bundle 也没有 dsh.client,不是可加载的 dsh 插件(可能只是普通库)。已作为依赖保留。"
						});
					}
				} catch {
					issues.push({
						level: "warn",
						title: `找不到 ${name} 的包文件`,
						detail: "依赖名单里有它,但 node_modules 里没有。解决:点「一键修复」自动补装。",
						fixable: true
					});
				}
				const idHolders = /* @__PURE__ */ new Map();
				for (const s of scanned) {
					if (!s.enabled) continue;
					for (const id of s.patchIds) {
						const holder = idHolders.get(id);
						if (holder && holder !== s.name) issues.push({
							level: "error",
							title: `挂载行 id "${id}" 重复`,
							detail: `${holder} 和 ${s.name} 都声明了这个行 id,加载时会互相冲突,建议二选一。若是有意的覆盖可忽略。`
						});
						else if (!holder) idHolders.set(id, s.name);
					}
				}
				const bundleOwnedIds = /* @__PURE__ */ new Map();
				for (const s of scanned) {
					if (!s.enabled) continue;
					for (const id of s.patchIds) if (!bundleOwnedIds.has(id)) bundleOwnedIds.set(id, s.name);
				}
				for (const patch of await this.readPatches()) {
					if (!patch || typeof patch !== "object") continue;
					const insert = patch.insert;
					if (!Array.isArray(insert)) continue;
					for (const row of insert) {
						if (!(row && typeof row === "object")) continue;
						const rid = row.id;
						if (typeof rid !== "string") continue;
						const holder = bundleOwnedIds.get(rid);
						if (holder) issues.push({
							level: "error",
							title: `cordis.patch.yml 手抄了挂载行 id "${rid}"`,
							detail: `插件 ${holder} 自带的补丁已声明这个 id,loader 会自动挂载;profile 的 cordis.patch.yml 再手抄一遍会导致 id 冲突、dsh 起不来。解决:点「一键修复」自动删掉这条手抄行(插件照常通过自带补丁加载)。`,
							fixable: true
						});
					}
				}
				const declared = /* @__PURE__ */ new Map();
				for (const s of scanned) {
					if (!s.enabled) continue;
					for (const [dep, range] of [...Object.entries(s.meta.dependencies || {}), ...Object.entries(s.meta.peerDependencies || {})]) {
						if (dep.startsWith("@deepseek-ai/")) continue;
						if (!declared.has(dep)) declared.set(dep, []);
						declared.get(dep).push({
							pkg: s.name,
							range: String(range)
						});
					}
				}
				for (const [dep, list] of declared) {
					const majors = /* @__PURE__ */ new Set();
					for (const item of list) {
						const m = String(item.range).match(/^\^?(\d+)(?:\.\d+){0,2}$/);
						if (m) majors.add(Number(m[1]));
					}
					if (majors.size > 1) issues.push({
						level: "warn",
						title: `依赖版本冲突:${dep}`,
						detail: list.map((x) => `${x.pkg} 要求 ${x.range}`).join(";") + "。大版本不一致时 pnpm 会装多份拷贝,宿主侧共享包可能出现状态分裂或报错。"
					});
				}
				const hostNames = /* @__PURE__ */ new Map();
				const clientNames = /* @__PURE__ */ new Map();
				for (const s of scanned) {
					if (!s.enabled) continue;
					const names = await this.scanLocalNames(s.name);
					for (const nm of names.host) {
						const holder = hostNames.get(nm);
						if (holder && holder !== s.name) issues.push({
							level: "error",
							title: `服务/提供名 "${nm}" 重复注册`,
							detail: `${holder} 和 ${s.name} 都提供了同名服务,后加载的会覆盖先加载的或直接报错,建议二选一。`
						});
						else if (!holder) hostNames.set(nm, s.name);
					}
					for (const nm of names.client) {
						const holder = clientNames.get(nm);
						if (holder && holder !== s.name) issues.push({
							level: "warn",
							title: `界面注册名 "${nm}" 重复`,
							detail: `${holder} 和 ${s.name} 注册了同一个界面位置,可能互相覆盖;若属有意共享可忽略。`
						});
						else if (!holder) clientNames.set(nm, s.name);
					}
				}
				for (const s of scanned) {
					if (!s.enabled) continue;
					for (const [pd, range] of Object.entries(s.meta.peerDependencies || {})) {
						if (!pd.startsWith("@deepseek-ai/")) continue;
						const installedVer = await this.installedVersionOf(pd);
						if (installedVer && simpleMajorConflict(String(range), installedVer)) issues.push({
							level: "warn",
							title: `${s.name} 与官方包 ${pd} 版本可能不兼容`,
							detail: `插件要求 ${range},本机是 v${installedVer}。大版本不一致时运行可能报错,建议等插件作者适配。`
						});
					}
				}
				for (const s of scanned) {
					if (!s.enabled || s.name.startsWith("@deepseek-ai/") || s.name === "zat-dsh-engine") continue;
					const texts = await this.readLocalTexts(s.name);
					for (const f of scanSecurity(texts.hostText, `${s.name} 宿主代码`)) issues.push({
						level: "warn",
						title: f.title,
						detail: f.detail
					});
					for (const f of scanSecurity(texts.clientText, `${s.name} 界面代码`)) issues.push({
						level: "warn",
						title: f.title,
						detail: f.detail
					});
				}
				const inst = await this.installedMap(p);
				const markets = [];
				for (const rec of new Set(Object.values(inst))) if (KNOWN_MARKET_REPOS[(rec.owner + "/" + rec.repo).toLowerCase()] !== void 0 || Object.values(KNOWN_MARKET_REPOS).includes(rec.name) || isMarketishName(rec.name) || await this.scanLocalMarketish(rec.name)) {
					if (!markets.includes(rec.name)) markets.push(rec.name);
				}
				if (markets.length > 1) issues.push({
					level: "error",
					title: "装了多个市场/管理器插件",
					detail: markets.join("、") + " 会互相覆盖设置页并注册冲突,建议只保留一个。"
				});
				for (const ri of this.recentIssues) if (!issues.some((i) => i.title === ri.title)) issues.push({
					level: ri.level,
					title: ri.title,
					detail: ri.detail
				});
				if (issues.length === 0) issues.push({
					level: "ok",
					title: "体检通过",
					detail: "没有发现冲突、依赖矛盾或明显风险。"
				});
				return {
					ok: true,
					issues
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		/**
		* 一键修复:自动解决能安全修复的问题(启用已停用插件、补装缺失依赖/包文件)。
		* 修不了的(系统不支持、入口文件缺失、官方包写错、冲突、网络、pnpm 缺失)不硬来,
		* 原样留在 remaining 里,由 healthCheck 的说明告诉用户怎么办。
		*/
		async repair() {
			const fixed = [];
			const remaining = [];
			try {
				const dir = await this.getProfileDir();
				const p = await this.readProfile();
				const deps = Object.keys(p.dependencies || {});
				const profile = p.dsh?.profile || {};
				let bundles = Array.isArray(profile.bundles) ? [...profile.bundles] : [];
				if (!await this.pnpmAvailable()) {
					let installed = false;
					for (const cmd of ["corepack enable", "npm install -g pnpm"]) if ((await this.runShell(cmd)).outcome.exitCode === 0) {
						installed = true;
						break;
					}
					if (installed && await this.pnpmAvailable()) fixed.push("已装好 pnpm");
					else remaining.push("没装 pnpm,本机也装不了(corepack/npm 都没有);请先装 Node.js 再点一次。");
				}
				const badBundles = [];
				for (const b of bundles) {
					if (b.startsWith("@deepseek-ai/")) continue;
					if (!await this.isBundlePackage(b)) badBundles.push(b);
				}
				if (badBundles.length > 0) {
					const snap = await this.snapshotProfile(dir);
					const cleaned = bundles.filter((b) => !badBundles.includes(b));
					p.dsh = p.dsh || {};
					p.dsh.profile = p.dsh.profile || {};
					p.dsh.profile.bundles = cleaned;
					await this.writeProfile(p);
					try {
						const checkBundles = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).dsh?.profile?.bundles;
						if (!Array.isArray(checkBundles) || badBundles.some((b) => checkBundles.includes(b))) throw new Error("cleanup not persisted");
						bundles = cleaned;
						fixed.push(`已把 ${badBundles.join("、")} 移出启用名单(没有 dsh.bundle,留着会导致 dsh 起不来)`);
					} catch {
						await this.restoreProfile(dir, snap);
						remaining.push("清理无效启用条目失败,已还原;请手动编辑 profile 的 dsh.profile.bundles 删掉这些名字。");
					}
				}
				const toEnable = [];
				for (const name of deps) {
					if (name.startsWith("@deepseek-ai/")) continue;
					if (bundles.includes(name)) continue;
					if (!await this.isBundlePackage(name)) continue;
					toEnable.push(name);
				}
				if (toEnable.length > 0) {
					const snap = await this.snapshotProfile(dir);
					p.dsh = p.dsh || {};
					p.dsh.profile = p.dsh.profile || {};
					p.dsh.profile.bundles = [...bundles, ...toEnable];
					await this.writeProfile(p);
					try {
						const checkBundles = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).dsh?.profile?.bundles;
						if (!Array.isArray(checkBundles) || !toEnable.every((n) => checkBundles.includes(n))) throw new Error("bundles not persisted");
						fixed.push(`已启用 ${toEnable.join("、")}`);
					} catch {
						await this.restoreProfile(dir, snap);
						remaining.push("启用插件失败,已还原;请重启 dsh 后重试。");
					}
				}
				const clientNames = await this.clientInsertNames();
				const clientToInsert = [];
				for (const name of deps) {
					if (bundles.includes(name)) continue;
					if (clientNames.has(name)) continue;
					if (await this.isClientOnlyPackage(name)) clientToInsert.push(name);
				}
				for (const name of clientToInsert) {
					await this.upsertClientInsert(name);
					fixed.push(`已注册 ${name}(主题/界面插件,自动写入 cordis.patch.yml)`);
				}
				const ownedIds = await this.installedPatchIds();
				if (ownedIds.size > 0) {
					const patches = await this.readPatches();
					let removedAny = false;
					const removedIds = [];
					const cleaned = patches.map((patch) => {
						if (!patch || typeof patch !== "object") return patch;
						const insert = patch.insert;
						if (!Array.isArray(insert)) return patch;
						patch.insert = insert.filter((row) => {
							if (!(row && typeof row === "object")) return true;
							const rid = row.id;
							if (typeof rid === "string" && ownedIds.has(rid)) {
								removedIds.push(rid);
								removedAny = true;
								return false;
							}
							return true;
						});
						return patch;
					}).filter((patch) => {
						if (!patch || typeof patch !== "object") return true;
						const insert = patch.insert;
						const hasOtherKeys = Object.keys(patch).some((k) => k !== "insert");
						if (!Array.isArray(insert)) return true;
						if (insert.length === 0 && !hasOtherKeys) return false;
						return true;
					});
					if (removedAny) {
						await this.writePatches(cleaned);
						fixed.push(`已删掉 cordis.patch.yml 里手抄重复的挂载行 id:${[...new Set(removedIds)].join("、")}(插件自带补丁会自动挂载)`);
					}
				}
				const missingPeers = /* @__PURE__ */ new Set();
				let missingPkg = false;
				for (const name of deps) try {
					const meta = JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"));
					for (const pd of Object.keys(meta.peerDependencies || {})) {
						if (meta.peerDependenciesMeta?.[pd]?.optional) continue;
						if (pd.startsWith("@deepseek-ai/")) continue;
						if (!await this.moduleProvided(pd)) missingPeers.add(pd);
					}
				} catch {
					missingPkg = true;
				}
				if (missingPeers.size > 0 || missingPkg) {
					if ((await this.pnpmShell("pnpm install", dir)).outcome.exitCode === 0) fixed.push("已补装缺失依赖" + (missingPeers.size ? `:${[...missingPeers].join("、")}` : ""));
					else remaining.push(`依赖补装失败(网络或 pnpm 问题):${[...missingPeers].join("、") || "缺包文件"}。开代理后再点一次,或手动 dsh plugin add。`);
				}
				this.invalidateListCache();
				const hc = await this.healthCheck();
				if (hc.ok === true && Array.isArray(hc.issues)) for (const it of hc.issues) {
					if (it.level === "ok" || it.fixable) continue;
					if (!remaining.includes(it.title)) remaining.push(it.title);
				}
				if (fixed.length === 0 && remaining.length === 0) return {
					ok: true,
					fixed,
					remaining,
					message: "没有需要修复的问题。"
				};
				return {
					ok: true,
					fixed,
					remaining,
					message: `修复 ${fixed.length} 项。` + (remaining.length ? `还有 ${remaining.length} 项修不了,需要你手动处理(见体检报告):${remaining.slice(0, 3).join(";")}${remaining.length > 3 ? "…" : ""}` : "全部修复完毕。")
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		tokenValue = null;
		tokenResolved = false;
		tokenPromise = null;
		/**
		* GitHub REST call with an optional Bearer token. Uses curl with argv
		* (no shell interpolation), so the token can never break quoting or leak
		* into a log line.
		*/
		async ghApi(method, path, token) {
			const proxy = this.proxyDown ? null : await this.loadProxy();
			const proxyArgs = proxy ? ["--proxy", proxy] : [];
			let curl = "curl";
			try {
				curl = await this.subprocess.resolveExecutable("curl");
			} catch {
				curl = "";
			}
			if (!curl) return {
				status: 0,
				body: "",
				error: "curl not available"
			};
			const argv = [
				curl,
				...proxyArgs,
				"-s",
				"-L",
				"--max-time",
				"5",
				"-w",
				"\n%{http_code}",
				"-H",
				"User-Agent: zat-dsh-engine/0.3.1",
				"-H",
				"Accept: application/vnd.github+json",
				"-X",
				method
			];
			if (token) argv.push("-H", `Authorization: Bearer ${token}`);
			argv.push("https://api.github.com" + path);
			const handle = this.subprocess.spawn({
				argv,
				cwd: this.shellCwd(),
				stdio: {
					stdin: "ignore",
					stdout: { maxBytes: 16777216 },
					stderr: { maxBytes: 1048576 }
				},
				graceMs: 6e4
			});
			const outcome = await handle.done;
			let stdout = "";
			let stderr = "";
			if (handle.collected?.stdout) stdout = handle.collected.stdout.readFrom(0).text || "";
			if (handle.collected?.stderr) stderr = handle.collected.stderr.readFrom(0).text || "";
			if (outcome.exitCode === 0) {
				const lines = String(stdout).trimEnd().split("\n");
				const status = Number(lines.pop());
				if (Number.isFinite(status) && status > 0) {
					if (status === 0) this.proxyDown = true;
					return {
						status,
						body: lines.join("\n")
					};
				}
				return {
					status: 200,
					body: lines.join("\n")
				};
			}
			this.proxyDown = true;
			if (stderr.trim()) return {
				status: 0,
				body: "",
				error: stderr.trim().slice(0, 200)
			};
			return {
				status: 0,
				body: "",
				error: "curl failed"
			};
		}
		/** Ask the local git credential helper for the github.com token — NEVER prompts. */
		async gitCredentialToken() {
			let git = "git";
			try {
				git = await this.subprocess.resolveExecutable("git");
			} catch {
				return null;
			}
			try {
				const handle = this.subprocess.spawn({
					argv: [
						git,
						"-c",
						"credential.interactive=false",
						"credential",
						"fill"
					],
					cwd: this.shellCwd(),
					stdio: {
						stdin: { data: "protocol=https\nhost=github.com\n\n" },
						stdout: { maxBytes: 65536 },
						stderr: { maxBytes: 16384 }
					},
					graceMs: 3e4
				});
				if ((await handle.done).exitCode !== 0) return null;
				const line = (handle.collected?.stdout ? handle.collected.stdout.readFrom(0).text || "" : "").split(/\r?\n/).find((l) => l.startsWith("password="));
				return (line ? line.slice(9).trim() : "") || null;
			} catch {
				return null;
			}
		}
		/**
		* Token only from non-interactive sources (env / market config). Used by the
		* automatic search & health paths — they must never touch `git credential
		* fill`, whose credential manager pops a GitHub login window when the user
		* has no stored credentials.
		*/
		async resolveConfiguredToken() {
			try {
				const envTok = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
				if (envTok && envTok.trim()) return envTok.trim();
				const dir = await this.getProfileDir();
				const cfg = JSON.parse(readFileSync(join(dir, "zat-market.json"), "utf8"));
				if (typeof cfg.githubToken === "string" && cfg.githubToken.trim()) return cfg.githubToken.trim();
			} catch {}
			return null;
		}
		/** Resolve a GitHub token: env → local profile config → git credential helper (non-interactive). Cached. */
		resolveToken() {
			if (this.tokenResolved) return Promise.resolve(this.tokenValue);
			if (this.tokenPromise) return this.tokenPromise;
			this.tokenPromise = (async () => {
				try {
					const configured = await this.resolveConfiguredToken();
					if (configured) return configured;
					return await this.gitCredentialToken();
				} catch {
					return null;
				}
			})().then((t) => {
				this.tokenValue = t;
				this.tokenResolved = true;
				return t;
			});
			return this.tokenPromise;
		}
		async starToggle(owner, repo) {
			try {
				const o = safeSegment(owner);
				const r = safeSegment(repo);
				if (!o || !r) return {
					ok: false,
					message: "invalid repository name"
				};
				const token = await this.resolveToken();
				if (!token) return {
					ok: false,
					needToken: true,
					message: "一键星标需要已保存的 GitHub 凭据或 Token,本机还没有。可在市场底部填一个 GitHub Token 后再点星;不会强制你登录。"
				};
				const cur = await this.ghApi("GET", `/user/starred/${o}/${r}`, token);
				if (cur.status !== 204 && cur.status !== 404) {
					if (cur.status === 401 || cur.status === 403) return {
						ok: false,
						message: "GitHub 拒绝了这个凭据(401/403)。请在市场底部重新填一个有效的 GitHub Token。"
					};
					return {
						ok: false,
						message: `GitHub API 错误:${cur.status}${cur.error ? " " + cur.error : ""}`
					};
				}
				const starred = cur.status === 204;
				const act = await this.ghApi(starred ? "DELETE" : "PUT", `/user/starred/${o}/${r}`, token);
				if (act.status === 204) return {
					ok: true,
					starred: !starred,
					message: starred ? `已取消星标 ${o}/${r}` : `已星标 ⭐ ${o}/${r}`
				};
				if (act.status === 401 || act.status === 403) return {
					ok: false,
					message: "GitHub 拒绝了这个凭据(401/403)。请在市场底部重新填一个有效的 GitHub Token。"
				};
				return {
					ok: false,
					message: `星标操作失败:${act.status}${act.error ? " " + act.error : ""}`
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		async starredList() {
			try {
				const token = await this.resolveToken();
				if (!token) return {
					ok: false,
					message: "no github token available"
				};
				const names = [];
				for (let page = 1; page <= 20; page++) {
					const r = await this.ghApi("GET", `/user/starred?per_page=100&page=${page}`, token);
					if (r.status !== 200) {
						if (page === 1) {
							if (r.status === 401 || r.status === 403) return {
								ok: false,
								message: "GitHub 拒绝了这个凭据。请在市场底部重新填一个有效的 GitHub Token。"
							};
							return {
								ok: false,
								message: `GitHub API 错误:${r.status}`
							};
						}
						break;
					}
					let arr = [];
					try {
						arr = JSON.parse(r.body);
					} catch {
						break;
					}
					const list = Array.isArray(arr) ? arr : [];
					for (const it of list) {
						const f = it?.full_name;
						if (typeof f === "string" && f) names.push(f.toLowerCase());
					}
					if (list.length < 100) break;
				}
				return {
					ok: true,
					starred: names
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
		async setToken(token) {
			try {
				const t = String(token || "").trim();
				if (t.length > 200) return {
					ok: false,
					message: "token too long"
				};
				const dir = await this.getProfileDir();
				const cfgPath = join(dir, "zat-market.json");
				let cfg = {};
				try {
					cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
				} catch {}
				if (t) cfg.githubToken = t;
				else delete cfg.githubToken;
				await this.writeFileText(cfgPath, JSON.stringify(cfg, null, 2));
				this.tokenValue = null;
				this.tokenResolved = false;
				this.tokenPromise = null;
				return {
					ok: true,
					hasToken: Boolean(t),
					message: t ? "Token 已保存(只存在本机 profile 目录的 zat-market.json,不会上传)" : "Token 已清除"
				};
			} catch (err) {
				return {
					ok: false,
					message: String(err?.message || err)
				};
			}
		}
	};
})();
//#endregion
export { ZatMarketGateway, ZatMarketGateway as default, compareVersions, fieldSupports, scanSecurity };
