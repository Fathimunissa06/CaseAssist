from qdrant_client import QdrantClient
import os 
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.preprocessing import normalize
import re


# ============================================================
# CONFIGURATION
# ============================================================

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "caseassist_legal_statutes"

VECTOR_SIZE = 384

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

vectorizer = HashingVectorizer(
    n_features=VECTOR_SIZE,
    alternate_sign=False,
    norm=None
)


# ============================================================
# DOMAIN KEYWORDS
# ============================================================

DOMAIN_KEYWORDS = {

    "EMPLOYMENT": [
        "salary",
        "wage",
        "wages",
        "employee",
        "employer",
        "employment",
        "worker",
        "work",
        "job",
        "termination",
        "fired",
        "dismissed",
        "minimum wage",
        "payment of wages",
        "unpaid salary",
        "unpaid wages",
        "remuneration",
        "deduction",
        "employment contract"
    ],

    "CONSUMER": [
        "consumer",
        "refund",
        "product",
        "seller",
        "purchase",
        "defective",
        "customer",
        "service",
        "deficiency",
        "complaint"
    ],

    "RENTAL": [
        "rent",
        "tenant",
        "landlord",
        "lease",
        "deposit",
        "eviction",
        "rental",
        "rent agreement"
    ],

    "PROPERTY": [
        "property",
        "land",
        "house",
        "ownership",
        "boundary",
        "sale deed",
        "title",
        "possession"
    ],

    "ONLINE_FRAUD": [
        "fraud",
        "scam",
        "otp",
        "phishing",
        "online fraud",
        "fake payment",
        "online scam",
        "cyber fraud"
    ],

    "CYBERCRIME": [
        "hacked",
        "cyber",
        "password",
        "unauthorized access",
        "account hacked",
        "computer",
        "computer system",
        "cybercrime"
    ],

    "INSURANCE": [
        "insurance",
        "claim",
        "policy",
        "premium",
        "insurer",
        "insurance company"
    ],

    "CONTRACT": [
        "contract",
        "agreement",
        "breach",
        "clause",
        "contractual",
        "contractual obligation"
    ],

    "FINANCIAL": [
        "bank",
        "transaction",
        "payment",
        "loan",
        "credit",
        "debit",
        "account",
        "financial"
    ]
}


# ============================================================
# LEGAL CONCEPT KEYWORDS
# ============================================================

# These provide stronger relevance signals than simple
# word-overlap when the user describes a real-world dispute.

CONCEPT_KEYWORDS = {

    "EMPLOYMENT": [
        "salary",
        "wage",
        "wages",
        "unpaid",
        "unpaid salary",
        "unpaid wages",
        "payment",
        "pay",
        "remuneration",
        "employee",
        "employer",
        "worker",
        "employment",
        "deduction",
        "minimum wage",
        "payment of wages",
        "delay in payment",
        "withholding salary"
    ],

    "CONSUMER": [
        "consumer",
        "refund",
        "defective",
        "product",
        "service",
        "seller",
        "purchase",
        "deficiency",
        "compensation"
    ],

    "RENTAL": [
        "rent",
        "tenant",
        "landlord",
        "lease",
        "deposit",
        "eviction",
        "rental"
    ],

    "PROPERTY": [
        "property",
        "land",
        "ownership",
        "possession",
        "boundary",
        "sale deed",
        "title"
    ],

    "ONLINE_FRAUD": [
        "fraud",
        "scam",
        "otp",
        "phishing",
        "fake payment",
        "online fraud",
        "unauthorized transaction"
    ],

    "CYBERCRIME": [
        "hacked",
        "hack",
        "password",
        "unauthorized access",
        "computer system",
        "cybercrime",
        "account hacked"
    ],

    "INSURANCE": [
        "insurance",
        "claim",
        "policy",
        "premium",
        "insurer",
        "insurance company"
    ],

    "CONTRACT": [
        "contract",
        "agreement",
        "breach",
        "clause",
        "obligation",
        "contractual"
    ],

    "FINANCIAL": [
        "bank",
        "transaction",
        "loan",
        "credit",
        "debit",
        "payment",
        "account"
    ]
}


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text: str) -> str:

    if not text:
        return ""

    text = str(text).lower()

    # Repair common PDF encoding artefacts.
    text = text.replace("â€™", "'")
    text = text.replace("â€œ", '"')
    text = text.replace("â€", '"')
    text = text.replace("â€“", "-")
    text = text.replace("â€”", "-")
    text = text.replace("â€¦", "...")
    text = text.replace("â", " ")

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# ============================================================
# DOMAIN DETECTION
# ============================================================

