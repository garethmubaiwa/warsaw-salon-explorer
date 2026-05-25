"""
Run once to ingest the raw Outscraper Excel export into salons.db.

Usage:
    python data_prep.py --input path/to/outscraper_export.xlsx
"""

import argparse
import json
import os
import re
import sqlite3

import pandas as pd


def extract_postal(addr: str) -> str | None:
    """Parse a Polish postal code (XX-XXX) from an address string."""
    m = re.search(r"\d{2}-\d{3}", str(addr))
    return m.group(0) if m else None


def aggregate_and_deduplicate(df, id_col, target_col, output_col):
    """
    Universally aggregates list-like values across duplicates and collapses
    the DataFrame to one unique row per ID.
    """
    # Aggregate target_col values into a JSON array string per ID, skipping nulls and empties
    agg_series = (
        df.groupby(id_col)[target_col]
        .apply(lambda x: json.dumps([item for item in x.dropna().tolist() if item]))
        .rename(output_col)
    )
    
    # Deduplicate rows by ID, keeping the first occurrence, and merge the aggregated column back in
    df_unique = df.drop_duplicates(subset=id_col, keep="first").set_index(id_col)
    df_unique[output_col] = agg_series
    
    return df_unique.reset_index()


def clean(xlsx_path: str, db_path: str) -> None:
    df = pd.read_excel(xlsx_path)

    # Drop permanently closed salons, often have incomplete data which can cause issues with the cleaning
    df = df[df["business_status"] != "CLOSED_PERMANENTLY"]

    # Aggregate multiple email entries per place_id into a single JSON array string, then deduplicate rows by place_id
    df = aggregate_and_deduplicate(
        df=df,
        id_col="place_id",
        target_col="email",
        output_col="emails"
    )

    # Select and rename columns to match database schema
    col_map = {
        "place_id": "place_id",
        "name": "name",
        "address": "address",
        "street": "street",
        "county": "district",
        "postal_code": "postal_code",
        "phone": "phone",
        "website": "website",
        "subtypes": "services",
        "rating": "rating",
        "reviews": "review_count",
        "business_status": "status",
        "working_hours_csv_compatible": "hours",
        "latitude": "latitude",
        "longitude": "longitude",
        "booking_appointment_link": "booking_link",
        "photo": "photo_url",
        "emails": "emails",
        "company_facebook": "facebook",
        "company_instagram": "instagram",
        "description": "description",
    }
    df = df[list(col_map.keys())].rename(columns=col_map)

    # Type conversions and cleaning
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    df["review_count"] = (
        pd.to_numeric(df["review_count"], errors="coerce").fillna(0).astype(int)
    )

    # Fill missing postal codes by parsing from address
    df["postal_code"] = df.apply(
        lambda r: r["postal_code"]
        if pd.notna(r["postal_code"])
        else extract_postal(r["address"]),
        axis=1,
    )

    df["services"] = df["services"].fillna("")
    df["price_range"] = None  # Not available in Outscraper export, but our schema requires it

    # Write to SQLite
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    df.to_sql("salons", conn, if_exists="replace", index=False)
    count = conn.execute("SELECT COUNT(*) FROM salons").fetchone()[0]
    conn.close()

    print(f"Wrote {count} salons to {db_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to Outscraper .xlsx file")
    parser.add_argument(
        "--db",
        default=os.path.join(os.path.dirname(__file__), "data", "salons.db"),
        help="Output SQLite path",
    )
    args = parser.parse_args()
    clean(args.input, args.db)