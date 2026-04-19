$ptPath = "c:\Users\mkavi\Desktop\pt"
$capPath = "c:\Users\mkavi\Desktop\Capstone"

function Commit-Batch($message) {
    Set-Location $capPath
    git add -A
    git commit -m $message
}

# 1. Root Configuration
Copy-Item "$ptPath\.gitignore" "$capPath\" -Force
Copy-Item "$ptPath\README.md" "$capPath\" -Force
Commit-Batch "chore: add root configuration and documentation"

# 2. Backend Initialization
New-Item -ItemType Directory -Force -Path "$capPath\backend" | Out-Null
Copy-Item "$ptPath\backend\package.json" "$capPath\backend\" -Force
if (Test-Path "$ptPath\backend\.env.example") { Copy-Item "$ptPath\backend\.env.example" "$capPath\backend\" -Force }
if (Test-Path "$ptPath\backend\Dockerfile") { Copy-Item "$ptPath\backend\Dockerfile" "$capPath\backend\" -Force }
Commit-Batch "chore(backend): initialize backend project structure"

# 3. Backend Config & Utils
if (Test-Path "$ptPath\backend\config") { Copy-Item "$ptPath\backend\config" "$capPath\backend\config" -Recurse -Force }
if (Test-Path "$ptPath\backend\utils") { Copy-Item "$ptPath\backend\utils" "$capPath\backend\utils" -Recurse -Force }
Commit-Batch "feat(backend): add database configuration and utility functions"

# 4. Backend Models
if (Test-Path "$ptPath\backend\models") { Copy-Item "$ptPath\backend\models" "$capPath\backend\models" -Recurse -Force }
Commit-Batch "feat(backend): add Mongoose schemas and database models"

# 5. Backend Middleware
if (Test-Path "$ptPath\backend\middleware") { Copy-Item "$ptPath\backend\middleware" "$capPath\backend\middleware" -Recurse -Force }
Commit-Batch "feat(backend): implement authentication and request middleware"

# 6. Backend Controllers
if (Test-Path "$ptPath\backend\controllers") { Copy-Item "$ptPath\backend\controllers" "$capPath\backend\controllers" -Recurse -Force }
Commit-Batch "feat(backend): add controllers for core business logic"

# 7. Backend Routes
if (Test-Path "$ptPath\backend\routes") { Copy-Item "$ptPath\backend\routes" "$capPath\backend\routes" -Recurse -Force }
Commit-Batch "feat(backend): define REST API routes and endpoint mapping"

# 8. Backend Services
if (Test-Path "$ptPath\backend\services") { Copy-Item "$ptPath\backend\services" "$capPath\backend\services" -Recurse -Force }
Commit-Batch "feat(backend): add service layer for external integrations"

# 9. Backend Jobs & Seeds
if (Test-Path "$ptPath\backend\jobs") { Copy-Item "$ptPath\backend\jobs" "$capPath\backend\jobs" -Recurse -Force }
if (Test-Path "$ptPath\backend\seeds") { Copy-Item "$ptPath\backend\seeds" "$capPath\backend\seeds" -Recurse -Force }
Commit-Batch "feat(backend): add scheduled cron jobs and database seeders"

# 10. Backend Entry Points (all root-level .js files + .env)
Get-ChildItem -Path "$ptPath\backend" -File | ForEach-Object { Copy-Item $_.FullName "$capPath\backend\" -Force }
Commit-Batch "feat(backend): add server entry point and app initialization"

# 11. Frontend Init + Public
New-Item -ItemType Directory -Force -Path "$capPath\frontend" | Out-Null
Copy-Item "$ptPath\frontend\package.json" "$capPath\frontend\" -Force
if (Test-Path "$ptPath\frontend\.env") { Copy-Item "$ptPath\frontend\.env" "$capPath\frontend\" -Force }
if (Test-Path "$ptPath\frontend\public") { Copy-Item "$ptPath\frontend\public" "$capPath\frontend\public" -Recurse -Force }
Commit-Batch "chore(frontend): initialize React frontend application"

# 12. Frontend API & Utils
New-Item -ItemType Directory -Force -Path "$capPath\frontend\src" | Out-Null
if (Test-Path "$ptPath\frontend\src\api") { Copy-Item "$ptPath\frontend\src\api" "$capPath\frontend\src\api" -Recurse -Force }
if (Test-Path "$ptPath\frontend\src\utils") { Copy-Item "$ptPath\frontend\src\utils" "$capPath\frontend\src\utils" -Recurse -Force }
Commit-Batch "feat(frontend): add Axios API client and auth utilities"

# 13. Frontend Styles
if (Test-Path "$ptPath\frontend\src\styles") { Copy-Item "$ptPath\frontend\src\styles" "$capPath\frontend\src\styles" -Recurse -Force }
Commit-Batch "style(frontend): add global styles, themes and component CSS"

# 14. Frontend Components
if (Test-Path "$ptPath\frontend\src\components") { Copy-Item "$ptPath\frontend\src\components" "$capPath\frontend\src\components" -Recurse -Force }
Commit-Batch "feat(frontend): build reusable UI components"

# 15. Frontend Core Pages (excluding admin/driver)
if (Test-Path "$ptPath\frontend\src\pages") {
    New-Item -ItemType Directory -Force -Path "$capPath\frontend\src\pages" | Out-Null
    Get-ChildItem -Path "$ptPath\frontend\src\pages" -File | ForEach-Object { Copy-Item $_.FullName "$capPath\frontend\src\pages\" -Force }
}
Commit-Batch "feat(frontend): implement core pages - Home, Login, Register, Tracking"

# 16. Frontend Admin & Driver Pages
if (Test-Path "$ptPath\frontend\src\pages\admin") { Copy-Item "$ptPath\frontend\src\pages\admin" "$capPath\frontend\src\pages\admin" -Recurse -Force }
if (Test-Path "$ptPath\frontend\src\pages\driver") { Copy-Item "$ptPath\frontend\src\pages\driver" "$capPath\frontend\src\pages\driver" -Recurse -Force }
Commit-Batch "feat(frontend): add role-based admin and driver dashboard pages"

# 17. Frontend App Entry Files
Get-ChildItem -Path "$ptPath\frontend\src" -File | ForEach-Object { Copy-Item $_.FullName "$capPath\frontend\src\" -Force }
Commit-Batch "feat(frontend): add App.js routing and React entry point"

Write-Host "`n=== All 17 commits completed! ===" -ForegroundColor Green
