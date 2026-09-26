from typing  import Optional
from pydantic import BaseModel, ConfigDict, Field

class CookBase(BaseModel):

    title:str =Field(
        ...,
        min_length=1,
        max_length=150,
        description="Title cook",
        examples=["Pastel"]
    )

    recipes:str =Field(
            ...,
            min_length=1,
            max_length=100,
            description="recipes cook",
            examples=["todo"]
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
    pass

class cookUpdate(BaseModel):

    title:Optional[str] =Field(None,min_length=1, max_length=150)
    recipes:Optional[str] =Field(None,min_length=1,max_length=150)
    ingredients:Optional[str] =Field(None)
    is_available:Optional[bool] = Field(None)


class CookResponse(CookBase):

    id:int = Field(...,description="PK databaase", examples=[1])

    model_config = ConfigDict(from_attributes=True)