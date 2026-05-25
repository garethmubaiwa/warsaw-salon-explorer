from sqlalchemy import Column, String, Float, Integer, Text
from database import Base


class Salon(Base):
    __tablename__ = "salons"

    place_id = Column(String, primary_key=True, index=True) # Unique identifier from Google Places API
    name = Column(String, nullable=False) # Name of the salon
    address = Column(String) # Full address as returned by Google Places API
    street = Column(String) # Street name extracted from the address
    district = Column(String, index=True) # District or neighborhood extracted from the address, indexed for faster queries
    postal_code = Column(String) # Postal code extracted from the address
    phone = Column(String) # Contact phone number
    website = Column(String) # Official website URL
    services = Column(Text)           # Comma-separated string from Outscraper
    rating = Column(Float) # Average rating from Google Places API
    review_count = Column(Integer) # Number of reviews from Google Places API
    status = Column(String) # Open/Closed status from Google Places API
    hours = Column(Text)             # Operating hours as a JSON string from Google Places API
    latitude = Column(Float) # Latitude from Google Places API
    longitude = Column(Float) # Longitude from Google Places API
    booking_link = Column(String) # Booking link from Outscraper
    photo_url = Column(String) # URL of the salon's photo from Google Places API
    emails = Column(Text)             # Comma-separated string of emails from Outscraper
    facebook = Column(String) # Facebook profile link from Outscraper
    instagram = Column(String) # Instagram profile link from Outscraper
    description = Column(Text) # Description from Outscraper
    price_range = Column(String)     # Currently null; reserved for future enrichment
