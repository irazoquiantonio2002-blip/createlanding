# =============================================================
#  Setup del servidor MCP de n8n para Claude Code
#  Uso:
#    1. Edita las dos variables de abajo (URL y API key)
#    2. Abre PowerShell en esta carpeta
#    3. Ejecuta:  .\setup-n8n-mcp.ps1
#    4. Al terminar, en Claude Code escribe:  /mcp
# =============================================================

# ---- EDITA ESTO -------------------------------------------------
$N8N_API_URL = "https://n8n.agenciahello.com.mx"   # sin barra final
$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlOTYwMjhjYi05NWUzLTQxNWQtYWZjMi1kMDEyNDU5MDkxM2UiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTFjMjI4OWItZWE4Yy00ZmZjLWJmODItOWYyZTFlZGM4ZDlkIiwiaWF0IjoxNzg4Mzg3Njc1LCJleHAiOjE3OTA5MTM2MDB9.1_WP8HdXM8xF3_ZWn8GT8UU0TBMRZUfdEG5rAqlb2OY"
# Scope: "local" (solo este proyecto), "user" (todas tus sesiones)
$SCOPE       = "local"
# ---------------------------------------------------------------

$ErrorActionPreference = "Stop"

Write-Host "== Verificando Node.js ==" -ForegroundColor Cyan
$nodeVersion = (node --version) 2>$null
if (-not $nodeVersion) {
    Write-Host "Node.js no encontrado. Instalalo desde https://nodejs.org (18+)." -ForegroundColor Red
    exit 1
}
$major = [int]($nodeVersion.TrimStart("v").Split(".")[0])
if ($major -lt 18) {
    Write-Host "Node $nodeVersion es muy viejo. Se necesita 18 o superior." -ForegroundColor Red
    exit 1
}
Write-Host "Node $nodeVersion OK" -ForegroundColor Green

if ($N8N_API_URL -like "*TU-INSTANCIA*" -or $N8N_API_KEY -like "*PEGA_AQUI*") {
    Write-Host "Falta editar N8N_API_URL y N8N_API_KEY dentro de este script." -ForegroundColor Red
    exit 1
}

Write-Host "== Verificando conexion con n8n ==" -ForegroundColor Cyan
try {
    $resp = Invoke-RestMethod -Uri "$N8N_API_URL/api/v1/workflows?limit=1" `
        -Headers @{ "X-N8N-API-KEY" = $N8N_API_KEY } -Method Get
    Write-Host "API de n8n responde OK" -ForegroundColor Green
} catch {
    Write-Host "No se pudo conectar a la API de n8n:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Revisa la URL y el API key (Settings -> n8n API)." -ForegroundColor Yellow
    exit 1
}

Write-Host "== Quitando registro previo de n8n-mcp (si existe) ==" -ForegroundColor Cyan
claude mcp remove n8n-mcp -s $SCOPE 2>$null

Write-Host "== Agregando servidor MCP n8n-mcp ==" -ForegroundColor Cyan
claude mcp add n8n-mcp -s $SCOPE `
    -e N8N_API_URL=$N8N_API_URL `
    -e N8N_API_KEY=$N8N_API_KEY `
    -e MCP_MODE=stdio `
    -e LOG_LEVEL=error `
    -e DISABLE_CONSOLE_OUTPUT=true `
    -- cmd /c npx -y n8n-mcp

Write-Host ""
Write-Host "Listo. Ahora en Claude Code escribe:  /mcp" -ForegroundColor Green
Write-Host "Debe aparecer 'n8n-mcp' como connected." -ForegroundColor Green
