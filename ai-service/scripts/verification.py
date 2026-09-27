from typing import Dict, Any, List


def verify_legal_rights(
    rights: List[Dict[str, Any]],
    legal_domain: str,
    problem_description: str
) -> Dict[str, Any]:

    verified = []
    downgraded = []
    warnings = []

    for right in rights:

        source = right.get("source", {})

        title = source.get("title", "")
        section = source.get("section", "")
        text = source.get("text", "")
        jurisdiction = source.get("jurisdiction", "")
        source_type = source.get("sourceType", "")

        checks = {
            "sourceExists": bool(title and text),
            "sectionExists": bool(section),
            "jurisdictionExists": bool(jurisdiction),
            "authoritativeSource": (
                source.get("authority") == "India Code"
            ),
            "statuteSource": (
                source_type == "STATUTE"
            ),
            "domainMatches": (
                right.get("legalDomain") == legal_domain
            )
        }

        passed_checks = sum(
            1
            for value in checks.values()
            if value
        )

        verification_score = round(
            passed_checks / len(checks),
            2
        )

        if (
            checks["sourceExists"]
            and checks["sectionExists"]
            and checks["jurisdictionExists"]
            and checks["authoritativeSource"]
            and checks["domainMatches"]
        ):

            verification_status = "PASS"

            verified.append({

                "rightId": right.get("rightId"),

                "title": title,

                "section": section,

                "status": "VERIFIED_SOURCE",

                "verificationScore":
                    verification_score,

                "checks": checks,

                "source": source
            })

        else:

            verification_status = "DOWNGRADED"

            downgraded.append({

                "rightId": right.get("rightId"),

                "title": title,

                "section": section,

                "status": "REQUIRES_REVIEW",

                "verificationScore":
                    verification_score,

                "checks": checks,

                "source": source
            })

    if not verified:

        warnings.append(
            "No retrieved legal provision passed all verification checks."
        )

    warnings.append(
        "Verification confirms source and metadata consistency; "
        "it does not establish that a provision legally applies "
        "to the complete facts of the dispute."
    )

    return {

        "status": (
            "VERIFIED"
            if verified
            else "PARTIAL"
        ),

        "verifiedCount":
            len(verified),

        "downgradedCount":
            len(downgraded),

        "verifiedRights":
            verified,

        "downgradedRights":
            downgraded,

        "warnings":
            warnings
    }