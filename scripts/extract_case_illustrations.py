#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA_PATHS = [ROOT / "src/data/data.json", ROOT / "cases.json"]
OUTPUT_DIR = ROOT / "public/images/cases"
REPORT_PATH = ROOT / "illustration_extraction_report.json"

CAPTION_RE = re.compile(r"^\s*(?:fig(?:ure)?\.?)\s*\d+\b", re.IGNORECASE)
MAX_SCAN_PAGES = 5
RENDER_SCALE = 2.2


@dataclass
class ExtractionResult:
  success: bool
  method: str
  output_path: str | None = None
  message: str | None = None


def load_case_data() -> dict:
  return json.loads((ROOT / "src/data/data.json").read_text())


def save_case_data(data: dict) -> None:
  payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
  for path in DATA_PATHS:
    path.write_text(payload)


def pixmap_to_image(pixmap: fitz.Pixmap) -> Image.Image:
  png_bytes = pixmap.tobytes("png")
  return Image.open(io.BytesIO(png_bytes)).convert("RGB")


def rect_area(rect: fitz.Rect) -> float:
  return max(0, rect.width) * max(0, rect.height)


def trim_image(image: Image.Image, threshold: int = 245, padding: int = 12) -> Image.Image:
  grayscale = image.convert("L")
  mask = grayscale.point(lambda value: 255 if value < threshold else 0, mode="1")
  bbox = mask.getbbox()
  if bbox is None:
    return image

  width, height = image.size
  crop_box = (
    max(0, bbox[0] - padding),
    max(0, bbox[1] - padding),
    min(width, bbox[2] + padding),
    min(height, bbox[3] + padding),
  )
  return image.crop(crop_box)


def non_white_ratio(image: Image.Image, threshold: int = 245) -> float:
  grayscale = image.convert("L")
  mask = grayscale.point(lambda value: 255 if value < threshold else 0, mode="1")
  histogram = mask.histogram()
  colored = histogram[255] if len(histogram) > 255 else 0
  width, height = image.size
  return colored / max(1, width * height)


def render_clip(page: fitz.Page, clip: fitz.Rect) -> Image.Image:
  safe_clip = clip & page.rect
  pixmap = page.get_pixmap(matrix=fitz.Matrix(RENDER_SCALE, RENDER_SCALE), clip=safe_clip, alpha=False)
  image = pixmap_to_image(pixmap)
  return trim_image(image)


def is_usable(image: Image.Image) -> bool:
  width, height = image.size
  if width < 220 or height < 120:
    return False
  if non_white_ratio(image) < 0.05:
    return False
  return True


def infer_column(page_rect: fitz.Rect, bbox: fitz.Rect) -> fitz.Rect:
  midpoint = page_rect.x0 + page_rect.width / 2
  gutter = page_rect.width * 0.08
  left = fitz.Rect(page_rect.x0 + 18, page_rect.y0, midpoint - gutter / 2, page_rect.y1)
  right = fitz.Rect(midpoint + gutter / 2, page_rect.y0, page_rect.x1 - 18, page_rect.y1)
  full = fitz.Rect(page_rect.x0 + 18, page_rect.y0, page_rect.x1 - 18, page_rect.y1)

  if bbox.x1 <= left.x1 + 12:
    return left
  if bbox.x0 >= right.x0 - 12:
    return right
  return full


def parse_blocks(page: fitz.Page) -> list[dict]:
  parsed: list[dict] = []
  data = page.get_text("dict")

  for block in data["blocks"]:
    bbox = fitz.Rect(block["bbox"])
    if block["type"] == 0:
      lines: list[tuple[fitz.Rect, str]] = []
      text_parts: list[str] = []
      for line in block.get("lines", []):
        spans = [span.get("text", "") for span in line.get("spans", [])]
        line_text = "".join(spans).strip()
        if line_text:
          lines.append((fitz.Rect(line["bbox"]), line_text))
          text_parts.append(line_text)
      parsed.append({"type": "text", "bbox": bbox, "text": " ".join(text_parts).strip(), "lines": lines})
    elif block["type"] == 1:
      parsed.append({"type": "image", "bbox": bbox})

  return parsed


def rect_with_padding(rect: fitz.Rect, page_rect: fitz.Rect, padding: float = 8) -> fitz.Rect:
  expanded = fitz.Rect(rect.x0 - padding, rect.y0 - padding, rect.x1 + padding, rect.y1 + padding)
  return expanded & page_rect


