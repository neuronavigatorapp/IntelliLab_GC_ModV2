#!/usr/bin/env python3
"""
Method CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db, Method as MethodModel
from app.models.schemas import Method, MethodCreate, MethodUpdate


router = APIRouter()


@router.get("/", response_model=List[Method])
async def list_methods(db: Session = Depends(get_db), method_type: Optional[str] = Query(None)):
    try:
        q = db.query(MethodModel)
        if method_type:
            q = q.filter(MethodModel.method_type == method_type)
        return q.order_by(MethodModel.created_date.desc()).all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{method_id}", response_model=Method)
async def get_method(method_id: int, db: Session = Depends(get_db)):
    obj = db.query(MethodModel).filter(MethodModel.id == method_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Method not found")
    return obj


@router.post("/", response_model=Method)
async def create_method(payload: MethodCreate, db: Session = Depends(get_db)):
    try:
        obj = MethodModel(**payload.dict())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{method_id}", response_model=Method)
async def update_method(method_id: int, payload: MethodUpdate, db: Session = Depends(get_db)):
    try:
        obj = db.query(MethodModel).filter(MethodModel.id == method_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Method not found")
        for k, v in payload.dict(exclude_unset=True).items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        return obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{method_id}")
async def delete_method(method_id: int, db: Session = Depends(get_db)):
    try:
        obj = db.query(MethodModel).filter(MethodModel.id == method_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Method not found")
        db.delete(obj)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


