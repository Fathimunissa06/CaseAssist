/**
 * Sample response used when VITE_USE_MOCK=true.
 * The shape mirrors the fields described for POST /api/analyze; the legal
 * references are illustrative placeholders, not real citations.
 */
export function buildMockResponse({ caseId, title } = {}) {
  return {
    caseId,
    title,
    domain: {
      name: 'Tenancy and housing law',
      confidence: 0.93,
      description: 'A dispute between a tenant and a landlord over a refundable security deposit.',
    },
    extracted_facts: [
      'The tenant vacated the rented flat after giving two months of written notice.',
      'A security deposit of 90,000 was paid when the lease was signed.',
      'More than two months have passed and the deposit has not been returned.',
      'The landlord plans to deduct repainting charges that the lease does not mention.',
      'The tenant holds rent receipts and a message thread in which the landlord agreed the flat was left clean.',
    ],
    legal_retrieval: [
      {
        title: 'State tenancy statute: return of security deposit',
        section: 'Sample provision',
        text: 'Illustrative sample: a landlord must return the security deposit within the statutory period after vacant possession is handed over. Deductions are limited to documented unpaid rent and damage beyond normal wear and tear, and must be permitted by the lease.',
        source: 'Sample data',
        score: 0.91,
      },
      {
        title: 'Contract law: enforcement of lease terms',
        section: 'Sample provision',
        text: 'Illustrative sample: charges that are not part of the written agreement cannot be imposed unilaterally. A party who withholds money without a contractual basis may be liable to repay it with interest.',
        source: 'Sample data',
        score: 0.84,
      },
      {
        title: 'Consumer and civil remedies for recovery of money',
        section: 'Sample provision',
        text: 'Illustrative sample: a claimant may send a legal notice demanding repayment and, if the demand is ignored, file a civil suit or a small-claims application to recover the amount.',
        source: 'Sample data',
        score: 0.72,
      },
    ],
    rights_analysis: {
      summary: 'On these facts the tenant has a strong claim to the return of the deposit.',
      rights: [
        {
          right: 'Refund of the deposit',
          description: 'The deposit is refundable once the tenancy ends, less only deductions the lease allows.',
          basis: 'Lease agreement and tenancy statute',
        },
        {
          right: 'Challenge undocumented deductions',
          description: 'Repainting charges that are not in the lease can be disputed, and the landlord should be asked to justify them in writing.',
          basis: 'Contract law',
        },
        {
          right: 'Claim interest for delay',
          description: 'If the refund is unreasonably delayed, interest on the withheld amount may be claimed.',
          basis: 'Civil remedies',
        },
      ],
    },
    risk_assessment: {
      level: 'Moderate',
      score: 0.48,
      summary: 'The claim is well supported, but recovery depends on the landlord cooperating or on a formal proceeding.',
      factors: [
        'The lease does not mention repainting charges, which favors the tenant.',
        'No written record of the notice date beyond messages may need to be shown.',
        'Court or tribunal proceedings add time and cost if the landlord refuses.',
      ],
    },
    recommended_actions: [
      {
        action: 'Collect and organize your evidence',
        description: 'Gather the lease, rent receipts, the notice, and screenshots of the conversation about the condition of the flat.',
        priority: 'High',
      },
      {
        action: 'Send a written demand',
        description: 'Ask for the full deposit within a fixed period, and request an itemized explanation for any deduction.',
        priority: 'High',
      },
      {
        action: 'Send a formal legal notice',
        description: 'If the demand is ignored, a notice from a lawyer often prompts repayment before any filing.',
        priority: 'Medium',
      },
      {
        action: 'Prepare a civil or small-claims filing',
        description: 'Keep the paperwork ready in case the matter has to go to a court or tribunal.',
        priority: 'Low',
      },
    ],
    disclaimer:
      'This is sample output for demonstration only. It is general legal information, not legal advice, and it does not create a lawyer-client relationship.',
  };
}
