# Warsaw Beauty Salon Explorer

A full-stack local-services application for discovering and managing beauty salons in Warsaw.
Collects real salon data (255 records) from an excel file sourced via Outscraper, stores it in SQLite, exposes it through a FastAPI REST API, and presents it in a React frontend with search, filtering, and inline editing.
---

## Tech Stack
| Layer             | Technology                                |
|---                |---                                        |
| Data collection   | Outscraper (Google Maps scraper), pandas  |
| Storage           | SQLite via SQLAlchemy ORM                 |
| Backend           | Python, FastAPI, Pydantic, Uvicorn        |
| Frontend          | React (Vite), plain CSS-in-JS             |
---

## Getting Started / Installation
### 1. Prepare the data
```bash
pip install pandas openpyxl
python data_prep.py --input path/to/outscraper_export.xlsx #run only once
```
This produces `data/salons.db` (SQLite, approx 255 salon records).

### 2. Run the API (Backend)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
# connected at http://localhost:5173
```
---

## Architecture
```
Outscraper XLSX
        │
data_prep.py            ETL script (run once)
        │
data/salons.db          SQLite (swap for Postgres in prod)
        │
backend/main.py         FastAPI REST API
        │  HTTP/JSON
frontend/src/           React (port 5173)
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET`     | `/salons`             | List salons — supports `?district=`, `?service=`, `?search=`, `?min_rating=` |
| `GET`     | `/salons/{place_id}`  | Full details for a single salon                                              |
| `PATCH`   | `/salons/{place_id}`  | Partial update — only changed fields are written                             |
| `GET`     | `/salons/districts`   | Distinct districts (for filter dropdown)                                     |
| `GET`     | `/salons/services`    | Distinct service types (for filter dropdown)                                 |
---

## Technical Decisions
### Why SQLite?
- Zero configuration — no server, no credentials, no migration scripts for this task.
- The dataset is small (255 rows) and single-writer (only the API edits it).
- The SQLAlchemy engine URL is a one-line change to switch to Postgres/MySQL.

### Why FastAPI?
- Reviewers can test the API without Postman.
- Pydantic handles serialisation and validation in one step.
- PATCH for updates - only the changed fields are sent/stored.

### Why Outscraper?
The raw data (325 rows, 102 columns) was collected via Outscraper, a Google Maps scraping service. It provides:
- Google Place metadata (name, address, rating, hours, photos)
- Contact enrichment (emails, phone, social media)
- Structured data ready for download

### How missing and inconsistent data was handled
The ETL script (`data_prep.py`) applies the following cleaning steps:

- Permanent closures - rows where `business_status = CLOSED_PERMANENTLY` are dropped upfront, as these often have incomplete or stale data.
- Duplicate place IDs - Outscraper sometimes returns multiple rows per salon (one per email address). These are collapsed with `aggregate_and_deduplicate()`, which concatenates all email values into a JSON array and keeps the first occurrence of every other field.
- Missing postal codes - filled by parsing the `address` string with a `\d{2}-\d{3}` regex fallback when `postal_code` is null.
- Type coercion - `rating` and `review_count` are cast with `pd.to_numeric(..., errors='coerce')` so that malformed values become `NaN` / `0` rather than crashing the pipeline.
- Price range - not available in the Outscraper export; the column is created as `NULL` and reserved for future enrichment (e.g. scraped from Booksy).
---

## What I'd Improve
### Data Quality
- Scrape Booksy for accurate price ranges: As Poland's most widely used booking platform, Booksy displays service prices publicly, making it an ideal source for real-time pricing data.
- Implement a second-pass deduplication layer: I would deduplicate entries using a combined name + address check, as a handful of salons are currently listed under slightly different names despite sharing the exact same physical location.

### Backend
- Migrate to PostgreSQL + Alembic: This would introduce production-grade persistence complete with a robust database schema history.
- Add rate limiting: Introducing rate limiting on PATCH endpoints is necessary to prevent abuse, as any user can currently modify any salon's details.
- Introduce authentication: Implementing a straight-forward API key header would properly secure and protect the data-editing endpoints.

### Frontend
- Integrate a map view using Leaflet: Since the database contains latitude and longitude coordinates for every salon, a map interface is the most intuitive UI for a "find a salon near me" feature.
- Enable bookmarkable URLs with React Router: Routing paths like /salons/... would allow users to easily copy and share direct links to specific salons.
- Implement Optimistic UI updates: Modifying the local state immediately upon a PATCH request before waiting for the server response would significantly improve the perceived user experience.

### Scaling to All of Poland
1. Expand data collection: Run Outscraper queries systematically across each of Poland's 16 provinces
2. Upgrade the infrastructure: Replace SQLite with PostgreSQL and integrate spatial indexes (PostGIS) to optimize geographic and proximity queries.
3. Automate data maintenance: Set up background workers using Celery and Redis to re-scrape each salon record monthly, ensuring the platform automatically detects and handles business closures.
4. Optimize performance via caching: Cache the main listing endpoint in Redis; because salon directory data changes infrequently but reads occur constantly, this would drastically reduce database load.
---