def extract_from_caption(page: fitz.Page, blocks: list[dict]) -> Image.Image | None:
  text_blocks = [block for block in blocks if block["type"] == "text" and block["text"]]
  image_blocks = [block for block in blocks if block["type"] == "image"]

  for block in text_blocks:
    for line_bbox, line_text in block["lines"]:
      if not CAPTION_RE.match(line_text):
        continue

      column = infer_column(page.rect, line_bbox)
      previous_bottom = column.y0 + 24
      for candidate in text_blocks:
        if candidate["bbox"].x1 < column.x0 or candidate["bbox"].x0 > column.x1:
          continue
        if candidate["bbox"].y1 <= line_bbox.y0 - 6:
          previous_bottom = max(previous_bottom, candidate["bbox"].y1)

      caption_top = line_bbox.y0
      crop_top = max(page.rect.y0 + 24, previous_bottom + 8)
      if caption_top - crop_top < 72:
        crop_top = max(page.rect.y0 + 24, caption_top - min(page.rect.height * 0.36, 240))

      clip = fitz.Rect(column.x0, crop_top, column.x1, max(crop_top + 72, caption_top - 4))

      intersecting_images = [
        image["bbox"]
        for image in image_blocks
        if rect_area(image["bbox"] & clip) >= rect_area(image["bbox"]) * 0.4
      ]
      if intersecting_images:
        union = fitz.Rect(intersecting_images[0])
        for image_bbox in intersecting_images[1:]:
          union.include_rect(image_bbox)
        clip = rect_with_padding(union, page.rect, padding=10)

      image = render_clip(page, clip)
      if is_usable(image):
        return image

  return None


def extract_from_image_blocks(page: fitz.Page, blocks: list[dict]) -> Image.Image | None:
  for block in blocks:
    if block["type"] != "image":
      continue

    bbox = block["bbox"]
    width_ratio = bbox.width / page.rect.width
    height_ratio = bbox.height / page.rect.height
    area_ratio = rect_area(bbox) / rect_area(page.rect)

    if bbox.width < 80 or bbox.height < 80:
      continue
    if area_ratio < 0.015 and width_ratio < 0.25 and height_ratio < 0.12:
      continue

    image = render_clip(page, rect_with_padding(bbox, page.rect))
    if is_usable(image):
      return image

  return None


def fallback_page_crop(page: fitz.Page) -> Image.Image | None:
  clip = fitz.Rect(
    page.rect.x0 + 18,
    page.rect.y0 + page.rect.height * 0.18,
    page.rect.x1 - 18,
    page.rect.y0 + page.rect.height * 0.62,
  )
  image = render_clip(page, clip)
  return image if is_usable(image) else None


def extract_first_figure(pdf_path: Path) -> tuple[Image.Image | None, str]:
  with fitz.open(pdf_path) as document:
    for page_index in range(min(MAX_SCAN_PAGES, document.page_count)):
      page = document.load_page(page_index)
      blocks = parse_blocks(page)

      caption_image = extract_from_caption(page, blocks)
      if caption_image is not None:
        return caption_image, f"caption_crop_page_{page_index + 1}"

      block_image = extract_from_image_blocks(page, blocks)
      if block_image is not None:
        return block_image, f"image_block_page_{page_index + 1}"

    for page_index in range(min(2, document.page_count)):
      fallback = fallback_page_crop(document.load_page(page_index))
      if fallback is not None:
        return fallback, f"fallback_page_crop_{page_index + 1}"

  return None, "not_found"


def iter_cases_with_local_pdfs(cases: Iterable[dict]) -> Iterable[tuple[int, dict, Path]]:
  for index, case in enumerate(cases, start=1):
    link = case.get("link", "")
    if not link.startswith("papers/"):
      continue

    pdf_path = ROOT / "public" / link
    if pdf_path.exists():
      yield index, case, pdf_path


def main() -> None:
  limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
  OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
  data = load_case_data()
  report: dict[str, dict] = {}

  iterable = iter_cases_with_local_pdfs(data["cases"])
  if limit is not None:
    iterable = list(iterable)[:limit]

  for index, case, pdf_path in iterable:
    image, method = extract_first_figure(pdf_path)
    if image is None:
      report[case["title"]] = {
        "success": False,
        "method": method,
        "pdf": str(pdf_path.relative_to(ROOT)),
      }
      print(f"[miss] {index:02d} {case['title']} ({method})", flush=True)
      continue

    output_name = f"case_{index}.png"
    output_path = OUTPUT_DIR / output_name
    image.save(output_path, format="PNG", optimize=True)
    case["illustration"] = f"/images/cases/{output_name}"
    report[case["title"]] = {
      "success": True,
      "method": method,
      "pdf": str(pdf_path.relative_to(ROOT)),
      "image": str(output_path.relative_to(ROOT)),
      "size": list(image.size),
    }
    print(f"[ok] {index:02d} {case['title']} -> {output_name} ({method})", flush=True)

  REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
  save_case_data(data)
  print(f"\nSaved report to {REPORT_PATH}")


if __name__ == "__main__":
  main()
