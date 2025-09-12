#!/usr/bin/env python3
"""
Authentication service for IntelliLab GC API
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..core.config import settings
from ..models.schemas import UserCreate, User, UserRole, TokenData
from ..core.database import get_db

# Database models
Base = declarative_base()


class UserModel(Base):
    """User database model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="scientist")
    is_active = Column(Boolean, default=True)
    department = Column(String(255))
    phone = Column(String(50))
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)


class AuthService:
    """Authentication service"""
    
    def __init__(self):
        """Initialize authentication service"""
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify JWT token and return token data"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            role: str = payload.get("role")
            
            if email is None or user_id is None:
                return None
            
            return TokenData(email=email, user_id=user_id, role=UserRole(role))
        except jwt.PyJWTError:
            return None
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_user(self, db: Session, user: UserCreate) -> User:
        """Create new user"""
        hashed_password = self.hash_password(user.password)
        db_user = UserModel(
            email=user.email,
            full_name=user.full_name,
            hashed_password=hashed_password,
            role=user.role.value,
            is_active=user.is_active,
            department=user.department,
            phone=user.phone
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return self._model_to_schema(db_user)
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        db_user = db.query(UserModel).filter(UserModel.email == email).first()
        if db_user:
            return self._model_to_schema(db_user)
        return None
    
    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if db_user:
            return self._model_to_schema(db_user)
        return None
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user
    
    def update_last_login(self, db: Session, user_id: int) -> None:
        """Update user's last login timestamp"""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if db_user:
            db_user.last_login = datetime.utcnow()
            db.commit()
    
    def change_password(self, db: Session, user_id: int, current_password: str, new_password: str) -> bool:
        """Change user password"""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not db_user:
            return False
        
        if not self.verify_password(current_password, db_user.hashed_password):
            return False
        
        db_user.hashed_password = self.hash_password(new_password)
        db.commit()
        return True
    
    def update_user(self, db: Session, user_id: int, user_update: Dict[str, Any]) -> Optional[User]:
        """Update user information"""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not db_user:
            return None
        
        # Update fields
        for field, value in user_update.items():
            if field == "password" and value:
                setattr(db_user, "hashed_password", self.hash_password(value))
            elif hasattr(db_user, field):
                setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        return self._model_to_schema(db_user)
    
    def get_all_users(self, db: Session, skip: int = 0, limit: int = 100) -> list[User]:
        """Get all users with pagination"""
        db_users = db.query(UserModel).offset(skip).limit(limit).all()
        return [self._model_to_schema(user) for user in db_users]
    
    def delete_user(self, db: Session, user_id: int) -> bool:
        """Delete user (soft delete by setting is_active=False)"""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not db_user:
            return False
        
        db_user.is_active = False
        db.commit()
        return True
    
    def _model_to_schema(self, db_user: UserModel) -> User:
        """Convert database model to schema"""
        return User(
            id=db_user.id,
            email=db_user.email,
            full_name=db_user.full_name,
            role=UserRole(db_user.role),
            is_active=db_user.is_active,
            department=db_user.department,
            phone=db_user.phone,
            created_date=db_user.created_date,
            modified_date=db_user.modified_date,
            last_login=db_user.last_login
        )


# Create global auth service instance
auth_service = AuthService()

# Security scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            auth_service.secret_key, 
            algorithms=[auth_service.algorithm]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = auth_service.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user
