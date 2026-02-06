from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: Optional[int] = None
    pack_variant_id: Optional[int] = None
    qty: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_address: str
    phone: str
    payment_method: str = "etransfer"


class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    name_snapshot: str
    unit_price: int
    qty: int
    line_total: int
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str
    total_amount: int
    delivery_address: str
    phone: str
    created_at: datetime
    items: List[OrderItemResponse] = []
    has_receipt: bool = False
    receipt_status: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    status: str
    total_amount: int
    created_at: datetime
    item_count: int = 0
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
