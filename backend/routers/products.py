from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.models import Product
from services.auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    category: str
    in_stock: bool

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    category: str = "general"
    in_stock: bool = True


@router.get("")
def list_products(
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)

    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [ProductOut.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "error": None,
    }


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "data": ProductOut.model_validate(product), "error": None}


@router.post("", status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"success": True, "data": ProductOut.model_validate(product), "error": None}
