from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RecipesBase(BaseModel):

    name: str = Field(
        ...,
        min_length=1,
        max_length=150,
        description="Name recipes",
        examples=["recipes baked"]
    )

    index: Optional[str] = Field(
        None,
        max_length=500,
        description="index of the recipes"
    )


class RecipesCreate(RecipesBase):
    pass


class RecipesUpdate(BaseModel):

    name: Optional[str] = Field(None, min_length=1, max_length=150)
    index: Optional[str] = Field(None, max_length=500)


class RecipesResponse(RecipesBase):

    id: int = Field(..., description="PK database", examples=[1])

    model_config = ConfigDict(from_attributes=True)
