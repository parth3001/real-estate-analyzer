# Terms of Service — DRAFT FOR ATTORNEY REVIEW

> **NOT YET ACTIVE.** This is a draft created 2026-06-18 to replace the current ToS
> at `frontend/src/pages/TermsOfServicePage.tsx`. It has NOT been reviewed by a
> licensed attorney. **Do not deploy without a Texas consumer SaaS attorney's
> review pass**, particularly for:
>
> - §8 Arbitration and Class Action Waiver — enforceability and opt-out wording
> - §16 Pay-Per-Deal Billing — refund and consumer-protection-law alignment
> - §20 California Residents (CCPA) — current statute references
> - §10–14 Disclaimers — survivability under TX consumer-fraud law
>
> Estimated attorney review cost: $1,500–$3,000 for a pass.
>
> Once approved, replace the body of `TermsOfServicePage.tsx`, update the
> `Last updated` constant, and bump `termsVersion` in
> `backend/src/controllers/authController.ts:106` to `'2026-06-18'` (or the
> attorney-approved date). Then ship #78 (re-consent flow) so existing users
> are forced to re-accept.

---

**Last updated: June 18, 2026**

**Effective: [TO BE SET BY COUNSEL]**

---

## 1. Acceptance of Terms

By creating an account on REanalyzr ("the Service") or by clicking "I agree" during signup, you accept and agree to be bound by these Terms of Service ("Terms") and our [Privacy Policy](/privacy). If you do not agree, do not use the Service.

You must be at least 18 years old and a resident of the United States to use REanalyzr.

Your continued use of the Service after we post material changes to these Terms constitutes acceptance only when accompanied by an affirmative re-consent prompt (see §7). Passive continued use does not bind you to material changes.

---

## 2. Service License

REanalyzr is a Software-as-a-Service ("SaaS") platform delivered through web browsers and other supported clients. Subject to your compliance with these Terms, REanalyzr grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal real estate investment analysis purposes.

You agree NOT to:

- Reverse engineer, decompile, or attempt to extract the source code of the Service;
- Use the Service to provide investment advice to third parties for compensation, unless you hold the appropriate professional license in your jurisdiction;
- Scrape, harvest, or systematically download data from the Service via automated means;
- Resell, sublicense, or redistribute access to the Service or its outputs as a competing product;
- Use the Service to violate any applicable law, regulation, or third-party right;
- Circumvent technical or contractual usage limits, including per-deal license terms.

This license terminates automatically upon any violation of these Terms.

---

## 3. Disclaimer

The Service is provided on an "AS IS" and "AS AVAILABLE" basis. REanalyzr makes no warranties, expressed or implied, including without limitation implied warranties of merchantability, fitness for a particular purpose, or non-infringement.

REanalyzr does not warrant the accuracy, completeness, timeliness, or reliability of any analysis, calculation, projection, market data, AI-generated content, or recommendation produced by the Service.

---

## 4. Limitation of Liability

To the maximum extent permitted by law, in no event shall REanalyzr, its affiliates, officers, directors, employees, agents, or suppliers be liable for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages (including without limitation damages for lost profits, lost data, business interruption, or investment losses) arising out of or related to your use of or inability to use the Service, even if REanalyzr has been advised of the possibility of such damages.

REanalyzr's total aggregate liability arising out of or relating to these Terms or the Service shall not exceed the greater of (a) the amount you paid REanalyzr in the twelve (12) months preceding the event giving rise to the claim, or (b) one hundred U.S. dollars ($100).

Some jurisdictions do not allow these limitations; in such jurisdictions liability is limited to the maximum extent permitted by law.

---

## 5. Accuracy of Materials

The Service may include technical, typographical, or factual errors. REanalyzr does not warrant that any of the materials, calculations, or AI-generated outputs are accurate, complete, or current. REanalyzr may modify the Service or its outputs at any time without notice.

---

## 6. Third-Party Links

The Service may contain links to third-party websites. REanalyzr has not reviewed all such linked sites and is not responsible for their content. Inclusion does not imply endorsement. Use of any linked website is at your own risk.

