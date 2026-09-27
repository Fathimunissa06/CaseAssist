import json
import re
from pathlib import Path
from pypdf import PdfReader


BASE_DIR = Path(r"D:\CaseAssist")

SOURCE_DIR = BASE_DIR / "data" / "raw" / "official_sources"
OUTPUT_DIR = BASE_DIR / "data" / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


DOCUMENTS = {
    "indian_contract_act_1872.pdf": {
        "title": "Indian Contract Act, 1872",
        "domain": "CONTRACT",
        "source_id": "INDIA_CODE_CONTRACT_1872",
    },
    "consumer_protection_act_2019.pdf": {
        "title": "Consumer Protection Act, 2019",
        "domain": "CONSUMER",
        "source_id": "INDIA_CODE_CONSUMER_2019",
    },
    "information_technology_act_2000.pdf": {
        "title": "Information Technology Act, 2000",
        "domain": "CYBERCRIME",
        "source_id": "INDIA_CODE_IT_2000",
    },
    "code_on_wages_2019.pdf": {
        "title": "Code on Wages, 2019",
        "domain": "EMPLOYMENT",
        "source_id": "INDIA_CODE_WAGES_2019",
    },
}


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def detect_sections(text: str):
    """
    Detect common Indian statutory section headings.
    Example:
    1. Short title...
    10. What agreements are contracts...
    """

    pattern = re.compile(
        r"(?m)^\s*(\d{1,3})\.\s+(.+?)(?=\n|$)"
    )

    matches = list(pattern.finditer(text))

    sections = []

    for i, match in enumerate(matches):
        section_number = match.group(1)
        heading = match.group(2).strip()

        start = match.start()

        if i + 1 < len(matches):
            end = matches[i + 1].start()
        else:
            end = len(text)

        section_text = text[start:end].strip()

        if len(section_text) < 40:
            continue

        sections.append({
            "section": f"Section {section_number}",
            "heading": heading,
            "text": section_text
        })

    return sections


all_documents = []
all_chunks = []

for filename, metadata in DOCUMENTS.items():

    pdf_path = SOURCE_DIR / filename

    if not pdf_path.exists():
        print(f"[WARNING] Missing: {pdf_path}")
        continue

    print(f"\nProcessing: {filename}")

    reader = PdfReader(str(pdf_path))

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            print(f"Could not extract page {page_number}: {exc}")
            text = ""

        text = clean_text(text)

        if text:
            pages.append({
                "page": page_number,
                "text": text
            })

    full_text = "\n\n".join(page["text"] for page in pages)

    sections = detect_sections(full_text)

    document_record = {
        "sourceId": metadata["source_id"],
        "title": metadata["title"],
        "documentType": "STATUTE",
        "domain": metadata["domain"],
        "jurisdiction": "INDIA",
        "source": "India Code",
        "sourceUrl": "https://www.indiacode.nic.in/",
        "filename": filename,
        "pageCount": len(reader.pages),
        "extractedPages": len(pages),
        "sectionCount": len(sections)
    }

    all_documents.append(document_record)

    for index, section in enumerate(sections, start=1):

        chunk_text = section["text"]

        # Keep chunks manageable for retrieval.
        max_chars = 3500

        if len(chunk_text) <= max_chars:

            chunks = [chunk_text]

        else:

            chunks = [
                chunk_text[i:i + max_chars]
                for i in range(0, len(chunk_text), max_chars)
            ]

        for chunk_index, chunk in enumerate(chunks, start=1):

            chunk_id = (
                f"{metadata['source_id']}_"
                f"{section['section'].replace(' ', '_')}_"
                f"{chunk_index}"
            )

            all_chunks.append({
                "chunkId": chunk_id,
                "sourceId": metadata["source_id"],
                "documentType": "STATUTE",
                "title": metadata["title"],
                "domain": metadata["domain"],
                "jurisdiction": "INDIA",
                "section": section["section"],
                "heading": section["heading"],
                "chunkIndex": chunk_index,
                "text": chunk,
                "source": "India Code",
                "sourceUrl": "https://www.indiacode.nic.in/"
            })


documents_path = OUTPUT_DIR / "legal_documents.json"
chunks_path = OUTPUT_DIR / "legal_chunks.json"

with open(documents_path, "w", encoding="utf-8") as f:
    json.dump(all_documents, f, indent=2, ensure_ascii=False)

with open(chunks_path, "w", encoding="utf-8") as f:
    json.dump(all_chunks, f, indent=2, ensure_ascii=False)


print("\n====================================")
print("LEGAL DATA EXTRACTION COMPLETE")
print("====================================")
print(f"Documents : {len(all_documents)}")
print(f"Chunks    : {len(all_chunks)}")
print(f"Documents : {documents_path}")
print(f"Chunks    : {chunks_path}")