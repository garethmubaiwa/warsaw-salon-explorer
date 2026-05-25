"""
Rest API for Warsaw beauty salons, built with FastAPI and SQLAlchemy.
Endpoints:
- GET /salons: List salons with optional filters (district, service, rating)
- GET /salons/{place_id}: Get full details of a single salon
- PATCH /salons/{place_id}: Update salon details (admin use)
- GET /salons/districts: List all distinct districts (for filter dropdown)
- GET /salons/services: List all distinct service types (for filter dropdown)

"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import engine, get_db, Base
from models import Salon

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Warsaw Beauty Salon Explorer",
    description="REST API for browsing and editing Warsaw hair/beauty salon data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "PATCH"],
    allow_headers=["*"],
)


# Pydantic models for request/response validation and serialization
class SalonListItem(BaseModel):
    """Lightweight representation returned by the list endpoint."""
    place_id: str
    name: str
    district: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    price_range: Optional[str]
    photo_url: Optional[str]
    services: Optional[str]
    status: Optional[str]

    class Config:
        from_attributes = True


class SalonDetail(SalonListItem):
    """Full representation returned by the detail endpoint."""
    address: Optional[str]
    street: Optional[str]
    postal_code: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    hours: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    booking_link: Optional[str]
    emails: Optional[str]
    facebook: Optional[str]
    instagram: Optional[str]
    description: Optional[str]
    
    # Inherits Config from SalonListItem (from_attributes=True)
        


class SalonUpdate(BaseModel):
    """All fields optional for partial updates.  Only provided fields will be updated."""
    name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    services: Optional[str] = None
    rating: Optional[float] = None
    price_range: Optional[str] = None
    hours: Optional[str] = None
    booking_link: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    description: Optional[str] = None


# Helper function to parse the comma-separated services string into a list of clean service names.

def _parse_services(services_str: Optional[str]) -> list[str]:
    """Split the comma-separated subtypes string into a clean list."""
    if not services_str:
        return []
    return [s.strip() for s in services_str.split(",") if s.strip()]


# API endpoints

@app.get("/salons", response_model=list[SalonListItem], tags=["Salons"])
def list_salons(
    district: Optional[str] = Query(None, description="Filter by district name"),
    service: Optional[str] = Query(None, description="Filter by service keyword"),
    search: Optional[str] = Query(None, description="Full-text search on name"),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    skip: int = Query(0, ge=0),
    limit: int = Query(255, ge=1, le=300),
    db: Session = Depends(get_db),
):
    """
    Return paginated list of salons.
    Filter parameters can be combined: ?district=Mokotów&min_rating=4.5
    """
    q = db.query(Salon)

    if district:
        q = q.filter(Salon.district.ilike(f"%{district}%"))
    if service:
        q = q.filter(Salon.services.ilike(f"%{service}%"))
    if search:
        q = q.filter(Salon.name.ilike(f"%{search}%"))
    if min_rating is not None:
        q = q.filter(Salon.rating >= min_rating)

    # Order by rating desc (nulls last) and then name asc for consistent ordering
    q = q.order_by(Salon.rating.desc().nullslast(), Salon.name)

    return q.offset(skip).limit(limit).all()


@app.get("/salons/districts", tags=["Meta"])
def list_districts(db: Session = Depends(get_db)):
    """Return all distinct district names — useful for populating a filter dropdown."""
    rows = db.query(Salon.district).distinct().order_by(Salon.district).all()
    return [r[0] for r in rows if r[0]]


@app.get("/salons/services", tags=["Meta"])
def list_service_types(db: Session = Depends(get_db)):
    """Return all distinct service types derived from the subtypes field."""
    rows = db.query(Salon.services).filter(Salon.services != "").all()
    seen = set()
    for (s,) in rows:
        for item in _parse_services(s):
            seen.add(item)
    return sorted(seen)


@app.get("/salons/{place_id}", response_model=SalonDetail, tags=["Salons"])
def get_salon(place_id: str, db: Session = Depends(get_db)):
    """Return full details for a single salon identified by its Google Place ID."""
    salon = db.get(Salon, place_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return salon


@app.patch("/salons/{place_id}", response_model=SalonDetail, tags=["Salons"])
def update_salon(place_id: str, payload: SalonUpdate, db: Session = Depends(get_db)):
    """
    Update salon details.  Only fields provided in the payload will be updated; others remain unchanged.
    This endpoint is intended for admin use to correct or enhance salon data.  
    Authentication/authorization is required.
    """
    salon = db.get(Salon, place_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(salon, field, value)

    db.commit()
    db.refresh(salon)
    return salon


@app.get("/health", tags=["Meta"])
def health():
    return {"status": "ok"}
