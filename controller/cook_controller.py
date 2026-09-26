from typing import List
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import session

from model.cook_model import Book
from schema.cook_schema import cookCreate


def get_all(db:session,skip:int = 0, limit: int = 100)->List[Book]:
    try:
        return db.query(Book).offset(skip).limit(limit).all()
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error in creating book: {str(error)}",
        )



def create_cook(db: session, cook_data: cookCreate) -> list:


    new_book = Book(
        title=cook_data.title,
        recipes=cook_data.recipes,
        ingredients=cook_data.ingredients,
        is_available=cook_data.is_available,
    )

    try:
        db.add(new_book)
        db.commit()
        db.refresh(new_book)
        return new_book
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error in creating book: {str(error)}",
        )