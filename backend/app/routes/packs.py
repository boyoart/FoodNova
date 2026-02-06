from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.pack import Pack, PackVariant, PackVariantItem
from ..models.product import Product
from ..schemas.pack import PackResponse, PackListResponse, PackVariantResponse, PackVariantItemResponse

router = APIRouter(prefix="/packs", tags=["Packs"])


@router.get("", response_model=List[PackListResponse])
def get_packs(db: Session = Depends(get_db)):
    packs = db.query(Pack).filter(Pack.is_active == True).all()
    
    result = []
    for pack in packs:
        variants = db.query(PackVariant).filter(PackVariant.pack_id == pack.id).all()
        min_price = min([v.price for v in variants]) if variants else None
        
        result.append(PackListResponse(
            id=pack.id,
            name=pack.name,
            description=pack.description,
            is_active=pack.is_active,
            variant_count=len(variants),
            min_price=min_price
        ))
    
    return result


@router.get("/{pack_id}", response_model=PackResponse)
def get_pack(pack_id: int, db: Session = Depends(get_db)):
    pack = db.query(Pack).filter(Pack.id == pack_id, Pack.is_active == True).first()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pack not found"
        )
    
    variants = db.query(PackVariant).filter(PackVariant.pack_id == pack_id).all()
    variant_responses = []
    
    for variant in variants:
        items = db.query(PackVariantItem).filter(PackVariantItem.variant_id == variant.id).all()
        item_responses = []
        
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                item_responses.append(PackVariantItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=product.name,
                    qty=item.qty
                ))
        
        variant_responses.append(PackVariantResponse(
            id=variant.id,
            name=variant.name,
            price=variant.price,
            items=item_responses
        ))
    
    return PackResponse(
        id=pack.id,
        name=pack.name,
        description=pack.description,
        is_active=pack.is_active,
        variants=variant_responses
    )
