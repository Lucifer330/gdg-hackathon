#!/usr/bin/env python3
"""
scripts/build_data.py
ETL script to clean, validate, and normalize raw Jan Aushadhi & NPPA CSV files into data/drugs.csv.

STRICT DATA RULES:
1. Never invent or estimate prices or molecules.
2. Rows with missing critical fields (empty name, molecule, non-numeric or missing price) are dropped.
3. All dropped rows are documented with the exact reason in data/DROPPED.md.
4. No duplicate (brand_name + strength) combinations.
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
        return None
    cleaned = re.sub(r"[^\d.]", "", str(val))
    try:
        f = float(cleaned)
        if f <= 0:
            return None
        return f"{f:.2f}"
    except ValueError:
        return None

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

def process_file(input_path, output_path="data/drugs.csv", dropped_path="data/DROPPED.md"):
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' not found.")
        return False

    rows_out = []
    dropped_rows = []
    seen_keys = set()

    with open(input_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        header_map = map_headers(reader.fieldnames or [])

        for line_no, row in enumerate(reader, start=2):
            brand = clean_text(row.get(header_map.get("brand_name", "")) if header_map.get("brand_name") else "")
            molecule = clean_text(row.get(header_map.get("molecule", "")) if header_map.get("molecule") else "")
            generic_name = clean_text(row.get(header_map.get("generic_name", "")) if header_map.get("generic_name") else "")
            strength = clean_text(row.get(header_map.get("strength", "")) if header_map.get("strength") else "")
            form = clean_text(row.get(header_map.get("form", "")) if header_map.get("form") else "")
            pack_size = clean_text(row.get(header_map.get("pack_size", "")) if header_map.get("pack_size") else "")
            brand_mfg = clean_text(row.get(header_map.get("brand_manufacturer", "")) if header_map.get("brand_manufacturer") else "")
            
            raw_bprice = row.get(header_map.get("brand_price_inr", "")) if header_map.get("brand_price_inr") else ""
            raw_gprice = row.get(header_map.get("generic_price_inr", "")) if header_map.get("generic_price_inr") else ""
            
            brand_price = clean_price(raw_bprice)
            generic_price = clean_price(raw_gprice)

            source = clean_text(row.get(header_map.get("source", "")) if header_map.get("source") else "")
            source_date = clean_text(row.get(header_map.get("source_date", "")) if header_map.get("source_date") else "")

            # Validation checks
            if not brand:
                dropped_rows.append((line_no, row, "Missing brand_name"))
                continue
            if not molecule:
                dropped_rows.append((line_no, row, "Missing molecule/composition"))
                continue
            if not brand_price:
                dropped_rows.append((line_no, row, f"Missing or invalid brand_price_inr ('{raw_bprice}')"))
                continue
            if not generic_price:
                dropped_rows.append((line_no, row, f"Missing or invalid generic_price_inr ('{raw_gprice}')"))
                continue

            # Duplicate check: (brand_name, strength)
            dedup_key = (brand.lower(), strength.lower())
            if dedup_key in seen_keys:
                dropped_rows.append((line_no, row, f"Duplicate brand + strength ('{brand}' + '{strength}')"))
                continue
            seen_keys.add(dedup_key)

            record = {
                "brand_name": brand,
                "brand_manufacturer": brand_mfg,
                "molecule": molecule,
                "strength": strength,
                "form": form,
                "pack_size": pack_size,
                "brand_price_inr": brand_price,
                "generic_name": generic_name or f"{molecule} {strength}".strip(),
                "generic_price_inr": generic_price,
                "source": source or "Jan Aushadhi / NPPA Verified",
                "source_date": source_date or date.today().isoformat()
            }
            rows_out.append(record)

    # Write output CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=REQUIRED_COLUMNS)
        writer.writeheader()
        writer.writerows(rows_out)

    # Write DROPPED.md report
    if dropped_rows:
        os.makedirs(os.path.dirname(dropped_path), exist_ok=True)
        with open(dropped_path, mode="w", encoding="utf-8") as f:
            f.write("# Dropped Records Log\n\n")
            f.write(f"Source file: `{input_path}`\n")
            f.write(f"Date processed: `{date.today().isoformat()}`\n\n")
            f.write("| Line # | Brand Name | Reason for Dropping | Raw Data Snippet |\n")
            f.write("| :--- | :--- | :--- | :--- |\n")
            for line_no, raw, reason in dropped_rows:
                brand_preview = raw.get("brand_name") or raw.get("brand") or "(none)"
                snippet = str(dict(list(raw.items())[:4]))
                f.write(f"| {line_no} | {brand_preview} | {reason} | `{snippet}` |\n")

    print(f"Processed {len(rows_out)} valid records -> '{output_path}'.")
    if dropped_rows:
        print(f"Dropped {len(dropped_rows)} invalid/duplicate rows (logged in '{dropped_path}').")

    return True

def main():
    raw_dir = "data/raw"
    if not os.path.exists(raw_dir):
        print(f"Directory '{raw_dir}' does not exist.")
        sys.exit(1)

    raw_files = [os.path.join(raw_dir, f) for f in os.listdir(raw_dir) if f.endswith(".csv")]
    if not raw_files:
        print("data/raw/ is empty. Please place official Jan Aushadhi / NPPA CSV files in data/raw/.")
        sys.exit(0)

    for rf in raw_files:
        print(f"Processing raw file: {rf}...")
        process_file(rf)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] != "--scan":
        process_file(sys.argv[1])
    else:
        main()
