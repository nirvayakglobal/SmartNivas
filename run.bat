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
echo  - Niravayak Central CRM: http://localhost:5000/central/leads
echo  - Central CRM Login:     http://localhost:5000/central/login
echo  - Society Admin ERP:     http://localhost:5000/admin/topology
echo  - Society Admin Login:   http://localhost:5000/admin/login
echo  - API Health Check:      http://localhost:5000/api/health
echo.
echo  Default Credentials (Seed Data):
echo  - Super Admin Phone:     9999999999
echo  - Super Admin Password:  SuperAdmin@Niravayak2026!
echo =====================================================================
echo.
echo Opening browser at http://localhost:5000/central/leads ...
echo.

start "" "http://localhost:5000/central/leads"

python passenger_wsgi.py

pause
