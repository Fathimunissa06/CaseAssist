from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    Header,
    Security
)

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from datetime import datetime
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

from typing import Optional

import sys
import re
import os

from typing import Any
import json

from google import genai

from auth import (
    init_database,
    create_user,
    get_user_by_email,
    verify_password,
    create_access_token,
    decode_access_token
)


# ============================================================
# GEMINI AI CLIENT
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )
else:
    gemini_client = None


# ============================================================
# PROJECT PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = BASE_DIR / "scripts"

if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


# ============================================================
# CASEASSIST MODULES
# ============================================================

from legal_retrieval import retrieve_legal_chunks
from verification import verify_legal_rights
from report_generator import generate_legal_report


# ============================================================
# FASTAPI
# ============================================================
security = HTTPBearer()

app = FastAPI(
    title="CaseAssist AI Service",
    version="1.0.0",
    description="Multi-Agent AI Legal Rights and Dispute Intelligence Platform"
)

# ============================================================
# DATABASE INITIALIZATION
# ============================================================

init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class AnalysisRequest(BaseModel):

    caseId: str

    title: str

    problemDescription: str


# ============================================================
# AUTHENTICATION MODELS
# ============================================================

class RegisterRequest(BaseModel):

    name: str

    email: str

    password: str


class LoginRequest(BaseModel):

    email: str

    password: str


# ============================================================
# CHAT REQUEST MODELS
# ============================================================

class ChatMessage(BaseModel):

    role: str

    content: str


class ChatRequest(BaseModel):

    message: str

    caseContext: Optional[dict] = None

    history: list[ChatMessage] = Field(
        default_factory=list
    )


# ============================================================
# LEGAL MIND AI SYSTEM INSTRUCTIONS
# ============================================================

LEGAL_MIND_SYSTEM_PROMPT = """
You are LegalMind AI, the conversational legal assistant inside
CaseAssist.

Your job is to help users understand their legal situation in
clear, simple language.

IMPORTANT RULES:

1. Do not pretend to be a lawyer.
2. Do not claim certainty about legal outcomes.
3. Do not invent laws, sections, cases, deadlines, authorities,
   courts, procedures, or legal sources.
4. Use the provided Case Context and Retrieved Legal Sources
   whenever they are relevant.
5. Clearly distinguish:
   - facts provided by the user
   - retrieved legal information
   - general guidance
   - uncertainty or missing information
6. If important facts are missing, ask a short useful follow-up
   question.
7. If the user asks what they should do next, provide practical
   information such as documentation, evidence collection,
   communication, complaint channels, or questions to discuss
   with a qualified legal professional.
8. Keep answers understandable to a non-lawyer.
9. Do not overwhelm the user with unnecessary legal terminology.
10. If a retrieved legal source is available, mention the source
    title and section when appropriate.
11. Never fabricate a citation.
12. If the available information is insufficient, say so clearly.
13. Treat the case context as confidential case information.
14. Answer the user's current question directly first.

The assistant should sound professional, calm, helpful and
conversational.

For legal conclusions, use cautious language such as:
"may", "could", "appears relevant", or
"based on the information provided".

Do not present AI output as a final legal determination.
"""


# ============================================================
# LEGAL MIND AI CHAT
# ============================================================

