from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..db.session import get_db
from ..models.pack import Pack, PackVariant, PackVariantItem
from ..models.product import Product
from ..core.security import get_admin_user

router = APIRouter(prefix="/admin/packs", tags=["Admin Packs"])


# Schemas
class PackVariantItemCreate(BaseModel):
    product_id: int
    qty: int


class PackVariantCreate(BaseModel):
    name: str
    price: int
    items: List[PackVariantItemCreate] = []


class PackCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    variants: List[PackVariantCreate] = []


class PackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PackVariantUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None


# Pack endpoints
@router.get("")
def get_all_packs(
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    packs = db.query(Pack).all()
    result = []
    
    for pack in packs:
        variants = db.query(PackVariant).filter(PackVariant.pack_id == pack.id).all()
        variant_data = []
        
        for variant in variants:
            items = db.query(PackVariantItem).filter(PackVariantItem.variant_id == variant.id).all()
            item_data = []
            
            for item in items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                item_data.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": product.name if product else "Unknown",
                    "qty": item.qty
                })
            
            variant_data.append({
                "id": variant.id,
                "name": variant.name,
                "price": variant.price,
                "items": item_data
            })
        
        result.append({
            "id": pack.id,
            "name": pack.name,
            "description": pack.description,
            "is_active": pack.is_active,
            "variants": variant_data,
            "variant_count": len(variants)
        })
    
    return result


@router.post("")
def create_pack(
    data: PackCreate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Create pack
    pack = Pack(
        name=data.name,
        description=data.description,
        is_active=data.is_active
    )
    db.add(pack)
    db.commit()
    db.refresh(pack)
    
    # Create variants
    for variant_data in data.variants:
        variant = PackVariant(
            pack_id=pack.id,
            name=variant_data.name,
            price=variant_data.price
        )
        db.add(variant)
        db.commit()
        db.refresh(variant)
        
        # Create variant items
        for item_data in variant_data.items:
            item = PackVariantItem(
                variant_id=variant.id,
                product_id=item_data.product_id,
                qty=item_data.qty
            )
            db.add(item)
        
        db.commit()
    
    return {"message": "Pack created", "id": pack.id}


@router.patch("/{pack_id}")
def update_pack(
    pack_id: int,
    data: PackUpdate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    
    if data.name is not None:
        pack.name = data.name
    if data.description is not None:
        pack.description = data.description
    if data.is_active is not None:
        pack.is_active = data.is_active
    
    db.commit()
    return {"message": "Pack updated"}


@router.delete("/{pack_id}")
def delete_pack(
    pack_id: int,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    
    # Delete all variants and items
    variants = db.query(PackVariant).filter(PackVariant.pack_id == pack_id).all()
    for variant in variants:
        db.query(PackVariantItem).filter(PackVariantItem.variant_id == variant.id).delete()
        db.delete(variant)
    
    db.delete(pack)
    db.commit()
    return {"message": "Pack deleted"}


# Variant endpoints
@router.post("/{pack_id}/variants")
def add_variant(
    pack_id: int,
    data: PackVariantCreate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    
    variant = PackVariant(
        pack_id=pack_id,
        name=data.name,
        price=data.price
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    
    # Add items
    for item_data in data.items:
        item = PackVariantItem(
            variant_id=variant.id,
            product_id=item_data.product_id,
            qty=item_data.qty
        )
        db.add(item)
    
    db.commit()
    return {"message": "Variant added", "id": variant.id}


@router.patch("/variants/{variant_id}")
def update_variant(
    variant_id: int,
    data: PackVariantUpdate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    variant = db.query(PackVariant).filter(PackVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    if data.name is not None:
        variant.name = data.name
    if data.price is not None:
        variant.price = data.price
    
    db.commit()
    return {"message": "Variant updated"}


@router.delete("/variants/{variant_id}")
def delete_variant(
    variant_id: int,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    variant = db.query(PackVariant).filter(PackVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Delete items first
    db.query(PackVariantItem).filter(PackVariantItem.variant_id == variant_id).delete()
    db.delete(variant)
    db.commit()
    return {"message": "Variant deleted"}


# Variant item endpoints
@router.post("/variants/{variant_id}/items")
def add_variant_item(
    variant_id: int,
    data: PackVariantItemCreate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    variant = db.query(PackVariant).filter(PackVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    item = PackVariantItem(
        variant_id=variant_id,
        product_id=data.product_id,
        qty=data.qty
    )
    db.add(item)
    db.commit()
    return {"message": "Item added", "id": item.id}


@router.delete("/variants/items/{item_id}")
def delete_variant_item(
    item_id: int,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    item = db.query(PackVariantItem).filter(PackVariantItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}
