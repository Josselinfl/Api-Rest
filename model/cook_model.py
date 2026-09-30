from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base
from model.genre_model import cook_genre

class Book(Base):

    __tablename__ = "cook"

    id = Column(Integer,primary_key=True, index=True,autoincrement=True)
    title = Column(String(150), nullable=False,index=True)
    recipes = Column(String(150), nullable=False,index=True)
    ingredients = Column(Integer,nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    recipes_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"),nullable=True)

    
    author = relationship("Author", back_populates="cooks", foreign_keys=[recipes_id])

    genres = relationship("Genre", secondary=cook_genre, back_populates="cook")
    def __repr__(self)->str:
        return f"<cook(id={self.id},title={self.title},recipes={self.recipes})>"
