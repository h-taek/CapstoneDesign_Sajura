from pydantic_settings import BaseSettings, SettingsConfigDict
import os

# 현재 파일의 위치를 기준으로 상위 폴더들로 올라가서 .env 경로를 찾습니다.
# (.env 파일은 보통 프로젝트 최상단에 위치)
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.abspath(os.path.join(current_dir, "../../../.env"))

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    model_config = SettingsConfigDict(
        env_file=env_path,
        env_file_encoding="utf-8",
        extra="ignore"  # .env에 선언되지 않은 변수가 있어도 무시
    )

settings = Settings()
