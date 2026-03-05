from pydantic import BaseModel
from typing import Optional

# Schema for receiving data (Creating/Updating)
class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

# Schema for returning data (Reading)
class ItemResponse(ItemCreate):
    id: str
