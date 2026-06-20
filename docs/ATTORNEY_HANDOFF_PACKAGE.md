# Attorney Handoff Package — REanalyzr ToS Review

> Use the email template (Section 1) to introduce the engagement. The
> background (Section 2) and questions (Section 3) give you something
> to share before the first call. Keep the ToS draft attached as the
> primary artifact for review.

---

## Section 1 — Email Template

```
Subject: Pre-launch ToS/Privacy review — TX consumer SaaS, AI-assisted
         real-estate analysis platform

Dear [Attorney Name],

I'm the founder of REanalyzr, an AI-assisted real estate investment
analysis platform launching in [target month] 2026. I'm reaching out
to engage you for a pre-launch review of our Terms of Service draft,
Privacy Policy, and the consent-capture flow.

Quick context:
  • REanalyzr is a SaaS web app — investors run institutional-grade
    underwriting analysis on residential real estate deals
  • Pay-per-deal pricing: $4.99 per property analyzed (no subscription)
  • Tax-residency: Texas (Delaware C-corp planned at scale)
  • Currently in beta with [N] users; planning v1 launch in [month]
  • Backend captures consent at signup with timestamp + IP + ToS version

I've drafted a comprehensive ToS rewrite (attached as
TERMS_OF_SERVICE_DRAFT.md, ~22 sections) and need your professional
review before deploying it to production. Key areas I'd value your
expert eye on:

  1. The arbitration + class action waiver clause (Section 8) — TX
     enforceability + 30-day opt-out mechanics
  2. The pay-per-deal refund policy (Section 16) — alignment with TX
     consumer protection and any state-specific rules I should worry
     about
  3. The AI confabulation acknowledgment (Section 14) — we recently
     discovered our LLM agent can confidently produce factually
     incorrect numbers and added explicit language about this
  4. Tax-content disclaimers (Sections 10, 11, 12, 18) — the platform
     surfaces depreciation/recapture/1031/NIIT concepts but never
     computes the user's actual liability
  5. CCPA section (Section 20) — making sure the statutory references
     are current and the rights language is enforceable
  6. The professional-liability exclusions (Section 18) — we are NOT
     a licensed investment adviser, broker-dealer, or real estate
     professional; need confidence the disclaimers hold up
  7. The browsewrap → clickwrap migration (Section 7) — we have a
     re-consent flow built into the login path that fires on material
     ToS version changes

Engagement budget: $1,500 – $3,000 for a review pass with redline
comments + a 30-minute call to walk through your findings. Happy to
discuss a fixed fee vs. hourly arrangement, whichever works for your
practice.

Timeline: I'd love your review within 2-3 weeks so we can iterate
once and ship. Happy to push timing for the right attorney.

Attached:
  • TERMS_OF_SERVICE_DRAFT.md — the document for review
  • PRODUCT_CONTEXT.md — one-pager on what we do, target user, pricing
  • A list of specific questions I'd love your perspective on
    (separate document)

Could we schedule a 15-minute intro call this week to confirm fit
and scope? My direct line is [phone] or just reply to this email.

Thanks for your time.

[Your name]
Founder, REanalyzr
[email]
[website]
```

---

## Section 2 — Background Briefing (for the first call)

### What REanalyzr Does

A SaaS platform that runs institutional-grade real estate underwriting
calculations on residential properties for individual investors. Think
of it as taking the analytical depth that Wall Street firms (Blackstone,
Invitation Homes) use internally and packaging it for the retail
investor analyzing 5-30 properties a year.

**Output of a typical analysis:**
- Deal Quality Score (0–100) with contextual labels
- 10-year projection with year-by-year cash flow, value, equity
- Walk-away price (analytical "don't pay more than" number)
- Adversarial review from two AI personas (optimistic_flipper +
  skeptical_cpa) that argue against the engine's score
- Stress test results across multiple input perturbations

### Key Architecture Points the Attorney Should Know

1. **AI-assisted, not AI-driven.** The financial math is deterministic
   (we own the calculation engine). The AI layer narrates the results
   in plain English. AI confabulation risk is bounded but real — we've
   added 14 read tools so the agent narrates from substrate-stored
   data rather than guessing.

2. **No payment processor live yet.** Stripe integration is the next
   workstream after the legal pass. The ToS draft is written for the
   pay-per-deal model that ships with Stripe.

3. **No money has changed hands yet.** Currently in free beta. v1
   launch will be the first paid transaction. Critical to get the
   refund policy + recurring-vs-one-time language right BEFORE the
   first dollar.

4. **Consent capture is solid.** We persist `termsAcceptedAt` +
   `termsVersion` + `termsAcceptedIp` at signup on the User record.
   Login flow detects outdated termsVersion and forces a re-consent
   modal before access — this is built and ready.

