#!/usr/bin/env python3
"""
Compound library CRUD and loader endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io

from app.core.database import get_db, Compound as CompoundModel
from app.models.schemas import Compound, CompoundCreate, CompoundUpdate


router = APIRouter()


@router.get("/", response_model=List[Compound])
async def list_compounds(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=5000),
):
    try:
        q = db.query(CompoundModel)
        if category:
            q = q.filter(CompoundModel.category == category)
        if search:
            like = f"%{search}%"
            q = q.filter(CompoundModel.name.ilike(like))
        return q.limit(limit).all()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=Compound)
async def create_compound(payload: CompoundCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(CompoundModel).filter(CompoundModel.name == payload.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Compound already exists")
        obj = CompoundModel(**payload.dict())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{compound_id}", response_model=Compound)
async def update_compound(compound_id: int, payload: CompoundUpdate, db: Session = Depends(get_db)):
    try:
        obj = db.query(CompoundModel).filter(CompoundModel.id == compound_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Compound not found")
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


@router.delete("/{compound_id}")
async def delete_compound(compound_id: int, db: Session = Depends(get_db)):
    try:
        obj = db.query(CompoundModel).filter(CompoundModel.id == compound_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Compound not found")
        db.delete(obj)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/load-csv")
async def load_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Load compounds from a CSV with columns: name,rt,molecular_weight,category,intensity,width"""
    try:
        content = await file.read()
        decoded = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))
        count = 0
        for row in reader:
            name = row.get("name")
            if not name:
                continue
            existing = db.query(CompoundModel).filter(CompoundModel.name == name).first()
            if existing:
                # update
                existing.retention_time = float(row.get("rt", existing.retention_time or 1.0))
                existing.molecular_weight = float(row.get("molecular_weight", existing.molecular_weight or 0) or 0)
                existing.category = row.get("category") or existing.category
                existing.default_intensity = float(row.get("intensity", existing.default_intensity or 100) or 100)
                existing.default_width = float(row.get("width", existing.default_width or 0.1) or 0.1)
            else:
                obj = CompoundModel(
                    name=name,
                    retention_time=float(row.get("rt", 1.0)),
                    molecular_weight=float(row.get("molecular_weight", 0) or 0),
                    category=row.get("category"),
                    default_intensity=float(row.get("intensity", 100) or 100),
                    default_width=float(row.get("width", 0.1) or 0.1),
                )
                db.add(obj)
            count += 1
        db.commit()
        return {"success": True, "loaded": count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


