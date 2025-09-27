@echo off
echo Запуск фронтенда на порту 3000...
cd frontend
python -m http.server 3000
pause
