from fastapi import APIRouter,Depends,HTTPException,Query,status
from database.database import Session

from database.database import get_db
from schema.cook_schema import cookCreate, CookResponse
import controller.cook_controller as controller


router = APIRouter(
    prefix="/book",
    tags=["Book"]
)

@router.get(
    "/",
    response_model=list[CookResponse],
    summary="read and recet",
    description="Sean al recet"
)
def read_cooks(
    skip:int = Query(0,ge=0,description="Number recor"),
    limit:int = Query(100,ge=1, le=100,description="Number recor"),
    db: Session = Depends(get_db)
):
    return controller.get_all(db=db, skip=skip, limit=limit)
    
@router.post(
    "/",
    response_model=CookResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new book",
    description="Add a book",
)


def create_new_book(
    cook_data:cookCreate,
    db:Session =Depends(get_db)
):
    return controller.create_cook(db=db, cook_data=cook_data)