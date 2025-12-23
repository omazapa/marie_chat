import os
from datetime import timedelta
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Flask
    FLASK_ENV: str = os.getenv('FLASK_ENV', 'development')
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG: bool = FLASK_ENV == 'development'
    PORT: int = int(os.getenv('PORT', '5000'))
    
    # JWT
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(days=30)
    JWT_TOKEN_LOCATION: list = ['headers']
    JWT_HEADER_NAME: str = 'Authorization'
    JWT_HEADER_TYPE: str = 'Bearer'
    
    # OpenSearch
    OPENSEARCH_HOSTS: str = os.getenv('OPENSEARCH_HOSTS', 'http://localhost:9200')
    OPENSEARCH_USER: str = os.getenv('OPENSEARCH_USER', 'admin')
    OPENSEARCH_PASSWORD: str = os.getenv('OPENSEARCH_PASSWORD', 'Marie_Chat_2024!')
    OPENSEARCH_USE_SSL: bool = os.getenv('OPENSEARCH_USE_SSL', 'false').lower() == 'true'
    OPENSEARCH_VERIFY_CERTS: bool = os.getenv('OPENSEARCH_VERIFY_CERTS', 'false').lower() == 'true'
    
    @property
    def opensearch_hosts_list(self) -> list:
        """Convert OPENSEARCH_HOSTS string to list"""
        if isinstance(self.OPENSEARCH_HOSTS, list):
            return self.OPENSEARCH_HOSTS
        return [self.OPENSEARCH_HOSTS]
    
    # Ollama
    OLLAMA_BASE_URL: str = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    DEFAULT_LLM_MODEL: str = os.getenv('DEFAULT_LLM_MODEL', 'llama3.2')
    DEFAULT_LLM_PROVIDER: str = os.getenv('DEFAULT_LLM_PROVIDER', 'ollama')
    
    # HuggingFace
    HUGGINGFACE_API_KEY: str = os.getenv('HUGGINGFACE_API_KEY', '')
    
    # Embeddings
    EMBEDDING_MODEL: str = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    EMBEDDING_DIMENSION: int = int(os.getenv('EMBEDDING_DIMENSION', '384'))
    
    # Speech
    WHISPER_MODEL: str = os.getenv('WHISPER_MODEL', 'base')
    WHISPER_DEVICE: str = os.getenv('WHISPER_DEVICE', 'cpu')
    
    # CORS
    CORS_ORIGINS: list = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
    ]
    
    # File Upload
    UPLOAD_FOLDER: str = os.getenv('UPLOAD_FOLDER', './uploads')
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    class Config:
        case_sensitive = True
        env_file = '.env'


settings = Settings()