def run_legal_chat(request: ChatRequest):

    if not request.message.strip():

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    if gemini_client is None:

        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured."
        )

    # --------------------------------------------------------
    # RETRIEVE RELEVANT LEGAL INFORMATION
    # --------------------------------------------------------

    retrieved_sources = []

    try:

        retrieved_chunks = retrieve_legal_chunks(
            request.message,
            top_k=5
        )

        for chunk in retrieved_chunks:

            retrieved_sources.append({

                "title":
                    chunk.get("title", ""),

                "section":
                    chunk.get("section", ""),

                "domain":
                    chunk.get("domain", ""),

                "text":
                    chunk.get("text", ""),

                "source":
                    chunk.get("source", ""),

                "sourceUrl":
                    chunk.get("sourceUrl", ""),

                "score":
                    chunk.get("score", 0)
            })

    except Exception as retrieval_error:

        print(
            "Chat legal retrieval warning:",
            retrieval_error
        )

        retrieved_sources = []

    # --------------------------------------------------------
    # LIMIT CONTEXT SIZE
    # --------------------------------------------------------

    case_context_text = json.dumps(
        request.caseContext,
        ensure_ascii=False,
        indent=2
    )

    if len(case_context_text) > 12000:

        case_context_text = case_context_text[:12000]

    legal_sources_text = ""

    for index, source in enumerate(
        retrieved_sources[:5],
        start=1
    ):

        legal_sources_text += f"""

SOURCE {index}
Title: {source.get("title", "")}
Section: {source.get("section", "")}
Domain: {source.get("domain", "")}
Source: {source.get("source", "")}
URL: {source.get("sourceUrl", "")}

Text:
{source.get("text", "")[:3500]}
"""

    # --------------------------------------------------------
    # CONVERSATION HISTORY
    # --------------------------------------------------------

    history_text = ""

    for message in request.history[-10:]:

        role = message.role.lower()

        if role not in ["user", "assistant"]:
            continue

        history_text += (
            f"\n{role.upper()}: "
            f"{message.content[:4000]}\n"
        )

    # --------------------------------------------------------
    # FINAL PROMPT
    # --------------------------------------------------------

    prompt = f"""
{LEGAL_MIND_SYSTEM_PROMPT}

========================
CASE CONTEXT
========================

{case_context_text}

========================
RETRIEVED LEGAL SOURCES
========================

{legal_sources_text}

========================
CONVERSATION HISTORY
========================

{history_text}

========================
CURRENT USER MESSAGE
========================

{request.message}

========================
RESPONSE
========================

Answer the user's current message.

If the question relates to the case, use the Case Context.

If legal information is relevant, use the Retrieved Legal Sources.

Do not invent information that is not present in the supplied
context or retrieved sources.

Keep the answer conversational and useful.
"""

    # --------------------------------------------------------
    # GEMINI
    # --------------------------------------------------------

    try:
        interaction = gemini_client.interactions.create(
            model="gemini-3.6-flash",
            input=prompt
        )

        reply = interaction.output_text

    except Exception as ai_error:

        print("========================================")
        print("GEMINI CHAT ERROR")
        print(type(ai_error).__name__)
        print(str(ai_error))
        print("========================================")

        error_text = str(ai_error).lower()

        # ----------------------------------------------------
        # GEMINI RATE LIMIT / QUOTA FALLBACK
        # ----------------------------------------------------

        if (
            "429" in error_text
            or "rate limit" in error_text
            or "too_many_requests" in error_text
            or "quota" in error_text
        ):

            if retrieved_sources:

                reply = (
                    "Gemini is temporarily unavailable because the "
                    "AI generation quota has been reached. However, "
                    "I found relevant legal information from the "
                    "CaseAssist legal database.\n\n"
                )

                reply += (
                    "Based on the retrieved legal sources:\n\n"
                )

                for index, source in enumerate(
                    retrieved_sources[:3],
                    start=1
                ):

                    title = source.get("title", "").strip()
                    section = source.get("section", "").strip()
                    text = source.get("text", "").strip()

                    if title:
                        reply += f"{index}. {title}"

                    if section:
                        reply += f" — {section}"

                    reply += "\n"

                    if text:
                        reply += text[:1200]

                    reply += "\n\n"

                reply += (
                    "This information is provided for general "
                    "legal information only and is not a final "
                    "legal determination. Please verify the "
                    "applicable law and consult a qualified legal "
                    "professional for advice about your specific case."
                )

            else:

                reply = (
                    "The AI response service is temporarily "
                    "unavailable because the Gemini usage quota "
                    "has been reached. Please try again after "
                    "the quota resets."
                )

        else:

            raise HTTPException(
                status_code=500,
                detail=f"Gemini error: {str(ai_error)}"
            )
    return {

        "reply": reply,

        "sources": retrieved_sources,

        "caseContextUsed":
            bool(request.caseContext),

        "retrievalUsed":
            bool(retrieved_sources)
    }


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def now_iso():
    return datetime.utcnow().isoformat() + "Z"


