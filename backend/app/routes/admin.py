from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from ..db.session import get_db
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..models.category import Category
from ..models.receipt import Receipt
from ..models.payment import Payment
from ..models.user import User
from ..schemas.order import OrderResponse, OrderListResponse, OrderItemResponse, OrderStatusUpdate
from ..schemas.product import ProductCreate, ProductUpdate, ProductResponse
from ..schemas.receipt import ReceiptResponse, ReceiptStatusUpdate, PaymentResponse, PaymentStatusUpdate
from ..core.security import get_admin_user
from ..services.sms import get_sms_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# ===== ORDERS =====

@router.get("/orders", response_model=List[OrderListResponse])
def get_all_orders(
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        result.append(OrderListResponse(
            id=order.id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            item_count=len(items)
        ))
    
    return result


@router.get("/orders/{order_id}")
def get_order_detail(
    order_id: int,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    receipt = db.query(Receipt).filter(Receipt.order_id == order.id).order_by(Receipt.uploaded_at.desc()).first()
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    user = db.query(User).filter(User.id == order.user_id).first()
    
    return {
        "id": order.id,
        "user_id": order.user_id,
        "user_email": user.email if user else None,
        "user_name": user.full_name if user else None,
        "status": order.status,
        "total_amount": order.total_amount,
        "delivery_address": order.delivery_address,
        "phone": order.phone,
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "name_snapshot": i.name_snapshot,
                "unit_price": i.unit_price,
                "qty": i.qty,
                "line_total": i.line_total
            }
            for i in items
        ],
        "receipt": {
            "id": receipt.id,
            "file_url": receipt.file_url,
            "status": receipt.status,
            "admin_note": receipt.admin_note,
            "uploaded_at": receipt.uploaded_at.isoformat()
        } if receipt else None,
        "payment": {
            "id": payment.id,
            "method": payment.method,
            "status": payment.status,
            "reference": payment.reference,
            "verified_at": payment.verified_at.isoformat() if payment.verified_at else None
        } if payment else None
    }


@router.patch("/orders/{order_id}")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    valid_statuses = ["pending", "paid", "confirmed", "cancelled", "out_for_delivery"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    old_status = order.status
    order.status = data.status
    db.commit()
    
    # Send SMS notification for status change
    sms = get_sms_service()
    if sms and old_status != data.status:
        user = db.query(User).filter(User.id == order.user_id).first()
        customer_name = user.full_name if user else "Customer"
        
        if data.status == "paid":
            sms.send_order_paid(order.phone, order.id, customer_name)
        elif data.status == "confirmed":
            sms.send_order_confirmed(order.phone, order.id, customer_name)
        elif data.status == "out_for_delivery":
            sms.send_order_out_for_delivery(order.phone, order.id, customer_name)
    
    return {"message": "Order status updated", "status": order.status}


# ===== PRODUCTS =====

@router.get("/products", response_model=List[ProductResponse])
def get_all_products(
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()
    
    result = []
    for p in products:
        category_name = None
        if p.category_id:
            cat = db.query(Category).filter(Category.id == p.category_id).first()
            if cat:
                category_name = cat.name
        
        result.append(ProductResponse(
            id=p.id,
            name=p.name,
            price=p.price,
            stock_qty=p.stock_qty,
            image_url=p.image_url,
            category_id=p.category_id,
            is_active=p.is_active,
            category_name=category_name
        ))
    
    return result


@router.post("/products", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    
    category_name = None
    if product.category_id:
        cat = db.query(Category).filter(Category.id == product.category_id).first()
        if cat:
            category_name = cat.name
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        price=product.price,
        stock_qty=product.stock_qty,
        image_url=product.image_url,
        category_id=product.category_id,
        is_active=product.is_active,
        category_name=category_name
    )


@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    
    category_name = None
    if product.category_id:
        cat = db.query(Category).filter(Category.id == product.category_id).first()
        if cat:
            category_name = cat.name
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        price=product.price,
        stock_qty=product.stock_qty,
        image_url=product.image_url,
        category_id=product.category_id,
        is_active=product.is_active,
        category_name=category_name
    )


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft delete
    product.is_active = False
    db.commit()
    
    return {"message": "Product deleted"}


# ===== RECEIPTS =====

@router.patch("/receipts/{receipt_id}")
def update_receipt_status(
    receipt_id: int,
    data: ReceiptStatusUpdate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    valid_statuses = ["submitted", "approved", "rejected"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    receipt.status = data.status
    if data.admin_note is not None:
        receipt.admin_note = data.admin_note
    
    # Get order and user for SMS
    order = db.query(Order).filter(Order.id == receipt.order_id).first()
    user = db.query(User).filter(User.id == receipt.user_id).first()
    customer_name = user.full_name if user else "Customer"
    
    # If approved, update payment and order status
    if data.status == "approved":
        payment = db.query(Payment).filter(Payment.order_id == receipt.order_id).first()
        if payment:
            payment.status = "verified"
            payment.verified_by = int(current_user.get("sub"))
            payment.verified_at = datetime.now(timezone.utc)
        
        if order:
            order.status = "paid"
        
        # Send SMS notification
        sms = get_sms_service()
        if sms and order:
            sms.send_receipt_approved(order.phone, order.id, customer_name)
    
    elif data.status == "rejected":
        # Send SMS notification for rejection
        sms = get_sms_service()
        if sms and order:
            sms.send_receipt_rejected(order.phone, order.id, customer_name, data.admin_note)
    
    db.commit()
    
    return {"message": "Receipt status updated", "status": receipt.status}


# ===== PAYMENTS =====

@router.patch("/payments/{payment_id}")
def update_payment_status(
    payment_id: int,
    data: PaymentStatusUpdate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    valid_statuses = ["pending", "verified", "failed"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    payment.status = data.status
    if data.status == "verified":
        payment.verified_by = int(current_user.get("sub"))
        payment.verified_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Payment status updated", "status": payment.status}
