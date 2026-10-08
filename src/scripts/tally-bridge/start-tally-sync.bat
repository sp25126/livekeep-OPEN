@echo off
title Livekeeping Enterprise - Tally Sync Bridge
echo ==================================================
echo Livekeeping Tally Bridge is Initializing...
echo Ensure Tally Prime is Open and Listening on Port 9000.
echo ==================================================
cd /d %~dp0
node index.js
pause
