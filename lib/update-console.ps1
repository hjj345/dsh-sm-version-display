[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$NodeExecutable,
    [Parameter(Mandatory = $true)][string]$RuntimeScript,
    [Parameter(Mandatory = $true)][string]$StatePath,
    [Parameter(Mandatory = $true)][string]$JobId
)
$ErrorActionPreference = 'Stop'
$updateExitCode = 1
try {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $OutputEncoding = [Console]::OutputEncoding
    & $NodeExecutable $RuntimeScript --state $StatePath --job $JobId
    $updateExitCode = $LASTEXITCODE
} catch {
    Write-Host ('Update console failed: ' + $_.Exception.Message)
} finally {
    if ($updateExitCode -ne 0) { Write-Host 'Update failed. See the error and log above.' }
    Read-Host 'Press Enter to close this update window'
    exit $updateExitCode
}