---

## 7. Modifications and Re-Consent

REanalyzr may revise these Terms from time to time. We will:

- Update the "Last updated" date at the top of these Terms;
- For **material changes** (including but not limited to changes to dispute resolution, arbitration, pricing model, data sharing, or liability), notify you by email and require affirmative re-consent before you next access the Service;
- For non-material changes, post the updated Terms on the Service.

Material changes do not bind you until you affirmatively re-accept the updated Terms by clicking through an in-product consent prompt.

---

## 8. Governing Law and Dispute Resolution

### 8.1 Governing Law
These Terms are governed by the laws of the State of Texas, United States, without regard to conflict-of-law principles.

### 8.2 Binding Arbitration
Any dispute, claim, or controversy arising out of or relating to these Terms, the Service, or the relationship between you and REanalyzr — whether based in contract, tort, statute, fraud, misrepresentation, or any other legal theory — shall be resolved by **binding individual arbitration** administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules, except as set forth below.

Arbitration shall be conducted in Dallas County, Texas, or remotely at the arbitrator's discretion. The arbitrator's award shall be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.

### 8.3 Class Action Waiver
**YOU AND REANALYZR AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION.** No arbitrator or court may consolidate more than one party's claims or preside over any form of representative or class proceeding.

### 8.4 Opt-Out Right
You may opt out of the arbitration and class-action-waiver provisions in §8.2 and §8.3 by sending written notice of your decision to opt out to **legal@reanalyzr.com** within **thirty (30) days** of first accepting these Terms. Your notice must include your name, account email, and the statement "I opt out of arbitration." If you opt out, §8.2 and §8.3 do not apply to you, but all other provisions of these Terms remain in effect.

### 8.5 Exceptions
Notwithstanding the above, either party may bring an individual action in small-claims court if eligible, or seek injunctive relief in court for intellectual-property infringement.

---

## 9. Privacy Policy

Your privacy is important to us. Our [Privacy Policy](/privacy) explains what information we collect, how we use it, who we share it with, and your choices. By using the Service you agree to the data practices described in the Privacy Policy.

---

## 10. Investment Analysis Disclaimer

**IMPORTANT: REanalyzr IS NOT PROVIDING FINANCIAL, INVESTMENT, TAX, OR LEGAL ADVICE.**

REanalyzr provides educational property analysis tools, calculators, and AI-assisted commentary. All analysis results, scores, calculations, projections, and recommendations are estimates based on user-provided data, third-party market data, and algorithmic models. The Service is designed for informational and educational purposes only.

**You acknowledge and agree that:**

- No content on the Service constitutes professional financial, investment, tax, legal, or real estate advice;
- Past performance and historical data do not guarantee future results;
- Real estate investments carry inherent risks including market volatility, vacancy, property damage, illiquidity, and total loss of capital;
- You must conduct independent due diligence and consult qualified licensed professionals (CPA, financial advisor, attorney, licensed real estate agent) before making any investment decision;
- REanalyzr is NOT a licensed investment adviser, broker-dealer, real estate broker, mortgage broker, CPA, or attorney;
- Market data and calculations may contain errors, omissions, or become outdated;
- Local regulations, tax laws, lending environments, and market conditions vary significantly and may not be reflected in the analysis.

**EXPLICIT USER ACKNOWLEDGMENT.** By using this Service, you explicitly acknowledge and agree that:

- You are solely responsible for all investment decisions and any resulting financial outcomes;
- The Service provides educational tools only, not investment recommendations;
- You will not hold REanalyzr liable for any investment outcomes, positive or negative;
- You understand that real estate investments carry significant risks including total loss of capital;
- You will consult qualified licensed professionals before making investment decisions.

---

## 11. Financial Calculation Disclaimer

### Calculation Accuracy and Limitations

REanalyzr uses industry-standard financial formulas for calculations including NOI, Cap Rate, IRR, Cash-on-Cash Return, DSCR, walk-away price, and other metrics. However, you acknowledge the following limitations:

