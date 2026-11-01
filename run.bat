@echo off
title Smart Nivas - Platform Launcher

echo =====================================================================
echo  SMART NIVAS - HOUSING SOCIETY AND VISITOR MANAGEMENT PLATFORM
echo  Owned and Operated by Niravayak Global
echo =====================================================================
echo.

cd /d "%~dp0"

echo [Step 1/2] Checking MySQL InnoDB database and initializing schema...
python backend_api\database\initialize_database.py
echo.

echo [Step 2/2] Starting Smart Nivas Application Server...
echo =====================================================================
echo  Platform URLs:
echo  - Niravayak Global CRM: http://localhost:5000/CRM/login
echo  - Society Admin ERP:    http://localhost:5000/Society/Admin/login
echo  - API Health Check:     http://localhost:5000/api/health
echo.
echo  Default Credentials (Seed Data):
echo  - Super Admin Phone:     9999999999
echo  - Super Admin Password:  SuperAdmin@Niravayak2026!
echo =====================================================================
echo.
echo Opening browser at http://localhost:5000/CRM/login ...
echo.

start "" "http://localhost:5000/CRM/login"

python passenger_wsgi.py

pause