def unique_list(items):

    result = []

    for item in items:

        if item and item not in result:
            result.append(item)

    return result


# ============================================================
# AGENT 1 — FACT EXTRACTION
# ============================================================

def extract_facts(text: str):

    people = []
    dates = []
    amounts = []
    events = []

    text_lower = text.lower()

    # --------------------------------------------------------
    # PEOPLE / ENTITIES
    # --------------------------------------------------------

    entity_patterns = [
        r"\bmy employer\b",
        r"\bthe employer\b",
        r"\bmy company\b",
        r"\bthe company\b",
        r"\bmy landlord\b",
        r"\bthe landlord\b",
        r"\bmy tenant\b",
        r"\bthe tenant\b",
        r"\bthe seller\b",
        r"\bthe bank\b",
        r"\bthe insurer\b",
        r"\bthe insurance company\b"
    ]

    for pattern in entity_patterns:

        matches = re.findall(
            pattern,
            text_lower
        )

        for match in matches:

            people.append(match)

    # --------------------------------------------------------
    # DATES
    # --------------------------------------------------------

    date_patterns = [

        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",

        r"\b\d{1,2}\s+(?:january|february|march|april|may|june|"
        r"july|august|september|october|november|december)"
        r"\s+\d{4}\b",

        r"\b(?:january|february|march|april|may|june|july|"
        r"august|september|october|november|december)"
        r"\s+\d{1,2},?\s+\d{4}\b"
    ]

    for pattern in date_patterns:

        matches = re.findall(
            pattern,
            text_lower,
            flags=re.IGNORECASE
        )

        dates.extend(matches)

    # --------------------------------------------------------
    # AMOUNTS
    # --------------------------------------------------------

    amount_patterns = [

        r"(?:₹|rs\.?|inr)\s?[\d,]+(?:\.\d+)?",

        r"\b\d[\d,]*(?:\.\d+)?\s?(?:rupees|rs)\b"
    ]

    for pattern in amount_patterns:

        matches = re.findall(
            pattern,
            text_lower,
            flags=re.IGNORECASE
        )

        amounts.extend(matches)

    # --------------------------------------------------------
    # EVENTS
    # --------------------------------------------------------

    event_keywords = [

        "not paid",
        "terminated",
        "fired",
        "refused",
        "purchased",
        "charged",
        "transferred",
        "threatened",
        "received",
        "sent",
        "complained",
        "cancelled"
    ]

    for keyword in event_keywords:

        keyword_lower = keyword.lower()

        if keyword_lower not in text_lower:
            continue

        # ----------------------------------------------------
        # NEGATION CHECK
        # ----------------------------------------------------
        # Prevent:
        #
        # "salary was not received"
        #
        # from being interpreted as:
        #
        # "received"
        # ----------------------------------------------------

        if keyword_lower == "received":

            negated_patterns = [

                "not received",
                "was not received",
                "were not received",
                "has not received",
                "have not received",
                "had not received",
                "did not receive",
                "didn't receive",
                "never received",
                "not been received",
                "not being received"
            ]

            if any(
                pattern in text_lower
                for pattern in negated_patterns
            ):
                continue

        events.append(keyword)

    return {

        "peopleOrEntities": unique_list(
            people
        ),

        "dates": unique_list(
            dates
        ),

        "amounts": unique_list(
            amounts
        ),

        "events": unique_list(
            events
        ),

        "locations": [],

        "organizations": [],

        "relationships": [],

        "extractionMethod":
            "structured NLP + rule-based entity detection"
    }


