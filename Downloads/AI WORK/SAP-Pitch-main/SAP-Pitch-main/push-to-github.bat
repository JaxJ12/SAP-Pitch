@echo off
cd /d "%~dp0"
echo Initializing git repo...
git init
git add .
git commit -m "Update VIK language, 2027 timeline, S3E, sustainability, employee engagement"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/JaxJ12/SAP-Pitch.git
echo Pushing to GitHub...
git push -u origin main
echo.
echo Done! Press any key to close.
pause
