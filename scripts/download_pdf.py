#!/usr/bin/env python3
"""
PDF Download Helper for TMT Legal Intelligence System

Usage:
    python scripts/download_pdf.py <url> <output_filename>

Example:
    python scripts/download_pdf.py "https://example.com/document.pdf" "2025-01-12_MeitY_AI-Framework.pdf"

The file will be saved to sources/downloaded/
"""

import sys
import os
import requests
from datetime import datetime
from pathlib import Path

# Configuration
DOWNLOAD_DIR = Path(__file__).parent.parent / "sources" / "downloaded"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
TIMEOUT = 30  # seconds


def sanitize_filename(filename: str) -> str:
    """Remove or replace invalid filename characters."""
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '-')
    # Limit length
    if len(filename) > 100:
        name, ext = os.path.splitext(filename)
        filename = name[:95] + ext
    return filename


def download_pdf(url: str, filename: str = None) -> str:
    """
    Download a PDF from the given URL.

    Args:
        url: The URL to download from
        filename: Optional filename. If not provided, will be generated from URL.

    Returns:
        Path to the downloaded file
    """
    # Ensure download directory exists
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Generate filename if not provided
    if not filename:
        date_prefix = datetime.now().strftime("%Y-%m-%d")
        url_filename = url.split("/")[-1].split("?")[0]
        if not url_filename.endswith(".pdf"):
            url_filename += ".pdf"
        filename = f"{date_prefix}_{sanitize_filename(url_filename)}"

    output_path = DOWNLOAD_DIR / filename

    # Download with proper headers
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/pdf,*/*",
    }

    print(f"Downloading: {url}")
    print(f"Saving to: {output_path}")

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT, stream=True)
        response.raise_for_status()

        # Check if it's actually a PDF
        content_type = response.headers.get("content-type", "")
        if "pdf" not in content_type.lower() and not url.endswith(".pdf"):
            print(f"Warning: Content-Type is {content_type}, may not be a PDF")

        # Save the file
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = output_path.stat().st_size
        print(f"Downloaded successfully: {file_size:,} bytes")
        return str(output_path)

    except requests.RequestException as e:
        print(f"Error downloading: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    url = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else None

    result = download_pdf(url, filename)
    print(f"\nFile saved: {result}")


if __name__ == "__main__":
    main()
