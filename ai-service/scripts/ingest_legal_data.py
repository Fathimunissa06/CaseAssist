import json
import uuid
import os
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sklearn.feature_extraction.text import HashingVectorizer


BASE_DIR = Path(r"D:\CaseAssist")

CHUNKS_FILE = BASE_DIR / "data" / "processed" / "legal_chunks.json"

COLLECTION_NAME = "caseassist_legal_statutes"

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")


# Lightweight local vectorizer.
# This avoids downloading a large transformer model tonight.
VECTOR_SIZE = 384

vectorizer = HashingVectorizer(
    n_features=VECTOR_SIZE,
    alternate_sign=False,
    norm="l2"
)


def make_vector(text: str):
    matrix = vectorizer.transform([text])
    return matrix.toarray()[0].tolist()


def stable_id(text: str):
    return str(uuid.uuid4())


print("Loading legal chunks...")

with open(CHUNKS_FILE, "r", encoding="utf-8") as f:
    chunks = json.load(f)

print(f"Loaded {len(chunks)} legal chunks.")


client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

# Recreate collection for a clean ingestion.
existing = [c.name for c in client.get_collections().collections]

if COLLECTION_NAME in existing:
    print(f"Deleting existing collection: {COLLECTION_NAME}")
    client.delete_collection(COLLECTION_NAME)


client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(
        size=VECTOR_SIZE,
        distance=Distance.COSINE
    )
)


points = []

for chunk in chunks:

    text = chunk["text"]

    vector = make_vector(text)

    payload = {
        "chunkId": chunk["chunkId"],
        "sourceId": chunk["sourceId"],
        "documentType": chunk["documentType"],
        "title": chunk["title"],
        "domain": chunk["domain"],
        "jurisdiction": chunk["jurisdiction"],
        "section": chunk["section"],
        "heading": chunk["heading"],
        "chunkIndex": chunk["chunkIndex"],
        "text": text,
        "source": chunk["source"],
        "sourceUrl": chunk["sourceUrl"]
    }

    points.append(
        PointStruct(
            id=stable_id(chunk["chunkId"]),
            vector=vector,
            payload=payload
        )
    )


print("Uploading vectors to Qdrant...")

BATCH_SIZE = 100

for i in range(0, len(points), BATCH_SIZE):

    batch = points[i:i + BATCH_SIZE]

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=batch
    )

    print(
        f"Uploaded {min(i + BATCH_SIZE, len(points))}"
        f"/{len(points)}"
    )


info = client.get_collection(COLLECTION_NAME)

print("\n====================================")
print("QDRANT INGESTION COMPLETE")
print("====================================")
print(f"Collection : {COLLECTION_NAME}")
print(f"Vectors    : {info.points_count}")
print(f"Vector size: {VECTOR_SIZE}")