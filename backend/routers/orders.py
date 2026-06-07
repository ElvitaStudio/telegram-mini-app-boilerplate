from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.models import Order, OrderItem, Product
from services.auth import get_current_user
from services.notifications import notify_owner, format_order_notification
import asyncio

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    items: list[OrderItemIn]
    payment_method: str


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    price: float
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    user_id: int
    total: float
    status: str
    payment_method: str
    payment_status: str
    created_at: str
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_items(cls, order: Order) -> "OrderOut":
        return cls(
            id=order.id,
            user_id=order.user_id,
            total=order.total,
            status=order.status,
            payment_method=order.payment_method,
            payment_status=order.payment_status,
            created_at=order.created_at.isoformat(),
            items=[
                OrderItemOut(
                    product_id=i.product_id,
                    product_name=i.product_name,
                    price=i.price,
                    quantity=i.quantity,
                )
                for i in order.items
            ],
        )


@router.post("", status_code=201)
async def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    if payload.payment_method not in ("monobank", "telegram_stars"):
        raise HTTPException(status_code=400, detail="Invalid payment method")

    order_items: list[OrderItem] = []
    total = 0.0

    for item_in in payload.items:
        product = db.get(Product, item_in.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        if not product.in_stock:
            raise HTTPException(status_code=400, detail=f"Product {product.name} is out of stock")
        if item_in.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")

        line_total = product.price * item_in.quantity
        total += line_total
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                price=product.price,
                quantity=item_in.quantity,
            )
        )

    order = Order(
        user_id=user["id"],
        total=total,
        payment_method=payload.payment_method,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    items_for_notify = [
        {"product_name": i.product_name, "price": i.price, "quantity": i.quantity}
        for i in order.items
    ]
    asyncio.create_task(
        notify_owner(format_order_notification(order.id, user, items_for_notify, total))
    )

    return {"success": True, "data": OrderOut.from_orm_with_items(order), "error": None}


@router.get("")
def list_orders(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user["id"])
        .order_by(Order.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "data": [OrderOut.from_orm_with_items(o) for o in orders],
        "total": len(orders),
        "page": 1,
        "limit": len(orders),
        "error": None,
    }


@router.get("/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"success": True, "data": OrderOut.from_orm_with_items(order), "error": None}


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    valid_statuses = {"pending", "confirmed", "preparing", "ready", "delivered", "cancelled"}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updated = Order(
        id=order.id,
        user_id=order.user_id,
        total=order.total,
        status=status,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        payment_reference=order.payment_reference,
        created_at=order.created_at,
    )
    db.merge(updated)
    db.commit()
    db.refresh(order)

    return {"success": True, "data": OrderOut.from_orm_with_items(order), "error": None}
