from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    database_url: str = "sqlite:///./data/bloodbuddy.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    auth_mode: str = "demo"
    jwt_secret: str = "bloodbuddy-dev-secret-change-in-production"
    jwt_expire_minutes: int = 1440
    ai_provider: str = "demo"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5vl:3b"
    max_upload_size_mb: int = 10

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
