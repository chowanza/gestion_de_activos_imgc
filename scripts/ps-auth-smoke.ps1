# PowerShell script to smoke-test login -> protected GET -> logout
# Usage: pwsh ./scripts/ps-auth-smoke.ps1 -BaseUrl 'http://172.16.3.123:3000' -Username 'admin' -Password 'password'
param(
  [string]$BaseUrl = 'http://127.0.0.1:3000',
  [string]$Username = '',
  [SecureString]$Password
)

function Show-RespHeaders($response) {
  Write-Host 'Status:' $response.StatusCode
  Write-Host 'Headers:'
  foreach ($h in $response.Headers.GetEnumerator()) {
    Write-Host "  $($h.Key): $($h.Value)"
  }
}

# 1) Login
$loginUrl = "$BaseUrl/api/auth/login"
$loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
Write-Host "POST $loginUrl"
$loginResp = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $loginBody -ContentType 'application/json' -SessionVariable session
Show-RespHeaders($loginResp)

# 2) Call protected endpoint /api/usuarios
$protectedUrl = "$BaseUrl/api/usuarios"
Write-Host "GET $protectedUrl (with session cookies)"
$protectedResp = Invoke-WebRequest -Uri $protectedUrl -Method GET -WebSession $session -ErrorAction SilentlyContinue
Show-RespHeaders($protectedResp)

# 3) Logout
$logoutUrl = "$BaseUrl/api/auth/logout"
Write-Host "POST $logoutUrl"
$logoutResp = Invoke-WebRequest -Uri $logoutUrl -Method POST -WebSession $session -ErrorAction SilentlyContinue
Show-RespHeaders($logoutResp)

Write-Host "Done. If cookies were set/cleared correctly, login should have produced a Set-Cookie for 'session' and logout should have produced a Set-Cookie with Max-Age=0 or an empty value."