# ============================================================
# AGENT 2 — LEGAL DOMAIN CLASSIFICATION
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
        "job",
        "work",
        "termination",
        "fired",
        "dismissed",
        "minimum wage",
        "payment of wages"
    ],

    "CONSUMER": [
        "consumer",
        "refund",
        "product",
        "seller",
        "purchase",
        "defective",
        "customer",
        "service"
    ],

    "RENTAL": [
        "rent",
        "tenant",
        "landlord",
        "lease",
        "deposit",
        "eviction"
    ],

    "PROPERTY": [
        "property",
        "land",
        "house",
        "ownership",
        "boundary",
        "sale deed"
    ],

    "ONLINE_FRAUD": [
        "fraud",
        "scam",
        "otp",
        "phishing",
        "online fraud",
        "fake payment"
    ],

    "CYBERCRIME": [
        "hacked",
        "cyber",
        "password",
        "unauthorized access",
        "account hacked"
    ],

    "INSURANCE": [
        "insurance",
        "claim",
        "policy",
        "premium",
        "insurer"
    ],

    "CONTRACT": [
        "contract",
        "agreement",
        "breach",
        "clause",
        "contractual"
    ],

    "FINANCIAL": [
        "bank",
        "transaction",
        "payment",
        "loan",
        "credit",
        "debit"
    ]
}


def classify_domain(text: str):

    text_lower = text.lower()

    scores = {}

    for domain, keywords in DOMAIN_KEYWORDS.items():

        score = 0

        for keyword in keywords:

            if keyword.lower() in text_lower:

                if " " in keyword:
                    score += 2
                else:
                    score += 1

        scores[domain] = score

    best_domain = max(
        scores,
        key=scores.get
    )

    best_score = scores[best_domain]

    if best_score == 0:

        return {

            "primary": "GENERAL",

            "confidence": 0.50,

            "alternatives": []
        }

    total = sum(
        scores.values()
    )

    confidence = round(
        best_score / max(total, 1),
        2
    )

    alternatives = []

    for domain, score in sorted(
        scores.items(),
        key=lambda item: item[1],
        reverse=True
    ):

        if (
            domain != best_domain
            and score > 0
        ):

            alternatives.append({
                "domain": domain,
                "score": score
            })

    return {

        "primary": best_domain,

        "confidence": confidence,

        "alternatives": alternatives[:3]
    }


# ============================================================
# AGENT 3 — RIGHTS IDENTIFICATION
# ============================================================

def identify_rights(
    problem_description: str,
    legal_domain: str
):

    retrieved_chunks = retrieve_legal_chunks(
        problem_description,
        top_k=5
    )

    potential_rights = []

    for index, chunk in enumerate(
        retrieved_chunks,
        start=1
    ):

        source = {

            "sourceType": chunk.get(
                "documentType",
                "STATUTE"
            ),

            "title": chunk.get(
                "title",
                ""
            ),

            "authority": "India Code",

            "section": chunk.get(
                "section",
                ""
            ),

            "jurisdiction": chunk.get(
                "jurisdiction",
                "INDIA"
            ),

            "text": chunk.get(
                "text",
                ""
            ),

            "sourceUrl": chunk.get(
                "sourceUrl",
                ""
            ),

            "source": chunk.get(
                "source",
                "India Code"
            )
        }

        potential_rights.append({

            "rightId": f"RIGHT-{index:03d}",

            "title": chunk.get(
                "title",
                "Potentially Relevant Legal Provision"
            ),

            "section": chunk.get(
                "section",
                ""
            ),

            "description": (
                "Potentially relevant legal provision "
                "identified from the retrieved legal source."
            ),

            "legalDomain": chunk.get(
                "domain",
                legal_domain
            ),

            "confidence": round(
                float(
                    chunk.get(
                        "score",
                        0.0
                    )
                ),
                2
            ),

            "source": source,

            "retrieval": {

                "score": chunk.get(
                    "score"
                ),

                "qdrantScore": chunk.get(
                    "qdrantScore"
                ),

                "keywordScore": chunk.get(
                    "keywordScore"
                ),

                "conceptScore": chunk.get(
                    "conceptScore"
                ),

                "phraseScore": chunk.get(
                    "phraseScore"
                )
            }
        })

    return {

        "status": "SUCCESS",

        "potentialRights": potential_rights,

        "retrievedCount": len(
            potential_rights
        ),

        "retrievalMethod":
            "Qdrant semantic retrieval + domain-aware lexical ranking"
    }


