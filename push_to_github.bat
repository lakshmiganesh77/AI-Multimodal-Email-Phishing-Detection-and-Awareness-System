@echo off
echo.
echo ===================================================
echo     Pushing PhishGuard Project to GitHub
echo ===================================================
echo.

echo [1/6] Deleting old Git memory to fix large-file errors...
rmdir /S /Q .git
echo.

echo [2/6] Starting Fresh Git Repository...
git init
echo.

echo [3/6] Setting up your GitHub Identity...
git config user.email "lakshmiganesh77@users.noreply.github.com"
git config user.name "Bokka Lakshmi Ganesh"
echo.

echo [4/6] Adding architectures, tools, and code (ignoring large models)...
git add .
echo.

echo [5/6] Saving Commit...
git commit -m "Final Project Release: Added System Architectures, ML Tools Stack, and Pipeline Configurations"
git branch -M main
echo.

echo [6/6] Pushing to your GitHub Repo!
git remote add origin https://github.com/lakshmiganesh77/AI-Multimodal-Email-Phishing-Detection-and-Awareness-System.git
git push -u origin main --force
echo.

echo ===================================================
echo                 SUCCESSFULLY PUSHED!
echo        (Press any key to close this window)
echo ===================================================
pause
