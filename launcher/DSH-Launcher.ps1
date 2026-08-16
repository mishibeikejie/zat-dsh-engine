#Requires -Version 5.1
# =====================================================================
#  DSH 启动器 v1 (秋叶启动器式)
#  - 守护 DSH 进程:崩了自动重启,日志不丢
#  - 启动 / 停止 / 重启 / 打开网页 / 环境检测
#  - 插件安装(走国内镜像) / 卸载 / 列表
#  - 纯 PowerShell + WinForms,无需任何额外依赖
# =====================================================================
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ---- 状态 ----
$script:DshDir    = 'D:\deepseek-harness'
$script:Profile   = 'web'
$script:Port      = 3080
$script:Proc      = $null
$script:OutLog    = Join-Path $env:TEMP 'dsh-launcher-out.log'
$script:ErrLog    = Join-Path $env:TEMP 'dsh-launcher-err.log'
$script:OutPos    = 0
$script:ErrPos    = 0
$script:Ready     = $false
$script:AutoRestart = $false
$script:AutoOpen    = $true

# ---- 帮助函数 ----
function Write-Log {
    param([string]$msg)
    if (-not $script:LogBox) { return }
    $ts = Get-Date -Format 'HH:mm:ss'
    $script:LogBox.AppendText("[$ts] $msg`r`n")
    $script:LogBox.SelectionStart = $script:LogBox.TextLength
    $script:LogBox.ScrollToCaret()
}

function Get-Pnpm {
    $c = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($c) { return @{ Exe = 'pnpm'; PreArgs = @() } }
    $cands = @(
        (Join-Path $env:APPDATA 'npm\pnpm.cmd'),
        (Join-Path $env:LOCALAPPDATA 'pnpm\pnpm.cmd'),
        (Join-Path $env:ProgramFiles 'nodejs\pnpm.cmd')
    )
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) { $cands += (Join-Path (Split-Path $node.Source) 'pnpm.cmd') }
    foreach ($p in $cands) {
        if ($p -and (Test-Path $p)) { return @{ Exe = $p; PreArgs = @() } }
    }
    $cc = Get-Command corepack -ErrorAction SilentlyContinue
    if ($cc) { return @{ Exe = 'corepack'; PreArgs = @('pnpm') } }
    # 兜底:读 start-dsh.cmd 里的 NODE_BIN / PNPM_MJS,用用户实际启动 DSH 的那套
    $startCmd = Join-Path $script:DshDir 'start-dsh.cmd'
    if (Test-Path $startCmd) {
        $lines = Get-Content $startCmd -Encoding UTF8
        $nodeBin = $null; $pnpmMjs = $null
        foreach ($l in $lines) {
            if ($l -match 'NODE_BIN=([^\r\n]+)') { $nodeBin = $Matches[1].Trim().Trim('"') }
            if ($l -match 'PNPM_MJS=([^\r\n]+)') { $pnpmMjs = $Matches[1].Trim().Trim('"') }
        }
        if ($nodeBin -and $pnpmMjs) {
            $nodeExe = Join-Path $nodeBin 'node.exe'
            if ((Test-Path $nodeExe) -and (Test-Path $pnpmMjs)) {
                return @{ Exe = $nodeExe; PreArgs = @($pnpmMjs) }
            }
        }
    }
    return $null
}

function Test-DshRunning {
    $line = cmd /c "netstat -ano | findstr :$($script:Port) | findstr LISTENING" 2>$null
    return [bool]$line
}

function Stop-Dsh {
    $killed = $false
    if ($script:Proc -and -not $script:Proc.HasExited) {
        try { $script:Proc.Kill(); $killed = $true } catch { }
    }
    # 兜底:按端口杀掉监听 3080 的进程(可能不是启动器拉起的)
    $line = cmd /c "netstat -ano | findstr :$($script:Port) | findstr LISTENING" 2>$null
    if ($line) {
        $pidText = ($line -split '\s+')[-1]
        if ($pidText -match '^\d+$') {
            try { Stop-Process -Id ([int]$pidText) -Force -ErrorAction Stop; $killed = $true } catch { }
        }
    }
    if ($killed) { Write-Log '已停止 DSH' } else { Write-Log 'DSH 本来就没在运行' }
    $script:Proc = $null
    $script:Ready = $false
}

