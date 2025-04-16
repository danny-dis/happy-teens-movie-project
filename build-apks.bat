@echo off
REM Build script for Movo and Filo APKs
REM Author: zophlic

echo ===== Building Movo and Filo APKs =====

REM Check for required tools
echo Checking for required tools...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed. Please install Node.js and try again.
  exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: npm is not installed. Please install npm and try again.
  exit /b 1
)

where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Java is not installed. Please install Java and try again.
  exit /b 1
)

where gradle >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Warning: Gradle is not installed. Capacitor will use the Gradle wrapper.
)

REM Install Capacitor CLI if not already installed
where cap >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Installing Capacitor CLI...
  call npm install -g @capacitor/cli
)

REM Build Movo APK
echo ===== Building Movo APK =====
cd movo

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing Movo dependencies...
  call npm install
)

REM Install Capacitor dependencies
echo Installing Capacitor dependencies for Movo...
call npm install @capacitor/core @capacitor/android @capacitor/ios @capacitor/cli
call npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/local-notifications @capacitor/push-notifications @capacitor/app

REM Build the web app
echo Building Movo web app...
cd client
call npm install
call npm run build
cd ..

REM Initialize Capacitor if not already initialized
if not exist "android" (
  echo Initializing Capacitor for Movo...
  call npx cap init Movo com.zophlic.movo --web-dir client/build
)

REM Add Android platform if not already added
if not exist "android" (
  echo Adding Android platform for Movo...
  call npx cap add android
) else (
  echo Updating Android platform for Movo...
  call npx cap sync android
)

REM Copy Android resources
echo Copying Android resources for Movo...
if not exist "android\app\src\main\res\drawable" mkdir android\app\src\main\res\drawable
copy resources\icon.png android\app\src\main\res\drawable\
copy resources\splash.png android\app\src\main\res\drawable\

REM Build the APK
echo Building Movo APK...
cd android
call gradlew assembleRelease
cd ..

REM Check if APK was built successfully
if exist "android\app\build\outputs\apk\release\app-release.apk" (
  echo Copying Movo APK to project root...
  copy android\app\build\outputs\apk\release\app-release.apk ..\movo.apk
  echo Movo APK built successfully: movo.apk
) else (
  echo Error: Failed to build Movo APK.
)

cd ..

REM Build Filo APK
echo ===== Building Filo APK =====
cd filo

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing Filo dependencies...
  call npm install
)

REM Install Capacitor dependencies
echo Installing Capacitor dependencies for Filo...
call npm install @capacitor/core @capacitor/android @capacitor/ios @capacitor/cli
call npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/local-notifications @capacitor/push-notifications @capacitor/app @capacitor/filesystem @capacitor/preferences

REM Build the web app
echo Building Filo web app...
call npm run build

REM Initialize Capacitor if not already initialized
if not exist "android" (
  echo Initializing Capacitor for Filo...
  call npx cap init Filo com.zophlic.filo --web-dir build
)

REM Add Android platform if not already added
if not exist "android" (
  echo Adding Android platform for Filo...
  call npx cap add android
) else (
  echo Updating Android platform for Filo...
  call npx cap sync android
)

REM Copy Android resources
echo Copying Android resources for Filo...
if not exist "android\app\src\main\res\drawable" mkdir android\app\src\main\res\drawable
copy resources\icon.png android\app\src\main\res\drawable\
copy resources\splash.png android\app\src\main\res\drawable\

REM Build the APK
echo Building Filo APK...
cd android
call gradlew assembleRelease
cd ..

REM Check if APK was built successfully
if exist "android\app\build\outputs\apk\release\app-release.apk" (
  echo Copying Filo APK to project root...
  copy android\app\build\outputs\apk\release\app-release.apk ..\filo.apk
  echo Filo APK built successfully: filo.apk
) else (
  echo Error: Failed to build Filo APK.
)

cd ..

echo ===== Build Process Complete =====
echo APK files (if built successfully):
echo - movo.apk
echo - filo.apk

pause
