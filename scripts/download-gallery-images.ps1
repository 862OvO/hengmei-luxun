$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot "assets\images\gallery"
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$images = @(
    @{ Name = "13-luxun-study-1928.jpg"; Url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lu%20Xun%20in%20his%20study%20by%20Liang%20Desuo%2C%20Liangyou%2C%201928-04-30.jpg?width=1600" },
    @{ Name = "14-luxun-haiying-1930.jpg"; Url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lu%20Xun%20and%20Zhou%20Haiying.jpg?width=1600" },
    @{ Name = "15-luxun-last-photo-1936.jpg"; Url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lu%20Xun%201936.jpg?width=1600" },
    @{ Name = "16-luxun-seal-1915.jpg"; Url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lu%20Xun%20Seal-kuaiji.jpg?width=1200" },
    @{ Name = "17-luxun-signature.png"; Url = "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/3e/Lu_Xun%2527s_Signature.svg&output=png&w=1200" },
    @{ Name = "18-luxun-marks-sendai.jpg"; Url = "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/c/cf/Lu_Xun%2527s_marks_in_University_-_Beijing_Lu_Xun_Museum.jpg&output=jpg&w=1600&q=88" }
)

foreach ($image in $images) {
    $target = Join-Path $outputDirectory $image.Name
    if ((Test-Path -LiteralPath $target) -and (Get-Item -LiteralPath $target).Length -ge 1000) {
        Write-Host "已存在 $($image.Name)"
        continue
    }

    $downloaded = $false
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            Invoke-WebRequest -Uri $image.Url -OutFile $target -MaximumRedirection 10 -Headers @{ "User-Agent" = "Hengmei-Luxun-Course-Project/1.0" }
            $downloaded = $true
            break
        } catch {
            if ($attempt -eq 5) { throw }
            Start-Sleep -Seconds (5 * $attempt)
        }
    }
    if (-not $downloaded) { throw "下载失败：$($image.Name)" }
    if ((Get-Item -LiteralPath $target).Length -lt 1000) {
        throw "下载文件过小：$($image.Name)"
    }
    Write-Host "已下载 $($image.Name)"
    Start-Sleep -Seconds 3
}

$signaturePath = Join-Path $outputDirectory "17-luxun-signature.png"
if (Test-Path -LiteralPath $signaturePath) {
    Add-Type -AssemblyName System.Drawing
    $sourceImage = [System.Drawing.Image]::FromFile($signaturePath)
    $whiteBitmap = New-Object System.Drawing.Bitmap($sourceImage.Width, $sourceImage.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($whiteBitmap)
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.DrawImage($sourceImage, 0, 0, $sourceImage.Width, $sourceImage.Height)
    $sourceImage.Dispose()
    $graphics.Dispose()
    $whiteBitmap.Save($signaturePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $whiteBitmap.Dispose()
}
