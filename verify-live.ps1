# DevPulse requirement verification — runs against any base URL.
# Usage:  .\verify-live.ps1                       (defaults to live Vercel URL)
#         .\verify-live.ps1 http://localhost:5000 (test locally)
param([string]$base = "https://dev-pulse-azure-ten.vercel.app")

$script:pass = 0; $script:fail = 0; $script:total = 0
function Check($name, $expected, $actual) {
  $script:total++
  if ($expected -eq $actual) { Write-Host ("  PASS  {0}" -f $name) -ForegroundColor Green; $script:pass++ }
  else { Write-Host ("  FAIL  {0}  expected {1}, got {2}" -f $name, $expected, $actual) -ForegroundColor Red; $script:fail++ }
}
function Req($method, $path, $body, $token) {
  $headers = @{}; if ($token) { $headers["Authorization"] = $token }
  $p = @{ Uri = "$base$path"; Method = $method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 30 }
  if ($body -ne $null) { $p["ContentType"] = "application/json"; $p["Body"] = ($body | ConvertTo-Json) }
  try { $r = Invoke-WebRequest @p; return @{ status = [int]$r.StatusCode; body = ($r.Content | ConvertFrom-Json) } }
  catch { $c = [int]$_.Exception.Response.StatusCode.value__; $b = $null; if ($_.ErrorDetails.Message) { $b = $_.ErrorDetails.Message | ConvertFrom-Json }; return @{ status = $c; body = $b } }
}

Write-Host "`nVerifying: $base" -ForegroundColor Cyan
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$johnEmail = "john_$stamp@devpulse.com"; $mariaEmail = "maria_$stamp@devpulse.com"; $carlosEmail = "carlos_$stamp@devpulse.com"

Write-Host "`n-- Auth --" -ForegroundColor Cyan
$r = Req POST "/api/auth/signup" @{ name="John"; email=$johnEmail; password="securePassword123"; role="contributor" } $null
Check "signup contributor 201" 201 $r.status
Check "signup hides password" $false ($r.body.data.PSObject.Properties.Name -contains "password")
Check "signup maintainer 201" 201 (Req POST "/api/auth/signup" @{ name="Maria"; email=$mariaEmail; password="maintainerPass1"; role="maintainer" } $null).status
Check "signup contributor2 201" 201 (Req POST "/api/auth/signup" @{ name="Carlos"; email=$carlosEmail; password="contribPass12"; role="contributor" } $null).status
Check "duplicate email 400" 400 (Req POST "/api/auth/signup" @{ name="x"; email=$johnEmail; password="whatever1" } $null).status
Check "invalid role 400" 400 (Req POST "/api/auth/signup" @{ name="x"; email="z$stamp@d.com"; password="whatever1"; role="admin" } $null).status
$r = Req POST "/api/auth/login" @{ email=$johnEmail; password="securePassword123" } $null
Check "login 200" 200 $r.status; $johnTok = $r.body.data.token
Check "login hides password" $false ($r.body.data.user.PSObject.Properties.Name -contains "password")
Check "login wrong pw 401" 401 (Req POST "/api/auth/login" @{ email=$johnEmail; password="nope" } $null).status
$mariaTok = (Req POST "/api/auth/login" @{ email=$mariaEmail; password="maintainerPass1" } $null).body.data.token
$carlosTok = (Req POST "/api/auth/login" @{ email=$carlosEmail; password="contribPass12" } $null).body.data.token

Write-Host "`n-- Create --" -ForegroundColor Cyan
$r = Req POST "/api/issues" @{ title="Bug under load"; description="Pool exhausts after 50 concurrent queries here"; type="bug" } $johnTok
Check "create 201" 201 $r.status; $bugId = $r.body.data.id
Check "create defaults open" "open" $r.body.data.status
$featId = (Req POST "/api/issues" @{ title="Dark mode"; description="Users want a dark theme option please"; type="feature_request" } $carlosTok).body.data.id
Check "create no token 401" 401 (Req POST "/api/issues" @{ title="x"; description="long enough description here ok"; type="bug" } $null).status
Check "create short desc 400" 400 (Req POST "/api/issues" @{ title="ok"; description="short"; type="bug" } $johnTok).status
Check "create bad type 400" 400 (Req POST "/api/issues" @{ title="ok"; description="long enough description here ok"; type="nope" } $johnTok).status

Write-Host "`n-- Read --" -ForegroundColor Cyan
$r = Req GET "/api/issues" $null $null
Check "get all 200" 200 $r.status
Check "get all message" "Issues retrived successfully" $r.body.message
Check "reporter embedded" $true ($r.body.data[0].PSObject.Properties.Name -contains "reporter")
Check "reporter_id dropped" $false ($r.body.data[0].PSObject.Properties.Name -contains "reporter_id")
Check "filter type=bug" $true (((Req GET "/api/issues?type=bug" $null $null).body.data | Where-Object { $_.type -ne "bug" }).Count -eq 0)
Check "bad sort 400" 400 (Req GET "/api/issues?sort=bogus" $null $null).status
Check "get single 200" 200 (Req GET "/api/issues/$bugId" $null $null).status
Check "get single 404" 404 (Req GET "/api/issues/999999" $null $null).status

Write-Host "`n-- Update (permissions) --" -ForegroundColor Cyan
Check "contributor edits own open 200" 200 (Req PATCH "/api/issues/$bugId" @{ title="Updated title for the bug here" } $johnTok).status
Check "contributor sets status 403" 403 (Req PATCH "/api/issues/$bugId" @{ status="in_progress" } $johnTok).status
Check "contributor edits others 403" 403 (Req PATCH "/api/issues/$bugId" @{ title="hack" } $carlosTok).status
Check "maintainer sets status 200" 200 (Req PATCH "/api/issues/$bugId" @{ status="in_progress" } $mariaTok).status
Check "contributor edits non-open 409" 409 (Req PATCH "/api/issues/$bugId" @{ title="late" } $johnTok).status
Check "update no token 401" 401 (Req PATCH "/api/issues/$bugId" @{ title="x" } $null).status

Write-Host "`n-- Delete (maintainer only) --" -ForegroundColor Cyan
Check "contributor delete 403" 403 (Req DELETE "/api/issues/$featId" $null $johnTok).status
Check "maintainer delete 200" 200 (Req DELETE "/api/issues/$featId" $null $mariaTok).status
Check "deleted gone 404" 404 (Req GET "/api/issues/$featId" $null $null).status

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host ("RESULTS: {0} passed, {1} failed (of {2})" -f $pass, $fail, $total) -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