# ============================================================
# AGENT 4 — CLAIM EXTRACTION
# ============================================================

def extract_claims(
    problem_description: str
):

    sentences = re.split(
        r"[.!?]+",
        problem_description
    )

    claims = []

    claim_number = 1

    for sentence in sentences:

        sentence = sentence.strip()

        if len(sentence) < 10:
            continue

        claims.append({

            "claimId":
                f"CLAIM-{claim_number:03d}",

            "text":
                sentence,

            "source":
                "user_description"
        })

        claim_number += 1

    return claims


# ============================================================
# AGENT 5 — EVIDENCE SUFFICIENCY
# ============================================================

def assess_evidence(
    facts,
    claims
):

    available = []

    missing = [

        "Relevant supporting documents",

        "Communication records",

        "Proof supporting the main claim",

        "Important dates and timeline",

        "Relevant financial amount"
    ]

    if facts.get("dates"):
        available.append(
            "Dates mentioned in user description"
        )

        if (
            "Important dates and timeline"
            in missing
        ):
            missing.remove(
                "Important dates and timeline"
            )

    if facts.get("amounts"):
        available.append(
            "Financial amount mentioned in user description"
        )

        if (
            "Relevant financial amount"
            in missing
        ):
            missing.remove(
                "Relevant financial amount"
            )

    if claims:

        available.append(
            "User-stated claims"
        )

    if not available:

        status = "INSUFFICIENT"

    elif len(available) < 3:

        status = "PARTIALLY_SUPPORTED"

    else:

        status = "SUPPORTED"

    claim_evidence_map = []

    for claim in claims:

        claim_evidence_map.append({

            "claimId": claim.get(
                "claimId"
            ),

            "status": (
                "PARTIALLY_SUPPORTED"
                if available
                else "INSUFFICIENT"
            ),

            "availableEvidence": available,

            "missingEvidence": missing
        })

    return {

        "status": status,

        "available": available,

        "missing": missing,

        "claimEvidenceMap":
            claim_evidence_map
    }


# ============================================================
# AGENT 6 — CONTRADICTION DETECTION
# ============================================================

def detect_contradictions(
    problem_description: str,
    facts
):

    contradictions = []

    text_lower = problem_description.lower()

    # --------------------------------------------------------
    # Simple contradictory phrase detection
    # --------------------------------------------------------

    contradiction_pairs = [

        (
            "received",
            "not received"
        ),

        (
            "paid",
            "not paid"
        ),

        (
            "signed",
            "did not sign"
        ),

        (
            "agreed",
            "did not agree"
        )
    ]

    for positive, negative in contradiction_pairs:

        if (
            positive in text_lower
            and negative in text_lower
        ):

            contradictions.append({

                "type":
                    "DIRECT_STATEMENT_CONFLICT",

                "description":
                    f"Potential inconsistency detected between "
                    f"'{positive}' and '{negative}'.",

                "severity":
                    "MEDIUM"
            })

    return contradictions


# ============================================================
# AGENT 7 — RISK ANALYSIS
# ============================================================

def assess_risks(
    evidence,
    contradictions
):

    risks = []

    if evidence.get("missing"):

        risks.append({

            "riskType":
                "DOCUMENTATION_RISK",

            "level":
                "HIGH",

            "description":
                "Important supporting evidence is currently missing."
        })

    if evidence.get("status") != "SUPPORTED":

        risks.append({

            "riskType":
                "EVIDENCE_SUFFICIENCY_RISK",

            "level":
                "MEDIUM",

            "description":
                "The available information may not be sufficient "
                "to establish all relevant facts."
        })

    if contradictions:

        risks.append({

            "riskType":
                "CONTRADICTION_RISK",

            "level":
                "HIGH",

            "description":
                "Potential inconsistencies require clarification."
        })

    risks.append({

        "riskType":
            "TIMELINE_RISK",

        "level":
            "MEDIUM",

        "description":
            "Important dates and sequence of events should be verified."
    })

    return risks


