from pydantic import BaseModel
from typing import List, Optional


class PackVariantItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    qty: int
    
    class Config:
        from_attributes = True


class PackVariantResponse(BaseModel):
    id: int
    name: str
    price: int
    items: List[PackVariantItemResponse] = []
    
    class Config:
        from_attributes = True


class PackResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    variants: List[PackVariantResponse] = []
    
    class Config:
        from_attributes = True


class PackListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    variant_count: int = 0
    min_price: Optional[int] = None
    
    class Config:
        from_attributes = True
