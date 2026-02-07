from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryResponse
from ..core.security import get_admin_user

router = APIRouter(prefix="/admin/categories", tags=["Admin Categories"])


@router.get("", response_model=List[CategoryResponse])
def get_all_categories(
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(Category).all()


@router.post("", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Check if category exists
    existing = db.query(Category).filter(Category.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = Category(name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: dict = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
