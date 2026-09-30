from typing  import Optional
from pydantic import BaseModel, ConfigDict, Field
from schema.recipes_schema import RecipesResponse
from schema.genre_schema import GenreDetailRespose, GenreResponse

class CookBase(BaseModel):

    title:str =Field(
        ...,
        min_length=1,
        max_length=150,
        description="Title cook",
        examples=["Pastel"]
    )

    recipes_id:Optional[int] =Field(
            default=None, description="ID of recipes"
    )

    

    ingredients: Optional[str] = Field(
        None,
        min_length=1,
        description="Total ingredients pastel",
        examples=["40 gramos harina", "3 huevos"]
    )

    is_available: bool = Field(
        default=True,
        description="no description",
        examples=[True]
    )

class cookCreate(CookBase):
    genre_ids:Optional[list[int]] = Field(
        default=[],
        description="List id of genres",
        examples=[[1,2]]
    )
    pass

class cookUpdate(BaseModel):

    title:Optional[str] =Field(None,min_length=1, max_length=150)
    recipes_id:Optional[int] =None
    genre_ids:Optional[list[int]] =Field(
        None,
        description="Update List id og genres",
    )
    is_available:Optional[bool] = Field(None)

class CookSimpleResponse(CookBase):

    id:int = Field(...,description="PK databaase", examples=[1])
    
    model_config = ConfigDict(from_attributes=True)

class CookResponse(CookSimpleResponse):

    
    recipes: Optional[RecipesResponse] = None
    genres: list[GenreResponse] = []
    model_config = ConfigDict(from_attributes=True)


GenreDetailRespose.model_rebuild(
    _types_namespace={"CookSimpleResponse": CookSimpleResponse}
)