5. **No fiduciary or professional license.** We are explicitly NOT
   acting as an investment adviser, broker-dealer, real estate
   broker, mortgage broker, or attorney. Our pricing page, ToS, and
   in-product disclaimers all repeat this. We want this enforceable.

### Pricing Model (matters for §16)

- **Free tier**: Deal Quality Score teaser + first full analysis free
- **Per deal**: $4.99 per property, 180-day editable window
- **Bundles (post-launch)**: 5-pack at $19.99, 10-pack at $34.99
- **No monthly subscription. No auto-renewal. No surprise charges.**
- **All sales final on unlocked deals** (justified by irreversible
  compute + API costs at unlock moment — please verify this works
  under TX consumer law)

### Notable Liability Surfaces

- **Financial analysis errors.** Our calculations can be off; we say
  so plainly in §11 and §13.
- **AI confabulation.** Our agent can produce confident-sounding but
  factually wrong numbers; §14 explicitly acknowledges this.
- **Tax content.** §10–12 disclaim tax advice; tax tool returns
  educational content + mandatory disclaimer the agent must surface.
- **Walk-away price.** §12 disclaims these as analytical, not
  appraisal. We are concerned about "I lost $X because your walk-away
  said this was a deal" claims.
- **Beta software.** §15 covers data loss, downtime, feature changes.

---

## Section 3 — Specific Questions for the Attorney

### Arbitration & Dispute Resolution (§8)

1. **Is our arbitration clause as drafted enforceable in Texas for
   consumer SaaS?** Specifically the AAA Consumer Arbitration Rules
   reference + Dallas County venue + 30-day opt-out mechanism.

2. **Should we strengthen the clickwrap evidence?** Beyond capturing
   `termsAcceptedAt + termsVersion + IP`, do you recommend a screen-
   recording or anything else for the consent moment?

3. **The 30-day opt-out — is the wording in §8.4 enforceable?** Should
   the opt-out window run from acceptance or from the original
   notification?

4. **California users** — even though we're TX-governed, are there
   CA-specific arbitration nuances (Iskanian/AB-51 line of cases for
   employment doesn't apply, but consumer arbitration may have its
   own quirks).

### Pay-Per-Deal Refund Policy (§16)

5. **"All sales final" — does this hold up under Texas consumer
   protection law?** We have a compute-cost rationale (~$2 of LLM
   cost is consumed at unlock moment). Should we offer a window for
   technical-failure refunds even so?

6. **Are there state-specific refund minima we need to honor?**
   California, Massachusetts, New York?

7. **Is the absence of subscription/auto-renewal language enough,
   or do we need an explicit "no auto-renewal" disclosure?**

### AI / Confabulation Liability (§14)

8. **The acknowledgment language in §14** — is this sufficient to
   protect us when the AI confidently produces a wrong number and a
   user acts on it? Should we strengthen the indemnification, add
   a "you agree to independently verify all AI-generated numbers"
   clause?

9. **Are there emerging regulatory frameworks** (FTC enforcement,
   state AI bills, federal AI legislation in committee) that we
   should be preparing for?

10. **Training data + IP**. Do we need to make any statement about
    whether user-provided property data is or isn't used to train
    third-party LLM models? OpenAI's API terms say no by default,
    but should we make that explicit to users?

### Tax Content (§10-12, §18)

11. **Tax disclaimers** — are our existing disclaimers sufficient
    to protect us when the agent explains depreciation/1031/recapture
    concepts? We added a "tax_education_context" tool that returns
    standard rates + a mandatory disclaimer.

12. **Is there any state where merely SURFACING the concepts (even
    educationally) could be construed as unlicensed practice of tax
    advisory?** Texas? Specific jurisdictions to be careful in?

### Investment Adviser / Securities Status

13. **Our "Investment Decision Engine" and "Deal Quality Score"** —
    is there any risk this gets characterized as investment advice
    under the Investment Advisers Act of 1940? We're not handling
    securities, but I want to be sure the calculation engine and
    score language don't trip an unintended definition.

14. **Same question for state-level real estate professional rules**
    — does Texas (or any state) regulate "automated property analysis"
    in a way that could affect us?

### Third-Party Data (§13)

15. **FRED, RentCast, Census, OpenAI, Anthropic** — we list each
    integration. Are there any provider-specific terms we should be
    flagging to users (e.g., RentCast's commercial-use terms, OpenAI's
    output-usage rules)?

### Beta / Disclaimers (§15)

16. **The "Beta Software Disclaimer"** — should we set an explicit
    sunset date (e.g., "Beta status ends YYYY-MM-DD") or is open-ended
    "currently in beta" sufficient?

