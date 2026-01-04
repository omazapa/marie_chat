import os
import uuid
from datetime import datetime
from typing import Any

import docx
import pandas as pd
import PyPDF2

from app.config import settings


class FileService:
    """Service for handling file uploads and text extraction"""

    def __init__(self):
        self.upload_folder = settings.UPLOAD_FOLDER
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)

    def save_file(self, file, user_id: str) -> dict[str, Any]:
        """Save a file to the upload folder"""
        file_id = str(uuid.uuid4())
        filename = file.filename
        extension = os.path.splitext(filename)[1].lower()

        # Create user-specific folder
        user_folder = os.path.join(self.upload_folder, user_id)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        file_path = os.path.join(user_folder, f"{file_id}{extension}")
        file.save(file_path)

        file_info = {
            "id": file_id,
            "filename": filename,
            "extension": extension,
            "path": file_path,
            "size": os.path.getsize(file_path),
            "created_at": datetime.utcnow().isoformat(),
        }

        return file_info

    def extract_text(self, file_path: str, extension: str) -> str:
        """Extract text from a file based on its extension"""
        try:
            if extension == ".pdf":
                return self._extract_from_pdf(file_path)
            elif extension in [".docx", ".doc"]:
                return self._extract_from_docx(file_path)
            elif extension in [".txt", ".md"]:
                return self._extract_from_text(file_path)
            elif extension in [".xlsx", ".xls"]:
                return self._extract_from_excel(file_path)
            elif extension == ".csv":
                return self._extract_from_csv(file_path)
            else:
                return f"[Unsupported file type: {extension}]"
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            return f"[Error extracting text: {str(e)}]"

    def _extract_from_pdf(self, file_path: str) -> str:
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_from_docx(self, file_path: str) -> str:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    def _extract_from_text(self, file_path: str) -> str:
        with open(file_path, encoding="utf-8", errors="ignore") as f:
            return f.read()

    def _extract_from_excel(self, file_path: str) -> str:
        df = pd.read_excel(file_path)
        return df.to_string()

    def _extract_from_csv(self, file_path: str) -> str:
        df = pd.read_csv(file_path)
        return df.to_string()


file_service = FileService()