- **Input Dependency:** All calculations depend on the accuracy of data you provide. Incorrect inputs produce incorrect results;
- **Market Assumptions:** Calculations use market data and assumptions that may not reflect actual or future conditions;
- **Convention Variation:** Industry calculation conventions vary (e.g., whether CapEx reserves are above or below NOI); the convention used by the Service may not match your accountant's or lender's;
- **Tax Calculations:** Tax estimates are educational only. Actual tax liability depends on your specific situation, which we cannot assess;
- **Projection Uncertainty:** Long-term projections (5, 10, 20+ years) are model estimates based on assumptions that may not materialize;
- **Calculation Errors:** Despite our efforts, software bugs or data issues may produce incorrect outputs;
- **No Guarantee:** We provide no guarantee that calculations match actual investment performance;
- **Third-Party Verification:** You must verify calculations with qualified professionals before acting on them.

**Tax-Specific:** Tax calculations are educational only. Actual tax liability depends on your filing status, state of residence, entity structure, depreciation schedule, and other factors we cannot assess. Always consult a licensed CPA or tax professional for actual tax advice.

---

## 12. Deal Quality Score and Walk-Away Price Disclaimer

REanalyzr's Investment Decision Engine produces a numerical **Deal Quality Score** (0–100) and a calculated **walk-away price** based on financial analysis. You explicitly acknowledge:

- **Algorithmic Nature:** Scores and walk-away prices are generated by algorithms, not human real estate professionals;
- **Score Interpretation:** The 0–100 score and its contextual label ("above professional standards," "meets professional standards," "requires optimization," "below professional standards") are analytical signals, not investment recommendations. Final interpretation is your responsibility;
- **Walk-Away Price Limitations:** Calculated walk-away prices are model estimates derived from your inputs and market data. Actual property value may differ significantly. Walk-away prices are starting points for analysis and negotiation, not appraisals or firm valuations;
- **Market Variations:** Real estate markets vary by micro-location, property condition, financing environment, and timing. Algorithmic analysis cannot account for every factor;
- **Professional Appraisal Required:** Always obtain a professional appraisal before purchasing property. Never rely solely on algorithmic valuations;
- **No Guarantee of Returns:** A high score does not guarantee profitable investment. A low score does not guarantee unprofitable investment.

The Deal Quality Score and walk-away price are educational tools to inform your thinking, not directives to follow. Final investment decisions must be made with qualified professionals.

---

## 13. Third-Party Data Sources and Liability

REanalyzr integrates data from third-party providers including FRED (Federal Reserve), RentCast, U.S. Census Bureau, OpenAI, Anthropic, and others. You acknowledge:

- We do not control third-party data accuracy, completeness, or timeliness;
- Third-party data may contain errors, omissions, or become outdated without notice;
- Third-party services may become unavailable, limiting analysis;
- REanalyzr is not liable for errors, omissions, or consequences resulting from third-party data inaccuracies;
- You must independently verify data from third-party sources before acting on it.

**Specific Disclaimers.** RentCast rent estimates are algorithmic predictions, not actual market rents — verify with local property managers and comparable listings. Census demographic data is historical and may not reflect current conditions.

---

## 14. AI-Generated Content and Confabulation Risk

REanalyzr incorporates artificial intelligence ("AI") and large language models ("LLMs") to generate analysis, commentary, and recommendations. You acknowledge and accept:

- **Algorithmic Nature:** AI outputs are generated by statistical models, not human judgment;
- **Confabulation Risk:** AI models can produce confident-sounding but factually incorrect content, including incorrect numbers, projections, calculations, citations, or claims about the Service's underlying data. You agree that you will independently verify any AI-generated numbers against the structured analysis in your workspace before acting on them;
- **Data Dependencies:** AI outputs depend on training data quality and may reflect historical biases;
- **No Warranty of Accuracy:** We provide no warranty regarding the accuracy, completeness, or reliability of AI-generated content;
- **User Responsibility:** You must independently verify all AI insights and analysis;
- **Continuous Change:** AI models are continuously updated; outputs may change over time for the same inputs;
- **Logged Conversations:** Conversations with the AI agent are stored in your account for service quality, debugging, and audit purposes (see Privacy Policy).

