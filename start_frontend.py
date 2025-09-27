#!/usr/bin/env python3
"""
Скрипт для запуска фронтенда на порту 3000
"""
import http.server
import socketserver
import os
import sys

def start_frontend():
    # Переходим в папку frontend
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    os.chdir(frontend_dir)
    
    # Настройки сервера
    PORT = 3000
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Фронтенд запущен на http://localhost:{PORT}")
            print(f"Фронтенд запущен на http://127.0.0.1:{PORT}")
            print("Нажмите Ctrl+C для остановки сервера")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Порт {PORT} уже используется. Попробуйте другой порт или остановите процесс, использующий этот порт.")
        else:
            print(f"Ошибка запуска сервера: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_frontend()
