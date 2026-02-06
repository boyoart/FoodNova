from sqlalchemy.orm import Session
from ..models.product import Product


def check_stock(db: Session, product_id: int, qty: int) -> bool:
    """Check if enough stock is available"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False
    return product.stock_qty >= qty


def reduce_stock(db: Session, product_id: int, qty: int) -> bool:
    """Reduce stock after order placement"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or product.stock_qty < qty:
        return False
    product.stock_qty -= qty
    db.commit()
    return True


def restore_stock(db: Session, product_id: int, qty: int) -> bool:
    """Restore stock after order cancellation"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False
    product.stock_qty += qty
    db.commit()
    return True


def update_stock(db: Session, product_id: int, new_qty: int) -> bool:
    """Update stock to a new value"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False
    product.stock_qty = new_qty
    db.commit()
    return True