# ============================================================
# AGENT 8 — SCENARIO SIMULATION
# ============================================================

def simulate_scenarios(
    legal_domain,
    evidence
):

    scenarios = [

        {

            "scenario":
                "Information Gathering",

            "description":
                "Collect documents, communications, dates and "
                "other relevant evidence before escalation.",

            "requirements":
                evidence.get("missing", []),

            "risk":
                "Low",

            "outcome":
                "Improves factual completeness for further analysis."
        },

        {

            "scenario":
                "Informal Resolution",

            "description":
                "The parties may attempt to resolve the dispute "
                "through direct communication.",

            "requirements":
                [
                    "Clear statement of the issue",
                    "Supporting evidence",
                    "Relevant dates and amounts"
                ],

            "risk":
                "Medium",

            "outcome":
                "May resolve the dispute without formal escalation."
        },

        {

            "scenario":
                "Formal Legal / Administrative Process",

            "description":
                "Depending on the dispute and applicable law, "
                "a formal complaint or legal process may be considered.",

            "requirements":
                [
                    "Verified facts",
                    "Supporting evidence",
                    "Applicable legal authority"
                ],

            "risk":
                "Medium",

            "outcome":
                "Requires verification of the appropriate forum and procedure."
        }
    ]

    return scenarios


# ============================================================
# AGENT 9 — ACTION RECOMMENDATION
# ============================================================

def recommend_actions(
    evidence,
    contradictions,
    legal_domain
):

    recommendations = []

    recommendations.append({

        "action":
            "Collect and preserve relevant evidence",

        "reason":
            "Supporting documents and records can help establish "
            "the factual basis of the dispute.",

        "requiredEvidence":
            evidence.get("missing", []),

        "priority":
            "HIGH"
    })

    recommendations.append({

        "action":
            "Create a chronological timeline",

        "reason":
            "Important dates can affect legal analysis and procedural steps.",

        "requiredEvidence":
            [
                "Dates",
                "Events",
                "Communications",
                "Payment records where applicable"
            ],

        "priority":
            "HIGH"
    })

    if contradictions:

        recommendations.append({

            "action":
                "Clarify potential inconsistencies",

            "reason":
                "Conflicting statements or records should be reviewed "
                "before relying on the analysis.",

            "requiredEvidence":
                [
                    "Original documents",
                    "Communication records",
                    "Timeline"
                ],

            "priority":
                "HIGH"
        })

    recommendations.append({

        "action":
            "Verify legal provisions against authoritative sources",

        "reason":
            "AI retrieval identifies potentially relevant provisions, "
            "but applicability depends on the complete facts.",

        "requiredEvidence":
            [
                "Original legal source",
                "Complete case facts"
            ],

        "priority":
            "MEDIUM"
    })

    return recommendations


# ============================================================
# AGENT 10 — LEGAL SOURCE VERIFICATION
# ============================================================

def perform_verification(
    rights_result,
    legal_domain,
    problem_description
):

    rights = rights_result.get(
        "potentialRights",
        []
    )

    verification_result = verify_legal_rights(

        rights,

        legal_domain,

        problem_description
    )

    return verification_result


# ============================================================
# MAIN CASE ANALYSIS
# ============================================================

