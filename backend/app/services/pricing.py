def format_price_naira(amount: int) -> str:
    """Format price in Nigerian Naira with commas"""
    return f"₦{amount:,}"


def calculate_line_total(unit_price: int, qty: int) -> int:
    """Calculate line total for an order item"""
    return unit_price * qty


def calculate_order_total(items: list) -> int:
    """Calculate total order amount from items"""
    return sum(item.get("line_total", 0) for item in items)
