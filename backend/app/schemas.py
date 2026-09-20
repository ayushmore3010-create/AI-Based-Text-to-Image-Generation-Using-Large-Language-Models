from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    is_admin: bool
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    user: UserOut


class PromptInput(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)


class GenerationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    prompt: str
    enhanced_prompt: str
    image_url: str
    is_favorite: bool
    created_at: datetime