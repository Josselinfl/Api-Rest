from typing import List
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import session

from model.recipes_model import Author
from schema.recipes_schema import RecipesCreate


def get_all(db:session,skip:int = 0, limit: int = 100)->List[Author]:
    try:
        return db.query(Author).offset(skip).limit(limit).all()
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error in creating book: {str(error)}",
        )



def create_recipes(db: session, recipes_data: RecipesCreate) -> Author:


    new_recipes = Author(
        name=recipes_data.name,
        index=recipes_data.index
    )

    try:
        db.add(new_recipes)
        db.commit()
        db.refresh(new_recipes)
        return new_recipes
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error in creating recipes: {str(error)}",
        )