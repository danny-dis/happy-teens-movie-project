#!/bin/bash

# Build script for Movo and Filo APKs
# Author: zophlic

echo "===== Building Movo and Filo APKs ====="

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "Checking for required tools..."

if ! command_exists node; then
  echo "Error: Node.js is not installed. Please install Node.js and try again."
  exit 1
fi

if ! command_exists npm; then
  echo "Error: npm is not installed. Please install npm and try again."
  exit 1
fi

if ! command_exists java; then
  echo "Error: Java is not installed. Please install Java and try again."
  exit 1
fi

if ! command_exists gradle; then
  echo "Warning: Gradle is not installed. Capacitor will use the Gradle wrapper."
fi

# Install Capacitor CLI if not already installed
if ! command_exists cap; then
  echo "Installing Capacitor CLI..."
  npm install -g @capacitor/cli
fi

# Build Movo APK
echo "===== Building Movo APK ====="
cd movo

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Movo dependencies..."
  npm install
fi

# Install Capacitor dependencies
echo "Installing Capacitor dependencies for Movo..."
npm install @capacitor/core @capacitor/android @capacitor/ios @capacitor/cli
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/local-notifications @capacitor/push-notifications @capacitor/app

# Build the web app
echo "Building Movo web app..."
cd client
npm install
npm run build
cd ..

# Initialize Capacitor if not already initialized
if [ ! -d "android" ]; then
  echo "Initializing Capacitor for Movo..."
  npx cap init Movo com.zophlic.movo --web-dir client/build
fi

# Add Android platform if not already added
if [ ! -d "android" ]; then
  echo "Adding Android platform for Movo..."
  npx cap add android
else
  echo "Updating Android platform for Movo..."
  npx cap sync android
fi

# Copy Android resources
echo "Copying Android resources for Movo..."
mkdir -p android/app/src/main/res/drawable
cp resources/icon.png android/app/src/main/res/drawable/
cp resources/splash.png android/app/src/main/res/drawable/

# Build the APK
echo "Building Movo APK..."
cd android
./gradlew assembleRelease
cd ..

# Check if APK was built successfully
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
  echo "Copying Movo APK to project root..."
  cp android/app/build/outputs/apk/release/app-release.apk ../movo.apk
  echo "Movo APK built successfully: movo.apk"
else
  echo "Error: Failed to build Movo APK."
fi

cd ..

# Build Filo APK
echo "===== Building Filo APK ====="
cd filo

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Filo dependencies..."
  npm install
fi

# Install Capacitor dependencies
echo "Installing Capacitor dependencies for Filo..."
npm install @capacitor/core @capacitor/android @capacitor/ios @capacitor/cli
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/local-notifications @capacitor/push-notifications @capacitor/app @capacitor/filesystem @capacitor/preferences

# Build the web app
echo "Building Filo web app..."
npm run build

# Initialize Capacitor if not already initialized
if [ ! -d "android" ]; then
  echo "Initializing Capacitor for Filo..."
  npx cap init Filo com.zophlic.filo --web-dir build
fi

# Add Android platform if not already added
if [ ! -d "android" ]; then
  echo "Adding Android platform for Filo..."
  npx cap add android
else
  echo "Updating Android platform for Filo..."
  npx cap sync android
fi

# Copy Android resources
echo "Copying Android resources for Filo..."
mkdir -p android/app/src/main/res/drawable
cp resources/icon.png android/app/src/main/res/drawable/
cp resources/splash.png android/app/src/main/res/drawable/

# Build the APK
echo "Building Filo APK..."
cd android
./gradlew assembleRelease
cd ..

# Check if APK was built successfully
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
  echo "Copying Filo APK to project root..."
  cp android/app/build/outputs/apk/release/app-release.apk ../filo.apk
  echo "Filo APK built successfully: filo.apk"
else
  echo "Error: Failed to build Filo APK."
fi

cd ..

echo "===== Build Process Complete ====="
echo "APK files (if built successfully):"
echo "- movo.apk"
echo "- filo.apk"
