@echo off
setlocal
cd /d %~dp0
set "PYTHONPATH=%CD%"
call venv\Scripts\activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload