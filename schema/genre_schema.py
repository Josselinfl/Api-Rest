from typing import TYPE_CHECKING, Optional
from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from schema.cook_schema import CookSimpleResponse


class GenreBase(BaseModel):

    name: str = Field(...,min_length=1,max_length=100,examples=["Pastel"])


class GenreCreate(GenreBase):
    pass


class GenreUpdate(BaseModel):
    name: Optional[str] = Field(None,min_length=1,max_length=100)


class GenreResponse(GenreBase):

    id: int = Field(...,description="Primary Key")

    model_config = ConfigDict(from_attributes=True)


class GenreDetailRespose(GenreResponse):

    cooks: list["CookSimpleResponse"] = Field(
        default=[],
        description="List cooks"
    )

    model_config = ConfigDict(from_attributes=True)