**Never rely solely on AI-generated content for investment decisions.** Always consult qualified professionals and conduct independent research.

---

## 15. Beta Software Disclaimer

REanalyzr is currently in active development. By using the Service you accept:

- The Service may be unavailable, interrupted, or contain bugs;
- User data, saved analyses, or account information may in rare cases be lost or corrupted, and you accept that risk;
- Features may be modified, discontinued, or added without prior notice;
- Performance may vary;
- Customer support may be limited;
- No service-level agreement is provided regarding uptime, performance, or availability.

Use REanalyzr for preliminary analysis only. We strongly recommend backing up important data and obtaining professional verification before making investment decisions.

---

## 16. Pricing and Billing Terms — Pay-Per-Deal Model

### 16.1 Pricing Model

REanalyzr uses a **pay-per-deal pricing model**. There is **no monthly subscription**. There is **no auto-renewal**.

- **Free first deal.** After signup, your first deal unlock is free.
- **Per-deal unlock.** Subsequent deals are unlocked at the price displayed at the time of purchase (currently $4.99 per deal).
- **180-day editing window.** Each unlocked deal includes a 180-day window during which you may re-run analyses, switch strategies, and override assumptions on that specific property. After 180 days, the deal becomes read-only; you may re-purchase if you want fresh analysis with current market data.
- **No recurring charges.** Pay-per-deal purchases are one-time charges. There are no subscriptions, no auto-renewals, no surprise recurring bills.
- **Bundles.** REanalyzr may from time to time offer multi-deal bundles (e.g., 5-pack or 10-pack) at a reduced per-deal effective price. Bundle credits are subject to the expiration window stated at the time of purchase.

### 16.2 Payment

- All charges are processed by a third-party payment processor (Stripe or equivalent). You authorize REanalyzr and its payment processor to charge your provided payment method for purchases you initiate.
- Prices are quoted in U.S. dollars and may be subject to applicable sales, use, or value-added taxes in your jurisdiction.
- REanalyzr may change pricing for future purchases at any time. Pricing applies to purchases made after the change becomes effective; existing unlocked deals are not affected.

### 16.3 Refunds and Cancellation

- Because the Service consumes irreversible compute and API costs at the moment of unlock, **all sales are final**. We do not offer refunds on unlocked deals except where required by law or at our discretion in cases of clear technical failure of the Service.
- You may delete your account at any time. Account deletion does not entitle you to refunds for previously unlocked deals.

### 16.4 No Long-Term Commitment

You are not committed to any future purchase. Episodic real estate investing is supported by an episodic pricing model.

---

## 17. Data Privacy and Third-Party Services

REanalyzr integrates with third-party data providers and processors:

- **FRED API** (Federal Reserve): Economic data;
- **RentCast API**: Rental and property data;
- **Census API**: Demographic data;
- **OpenAI / Anthropic APIs**: AI processing;
- **Resend**: Transactional email delivery;
- **Stripe**: Payment processing;
- **MongoDB Atlas**: Database hosting;
- **Render**: Application hosting;
- **Google Analytics 4 / Microsoft Clarity**: Analytics (see Privacy Policy).

We share only the minimum data required for each service to function. See the [Privacy Policy](/privacy) for details on data collection, use, and protection.

---

## 18. Professional Liability and Indemnification

### Limitation of Professional Liability

- REanalyzr is not licensed as an investment adviser, broker-dealer, real estate broker, mortgage broker, or attorney;
- The Service provides software tools, not professional services;
- No attorney-client, advisor-client, broker-client, or other professional relationship is created by use of the Service;
- REanalyzr assumes no fiduciary duty to users;
- Professional licensing requirements vary by jurisdiction and are your responsibility.

### User Indemnification

You agree to indemnify, defend, and hold harmless REanalyzr, its officers, directors, employees, agents, and suppliers from any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:

