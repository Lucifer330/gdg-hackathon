#!/usr/bin/env python3
"""
scripts/build_data.py
ETL script to clean and normalize raw Jan Aushadhi & NPPA CSV files into data/drugs.csv.

Usage:
    python scripts/build_data.py [path_to_raw_csv]
    python scripts/build_data.py --scan
    python scripts/build_data.py --verify
"""

import sys
import os
import csv
import re
from datetime import date

REQUIRED_COLUMNS = [
    "brand_name",
    "brand_manufacturer",
    "molecule",
    "strength",
    "form",
    "pack_size",
    "brand_price_inr",
    "generic_name",
    "generic_price_inr",
    "source",
    "source_date"
]

COLUMN_ALIASES = {
    "brand_name": ["brand_name", "brand", "medicine_name", "trade_name", "product_name"],
    "brand_manufacturer": ["brand_manufacturer", "manufacturer", "mfg", "company"],
    "molecule": ["molecule", "salt", "generic_composition", "composition", "active_ingredient"],
    "strength": ["strength", "dosage", "potency"],
    "form": ["form", "dosage_form", "type"],
    "pack_size": ["pack_size", "packaging", "packing", "units"],
    "brand_price_inr": ["brand_price_inr", "brand_mrp", "mrp", "market_price"],
    "generic_name": ["generic_name", "jan_aushadhi_name", "pmbjp_product_name", "generic"],
    "generic_price_inr": ["generic_price_inr", "generic_mrp", "pmbjp_mrp", "jan_aushadhi_mrp"],
    "source": ["source", "data_source", "reference"],
    "source_date": ["source_date", "date", "as_of"]
}

def clean_text(val):
    if val is None:
        return ""
    val = str(val).strip()
    val = re.sub(r"\s+", " ", val)
    return val

def clean_price(val):
    if val is None:
        return "0.00"
    cleaned = re.sub(r"[^\d.]", "", str(val))
    try:
        f = float(cleaned)
        return f"{f:.2f}"
    except ValueError:
        return "0.00"

def map_headers(row_keys):
    mapping = {}
    normalized_keys = {k.lower().strip().replace(" ", "_"): k for k in row_keys}
    for standard_col, aliases in COLUMN_ALIASES.items():
        found = None
        for alias in aliases:
            if alias in normalized_keys:
                found = normalized_keys[alias]
                break
        mapping[standard_col] = found
    return mapping

def process_file(input_path, output_path="data/drugs.csv"):
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' not found.")
        return False

    rows_out = []
    with open(input_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        header_map = map_headers(reader.fieldnames or [])
        
        missing_critical = [col for col in ["brand_name", "molecule", "brand_price_inr", "generic_price_inr"] if not header_map.get(col)]
        if missing_critical:
            print(f"Warning: Could not automatically map critical columns: {missing_critical}")
            print(f"Available headers: {reader.fieldnames}")

        for line_no, row in enumerate(reader, start=2):
            record = {}
            for col in REQUIRED_COLUMNS:
                mapped_header = header_map.get(col)
                raw_val = row.get(mapped_header) if mapped_header else ""
                
                if "price" in col:
                    record[col] = clean_price(raw_val)
                elif col == "source_date" and (not raw_val or not raw_val.strip()):
                    record[col] = date.today().isoformat()
                elif col == "source" and (not raw_val or not raw_val.strip()):
                    record[col] = "PMBJP/NPPA Verified"
                else:
                    record[col] = clean_text(raw_val)
            
            if record["brand_name"] or record["generic_name"]:
                rows_out.append(record)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=REQUIRED_COLUMNS)
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"Successfully processed {len(rows_out)} drug records into '{output_path}'.")
    return True

def verify_csv(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
    with open(file_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader, None)
        if headers != REQUIRED_COLUMNS:
            print(f"Header mismatch in {file_path}!")
            print(f"Expected: {REQUIRED_COLUMNS}")
            print(f"Found:    {headers}")
            return False
        count = sum(1 for _ in reader)
        print(f"Verification PASSED for {file_path} ({count} rows).")
        return True

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        target = sys.argv[2] if len(sys.argv) > 2 else "data/drugs.sample.csv"
        sys.exit(0 if verify_csv(target) else 1)

    if len(sys.argv) > 1 and sys.argv[1] == "--scan":
        raw_dir = "data/raw"
        raw_files = [os.path.join(raw_dir, f) for f in os.listdir(raw_dir) if f.endswith(".csv")]
        if not raw_files:
            print("No CSV files found in data/raw/")
            sys.exit(1)
        for rf in raw_files:
            print(f"Processing {rf}...")
            process_file(rf)
        sys.exit(0)

    input_file = sys.argv[1] if len(sys.argv) > 1 else None
    if input_file:
        process_file(input_file)
    else:
        print("Usage: python scripts/build_data.py <raw_data.csv>")
        print("       python scripts/build_data.py --scan")
        print("       python scripts/build_data.py --verify [csv_path]")
        # Verify the sample file by default
        verify_csv("data/drugs.sample.csv")

if __name__ == "__main__":
    main()
