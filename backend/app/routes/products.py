from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.session import get_db
from ..models.product import Product
from ..models.category import Category
from ..schemas.product import ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def get_products(
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    products = query.all()
    
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
