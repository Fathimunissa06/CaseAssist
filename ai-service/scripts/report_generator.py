from datetime import datetime


def safe_list(value):
    if isinstance(value, list):
        return value
    return []


def generate_legal_report(case_state):
    """
    Generate a structured Legal Intelligence Report
    from the verified CaseState.
    """

    facts = case_state.get("facts", {})
    domain = case_state.get("legalDomain", {})
    evidence = case_state.get("evidence", {})
    contradictions = case_state.get("contradictions", [])
    rights = case_state.get("rights", [])
    risks = case_state.get("risks", [])
    scenarios = case_state.get("scenarios", [])
    recommendations = case_state.get("recommendations", [])
    verification = case_state.get("verification", {})

    report = {
        "reportTitle": "CaseAssist Legal Intelligence Report",

        "generatedAt": datetime.utcnow().isoformat() + "Z",

        "caseId": case_state.get("caseId"),

        "caseSummary": {
            "title": case_state.get("title"),
            "problemDescription": case_state.get(
                "problemDescription"
            ),
            "status": case_state.get("status")
        },

        "legalDomain": {
            "primary": domain.get("primary"),
            "confidence": domain.get("confidence"),
            "alternatives": domain.get("alternatives", [])
        },

        "keyFacts": {
            "peopleOrEntities": safe_list(
                facts.get("peopleOrEntities")
            ),
            "dates": safe_list(
                facts.get("dates")
            ),
            "amounts": safe_list(
                facts.get("amounts")
            ),
            "events": safe_list(
                facts.get("events")
            ),
            "locations": safe_list(
                facts.get("locations")
            ),
            "organizations": safe_list(
                facts.get("organizations")
            ),
            "relationships": safe_list(
                facts.get("relationships")
            )
        },

        "claims": safe_list(
            case_state.get("claims")
        ),

        "potentiallyRelevantLegalProvisions": [],

        "evidenceAssessment": {
            "status": evidence.get("status"),
            "available": safe_list(
                evidence.get("available")
            ),
            "missing": safe_list(
                evidence.get("missing")
            ),
            "claimEvidenceMap": safe_list(
                evidence.get("claimEvidenceMap")
            )
        },

        "contradictionAssessment": {
            "count": len(contradictions),
            "items": contradictions
        },

        "riskAssessment": {
            "items": risks
        },

        "possibleScenarios": scenarios,

        "recommendedActions": recommendations,

        "verification": {
            "status": verification.get("status"),
            "verifiedCount": verification.get(
                "verifiedCount",
                0
            ),
            "downgradedCount": verification.get(
                "downgradedCount",
                0
            ),
            "verifiedRights": verification.get(
                "verifiedRights",
                []
            ),
            "downgradedRights": verification.get(
                "downgradedRights",
                []
            ),
            "warnings": verification.get(
                "warnings",
                []
            )
        },

        "limitations": [
            "This report is generated from the facts and documents supplied for analysis.",
            "Potentially relevant legal provisions do not automatically establish legal applicability.",
            "Missing or contradictory evidence may affect the analysis.",
            "Legal outcomes cannot be guaranteed from AI analysis.",
            "Important legal provisions should be checked against the original authoritative source."
        ]
    }

    # --------------------------------------------------------
    # LEGAL PROVISIONS
    # --------------------------------------------------------

    for right in rights:

        source = right.get(
            "source",
            {}
        )

        report["potentiallyRelevantLegalProvisions"].append({

            "rightId": right.get("rightId"),

            "title": right.get(
                "title"
            ),

            "section": right.get(
                "section"
            ),

            "description": right.get(
                "description"
            ),

            "legalDomain": right.get(
                "legalDomain"
            ),

            "confidence": right.get(
                "confidence"
            ),

            "source": {
                "title": source.get(
                    "title"
                ),

                "authority": source.get(
                    "authority"
                ),

                "section": source.get(
                    "section"
                ),

                "jurisdiction": source.get(
                    "jurisdiction"
                ),

                "sourceUrl": source.get(
                    "sourceUrl"
                )
            }
        })

    return report