17. **Data loss disclaimer** — defensible? We use MongoDB Atlas with
    backups, but should we set an SLA expectation?

### Re-Consent Flow (§7)

18. **Our re-consent flow forces existing users to accept new ToS
    versions when material changes ship.** Is the forced modal +
    "decline → contact legal@" UX defensible, or should the decline
    path automatically delete account?

19. **What counts as "material" for the purpose of re-consent?**
    Our `tosVersions.ts` constants list ARBITRATION, CLASS ACTION,
    PRICING MODEL, DATA SHARING, LIABILITY changes as material.
    Anything we should add?

### Logistics

20. **Timeline.** What's a realistic turnaround for redline comments
    + 30-min walkthrough call? We're flexible but want to launch in
    [target month].

21. **Engagement structure.** Fixed fee for the review pass + hourly
    for follow-up questions? Or all-in retainer? We're a pre-revenue
    bootstrap, so cost discipline matters but quality of the legal
    work matters more.

22. **Privacy Policy review** — would you do that in the same
    engagement, or as a separate scope?

23. **Ongoing.** Once launched, we'll need someone to call when:
    real claim arises, ToS needs material update, expansion to a new
    state. Are you available on a retainer or on-demand basis?

---

## Section 4 — Logistics Checklist Before Sending

- [ ] Replace `[Attorney Name]`, `[target month]`, `[your name]`,
      `[phone]`, `[email]`, `[website]` in Section 1
- [ ] Replace `[N]` with current beta user count
- [ ] Attach: `TERMS_OF_SERVICE_DRAFT.md`
- [ ] Attach: `PRODUCT_CONTEXT.md`
- [ ] Attach: Section 3 of THIS document as a separate "questions"
      file (renamed: `REANALYZR_LEGAL_QUESTIONS.md`)
- [ ] Subject line specific enough that it doesn't get filtered as
      a generic legal solicitation
- [ ] CC your co-founder / advisor if appropriate
- [ ] Save the PDF of the email + attachments in your records folder
      with timestamp

---

## Section 5 — How to Find a Good TX Consumer SaaS Attorney

If you don't have one yet, these are good signals:

**Yes — likely good fit:**
- Practice description mentions "consumer SaaS," "ToS review," "Terms
  & Privacy," or "tech startups"
- Lists work with companies you've heard of in TX tech ecosystem
- Has done arbitration enforcement work (knows the live caselaw)
- Comfortable engaging on flat-fee or pre-quoted scope (not just
  hourly-with-no-cap)

**Maybe — needs vetting:**
- General corporate practice with "tech experience"
- Big-firm associate with no startup practice (might over-charge)
- Solo attorney with great reviews but no SaaS background (might
  miss CCPA, AI risk, etc.)

**No — avoid:**
- Anyone who says "you don't need arbitration" (you do)
- Anyone who says ToS doesn't matter pre-launch (it does)
- Anyone who can't quote a scope or estimated cost

**Where to look:**
- Texas Bar Association — startup law section
- Y Combinator Startup School legal resources
- AngelList / former founder personal networks
- Specific names: practitioners in Austin who service the consumer-SaaS
  cluster around Austin tech tend to be the strongest fit for TX
  consumer SaaS

---

## Section 6 — After the Review Returns

Once the attorney comes back with redlines:

1. Review their comments. Push back on suggestions that conflict with
   the brand promise (e.g., reintroducing subscription auto-renewal
   language).
2. Iterate on the ToS draft.
3. Once final, save as `TERMS_OF_SERVICE_v2026-MM-DD.md` in `/docs/`.
4. Replace `frontend/src/pages/TermsOfServicePage.tsx` body with the
   approved content. Replace `new Date().toLocaleDateString()` with
   a literal date constant.
5. Bump `CURRENT_TOS_VERSION` in `backend/src/constants/tosVersions.ts`
   to match the new ToS date.
6. Add the new version to `TOS_VERSION_HISTORY` with `material: true`
   and a summary of what changed.
7. Bump `termsVersion` default in
   `backend/src/controllers/authController.ts:106` (the registration
   capture default).
8. Deploy. The re-consent flow (#78) will catch every existing user on
   their next login and force the modal.
9. Update `PRODUCT_CONTEXT.md` with the new effective date.
10. Archive the attorney's redlines + your finalized version + the
    invoice in `/legal/` (gitignored) for your records.

When changing the Privacy Policy in parallel, follow the same
pattern using `CURRENT_PRIVACY_VERSION` and a separate
`privacyAcceptedAt` field (currently bundled with terms — consider
splitting per the attorney's recommendation).

---

*Generated 2026-06-18 for handoff to TX consumer SaaS attorney.*
