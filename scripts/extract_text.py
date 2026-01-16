#!/usr/bin/env python3
"""
PDF Text Extraction Helper for TMT Legal Intelligence System

Usage:
    python scripts/extract_text.py <pdf_path> [output_path]

Example:
    python scripts/extract_text.py sources/downloaded/2025-01-12_MeitY_AI-Framework.pdf

If output_path is not provided, text will be saved alongside the PDF with .txt extension.

Requirements:
    pip install pdfplumber

    or if pdfplumber fails:
    pip install PyPDF2
"""

import sys
import os
from pathlib import Path

# Try different PDF libraries
PDF_LIBRARY = None

try:
    import pdfplumber
    PDF_LIBRARY = "pdfplumber"
except ImportError:
    try:
        import PyPDF2
        PDF_LIBRARY = "pypdf2"
    except ImportError:
        print("Error: No PDF library found.")
        print("Please install one of:")
        print("  pip install pdfplumber")
        print("  pip install PyPDF2")
        sys.exit(1)


def extract_with_pdfplumber(pdf_path: Path) -> str:
    """Extract text using pdfplumber (better for complex PDFs)."""
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- Page {i} ---\n{page_text}")
    return "\n\n".join(text_parts)


def extract_with_pypdf2(pdf_path: Path) -> str:
    """Extract text using PyPDF2 (fallback)."""
    text_parts = []
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- Page {i} ---\n{page_text}")
    return "\n\n".join(text_parts)


def extract_text(pdf_path: str, output_path: str = None) -> str:
    """
    Extract text from a PDF file.

    Args:
        pdf_path: Path to the PDF file
        output_path: Optional path for output. If not provided, uses same name with .txt

    Returns:
        Path to the extracted text file
    """
    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)

    if not pdf_path.suffix.lower() == ".pdf":
        print(f"Warning: File may not be a PDF: {pdf_path}")

    # Determine output path
    if output_path:
        output_path = Path(output_path)
    else:
        output_path = pdf_path.with_suffix(".txt")

    print(f"Extracting text from: {pdf_path}")
    print(f"Using library: {PDF_LIBRARY}")

    try:
        if PDF_LIBRARY == "pdfplumber":
            text = extract_with_pdfplumber(pdf_path)
        else:
            text = extract_with_pypdf2(pdf_path)
    except Exception as e:
        print(f"Error extracting text: {e}")
        sys.exit(1)

    if not text.strip():
        print("Warning: No text extracted. PDF may be image-based (scanned).")
        print("Consider using OCR tools like pytesseract for scanned documents.")
        text = "[No text extracted - PDF may be scanned/image-based]"

    # Save the text
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

    word_count = len(text.split())
    print(f"Extracted {word_count:,} words")
    print(f"Saved to: {output_path}")

    return str(output_path)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    result = extract_text(pdf_path, output_path)
    print(f"\nText file saved: {result}")


if __name__ == "__main__":
    main()