def run_case_analysis(
    request: AnalysisRequest
):

    agent_trace = []

    # ========================================================
    # AGENT 1
    # ========================================================

    facts = extract_facts(
        request.problemDescription
    )

    agent_trace.append({

        "agent":
            "FACT_EXTRACTION",

        "status":
            "SUCCESS",

        "confidence":
            0.90
    })

    # ========================================================
    # AGENT 2
    # ========================================================

    domain = classify_domain(
        request.problemDescription
    )

    agent_trace.append({

        "agent":
            "DOMAIN_CLASSIFICATION",

        "status":
            "SUCCESS",

        "confidence":
            domain.get(
                "confidence",
                0.50
            )
    })

    # ========================================================
    # AGENT 3
    # ========================================================

    rights_result = identify_rights(

        request.problemDescription,

        domain["primary"]
    )

    agent_trace.append({

        "agent":
            "RIGHTS_IDENTIFICATION",

        "status":
            rights_result.get(
                "status",
                "SUCCESS"
            ),

        "confidence":
            (
                max(
                    [
                        right.get(
                            "confidence",
                            0
                        )
                        for right
                        in rights_result.get(
                            "potentialRights",
                            []
                        )
                    ],
                    default=0
                )
            ),

        "retrievedCount":
            rights_result.get(
                "retrievedCount",
                0
            )
    })

    # ========================================================
    # AGENT 4
    # ========================================================

    claims = extract_claims(
        request.problemDescription
    )

    agent_trace.append({

        "agent":
            "CLAIM_EXTRACTION",

        "status":
            "SUCCESS",

        "confidence":
            0.88
    })

    # ========================================================
    # AGENT 5
    # ========================================================

    evidence_result = assess_evidence(

        facts,

        claims
    )

    agent_trace.append({

        "agent":
            "EVIDENCE_SUFFICIENCY",

        "status":
            evidence_result.get(
                "status"
            ),

        "confidence":
            (
                0.85
                if evidence_result.get(
                    "status"
                ) == "SUPPORTED"
                else 0.60
            )
    })

    # ========================================================
    # AGENT 6
    # ========================================================

    contradiction_result = detect_contradictions(

        request.problemDescription,

        facts
    )

    agent_trace.append({

        "agent":
            "CONTRADICTION_DETECTION",

        "status":
            "SUCCESS",

        "confidence":
            0.86,

        "contradictionCount":
            len(
                contradiction_result
            )
    })

    # ========================================================
    # AGENT 7
    # ========================================================

    risk_result = assess_risks(

        evidence_result,

        contradiction_result
    )

    agent_trace.append({

        "agent":
            "RISK_PREDICTION",

        "status":
            "SUCCESS",

        "confidence":
            0.78
    })

    # ========================================================
    # AGENT 8
    # ========================================================

    scenario_result = simulate_scenarios(

        domain["primary"],

        evidence_result
    )

    agent_trace.append({

        "agent":
            "SCENARIO_SIMULATION",

        "status":
            "SUCCESS",

        "confidence":
            0.75
    })

    # ========================================================
    # AGENT 9
    # ========================================================

    recommendation_result = recommend_actions(

        evidence_result,

        contradiction_result,

        domain["primary"]
    )

    agent_trace.append({

        "agent":
            "ACTION_RECOMMENDATION",

        "status":
            "SUCCESS",

        "confidence":
            0.82
    })

    # ========================================================
    # AGENT 10
    # ========================================================

    verification_result = perform_verification(

        rights_result,

        domain["primary"],

        request.problemDescription
    )

    verification_total = (

        verification_result.get(
            "verifiedCount",
            0
        )

        +

        verification_result.get(
            "downgradedCount",
            0
        )
    )

    verification_confidence = round(

        verification_result.get(
            "verifiedCount",
            0
        )

        /

        max(
            verification_total,
            1
        ),

        2
    )

    agent_trace.append({

        "agent":
            "LEGAL_SOURCE_VERIFICATION",

        "status":
            verification_result.get(
                "status",
                "PARTIAL"
            ),

        "confidence":
            verification_confidence,

        "verifiedCount":
            verification_result.get(
                "verifiedCount",
                0
            ),

        "downgradedCount":
            verification_result.get(
                "downgradedCount",
                0
            )
    })

    # ========================================================
    # CENTRAL CASE STATE
    # ========================================================

    case_state = {

        "caseId":
            request.caseId,

        "title":
            request.title,

        "problemDescription":
            request.problemDescription,

        "status":
            "COMPLETED",

        "input": {

            "userDescription":
                request.problemDescription,

            "documents":
                []
        },

        "facts":
            facts,

        "claims":
            claims,

        "timeline":
            [],

        "legalDomain":
            domain,

        "rights":
            rights_result.get(
                "potentialRights",
                []
            ),

        "evidence":
            evidence_result,

        "contradictions":
            contradiction_result,

        "similarCases":
            [],

        "risks":
            risk_result,

        "scenarios":
            scenario_result,

        "recommendations":
            recommendation_result,

        "sources":
            [
                right.get(
                    "source",
                    {}
                )
                for right
                in rights_result.get(
                    "potentialRights",
                    []
                )
            ],

        "verification":
            verification_result,

        "agentTrace":
            agent_trace,

        "createdAt":
            now_iso(),

        "updatedAt":
            now_iso()
    }

    # ========================================================
    # REPORT GENERATION
    # ========================================================

    report = generate_legal_report(
        case_state
    )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "caseId":
            request.caseId,

        "title":
            request.title,

        "status":
            "ANALYSIS_COMPLETED",

        "facts":
            facts,

        "claims":
            claims,

        "legalDomain":
            domain,

        "rights":
            rights_result,

        "evidence":
            evidence_result,

        "contradictions":
            contradiction_result,

        "risks":
            risk_result,

        "scenarios":
            scenario_result,

        "recommendations":
            recommendation_result,

        "verification":
            verification_result,

        "agentTrace":
            agent_trace,

        "caseState":
            case_state,

        "report":
            report,

        "verificationWarnings": [

            "Legal conclusions require verification against authoritative sources.",

            "Retrieved provisions are potentially relevant and should be reviewed in the context of the complete facts.",

            "Similarity or AI-generated analysis does not establish a legal outcome.",

            "Source verification confirms source and metadata consistency; it does not establish that a provision legally applies to every fact of the dispute.",

            "Users should verify important facts and legal provisions against the original authoritative source or obtain professional legal guidance where appropriate."
        ]
    }

