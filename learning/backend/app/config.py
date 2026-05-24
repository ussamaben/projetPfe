import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://auth:12345678@localhost/auth_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400  # 24 hours
    # Allow simple local development bypass for manager endpoints when running locally.
    # Set ALLOW_DEVMODE=false in environment to disable.
    ALLOW_DEVMODE = os.getenv('ALLOW_DEVMODE', 'true').lower() == 'true'
    DEV_USER_ID = int(os.getenv('DEV_USER_ID', '1'))
    
    