function Start-Dsh {
    if (Test-DshRunning) {
        Write-Log "DSH 已在运行(端口 $($script:Port))"
        $script:Ready = $true
        return
    }
    if ($script:Proc -and -not $script:Proc.HasExited) { Write-Log '正在启动中,请稍候…'; return }
    $pnpm = Get-Pnpm
    if (-not $pnpm) { Write-Log '找不到 pnpm。请先安装 pnpm,或在命令行里运行 corepack enable。'; return }
    if (-not (Test-Path $script:DshDir)) { Write-Log "DSH 安装目录不存在: $($script:DshDir)。请在上方填对目录。"; return }

    Remove-Item $script:OutLog, $script:ErrLog -ErrorAction SilentlyContinue
    $script:OutPos = 0
    $script:ErrPos = 0
    $script:Ready = $false

    $parts = @($pnpm.Exe) + $pnpm.PreArgs + @('dsh', 'web')
    $cmdLine = ($parts | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '
    Write-Log "正在启动 DSH ($cmdLine)…"
    try {
        $script:Proc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $cmdLine) `
            -WorkingDirectory $script:DshDir -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput $script:OutLog -RedirectStandardError $script:ErrLog
        Write-Log "DSH 进程已拉起(PID $($script:Proc.Id)),等待 web 就绪…"
    } catch {
        Write-Log "启动失败: $($_.Exception.Message)"
        $script:Proc = $null
    }
}

function Read-NewLog {
    # 把 stdout/stderr 的新增内容刷进日志框
    foreach ($pair in @(@($script:OutLog, [ref]$script:OutPos), @($script:ErrLog, [ref]$script:ErrPos))) {
        $path = $pair[0]
        $posRef = $pair[1]
        if (-not (Test-Path $path)) { continue }
        try {
            $bytes = [System.IO.File]::ReadAllBytes($path)
            if ($bytes.Length -le $posRef.Value) { continue }
            $text = [System.Text.Encoding]::UTF8.GetString($bytes, $posRef.Value, $bytes.Length - $posRef.Value)
            $posRef.Value = $bytes.Length
            foreach ($l in ($text -split "`r?`n")) {
                if ($l.Trim()) { Write-Log $l.TrimEnd() }
            }
        } catch { }
    }
}

function Run-Dsh {
    param([string[]]$Args)
    $pnpm = Get-Pnpm
    if (-not $pnpm) { Write-Log '找不到 pnpm。'; return }
    if (-not (Test-Path $script:DshDir)) { Write-Log 'DSH 安装目录不存在。'; return }
    $argsArr = $pnpm.PreArgs + @('dsh', 'plugin', '--profile', $script:Profile) + $Args
    Write-Log "执行: dsh plugin --profile $($script:Profile) $($Args -join ' ')"
    $form.Refresh()
    $out = & $pnpm.Exe @argsArr 2>&1
    foreach ($l in $out) { Write-Log ([string]$l).TrimEnd() }
    Write-Log '命令执行完毕'
}

function Test-Env {
    Write-Log '==== 环境检测 ===='
    $node = Get-Command node -ErrorAction SilentlyContinue
    Write-Log "node: $($(if($node){$node.Source + ' (v' + (& node -v) + ')'}else{'未找到'}))"
    $pnpm = Get-Pnpm
    $pnpmDesc = if ($pnpm) { ($pnpm.Exe + ' ' + ($pnpm.PreArgs -join ' ')).Trim() } else { '未找到' }
    Write-Log "pnpm: $pnpmDesc"
    Write-Log "DSH 目录: $($(if(Test-Path $script:DshDir){'存在 ' + $script:DshDir}else{'不存在 ' + $script:DshDir}))"
    Write-Log "profile: $($script:Profile)"
    Write-Log "端口 $($script:Port): $($(if(Test-DshRunning){'已监听(DSH 在运行)'}else{'未监听(未运行)'}))"
    $home = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
    $profDir = Join-Path $home 'profiles'
    Write-Log ".dsh: $($(if(Test-Path $home){'存在 ' + $home}else{'不存在 ' + $home}))"
    Write-Log "profiles: $($(if(Test-Path $profDir){'存在 ' + $profDir}else{'不存在'}))"
    Write-Log '==== 检测完成 ===='
}

# ---- 界面 ----
$form = New-Object System.Windows.Forms.Form
$form.Text = 'DSH 启动器 v1'
$form.Width = 760
$form.Height = 560
$form.StartPosition = 'CenterScreen'
$form.Font = New-Object System.Drawing.Font('Microsoft YaHei', 9)

$lblDir = New-Object System.Windows.Forms.Label
$lblDir.Text = 'DSH 目录:'
$lblDir.Location = New-Object System.Drawing.Point(14, 16)
$lblDir.AutoSize = $true

$txtDir = New-Object System.Windows.Forms.TextBox
$txtDir.Location = New-Object System.Drawing.Point(84, 12)
$txtDir.Width = 420
$txtDir.Text = $script:DshDir
$txtDir.Add_TextChanged({ $script:DshDir = $txtDir.Text.Trim() })

$lblProfile = New-Object System.Windows.Forms.Label
$lblProfile.Text = 'profile:'
$lblProfile.Location = New-Object System.Drawing.Point(514, 16)
$lblProfile.AutoSize = $true

$txtProfile = New-Object System.Windows.Forms.TextBox
$txtProfile.Location = New-Object System.Drawing.Point(562, 12)
$txtProfile.Width = 70
$txtProfile.Text = $script:Profile
$txtProfile.Add_TextChanged({ $script:Profile = $txtProfile.Text.Trim() })

$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Text = '启动 DSH'
$btnStart.Location = New-Object System.Drawing.Point(640, 10)
$btnStart.Width = 100
$btnStart.Add_Click({ Start-Dsh })

$btnStop = New-Object System.Windows.Forms.Button
$btnStop.Text = '停止'
$btnStop.Location = New-Object System.Drawing.Point(14, 44)
$btnStop.Width = 70
$btnStop.Add_Click({ Stop-Dsh })

$btnRestart = New-Object System.Windows.Forms.Button
$btnRestart.Text = '重启'
$btnRestart.Location = New-Object System.Drawing.Point(92, 44)
$btnRestart.Width = 70
$btnRestart.Add_Click({ Stop-Dsh; Start-Sleep -Seconds 1; Start-Dsh })

$btnOpen = New-Object System.Windows.Forms.Button
$btnOpen.Text = '打开网页'
$btnOpen.Location = New-Object System.Drawing.Point(170, 44)
$btnOpen.Width = 90
$btnOpen.Add_Click({ Start-Process "http://127.0.0.1:$($script:Port)" })

$btnEnv = New-Object System.Windows.Forms.Button
$btnEnv.Text = '环境检测'
$btnEnv.Location = New-Object System.Drawing.Point(268, 44)
$btnEnv.Width = 90
$btnEnv.Add_Click({ Test-Env })

$chkAutoRestart = New-Object System.Windows.Forms.CheckBox
$chkAutoRestart.Text = '崩溃自动重启'
$chkAutoRestart.Location = New-Object System.Drawing.Point(372, 46)
$chkAutoRestart.Width = 110
$chkAutoRestart.Add_CheckedChanged({ $script:AutoRestart = $chkAutoRestart.Checked })

$chkAutoOpen = New-Object System.Windows.Forms.CheckBox
$chkAutoOpen.Text = '就绪后自动打开网页'
$chkAutoOpen.Location = New-Object System.Drawing.Point(492, 46)
$chkAutoOpen.Width = 150
$chkAutoOpen.Checked = $true
$chkAutoOpen.Add_CheckedChanged({ $script:AutoOpen = $chkAutoOpen.Checked })

$lblRepo = New-Object System.Windows.Forms.Label
$lblRepo.Text = '装插件(仓库):'
$lblRepo.Location = New-Object System.Drawing.Point(14, 78)
$lblRepo.AutoSize = $true

$txtRepo = New-Object System.Windows.Forms.TextBox
$txtRepo.Location = New-Object System.Drawing.Point(100, 74)
$txtRepo.Width = 220

$btnInstall = New-Object System.Windows.Forms.Button
$btnInstall.Text = '安装(走镜像)'
$btnInstall.Location = New-Object System.Drawing.Point(330, 72)
$btnInstall.Width = 100
$btnInstall.Add_Click({
    $repo = $txtRepo.Text.Trim()
    if (-not $repo) { Write-Log '请先填仓库 owner/repo'; return }
    if ($repo -notmatch '^[\w.-]+/[\w.-]+$') { Write-Log '仓库格式应为 owner/repo'; return }
    Run-Dsh @('add', "https://gh-proxy.com/https://github.com/$repo.git")
})

$lblPkg = New-Object System.Windows.Forms.Label
$lblPkg.Text = '卸载(包名):'
$lblPkg.Location = New-Object System.Drawing.Point(14, 110)
$lblPkg.AutoSize = $true

$txtPkg = New-Object System.Windows.Forms.TextBox
$txtPkg.Location = New-Object System.Drawing.Point(100, 106)
$txtPkg.Width = 220

$btnRemove = New-Object System.Windows.Forms.Button
$btnRemove.Text = '卸载'
$btnRemove.Location = New-Object System.Drawing.Point(330, 104)
$btnRemove.Width = 100
$btnRemove.Add_Click({
    $pkg = $txtPkg.Text.Trim()
    if (-not $pkg) { Write-Log '请先填包名'; return }
    Run-Dsh @('remove', $pkg)
})

$btnList = New-Object System.Windows.Forms.Button
$btnList.Text = '插件列表'
$btnList.Location = New-Object System.Drawing.Point(440, 72)
$btnList.Width = 90
$btnList.Add_Click({ Run-Dsh @('list') })

$script:LogBox = New-Object System.Windows.Forms.TextBox
$script:LogBox.Multiline = $true
$script:LogBox.ReadOnly = $true
$script:LogBox.ScrollBars = 'Vertical'
$script:LogBox.Location = New-Object System.Drawing.Point(14, 140)
$script:LogBox.Width = 726
$script:LogBox.Height = 372
$script:LogBox.BackColor = [System.Drawing.Color]::FromArgb(18, 20, 24)
$script:LogBox.ForeColor = [System.Drawing.Color]::FromArgb(210, 214, 222)
$script:LogBox.Font = New-Object System.Drawing.Font('Consolas', 9)
$script:LogBox.Add_TextChanged({ $script:LogBox.SelectionStart = $script:LogBox.TextLength; $script:LogBox.ScrollToCaret() })

$form.Controls.AddRange(@(
    $lblDir, $txtDir, $lblProfile, $txtProfile,
    $btnStart, $btnStop, $btnRestart, $btnOpen, $btnEnv,
    $chkAutoRestart, $chkAutoOpen,
    $lblRepo, $txtRepo, $btnInstall, $btnList,
    $lblPkg, $txtPkg, $btnRemove,
    $script:LogBox
))

# ---- 守护定时器:刷日志 / 检测崩溃 / 检测就绪 ----
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 700
$timer.Add_Tick({
    Read-NewLog
    if ($script:Proc -and -not $script:Proc.HasExited) {
        if (-not $script:Ready) {
            try {
                $r = Invoke-WebRequest -Uri "http://127.0.0.1:$($script:Port)" -UseBasicParsing -TimeoutSec 2
                if ($r.StatusCode -eq 200) {
                    $script:Ready = $true
                    Write-Log 'DSH 已就绪。'
                    if ($script:AutoOpen) { Start-Process "http://127.0.0.1:$($script:Port)" }
                }
            } catch { }
        }
    } elseif ($script:Proc -and $script:Proc.HasExited) {
        $code = $script:Proc.ExitCode
        Write-Log "DSH 已退出(exit code $code)"
        $script:Proc = $null
        $script:Ready = $false
        if ($script:AutoRestart) {
            Write-Log '2 秒后自动重启…'
            Start-Sleep -Seconds 2
            Start-Dsh
        }
    }
})
$timer.Start()

Write-Log 'DSH 启动器已就绪。点「启动 DSH」开始;建议勾选「崩溃自动重启」。'
$form.Add_Shown({ $form.Activate() })
$form.ShowDialog()
