"""Configuration for Flask application."""
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 1)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 30)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # OpenSearch Configuration
    OPENSEARCH_HOSTS = os.environ.get('OPENSEARCH_HOSTS', 'https://localhost:9200').split(',')
    OPENSEARCH_USER = os.environ.get('OPENSEARCH_USER', 'admin')
    OPENSEARCH_PASSWORD = os.environ.get('OPENSEARCH_PASSWORD', 'admin')
    OPENSEARCH_USE_SSL = os.environ.get('OPENSEARCH_USE_SSL', 'true').lower() == 'true'
    OPENSEARCH_VERIFY_CERTS = os.environ.get('OPENSEARCH_VERIFY_CERTS', 'false').lower() == 'true'
    OPENSEARCH_TIMEOUT = int(os.environ.get('OPENSEARCH_TIMEOUT', 30))
    
    # Flask Configuration
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    TESTING = False


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

