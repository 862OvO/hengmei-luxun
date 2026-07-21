$ErrorActionPreference = "Stop"

# Wikimedia 返回 429 时，请停止旧脚本，等待一段时间后再运行本脚本。
# 本脚本只调用一次 MediaWiki API，并在每张图片之间主动暂停，避免高频请求。

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ImageDirectory = Join-Path $ProjectRoot "assets\images\biography"
New-Item -ItemType Directory -Force -Path $ImageDirectory | Out-Null

$Images = @(
    @{ FileName = "01-shaoxing-former-residence.jpg"; CommonsTitle = "Former Residence of Lu Xun in Shaoxing 01 2018-09.jpg" },
    @{ FileName = "02-sanwei-study.jpg"; CommonsTitle = "Sanwei Study Room.jpg" },
    @{ FileName = "03-young-lu-xun-1903.jpg"; CommonsTitle = "YoungLuXun.jpg" },
    @{ FileName = "04-tokyo-friends-1909.jpg"; CommonsTitle = "Lu Xun with Xu Shoushang & Jiang Yizhi @ Tokyo.jpg" },
    @{ FileName = "05-sendai-residence-monument.jpg"; CommonsTitle = "LuXun former residence monument.jpg" },
    @{ FileName = "06-beijing-working-desk.jpg"; CommonsTitle = "Beijing Lu Xun Museum - Lu Xun working desk.jpg" },
    @{ FileName = "07-shanghai-arrival-group-1927.jpg"; CommonsTitle = "Xu Guangping, Lu Xun and others.jpg" },
    @{ FileName = "08-lu-xun-shanghai-1928.jpg"; CommonsTitle = "Lu Xun3.jpg" },
    @{ FileName = "09-lu-xun-1930.jpg"; CommonsTitle = "LuXun1930.jpg" },
    @{ FileName = "10-lu-xun-family.jpg"; CommonsTitle = "Lu Xun 1 with Xu Guanping and Haiying.jpg" },
    @{ FileName = "11-lu-xun-1933.jpg"; CommonsTitle = "LuXun2.jpg" },
    @{ FileName = "12-shanghai-former-residence.jpg"; CommonsTitle = "上海鲁迅故居.jpg" }
)

$UserAgent = "Hengmei-Luxun-Course-Project/1.2 (https://github.com/862OvO/hengmei-luxun; educational website)"
$Headers = @{
    "User-Agent"     = $UserAgent
    "Api-User-Agent" = $UserAgent
    "Accept"         = "application/json"
}

function Get-StatusCode {
    param([object]$ErrorRecord)

    try {
        if ($null -ne $ErrorRecord.Exception.Response.StatusCode) {
            return [int]$ErrorRecord.Exception.Response.StatusCode
        }
    }
    catch {
    }

    return $null
}

function Invoke-WithBackoff {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Operation,

        [Parameter(Mandatory = $true)]
        [string]$Description,

        [int]$MaximumAttempts = 5
    )

    for ($Attempt = 1; $Attempt -le $MaximumAttempts; $Attempt++) {
        try {
            return & $Operation
        }
        catch {
            $StatusCode = Get-StatusCode -ErrorRecord $_

            if ($StatusCode -eq 429) {
                # 429 需要显著放慢速度，不能立即连续重试。
                $WaitSeconds = 120 * $Attempt
                Write-Host "$Description 遇到 429 限流；等待 $WaitSeconds 秒后再试（$Attempt/$MaximumAttempts）。" -ForegroundColor Yellow
            }
            else {
                $WaitSeconds = 20 * $Attempt
                Write-Host "$Description 失败：$($_.Exception.Message)" -ForegroundColor Red
                Write-Host "等待 $WaitSeconds 秒后再试（$Attempt/$MaximumAttempts）。" -ForegroundColor Yellow
            }

            if ($Attempt -ge $MaximumAttempts) {
                throw
            }

            Start-Sleep -Seconds $WaitSeconds
        }
    }
}

Write-Host ""
Write-Host "安全下载模式：一次查询图片地址，每张图片之间暂停 15 秒。" -ForegroundColor Cyan
Write-Host "预计需要约 3 至 8 分钟，请不要重复打开多个下载窗口。" -ForegroundColor Cyan
Write-Host ""

