@echo off
echo === DEPLOY TO SERVER ===
echo 1 - Backend only
echo 2 - Frontend only
echo 3 - All
set /p choice="Choose (1/2/3): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto all
goto end

:backend
echo === Building backend ===
cd backend
call mvn clean package -DskipTests
echo === Uploading to server ===
scp target\demo-0.0.1-SNAPSHOT.jar root@72.56.238.224:/opt/EdSpace/backend/target/
ssh root@72.56.238.224 "cd /opt/EdSpace && docker compose --env-file .env.docker up -d --build backend"
goto end

:frontend
echo === Building frontend ===
cd frontend
call npm run build
echo === Uploading to server ===
scp -r build\* root@72.56.238.224:/opt/EdSpace/frontend/build/
echo === Updating container ===
ssh root@72.56.238.224 "docker exec lmstutor-frontend rm -rf /usr/share/nginx/html/static && docker cp /opt/EdSpace/frontend/build/. lmstutor-frontend:/usr/share/nginx/html/ && docker exec lmstutor-frontend chmod -R 755 /usr/share/nginx/html/ && docker exec lmstutor-frontend nginx -s reload"
goto end

:all
echo === Building all ===
cd backend
call mvn clean package -DskipTests
cd ..\frontend
call npm run build
cd ..
echo === Uploading to server ===
scp backend\target\demo-0.0.1-SNAPSHOT.jar root@72.56.238.224:/opt/EdSpace/backend/target/
scp -r frontend\build\* root@72.56.238.224:/opt/EdSpace/frontend/build/
echo === Updating containers ===
ssh root@72.56.238.224 "cd /opt/EdSpace && docker compose --env-file .env.docker up -d --build && docker exec lmstutor-frontend rm -rf /usr/share/nginx/html/static && docker cp /opt/EdSpace/frontend/build/. lmstutor-frontend:/usr/share/nginx/html/ && docker exec lmstutor-frontend chmod -R 755 /usr/share/nginx/html/ && docker exec lmstutor-frontend nginx -s reload"
goto end

:end
echo === DONE ===
pause