# Zat-DSH Engine

> DeepSeek Harness 的可视化插件市场。像 Wallpaper Engine 一样浏览、搜索、安装、更新和卸载社区插件。

[中文说明](#zat-dsh-engine) · [English](README.md)

Zat-DSH Engine 在 DeepSeek Harness 网页界面的 **设置 → 插件** 里新增一个 **🛒 插件市场** 页签。它实时列出 GitHub 上整个 `dsh-plugin` 主题社区,双语简介,一键安装。

## 功能特性

- **全社区目录** — 实时搜索 GitHub `dsh-plugin` 主题(1700+ 仓库,每天都在增长)
- **12 个分类** — 皮肤主题、工具终端、浏览器自动化、技能、视觉多媒体、网络 MCP、多智能体、数据存储、硬件桌面、设计文档、安全通知…
- **输入即搜** — 打字自动筛选,不需要回车;清空搜索框自动回到完整列表
- **双语简介** — 内置 999 条预生成中文简介;新发布的插件会用你当前选择的模型现场翻译;英文界面显示 GitHub 原始简介
- **安装 / 更新 / 卸载** — 一键完成,底层走官方 `dsh plugin` 的 profile 机制(pnpm)
- **多插件仓库智能安装** — 一个仓库打包多个插件也能装对:只有一个插件的仓库点一下无感装好;多个插件的仓库用大白话列表让你选
- **已安装识别** — 标记你已装的插件,自动比较版本,发布新版本后显示**更新徽章**
- **跨平台** — Windows 与 Linux 全支持(PowerShell / sh、curl / wget 自动切换)
- **网络自适应** — 自动继承你的 VPN/系统代理来拉取和安装;GitHub 连不上时自动切到 `gh-proxy.com` 镜像,网络恢复后再切回直连
- **自更新** — 插件市场自身有新版本时,标题旁边出现更新按钮

## 安装

### 从 GitHub 安装(发布后推荐)

```sh
dsh plugin --profile web add github:mishibeikejie/zat-dsh-engine
```

### 从本地目录安装

```sh
git clone https://github.com/mishibeikejie/zat-dsh-engine.git
dsh plugin --profile web add ./zat-dsh-engine
```

### 从 npm 安装(如果后续发布到 npm)

```sh
dsh plugin --profile web add zat-dsh-engine
```

如果你的 profile 不叫 `web`,把它换成你自己的 profile 名。

> 前置要求:已安装 dsh;PATH 里有 `pnpm` 和 `curl`;profile 已初始化(第一次 `dsh plugin add` 会自动创建)。

## 使用

1. 安装后重启 dsh。
2. 打开网页界面 → **设置 → 插件**。
3. 点击插件列表右边的 **🛒 插件市场** 页签。
4. 浏览、搜索、按分类或安装状态筛选,点卡片上的 **安装**。
5. 重启 dsh 让安装的插件生效。

## 更新

```sh
dsh plugin --profile web add github:mishibeikejie/zat-dsh-engine
```

重新执行 `add` 即更新到最新版本。插件市场也会自动检测自身新版本,并在标题旁显示更新按钮。

## 卸载

```sh
dsh plugin --profile web remove zat-dsh-engine
```

## 给插件作者的说明 — 怎么让你的插件进市场

市场**全自动**从 GitHub 发现插件。让你的插件上架:

1. 打开你的插件仓库的 GitHub 页面。
2. 点 About 右边的 ⚙ 齿轮,添加 Topics 标签。
3. 添加**必需**标签:
   - `dsh-plugin` ← 进入插件市场的通行证
4. 再加上这些**曝光**标签,让搜 GitHub 的用户也能找到你:
   - `dsh`
   - `deepseek-harness`
   - `deepseek`
5. 完成 — 几分钟后你的插件就出现在市场里(切到「最新更新」排序立刻可见)。

市场会自动展示你的仓库名、star 数、简介和 README。中文用户会看到机器翻译的简介;你也可以自己加一个 `README.zh.md` 提供官方中文简介。

## 常见问题

**「全部」视图最多显示 1000 个插件。** 这是 GitHub 搜索 API 对单次查询的硬上限。用搜索框或分类筛选可以找到任何一个插件,不受此限。

**为什么中文简介需要模型?** 插件内置了 999 条中文简介。只有快照之后新发布的插件需要现场翻译,用的是你在 dsh 里选择的模型。

**镜像安全吗?** 只有直连 GitHub 失败时才走镜像,而且只拉取公开仓库的元数据。

## 赞助

如果 Zat-DSH Engine 帮你省了时间,欢迎支持作者:

- GitHub Sponsors:<https://github.com/sponsors/mishibeikejie>
- 爱发电 / Afdian(填你的链接)
- 微信 / 支付宝赞赏码(放你的二维码图片)

每一份支持都会用于维护目录数据、翻译和功能更新。

## 许可证

[MIT](LICENSE)