# 把 12 个文件名合并到一次 API POST 请求中，避免逐张查询造成高频访问。
$AllTitles = ($Images | ForEach-Object { "File:$($_.CommonsTitle)" }) -join "|"

$ApiBody = @{
    action        = "query"
    format        = "json"
    formatversion = "2"
    prop          = "imageinfo"
    iiprop        = "url|mime|size"
    iiurlwidth    = "1600"
    titles        = $AllTitles
    maxlag        = "5"
}

$ApiResponse = Invoke-WithBackoff `
    -Description "查询 Wikimedia 图片地址" `
    -Operation {
        Invoke-RestMethod `
            -Uri "https://commons.wikimedia.org/w/api.php" `
            -Method Post `
            -Body $ApiBody `
            -Headers $Headers `
            -TimeoutSec 90
    }

$UrlMap = @{}

foreach ($Page in $ApiResponse.query.pages) {
    if ($null -ne $Page.missing) {
        Write-Host "Commons 中找不到：$($Page.title)" -ForegroundColor Red
        continue
    }

    if ($null -eq $Page.imageinfo -or $Page.imageinfo.Count -eq 0) {
        Write-Host "未取得图片信息：$($Page.title)" -ForegroundColor Red
        continue
    }

    $Info = $Page.imageinfo[0]
    $DownloadUrl = $Info.thumburl

    if ([string]::IsNullOrWhiteSpace($DownloadUrl)) {
        $DownloadUrl = $Info.url
    }

    $NormalizedTitle = $Page.title -replace "^File:", ""
    $UrlMap[$NormalizedTitle.ToLowerInvariant()] = $DownloadUrl
}

Write-Host "图片地址查询完成，等待 15 秒后开始下载……" -ForegroundColor Green
Start-Sleep -Seconds 15

$Downloaded = 0
$Skipped = 0
$FailedFiles = New-Object System.Collections.Generic.List[string]

foreach ($Image in $Images) {
    $Destination = Join-Path $ImageDirectory $Image.FileName

    if (Test-Path $Destination) {
        $Existing = Get-Item $Destination

        if ($Existing.Length -ge 1000) {
            Write-Host "跳过已有文件：$($Image.FileName)" -ForegroundColor DarkGray
            $Skipped += 1
            continue
        }

        Remove-Item $Destination -Force
    }

    $Key = $Image.CommonsTitle.ToLowerInvariant()

    if (-not $UrlMap.ContainsKey($Key)) {
        Write-Host "没有找到下载地址：$($Image.FileName)" -ForegroundColor Red
        $FailedFiles.Add($Image.FileName)
        continue
    }

    Write-Host "下载 $($Image.FileName) ..." -ForegroundColor Cyan

    try {
        Invoke-WithBackoff `
            -Description "下载 $($Image.FileName)" `
            -Operation {
                Invoke-WebRequest `
                    -Uri $UrlMap[$Key] `
                    -OutFile $Destination `
                    -Headers $Headers `
                    -MaximumRedirection 10 `
                    -TimeoutSec 180 `
                    -UseBasicParsing
            } | Out-Null

        $FileInfo = Get-Item $Destination

        if ($FileInfo.Length -lt 1000) {
            Remove-Item $Destination -Force
            throw "下载结果小于 1000 字节，不是有效图片。"
        }

        Write-Host "完成：$($FileInfo.Length) 字节" -ForegroundColor Green
        $Downloaded += 1
    }
    catch {
        if (Test-Path $Destination) {
            Remove-Item $Destination -Force
        }

        Write-Host "最终失败：$($_.Exception.Message)" -ForegroundColor Red
        $FailedFiles.Add($Image.FileName)
    }

    # 无论成功失败，每张图片后都暂停，避免再次触发限流。
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Host "本次新下载：$Downloaded 张；跳过已有：$Skipped 张；计划总数：$($Images.Count) 张。" -ForegroundColor Yellow

if ($FailedFiles.Count -gt 0) {
    Write-Host "以下文件仍未完成：" -ForegroundColor Yellow

    foreach ($FailedFile in $FailedFiles) {
        Write-Host "  - $FailedFile" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "不要立刻重复运行。等待至少 30 分钟后再执行一次，本脚本会自动跳过已下载文件。" -ForegroundColor Yellow
    exit 1
}

Write-Host "12 张图片已经准备完成。" -ForegroundColor Green
Write-Host "图片目录：$ImageDirectory" -ForegroundColor Green
exit 0
