@echo off
echo ============================================
echo         EDSPACE DEPLOY v3.0
echo ============================================
echo 1 - Backend only (mvn + restart)
echo 2 - Frontend only (npm + reload)
echo 3 - All (backend + frontend)
echo ============================================
set /p choice="Choose (1/2/3): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto all
goto end

:backend
echo.
echo === [1/3] Building backend ===
cd /d C:\Users\datro\tutor-workspace\backend
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo ❌ BUILD FAILED
    goto end
)
echo.
echo === [2/3] Uploading JAR ===
scp target\demo-0.0.1-SNAPSHOT.jar root@5.129.192.139:/opt/EdSpace/backend/target/
if %errorlevel% neq 0 (
    echo ❌ UPLOAD FAILED
    goto end
)
echo.
echo === [3/3] Restarting backend ===
ssh root@5.129.192.139 "cd /opt/EdSpace && docker compose stop backend && docker compose rm -f backend && docker compose up -d backend"
echo.
echo ✅ BACKEND DEPLOYED
goto end

:frontend
echo.
echo === [1/4] Building frontend ===
cd /d C:\Users\datro\tutor-workspace\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ BUILD FAILED
    goto end
)
echo.
echo === [2/4] Uploading build ===
ssh root@5.129.192.139 "rm -rf /opt/EdSpace/frontend/build/static /opt/EdSpace/frontend/build/asset-manifest.json /opt/EdSpace/frontend/build/index.html"
scp -r build\* root@5.129.192.139:/opt/EdSpace/frontend/build/
if %errorlevel% neq 0 (
    echo ❌ UPLOAD FAILED
    goto end
)
echo.
echo === [3/4] Copying to container + fixing permissions ===
ssh root@5.129.192.139 "docker exec lmstutor-frontend rm -f /usr/share/nginx/html/static/js/main.*.js /usr/share/nginx/html/static/js/main.*.js.map /usr/share/nginx/html/static/js/main.*.js.LICENSE.txt && docker cp /opt/EdSpace/frontend/build/static/js/. lmstutor-frontend:/usr/share/nginx/html/static/js/ && docker cp /opt/EdSpace/frontend/build/index.html lmstutor-frontend:/usr/share/nginx/html/index.html && docker exec lmstutor-frontend chown -R nginx:nginx /usr/share/nginx/html/ && docker exec lmstutor-frontend chmod -R 755 /usr/share/nginx/html/ && docker exec lmstutor-frontend nginx -s reload"
echo.
echo ✅ FRONTEND DEPLOYED
goto end

:all
echo.
echo === [1/6] Building backend ===
cd /d C:\Users\datro\tutor-workspace\backend
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo ❌ BACKEND BUILD FAILED
    goto end
)
echo.
echo === [2/6] Building frontend ===
cd /d C:\Users\datro\tutor-workspace\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ FRONTEND BUILD FAILED
    goto end
)
echo.
echo === [3/6] Uploading backend ===
scp target\demo-0.0.1-SNAPSHOT.jar root@5.129.192.139:/opt/EdSpace/backend/target/
if %errorlevel% neq 0 (
    echo ❌ UPLOAD FAILED
    goto end
)
echo.
echo === [4/6] Uploading frontend ===
ssh root@5.129.192.139 "rm -rf /opt/EdSpace/frontend/build/static /opt/EdSpace/frontend/build/asset-manifest.json /opt/EdSpace/frontend/build/index.html"
scp -r build\* root@5.129.192.139:/opt/EdSpace/frontend/build/
if %errorlevel% neq 0 (
    echo ❌ UPLOAD FAILED
    goto end
)
echo.
echo === [5/6] Deploying backend ===
ssh root@5.129.192.139 "cd /opt/EdSpace && docker compose stop backend && docker compose rm -f backend && docker compose up -d backend"
echo.
echo === [6/6] Deploying frontend ===
ssh root@5.129.192.139 "docker exec lmstutor-frontend rm -f /usr/share/nginx/html/static/js/main.*.js /usr/share/nginx/html/static/js/main.*.js.map /usr/share/nginx/html/static/js/main.*.js.LICENSE.txt && docker cp /opt/EdSpace/frontend/build/static/js/. lmstutor-frontend:/usr/share/nginx/html/static/js/ && docker cp /opt/EdSpace/frontend/build/index.html lmstutor-frontend:/usr/share/nginx/html/index.html && docker exec lmstutor-frontend chown -R nginx:nginx /usr/share/nginx/html/ && docker exec lmstutor-frontend chmod -R 755 /usr/share/nginx/html/ && docker exec lmstutor-frontend nginx -s reload"
echo.
echo ✅ ALL DEPLOYED
goto end

:end
echo.
echo ============================================
pause