- Your use of the Service or reliance on analysis results;
- Investment decisions made using the Service's tools;
- Your violation of these Terms;
- Your violation of any third-party right, including intellectual property or privacy rights;
- Your violation of any applicable law or regulation.

---

## 19. Regulatory Compliance and Geographic Restrictions

### Geographic Limitations
REanalyzr is intended for use in the United States only. Use outside the United States may violate local laws and is at your own risk.

### Professional Licensing
If you are a licensed real estate professional, investment adviser, mortgage broker, or other regulated professional, you are responsible for ensuring your use of the Service complies with applicable professional standards and regulations in your jurisdiction.

### Securities Laws
REanalyzr does not provide investment advice as defined by U.S. securities laws. Users who provide advice to clients using outputs from the Service must comply with applicable investment adviser registration and disclosure requirements.

---

## 20. California Residents (CCPA / CPRA)

If you are a California resident, the California Consumer Privacy Act ("CCPA") as amended by the California Privacy Rights Act ("CPRA") provides you with specific rights regarding your personal information.

### Rights
You have the right to:

- **Know** what personal information we collect, use, and share;
- **Access** the personal information we hold about you;
- **Delete** personal information (subject to legal-retention exceptions);
- **Correct** inaccurate personal information;
- **Opt out** of the sale or sharing of personal information for cross-context behavioral advertising;
- **Limit** the use of sensitive personal information;
- **Non-discrimination** for exercising any of these rights.

### Categories of Personal Information We Collect
See the [Privacy Policy](/privacy) Section 2 for a full description.

### Sale or Sharing
**REanalyzr does not sell your personal information** and does not share it for cross-context behavioral advertising as those terms are defined by CCPA/CPRA.

### How to Exercise Your Rights
Contact us at **privacy@reanalyzr.com** with your request. We will verify your identity and respond within the statutory 45-day window (extendable to 90 days as permitted by law).

### Authorized Agent
You may designate an authorized agent to exercise your rights on your behalf, subject to verification.

---

## 21. Account Termination

You may delete your account at any time. We may suspend or terminate your account for violation of these Terms, fraud, abuse, or unlawful activity.

Upon termination:

- Your access to the Service ends;
- Your data is deleted or anonymized within 30 days, except where retention is required by law;
- Sections that by their nature survive termination (including Limitations of Liability, Indemnification, Dispute Resolution, and Disclaimers) continue to apply.

---

## 22. Entire Agreement; Severability

These Terms and the Privacy Policy constitute the entire agreement between you and REanalyzr regarding the Service and supersede any prior agreements.

If any provision of these Terms is found to be unenforceable, the remaining provisions remain in full force and effect.

---

## 23. Contact Information

Questions about these Terms:

- **Email:** legal@reanalyzr.com
- **Mail:** [INSERT BUSINESS MAILING ADDRESS — required for CCPA/consumer-law compliance]

---

## Appendix — Implementation Checklist for Engineering

When deploying this version:

1. Replace the body of `frontend/src/pages/TermsOfServicePage.tsx` with this content (or equivalent JSX).
2. Replace the auto-generated date line with a literal: `Last updated: June 18, 2026` (or attorney-approved date).
3. Update `backend/src/controllers/authController.ts:106` — change `termsVersion: '2025-10-30'` to `'2026-06-18'` (or attorney-approved date).
4. Ship the re-consent flow (Task #78) so existing users are forced to re-accept on next login.
5. Add `currentTosVersion` constant to a shared file so frontend and backend agree.
6. Add `privacyAcceptedAt` and `privacyVersion` fields to User model and capture at signup + re-consent.
7. Update the Privacy Policy to reference DealLicense / DealCredit data handling (will need refresh when Stripe ships).
8. Add the business mailing address in §23 (required for CCPA compliance and most consumer-protection laws).

When the attorney returns the reviewed draft, save the final version as `TERMS_OF_SERVICE_v2026-06-18.md` (or the attorney-approved date) in `/docs/` as a versioned record, and bump `termsVersion` to match.
