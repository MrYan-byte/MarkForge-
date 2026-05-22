from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


def ensure_mysql_database() -> None:
    url = make_url(settings.database_url)
    if not url.drivername.startswith("mysql"):
        return

    db_name = url.database
    if not db_name:
        return

    server_url = url.set(database="mysql")
    engine = create_engine(server_url, pool_pre_ping=True)
    with engine.begin() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
    engine.dispose()


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_database() -> None:
    ensure_mysql_database()
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
