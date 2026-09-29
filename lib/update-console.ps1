[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$NodeExecutable,
    [Parameter(Mandatory = $true)][string]$WorkerScript,
    [Parameter(Mandatory = $true)][string]$StatePath,
    [Parameter(Mandatory = $true)][int]$HostPid
)

$ErrorActionPreference = "Stop"
$exitCode = 1

try {
    try {
        [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
        $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    } catch {
        # The update itself must not fail because the console cannot change code page.
    }

    Write-Host "DSH independent update window"
    Write-Host "Target DSH process PID: $HostPid"
    Write-Host ""
    Write-Host "Close DSH Web. Dependency repair continues automatically after it exits."

    $lastNotice = [DateTime]::UtcNow
    while ($true) {
        try {
            Get-Process -Id $HostPid -ErrorAction Stop | Out-Null
            if (([DateTime]::UtcNow - $lastNotice).TotalSeconds -ge 10) {
                Write-Host "Waiting for the DSH process to exit..."
                $lastNotice = [DateTime]::UtcNow
            }
            Start-Sleep -Milliseconds 500
        } catch {
            break
        }
    }

    Start-Sleep -Seconds 2
    Write-Host ""
    Write-Host "DSH exited. Starting dependency repair."
    Write-Host "------------------------------------------------------------"
    & $NodeExecutable $WorkerScript --state $StatePath --action offline-repair --console
    $exitCode = $LASTEXITCODE
    Write-Host "------------------------------------------------------------"

    if ($exitCode -eq 0) {
        Write-Host "Dependency repair completed. You can restart DSH now."
        Write-Host "After restart, verify the installation in the plugin page."
    } else {
        Write-Host "Dependency repair failed. Do not restart DSH yet."
        Write-Host "Review the error above or use the manual repair command in the plugin page."
    }
} catch {
    $exitCode = 1
    Write-Host "Independent update window failed: $($_.Exception.Message)"
} finally {
    Write-Host ""
    Read-Host "Press Enter to close this update window"
    exit $exitCode
}
