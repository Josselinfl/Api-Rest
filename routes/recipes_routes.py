from fastapi import APIRouter,Depends,HTTPException,Query,status
from database.database import Session

from database.database import get_db
from schema.recipes_schema import RecipesCreate, RecipesResponse
import controller.recipes_controller as controller


router = APIRouter(
    prefix="/recipes",
    tags=["Recipes"]
)

@router.get(
    "/",
    response_model=list[RecipesResponse],
    summary="read and recet",
    description="Sean al recet"
)
def read_recipess(
    skip:int = Query(0,ge=0,description="Number recor"),
    limit:int = Query(100,ge=1, le=100,description="Number recor"),
    db: Session = Depends(get_db)
):
    return controller.get_all(db=db, skip=skip, limit=limit)
    
@router.post(
    "/",
    response_model=RecipesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new book",
    description="Add a book",
)


def create_new_recipes(
    recipes_data:RecipesCreate,
    db:Session=Depends(get_db)
):
    return controller.create_recipes(db=db, recipes_data=recipes_data)