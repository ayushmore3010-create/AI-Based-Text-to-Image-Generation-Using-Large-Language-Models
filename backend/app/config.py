from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./ai_canvas.db"
    secret_key: str = "development-secret-change-me"
    openai_api_key: str = ""
    openai_text_model: str = "gpt-4o-mini"
    openai_image_model: str = "dall-e-3"
    frontend_origin: str = "http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()