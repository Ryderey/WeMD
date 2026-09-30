$ErrorActionPreference = 'Stop'
$chapterRepo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..\..')).Path
$chapterTarget = [IO.Path]::GetFullPath((Join-Path $chapterRepo 'apps\web\src\__tests__\services\chapterLabelReference.probe.test.ts'))
if (-not $chapterTarget.StartsWith($chapterRepo + [IO.Path]::DirectorySeparatorChar)) { throw 'Probe target is outside the repository.' }
if (Test-Path -LiteralPath $chapterTarget) { throw 'Temporary probe target already exists; refusing to overwrite it.' }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'reference-probe.test.ts') -Destination $chapterTarget
try {
    Push-Location -LiteralPath (Join-Path $chapterRepo 'apps\web')
    try {
        & node .\node_modules\vitest\vitest.mjs run src/__tests__/services/chapterLabelReference.probe.test.ts
        $chapterExitCode = $LASTEXITCODE
    } finally { Pop-Location }
} finally { Remove-Item -LiteralPath $chapterTarget }
exit $chapterExitCode
