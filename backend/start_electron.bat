@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Get the directory of the current script
SET "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%" || exit /b

:: Set default values
IF "%PORT%"=="" SET PORT=8080
IF "%HOST%"=="" SET HOST=127.0.0.1

:: Check if WEBUI_SECRET_KEY is set
SET "KEY_FILE=.webui_secret_key"
IF NOT "%WEBUI_SECRET_KEY_FILE%" == "" (
    SET "KEY_FILE=%WEBUI_SECRET_KEY_FILE%"
)

IF "%WEBUI_SECRET_KEY%" == "" (
    echo Loading WEBUI_SECRET_KEY from file, not provided as an environment variable.

    IF NOT EXIST "%KEY_FILE%" (
        echo Generating WEBUI_SECRET_KEY
        :: Generate a simple secret key for development
        echo electron-dev-key-123456 > "%KEY_FILE%"
        echo WEBUI_SECRET_KEY generated
    )

    echo Loading WEBUI_SECRET_KEY from %KEY_FILE%
    SET /p WEBUI_SECRET_KEY=<%KEY_FILE%
)

:: Execute uvicorn with minimal workers for desktop app
SET "WEBUI_SECRET_KEY=%WEBUI_SECRET_KEY%"
SET UVICORN_WORKERS=1
echo Starting backend server on %HOST%:%PORT%
uvicorn open_webui.main:app --host "%HOST%" --port "%PORT%" --forwarded-allow-ips '*' --workers %UVICORN_WORKERS% --ws auto
