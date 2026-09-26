from sqlalchemy import Column, Integer, String, Boolean
from database.database import Base

class Book(Base):

    __tablename__ = "cook"

    id = Column(Integer,primary_key=True, index=True,autoincrement=True)
    title = Column(String(150), nullable=False,index=True)
    recipes = Column(String(150), nullable=False,index=True)
    ingredients = Column(Integer,nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    def __repr__(self)->str:
        return f"<cook(id={self.id},title={self.title},recipes={self.recipes})"
    