@echo off
echo ============================================
echo         EDSPACE DEPLOY v1.6
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
scp target\demo-0.0.1-SNAPSHOT.jar root@72.56.238.224:/opt/EdSpace/backend/target/
if %errorlevel% neq 0 (
    echo ❌ UPLOAD FAILED
    goto end
)
echo.
echo === [3/3] Restarting backend ===
ssh edspace "docker cp /opt/EdSpace/backend/target/demo-0.0.1-SNAPSHOT.jar lmstutor-backend:/app/app.jar && docker restart lmstutor-backend"
echo.
echo ✅ BACKEND DEPLOYED
goto end

:frontend
echo.
echo === [1/3] Building frontend ===
cd /d C:\Users\datro\tutor-workspace\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ BUILD FAILED
    goto end
)
echo.
echo === [2/3] Uploading build ===
scp -r build\* root@72.56.238.224:/tmp/build/
if %errorlevel% neq 0 (
    echo ❌ UPLOAD FAILED
    goto end
)
echo.
echo === [3/3] Updating container ===
ssh edspace "docker cp /tmp/build/. lmstutor-frontend:/usr/share/nginx/html/ && docker exec lmstutor-frontend chmod -R 755 /usr/share/nginx/html/ && docker exec lmstutor-frontend nginx -s reload"
echo.
echo ✅ FRONTEND DEPLOYED
goto end

:all
echo.
echo === [1/5] Building backend ===
cd /d C:\Users\datro\tutor-workspace\backend
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo ❌ BACKEND BUILD FAILED
    goto end
)
echo.
echo === [2/5] Building frontend ===
cd /d C:\Users\datro\tutor-workspace\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ FRONTEND BUILD FAILED
    goto end
)
echo.
echo === [3/5] Uploading backend ===
cd /d C:\Users\datro\tutor-workspace\backend
scp target\demo-0.0.1-SNAPSHOT.jar root@72.56.238.224:/opt/EdSpace/backend/target/
echo.
echo === [4/5] Uploading frontend ===
cd /d C:\Users\datro\tutor-workspace\frontend
scp -r build\* root@72.56.238.224:/tmp/build/
echo.
echo === [5/5] Deploying containers ===
ssh edspace "docker cp /opt/EdSpace/backend/target/demo-0.0.1-SNAPSHOT.jar lmstutor-backend:/app/app.jar && docker restart lmstutor-backend && docker cp /tmp/build/. lmstutor-frontend:/usr/share/nginx/html/ && docker exec lmstutor-frontend chmod -R 755 /usr/share/nginx/html/ && docker exec lmstutor-frontend nginx -s reload"
echo.
echo ✅ ALL DEPLOYED
goto end

:end
echo.
echo ============================================
pause