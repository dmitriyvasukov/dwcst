from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from app.core.dependencies import require_admin
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["upload"])

# Создаем папку для загруженных файлов
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Разрешенные типы файлов
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

def is_allowed_file(filename: str) -> bool:
    """Проверяет, разрешен ли тип файла"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

@router.post("/image")
async def upload_image(file: UploadFile = File(...), admin: bool = Depends(require_admin)):
    """Загружает изображение и возвращает URL для доступа к нему"""
    
    # Проверяем тип файла
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Неподдерживаемый тип файла. Разрешены: jpg, jpeg, png, gif, webp"
        )
    
    # Проверяем размер файла (максимум 10MB)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="Файл слишком большой. Максимум 10MB")
    
    # Генерируем уникальное имя файла
    file_extension = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Сохраняем файл
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Возвращаем URL для доступа к файлу
        file_url = f"/api/v1/upload/files/{unique_filename}"
        return {
            "filename": unique_filename,
            "url": file_url,
            "original_name": file.filename,
            "size": len(file_content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения файла: {str(e)}")

@router.get("/files/{filename}")
async def get_file(filename: str):
    """Возвращает загруженный файл"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="image/*"
    )

@router.delete("/files/{filename}")
async def delete_file(filename: str, admin: bool = Depends(require_admin)):
    """Удаляет загруженный файл"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    try:
        file_path.unlink()
        return {"message": "Файл успешно удален"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления файла: {str(e)}")