def detect_domain(query: str) -> str:

    query_lower = normalize_text(query)

    scores = {}

    for domain, keywords in DOMAIN_KEYWORDS.items():

        score = 0

        for keyword in keywords:

            keyword_normalized = normalize_text(keyword)

            if not keyword_normalized:
                continue

            if keyword_normalized in query_lower:

                # Multi-word concepts are more informative.
                if len(keyword_normalized.split()) > 1:
                    score += 2
                else:
                    score += 1

        scores[domain] = score

    if not scores:
        return "GENERAL"

    best_domain = max(
        scores,
        key=scores.get
    )

    if scores[best_domain] == 0:
        return "GENERAL"

    return best_domain


# ============================================================
# QUERY VECTOR
# ============================================================

def create_vector(text: str):

    vector = vectorizer.transform(
        [normalize_text(text)]
    )

    vector = normalize(vector)

    return vector.toarray()[0].tolist()


# ============================================================
# KEYWORD OVERLAP
# ============================================================

def keyword_overlap(
    query: str,
    text: str
) -> float:

    query_words = set(
        normalize_text(query).split()
    )

    text_words = set(
        normalize_text(text).split()
    )

    if not query_words:
        return 0.0

    overlap = query_words.intersection(
        text_words
    )

    return len(overlap) / len(query_words)


# ============================================================
# CONCEPT MATCH SCORE
# ============================================================

def concept_match_score(
    query: str,
    text: str,
    domain: str
) -> float:

    query_normalized = normalize_text(query)
    text_normalized = normalize_text(text)

    if not query_normalized or not text_normalized:
        return 0.0

    concepts = CONCEPT_KEYWORDS.get(
        domain,
        []
    )

    if not concepts:
        return 0.0

    matched = 0
    total = len(concepts)

    for concept in concepts:

        concept_normalized = normalize_text(
            concept
        )

        if concept_normalized in query_normalized:

            if concept_normalized in text_normalized:
                matched += 1

    if total == 0:
        return 0.0

    return min(
        matched / total,
        1.0
    )


# ============================================================
# PHRASE MATCH SCORE
# ============================================================

def phrase_match_score(
    query: str,
    text: str
) -> float:

    query_normalized = normalize_text(query)
    text_normalized = normalize_text(text)

    if not query_normalized:
        return 0.0

    # Important legal phrases.
    important_phrases = [
        "payment of wages",
        "unpaid wages",
        "unpaid salary",
        "minimum wages",
        "minimum wage",
        "payment of salary",
        "delay in payment",
        "deduction from wages",
        "withholding salary",
        "non payment of wages"
    ]

    matched = 0

    for phrase in important_phrases:

        phrase_normalized = normalize_text(
            phrase
        )

        if (
            phrase_normalized in query_normalized
            and phrase_normalized in text_normalized
        ):
            matched += 1

    return min(
        matched / 2.0,
        1.0
    )


# ============================================================
# DOMAIN-FILTERED SEARCH
# ============================================================

def search_candidates(
    query_vector,
    detected_domain: str,
    limit: int = 50
):

    # If a legal domain is confidently detected,
    # search that domain directly instead of relying
    # only on post-retrieval penalties.

    if detected_domain != "GENERAL":

        try:

            filtered_result = client.query_points(

                collection_name=COLLECTION_NAME,

                query=query_vector,

                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="domain",
                            match=MatchValue(
                                value=detected_domain
                            )
                        )
                    ]
                ),

                limit=limit,

                with_payload=True
            )

            if filtered_result.points:

                return filtered_result.points

        except Exception as error:

            print(
                "Domain-filtered search failed:",
                error
            )

    # Fallback to normal search.
    search_result = client.query_points(

        collection_name=COLLECTION_NAME,

        query=query_vector,

        limit=limit,

        with_payload=True
    )

    return search_result.points


# ============================================================
# LEGAL RETRIEVAL
# ============================================================

