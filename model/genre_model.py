from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from database.database import Base

cook_genre = Table(
    "cook_genre",
    Base.metadata,
    Column("cook_id", Integer, ForeignKey("cook.id", ondelete="CASCADE"),primary_key=True),
    Column("genre_id", Integer, ForeignKey("genres.id", ondelete="CASCADE"),primary_key=True),
)


class Genre(Base):

    __tablename__="genres"

    id = Column(Integer,primary_key=True,index=True,autoincrement=True)
    name = Column(String(150), nullable=False,index=True)

    cook = relationship("Book", secondary=cook_genre, back_populates="genres")

    def __repr__(self)->str:
        return f"<Genre(id={self.id}, name='{self.name}')>"