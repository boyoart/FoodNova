from pydantic import BaseModel
from typing import Optional


class ProductBase(BaseModel):
    name: str
    price: int
    stock_qty: int = 0
    image_url: Optional[str] = None
    category_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    stock_qty: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    is_active: bool
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True
