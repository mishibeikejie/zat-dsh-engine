# Zat-DSH Engine

> The visual plugin marketplace for DeepSeek Harness. Browse, search, install, update and uninstall community plugins — Wallpaper Engine style.

[English](#zat-dsh-engine) · [中文说明](README.zh.md)

Zat-DSH Engine adds a **Plugin Market** tab to **Settings → Plugins** in the DeepSeek Harness web GUI. It lists the entire `dsh-plugin` topic community from GitHub, shows bilingual intros, and installs plugins with one click.

## Features

- **Full community catalog** — live GitHub search of the `dsh-plugin` topic (1700+ repositories, growing daily)
- **12 categories** — Theme, Tools, Browser, Skills, Vision, Network, Agents, Data, Hardware, Design, Security…
- **Live search** — type to filter, no Enter key needed; clearing the box returns to the full list
- **Bilingual intros** — 999 pre-translated Chinese intros bundled; new plugins are translated on the fly by your current model; English UI shows the original GitHub description
- **Install / Update / Uninstall** — one click, powered by the official `dsh plugin` profile mechanism (`pnpm` under the hood)
- **Monorepo-aware install** — repositories that bundle several plugins install correctly: a single-plugin repo installs silently, multi-plugin repos offer a plain-language picker
- **Installed detection** — marks plugins you already have, with version comparison and an **update badge** when a newer version is released
- **Cross-platform** — full Windows and Linux support (PowerShell / sh, curl / wget, system-proxy aware)
- **Network auto-adaptation** — inherits your VPN/system proxy for fetching and installing; if GitHub is unreachable, requests automatically fall back to `gh-proxy.com` and recover
- **Self-update** — a button appears beside the title when a newer version of the marketplace itself is available

## Installation

### From GitHub (recommended, after release)

```sh
dsh plugin --profile web add github:mishibeikejie/zat-dsh-engine
```

### From a local checkout

```sh
git clone https://github.com/mishibeikejie/zat-dsh-engine.git
dsh plugin --profile web add ./zat-dsh-engine
```

### From npm (if published later)

```sh
dsh plugin --profile web add zat-dsh-engine
```

Replace `web` with your profile name if you use a different one (`headless` etc.).

> Requirements: a working dsh installation, `pnpm` and `curl` on PATH, and a profile that has been initialized (`dsh plugin --profile web add` creates it on first use).

## Usage

1. Restart dsh after installing.
2. Open the web GUI → **Settings → Plugins**.
3. Click the **🛒 Plugin Market** tab on the right of the plugin list.
4. Browse, search, filter by category or install state, and click **Install** on any card.
5. Restart dsh to activate installed plugins.

## Update

```sh
dsh plugin --profile web add github:mishibeikejie/zat-dsh-engine
```

Re-running `add` updates to the latest commit. The marketplace also detects its own updates and shows an **Update** button beside the title.

## Uninstall

```sh
dsh plugin --profile web remove zat-dsh-engine
```

## FAQ

**The market shows at most 1000 plugins in the All view.** GitHub's search API caps any query at 1000 results. Search and category filters reach every plugin regardless.

**Why do I need a model for Chinese intros?** 999 intros ship with the plugin. Only plugins released after the snapshot are translated on the fly, using the model you selected in dsh.

**Is the mirror safe?** The mirror is only used when a direct GitHub request fails, and only for public repository metadata.

## Sponsor

If Zat-DSH Engine saves you time, consider supporting the author:

- GitHub Sponsors: <https://github.com/sponsors/mishibeikejie>

Every bit of support keeps the catalog data, translations and feature updates coming.

## License

[MIT](LICENSE)
