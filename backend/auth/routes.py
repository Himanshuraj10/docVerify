from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import User, UserRole, AdminLog
from backend.schemas.schemas import (
    UserSignupRequest, UserLoginRequest, TokenResponse, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest
)
from backend.auth.security import (
    verify_password, get_password_hash, create_access_token,
    create_password_reset_token, verify_password_reset_token
)
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignupRequest, db: Session = Depends(get_db)):
    # Check if email already registered
    existing_user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Securely hash password
    hashed_pwd = get_password_hash(payload.password)

    # Create new user with normal USER role
    new_user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hashed_pwd,
        role=UserRole.USER,
        is_active=True,
        permissions=[]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    token = create_access_token({"sub": str(new_user.id), "role": new_user.role.value})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=new_user.role.value,
        name=new_user.name,
        email=new_user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled. Please contact administrator."
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role.value,
        name=user.name,
        email=user.email
    )

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    if not user:
        # Avoid user enumeration in public responses
        return {"message": "If the email is registered, password reset instructions have been generated.", "reset_token": None}

    reset_token = create_password_reset_token(user.email)
    return {
        "message": "Password reset token generated successfully. In production, this is emailed securely.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Password has been reset successfully. You can now log in with your new password."}
