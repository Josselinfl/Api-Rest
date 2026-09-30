from fastapi import APIRouter,Depends,Query,status
from database.database import Session

from database.database import get_db
from schema.genre_schema import GenreCreate, GenreResponse,GenreDetailRespose
import controller.genre_controller as controller


router = APIRouter(
    prefix="/genres",
    tags=["Genres"]
)

@router.get(
    "/",
    response_model=list[GenreDetailRespose],
    summary="read and list genres",
    description="List all genres"
)
def read_genres(
    skip:int = Query(0,ge=0,description="Number records to skip"),
    limit:int = Query(100,ge=1, le=100,description="Number records to return"),
    db: Session = Depends(get_db)
):
    return controller.get_all(db=db, skip=skip, limit=limit)

@router.post(
    "/",
    response_model=GenreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new genre",
    description="Add a genre",
)
def create_new_genre(
    genre_data:GenreCreate,
    db:Session=Depends(get_db)
):
    return controller.create_genre(db=db, genre_data=genre_data)
