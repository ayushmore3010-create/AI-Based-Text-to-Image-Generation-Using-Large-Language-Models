from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .ai import enhance_prompt, generate_image
from .auth import admin_user, create_token, current_user, hash_password, verify_password
from .config import settings
from .database import Base, engine, get_db
from .models import Generation, User
from .schemas import GenerationOut, LoginInput, PromptInput, TokenOut, UserCreate, UserOut


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        if not db.scalar(select(User).where(User.email == "admin@example.com")):
            db.add(User(name="Studio Admin", email="admin@example.com", password_hash=hash_password("admin123"), is_admin=True))
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(title="AI Canvas API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "AI Canvas API"}


@app.post("/api/auth/signup", response_model=TokenOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(409, "An account with this email already exists")
    user = User(name=payload.name, email=payload.email.lower(), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user.id), "user": user}


@app.post("/api/auth/login", response_model=TokenOut)
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_token(user.id), "user": user}


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@app.post("/api/ai/enhance")
async def enhance(payload: PromptInput, _: User = Depends(current_user)):
    return {"enhanced_prompt": await enhance_prompt(payload.prompt)}


@app.post("/api/generations", response_model=GenerationOut)
async def create_generation(payload: PromptInput, user: User = Depends(current_user), db: Session = Depends(get_db)):
    enhanced = await enhance_prompt(payload.prompt)
    image_url = await generate_image(enhanced)
    item = Generation(user_id=user.id, prompt=payload.prompt, enhanced_prompt=enhanced, image_url=image_url)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/generations", response_model=list[GenerationOut])
def history(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Generation).where(Generation.user_id == user.id).order_by(Generation.created_at.desc())).all()


@app.patch("/api/generations/{generation_id}/favorite", response_model=GenerationOut)
def toggle_favorite(generation_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = db.scalar(select(Generation).where(Generation.id == generation_id, Generation.user_id == user.id))
    if not item:
        raise HTTPException(404, "Generation not found")
    item.is_favorite = not item.is_favorite
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/admin/stats")
def admin_stats(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    return {"users": db.scalar(select(func.count(User.id))), "generations": db.scalar(select(func.count(Generation.id))), "favorites": db.scalar(select(func.count(Generation.id)).where(Generation.is_favorite.is_(True)))}