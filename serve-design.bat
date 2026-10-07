@echo off
rem Serves the SiteOS design prototype (this folder) with Python's built-in web server.
rem   Usage:  serve-design.bat [port]        (default port 5180)
rem   Then open http://localhost:5180/ . Press Ctrl+C in this window to stop.
rem   If Python 3 is missing it is installed automatically (for this user only, no admin rights needed).
rem   Set SITEOS_NO_BROWSER=1 to skip opening the browser automatically.
setlocal EnableExtensions
cd /d "%~dp0"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=5180"

call :findpy
if defined PY goto :run

echo.
echo   Python 3 was not found. Installing Python 3.12 for your user account (about a minute)...
call :installpy
call :findpy
if not defined PY (
  echo.
  echo   The automatic Python install did not finish. Check the messages above and your internet connection,
  echo   then run this file again.
  pause
  exit /b 1
)
echo   Python installed.

:run
echo.
echo   SiteOS design prototype
echo   http://localhost:%PORT%/
echo   Serving: %CD%
echo   Press Ctrl+C to stop.
echo.

rem open the browser a couple of seconds after the server starts listening
if not defined SITEOS_NO_BROWSER start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start "" http://localhost:%PORT%/"

rem localhost only; to open it from a phone or tablet on the same network, replace 127.0.0.1 with 0.0.0.0
%PY% -m http.server %PORT% --bind 127.0.0.1
exit /b %errorlevel%


rem ---- finds a working Python 3 and sets PY (empty if there is none) ----
:findpy
set "PY="
python --version >nul 2>&1 <nul
if not errorlevel 1 set "PY=python"
if defined PY exit /b 0
py -3 --version >nul 2>&1 <nul
if not errorlevel 1 set "PY=py -3"
if defined PY exit /b 0
rem a Python that was just installed is not on this window's PATH yet, so look in the install folders
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*" "%ProgramFiles%\Python3*") do call :trypath "%%~D\python.exe"
exit /b 0

:trypath
if defined PY exit /b 0
if not exist %1 exit /b 0
%1 --version >nul 2>&1 <nul
if errorlevel 1 exit /b 0
set PY=%1
exit /b 0


rem ---- installs Python 3.12: winget if there is one, otherwise the official python.org installer ----
:installpy
where winget >nul 2>&1
if errorlevel 1 goto :direct
echo   Installing with winget...
call winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
call :findpy
if defined PY exit /b 0
call winget install -e --id Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
call :findpy
if defined PY exit /b 0

:direct
echo   Downloading the installer from python.org...
set "ARCH=-amd64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "ARCH=-arm64"
if /i "%PROCESSOR_ARCHITECTURE%"=="x86" if not defined PROCESSOR_ARCHITEW6432 set "ARCH="
set "PYEXE=%TEMP%\python-3.12.10%ARCH%.exe"
call powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.10/python-3.12.10%ARCH%.exe' -OutFile '%PYEXE%' -UseBasicParsing"
if not exist "%PYEXE%" exit /b 1
echo   Installing...
"%PYEXE%" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 Include_test=0 Include_doc=0 Shortcuts=0
del "%PYEXE%" >nul 2>&1
exit /b 0