# ============================================================
# REGISTER
# ============================================================

@app.post("/api/register")
def register(
    request: RegisterRequest
):

    name = request.name.strip()

    email = request.email.strip().lower()

    password = request.password


    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 2 characters."
        )


    if "@" not in email:

        raise HTTPException(
            status_code=400,
            detail="Please provide a valid email address."
        )


    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )


    existing_user = get_user_by_email(
        email
    )

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )


    user = create_user(
        name=name,
        email=email,
        password=password
    )

    if not user:

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )


    token = create_access_token(
        user_id=user["id"],
        email=user["email"]
    )


    return {
        "message": "Registration successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

# ============================================================
# LOGIN
# ============================================================

@app.post("/api/login")
def login(
    request: LoginRequest
):

    email = request.email.strip().lower()

    password = request.password


    user = get_user_by_email(
        email
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )


    valid_password = verify_password(
        password,
        user["password_hash"]
    )

    if not valid_password:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )


    token = create_access_token(
        user_id=user["id"],
        email=user["email"]
    )


    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "createdAt": user["created_at"]
        }
    }


# ============================================================
# JWT AUTHENTICATION
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload."
        )

    user = get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User no longer exists."
        )

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "UP",

        "service":
            "CaseAssist AI Service",

        "version":
            "1.0.0"
    }

# ============================================================
# CURRENT USER
# ============================================================

@app.get("/api/me")
def get_me(
    current_user=Depends(
        get_current_user
    )
):

    return {
        "authenticated": True,
        "user": current_user
    }


# ============================================================
# ANALYSIS ENDPOINT
# ============================================================

@app.post("/api/analyze")
def analyze_case(
    request: AnalysisRequest,
    current_user=Depends(
        get_current_user
    )
):

    return run_case_analysis(
        request
    )

# ============================================================
# LEGAL MIND AI CHAT ENDPOINT
# ============================================================

@app.post("/api/chat")
def chat(
    request: ChatRequest,
    current_user=Depends(
        get_current_user
    )
):

    return run_legal_chat(
        request
    )
