from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..models.pack import PackVariant, PackVariantItem
from ..models.payment import Payment
from ..models.receipt import Receipt
from ..models.user import User
from ..schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderItemResponse
from ..schemas.receipt import ReceiptResponse
from ..core.security import get_current_user
from ..services.inventory import check_stock, reduce_stock
from ..services.receipts import save_receipt_file
from ..services.sms import get_sms_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse)
async def create_order(
    data: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(current_user.get("sub"))
    
    order_items = []
    total_amount = 0
    
    for item in data.items:
        if item.product_id:
            # Regular product
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.is_active == True
            ).first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {item.product_id} not found"
                )
            
            if not check_stock(db, product.id, item.qty):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {product.name}"
                )
            
            line_total = product.price * item.qty
            order_items.append({
                "product_id": product.id,
                "name_snapshot": product.name,
                "unit_price": product.price,
                "qty": item.qty,
                "line_total": line_total
            })
            total_amount += line_total
            
        elif item.pack_variant_id:
            # Pack variant
            variant = db.query(PackVariant).filter(
                PackVariant.id == item.pack_variant_id
            ).first()
            
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Pack variant {item.pack_variant_id} not found"
                )
            
            # Check stock for all items in pack
            pack_items = db.query(PackVariantItem).filter(
                PackVariantItem.variant_id == variant.id
            ).all()
            
            for pi in pack_items:
                if not check_stock(db, pi.product_id, pi.qty * item.qty):
                    product = db.query(Product).filter(Product.id == pi.product_id).first()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for {product.name if product else 'product'}"
                    )
            
            line_total = variant.price * item.qty
            order_items.append({
                "product_id": None,
                "name_snapshot": f"{variant.pack.name} - {variant.name}",
                "unit_price": variant.price,
                "qty": item.qty,
                "line_total": line_total
            })
            total_amount += line_total
    
    # Create order
    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        delivery_address=data.delivery_address,
        phone=data.phone,
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Create order items and reduce stock
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            **item_data
        )
        db.add(order_item)
        
        if item_data.get("product_id"):
            reduce_stock(db, item_data["product_id"], item_data["qty"])
    
    # Create payment record
    payment = Payment(
        order_id=order.id,
        method=data.payment_method,
        status="pending"
    )
    db.add(payment)
    db.commit()
    
    # Send SMS notification for order placed
    sms = get_sms_service()
    if sms:
        user = db.query(User).filter(User.id == user_id).first()
        customer_name = user.full_name if user else "Customer"
        sms.send_order_placed(order.phone, order.id, customer_name, order.total_amount)
    
    # Fetch order with items
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        phone=order.phone,
        created_at=order.created_at,
        items=[OrderItemResponse.model_validate(i) for i in items],
        has_receipt=False,
        receipt_status=None
    )


@router.get("/my", response_model=List[OrderListResponse])
def get_my_orders(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(current_user.get("sub"))
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    
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


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(current_user.get("sub"))
    role = current_user.get("role")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Non-admin users can only see their own orders
    if role != "admin" and order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    receipt = db.query(Receipt).filter(Receipt.order_id == order.id).order_by(Receipt.uploaded_at.desc()).first()
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        phone=order.phone,
        created_at=order.created_at,
        items=[OrderItemResponse.model_validate(i) for i in items],
        has_receipt=receipt is not None,
        receipt_status=receipt.status if receipt else None
    )


@router.post("/{order_id}/receipt", response_model=ReceiptResponse)
async def upload_receipt(
    order_id: int,
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(current_user.get("sub"))
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get base URL for file URL generation
    base_url = str(request.base_url).rstrip("/")
    
    # Save file
    file_url, file_key = await save_receipt_file(file, base_url)
    
    # Create receipt record
    receipt = Receipt(
        order_id=order.id,
        user_id=user_id,
        file_url=file_url,
        file_key=file_key,
        status="submitted"
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return receipt


@router.get("/{order_id}/receipt", response_model=ReceiptResponse)
def get_order_receipt(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(current_user.get("sub"))
    role = current_user.get("role")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if role != "admin" and order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    receipt = db.query(Receipt).filter(Receipt.order_id == order_id).order_by(Receipt.uploaded_at.desc()).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No receipt found for this order"
        )
    
    return receipt