def retrieve_legal_chunks(
    query: str,
    top_k: int = 5
):

    detected_domain = detect_domain(
        query
    )

    query_vector = create_vector(
        query
    )

    candidates = search_candidates(
        query_vector,
        detected_domain,
        limit=50
    )

    ranked = []

    for point in candidates:

        payload = point.payload or {}

        document_domain = payload.get(
            "domain",
            "GENERAL"
        )

        title = payload.get(
            "title",
            ""
        )

        section = payload.get(
            "section",
            ""
        )

        heading = payload.get(
            "heading",
            ""
        )

        text = payload.get(
            "text",
            ""
        )

        combined_text = " ".join([
            title,
            section,
            heading,
            text
        ])

        normalized_combined_text = normalize_text(
            combined_text
        )

        qdrant_score = float(
            point.score or 0.0
        )

        keyword_score = keyword_overlap(
            query,
            combined_text
        )

        concept_score = concept_match_score(
            query,
            combined_text,
            detected_domain
        )

        phrase_score = phrase_match_score(
            query,
            combined_text
        )

        # ----------------------------------------------------
        # DOMAIN MATCH
        # ----------------------------------------------------

        domain_match = (
            detected_domain == "GENERAL"
            or document_domain == detected_domain
        )

        if domain_match:
            domain_boost = 0.25
        else:
            domain_boost = 0.0

        # ----------------------------------------------------
        # DOMAIN PENALTY
        # ----------------------------------------------------

        if (
            detected_domain != "GENERAL"
            and document_domain != detected_domain
        ):
            domain_penalty = 0.75
        else:
            domain_penalty = 0.0

        # ----------------------------------------------------
        # TITLE / SECTION RELEVANCE
        # ----------------------------------------------------

        title_section_text = normalize_text(
            " ".join([
                title,
                section,
                heading
            ])
        )

        title_keyword_score = keyword_overlap(
            query,
            title_section_text
        )

        # ----------------------------------------------------
        # FINAL SCORE
        # ----------------------------------------------------

        final_score = (

            (qdrant_score * 0.30)

            +

            (keyword_score * 0.20)

            +

            (concept_score * 0.15)

            +

            (phrase_score * 0.10)

            +

            (title_keyword_score * 0.10)

            +

            domain_boost

            -

            domain_penalty
        )

        ranked.append({

            "score": round(
                final_score,
                4
            ),

            "qdrantScore": round(
                qdrant_score,
                4
            ),

            "keywordScore": round(
                keyword_score,
                4
            ),

            "conceptScore": round(
                concept_score,
                4
            ),

            "phraseScore": round(
                phrase_score,
                4
            ),

            "titleSectionScore": round(
                title_keyword_score,
                4
            ),

            "domainBoost": domain_boost,

            "domainPenalty": domain_penalty,

            "domainMatch": domain_match,

            "chunkId": payload.get(
                "chunkId"
            ),

            "sourceId": payload.get(
                "sourceId"
            ),

            "documentType": payload.get(
                "documentType"
            ),

            "title": title,

            "domain": document_domain,

            "jurisdiction": payload.get(
                "jurisdiction"
            ),

            "section": section,

            "heading": heading,

            "text": text,

            "source": payload.get(
                "source"
            ),

            "sourceUrl": payload.get(
                "sourceUrl"
            )
        })

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    ranked.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    # --------------------------------------------------------
    # HARD DOMAIN FILTER
    # --------------------------------------------------------

    # If domain-specific results exist, return only those.
    # This prevents an Employment query from returning
    # unrelated Contract Act sections.

    if detected_domain != "GENERAL":

        domain_results = [
            result
            for result in ranked
            if result["domain"] == detected_domain
        ]

        if domain_results:

            ranked = domain_results

    return ranked[:top_k]


# ============================================================
# TEST MODE
# ============================================================

if __name__ == "__main__":

    query = "My employer did not pay my wages"

    print(
        "\n========================================"
    )

    print(
        "CASEASSIST LEGAL RETRIEVAL TEST"
    )

    print(
        "========================================"
    )

    print(
        "\nQuery:",
        query
    )

    print(
        "\nDetected Domain:",
        detect_domain(query)
    )

    results = retrieve_legal_chunks(
        query,
        top_k=5
    )

    print(
        "\nRetrieved Results:",
        len(results)
    )

    for index, result in enumerate(
        results,
        start=1
    ):

        print(
            f"\n----------------------------------------"
        )

        print(
            f"RESULT {index}"
        )

        print(
            "Final Score       :",
            result["score"]
        )

        print(
            "Qdrant Score      :",
            result["qdrantScore"]
        )

        print(
            "Keyword Score     :",
            result["keywordScore"]
        )

        print(
            "Concept Score     :",
            result["conceptScore"]
        )

        print(
            "Phrase Score      :",
            result["phraseScore"]
        )

        print(
            "Title/Section     :",
            result["titleSectionScore"]
        )

        print(
            "Domain Match      :",
            result["domainMatch"]
        )

        print(
            "Domain             :",
            result["domain"]
        )

        print(
            "Title              :",
            result["title"]
        )

        print(
            "Section            :",
            result["section"]
        )

        print(
            "Source ID          :",
            result["sourceId"]
        )

        print(
            "Source URL         :",
            result["sourceUrl"]
        )

        print(
            "\nText:"
        )

        print(
            result["text"][:700]
        )

    print(
        "\n========================================"
    )

    print(
        "TEST COMPLETE"
    )

    print(
        "========================================"
    )

