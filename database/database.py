from typing import Generator
from sqlalchemy import create_engine,MetaData
from sqlalchemy.orm import declarative_base,sessionmaker,Session
from config.config_variables import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread":False}
)

SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine
)

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

Base = declarative_base(metadata=MetaData(naming_convention=NAMING_CONVENTION))

def get_db() -> Generator[Session,None,None]:
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()
