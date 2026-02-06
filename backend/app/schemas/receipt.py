from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReceiptResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    file_url: str
    uploaded_at: datetime
    status: str
    admin_note: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReceiptStatusUpdate(BaseModel):
    status: str  # approved, rejected
    admin_note: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    method: str
    reference: Optional[str] = None
    status: str
    verified_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PaymentStatusUpdate(BaseModel):
    status: str  # verified, failed
