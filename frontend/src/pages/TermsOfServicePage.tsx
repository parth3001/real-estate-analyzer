import React from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

const TermsOfServicePage: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();

  const getContainerStyle = () => ({
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: isMobile ? '20px' : isTablet ? '40px' : '60px 40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  });

  const getContentStyle = () => ({
    maxWidth: isMobile ? '100%' : isTablet ? '700px' : '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: isMobile ? '16px' : '24px',
    padding: isMobile ? '24px' : isTablet ? '40px' : '60px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  });

  const getHeaderStyle = () => ({
    textAlign: 'center' as const,
    marginBottom: isMobile ? '32px' : isTablet ? '40px' : '48px'
  });

  const getTitleStyle = () => ({
    fontSize: isMobile ? '2.25rem' : isTablet ? '2.75rem' : '3rem',
    fontWeight: 700,
    color: '#0a0a0a',
    margin: '0 0 16px 0',
    letterSpacing: isMobile ? '-1px' : '-1.5px'
  });

  const getSubtitleStyle = () => ({
    fontSize: isMobile ? '1rem' : '1.125rem',
    color: '#6b7280',
    margin: 0
  });

  const getSectionStyle = () => ({
    marginBottom: isMobile ? '32px' : '40px'
  });

  const getSectionTitleStyle = () => ({
    fontSize: isMobile ? '1.375rem' : '1.5rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: isMobile ? '16px' : '20px',
    lineHeight: 1.4
  });

  const getTextStyle = () => ({
    fontSize: isMobile ? '0.875rem' : '1rem',
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: '16px'
  });

  const getListStyle = () => ({
    fontSize: isMobile ? '0.875rem' : '1rem',
    lineHeight: 1.6,
    color: '#374151',
    paddingLeft: '20px',
    marginBottom: '16px'
  });

  const getBackLinkStyle = () => ({
    display: 'inline-flex',
    alignItems: 'center',
    color: '#6366f1',
    textDecoration: 'none',
    fontSize: isMobile ? '0.875rem' : '1rem',
    fontWeight: 500,
    marginBottom: isMobile ? '24px' : '32px',
    transition: 'color 0.2s'
  });

  const getLinkStyle = () => ({
    color: '#0071E3',
    textDecoration: 'none'
  });

  // Currently unused — all amber placeholders were resolved on 2026-08-30
  // (Issue #260). Kept because counsel's review of these terms is still
  // pending and will likely come back with new items to flag. If the
  // reviewed version ships with none, delete this.
  const getTodoStyle = () => ({
    backgroundColor: '#fef3c7',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#78350f',
    fontStyle: 'italic' as const,
    fontSize: '0.9em'
  });

  return (
    <div style={getContainerStyle()}>
      <div style={getContentStyle()}>
        <Link to="/register" style={getBackLinkStyle()}>
          ← Back to Registration
        </Link>

        <div style={getHeaderStyle()}>
          <h1 style={getTitleStyle()}>Terms of Service</h1>
          <p style={getSubtitleStyle()}>Last updated: July 27, 2026</p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>1. Introduction and Acceptance</h2>
          <p style={getTextStyle()}>
            These Terms of Service ("Terms") are a binding agreement between
            you and{' '}
            PVA Ventures LLC,
            a Texas limited liability company doing business as "REanalyzr"
            ("REanalyzr," "we," "us," or "our"). They govern your access to
            and use of the REanalyzr website, applications, and related
            services (collectively, the "Service").
          </p>
          <p style={getTextStyle()}>
            By creating an account, purchasing a paid property unlock, or
            otherwise using the Service, you agree to be bound by these Terms
            and by our{' '}
            <Link to="/privacy" style={getLinkStyle()}>Privacy Policy</Link>.
            If you do not agree, do not use the Service.
          </p>
          <p style={getTextStyle()}>
            <strong>These Terms contain an agreement to resolve disputes by
            binding individual arbitration (Section 20), a class-action and
            jury-trial waiver (Section 21), and a limitation of REanalyzr's
            liability (Section 17). Please read them carefully. You may opt
            out of arbitration within 30 days of first accepting these Terms
            as described in Section 23.</strong>
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>2. Eligibility and Geographic Scope</h2>
          <p style={getTextStyle()}>
            The Service is intended for individuals who are at least 18 years
            old and located in the United States. By using the Service you
            represent that you meet these requirements and that you have the
            legal capacity to enter into these Terms.
          </p>
          <p style={getTextStyle()}>
            The Service is not directed to children, and we do not knowingly
            collect personal information from anyone under 13. Use of the
            Service outside the United States is at your own risk and may
            violate local laws.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>3. Your Account</h2>
          <p style={getTextStyle()}>
            To use most features of the Service you must create an account
            using a valid email address. We authenticate accounts using
            magic-link email sign-in and do not use passwords. You are
            responsible for the security of the email account associated with
            your REanalyzr account.
          </p>
          <p style={getTextStyle()}>
            You agree to provide accurate information, to keep your account
            details current, and to notify us promptly if you believe someone
            has gained unauthorized access to your account. You are
            responsible for activity that occurs through your account.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>4. License to Use the Service</h2>
          <p style={getTextStyle()}>
            Subject to your compliance with these Terms, REanalyzr grants you
            a limited, personal, non-exclusive, non-transferable,
            non-sublicensable, revocable license to access and use the Service
            for your own personal, non-commercial use, including for your own
            real estate investment research.
          </p>
          <p style={getTextStyle()}>
            All right, title, and interest in the Service — including
            software, models, scoring logic, workspace layouts, generated
            reports, and any related documentation — remain the property of
            REanalyzr and its licensors. Nothing in these Terms transfers any
            ownership right to you.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>5. Paid Property Unlocks and Access</h2>
          <p style={getTextStyle()}>
            REanalyzr uses a pay-per-deal pricing model. No subscription is
            required to use the Service.
          </p>
          <ul style={getListStyle()}>
            <li><strong>Signup:</strong> Free. No credit card required.</li>
            <li><strong>First analysis:</strong> Included at no cost after signup.</li>
            <li><strong>Additional properties:</strong> $4.99 per property, one-time charge.</li>
            <li><strong>Access window:</strong> Each paid unlock grants 180 days of editable access to the applicable deal workspace, including unlimited chat, full analysis details, and PDF export for that property.</li>
            <li><strong>No subscription:</strong> No recurring monthly or annual charges, no automatic renewal, and no free trial to cancel.</li>
          </ul>
          <p style={getTextStyle()}>
            Payments are processed by Stripe, Inc. Your card details are
            handled by Stripe and are not stored on our servers. Prices are
            shown in U.S. dollars. Any applicable sales tax is added at
            checkout and shown before you confirm payment.
          </p>
          <p style={getTextStyle()}>
            After the 180-day access window closes, the property remains in
            your Saved Properties as read-only. Re-unlocking the same property
            for a fresh 180-day editable window costs another $4.99.
          </p>
          <p style={getTextStyle()}>
            We may update the $4.99 per-deal price with 30 days advance notice
            communicated by email or in-product notification. Property unlocks
            already purchased at the old price keep their 180-day access at no
            additional cost.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>6. Refunds</h2>
          <p style={getTextStyle()}>
            Each paid property unlock is a one-time purchase that provides
            access to the applicable deal workspace for the access period
            displayed at checkout. Purchases do not renew automatically.
          </p>
          <p style={getTextStyle()}>
            Except where otherwise required by law, fees are nonrefundable
            after the paid deal workspace has been successfully made
            available. However, you may request a refund by emailing{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>{' '}
            if a technical failure materially prevents you from accessing or
            using the paid analysis.
          </p>
          <p style={getTextStyle()}>
            Refund requests should identify the account email, property and
            problem. We may attempt to correct or regenerate the affected
            analysis before issuing a refund. Approved refunds will be
            submitted to the original payment method, generally within one
            business day after approval, although the payment processor or
            financial institution may require additional time to post the
            credit.
          </p>
          <p style={getTextStyle()}>
            Nothing in this policy limits any non-waivable rights or remedies
            available under applicable law.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>7. Information You Provide</h2>
          <p style={getTextStyle()}>
            When you use the Service you provide inputs such as property
            addresses, purchase prices, financing terms, rent assumptions,
            operating expenses, and renovation assumptions. You represent that
            you have the right to provide this information and that it does
            not violate any third-party right or applicable law.
          </p>
          <p style={getTextStyle()}>
            You retain ownership of the information you provide. You grant
            REanalyzr a worldwide, non-exclusive, royalty-free license to
            host, store, reproduce, structure, transmit, analyze, display,
            and create outputs from that information for the purpose of
            operating and improving the Service and providing it to you.
          </p>
          <p style={getTextStyle()}>
            <strong>Do not submit</strong> Social Security numbers,
            bank-account credentials, payment-card numbers, medical
            information, or other sensitive personal information that is not
            necessary to analyze a property. Property addresses may identify
            an individual's residence; use judgment about what to enter.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>8. AI Processing</h2>
          <p style={getTextStyle()}>
            When an AI-assisted feature is used, we may transmit relevant
            property information, financial assumptions, and generated
            calculations to a third-party artificial-intelligence provider to
            generate a response. AI providers may temporarily retain
            information for security or abuse-prevention purposes under their
            contractual terms. We do not authorize third-party AI providers to
            use your property-analysis information to train their generally
            available models unless we separately disclose that practice and
            obtain any consent required by law.
          </p>
          <p style={getTextStyle()}>
            AI outputs may not be unique to you, and other users may receive
            similar outputs from similar prompts. Ownership of AI outputs is
            subject to applicable law and third-party terms.
          </p>
          <p style={getTextStyle()}>
            See our{' '}
            <Link to="/privacy" style={getLinkStyle()}>Privacy Policy</Link>{' '}
            for detail on data handling.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>9. Nature of the Service; No Professional Advice</h2>
          <p style={getTextStyle()}>
            REanalyzr provides software-based educational and analytical
            tools designed to help users organize and evaluate information
            concerning potential real estate investments. The Service may
            generate financial calculations, projections, a proprietary Deal
            Quality Score, estimated negotiation or walk-away pricing, and
            narrative content generated or assisted by artificial
            intelligence.
          </p>
          <p style={getTextStyle()}>
            REanalyzr is not a real estate broker, appraiser, lender,
            investment adviser, broker-dealer, financial planner, attorney,
            accountant, tax adviser, property inspector, title company, or
            other licensed professional. REanalyzr does not provide
            investment, financial, legal, tax, accounting, lending,
            appraisal, brokerage, property-management, engineering,
            inspection, or other professional advice. No use of the Service
            creates an advisory, fiduciary, professional, agency, partnership,
            or similar relationship between you and REanalyzr.
          </p>
          <p style={getTextStyle()}>
            The Service does not evaluate your complete financial
            circumstances, investment objectives, risk tolerance, liquidity
            needs, tax situation, legal obligations, property condition,
            title, environmental conditions, insurance availability,
            financing eligibility, or other facts necessary to determine
            whether a transaction is suitable for you.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>10. Model-Generated Scores, Projections and Outputs</h2>
          <p style={getTextStyle()}>
            The Deal Quality Score and all other scores, projections, price
            estimates, classifications, labels, narratives and outputs are
            model-generated screening tools. They are not appraisals,
            valuations, broker price opinions, offers, lending decisions,
            guarantees, predictions of actual performance, or recommendations
            to buy, sell, finance, hold or otherwise transact in any property.
          </p>
          <p style={getTextStyle()}>
            Outputs are based on assumptions, information supplied by you,
            information obtained from third-party sources, and automated
            calculation or artificial-intelligence systems. Outputs may be
            inaccurate, incomplete, misleading, internally inconsistent,
            outdated, non-unique or unsuitable for your circumstances.
            Artificial-intelligence systems may generate statements that
            appear confident even when they are incorrect.
          </p>
          <p style={getTextStyle()}>
            A high score does not mean that a property is suitable, fairly
            priced, financeable or likely to be profitable. A low score does
            not mean that a property is unsuitable or likely to lose money.
            Any estimated walk-away price or negotiation range is a
            scenario-based calculation and is not an opinion of market value.
          </p>
          <p style={getTextStyle()}>
            You are solely responsible for verifying every material input,
            assumption, calculation and output before relying on it. Before
            entering a transaction, you should obtain appropriate independent
            advice and services, including as applicable a professional
            inspection, appraisal, title review, survey, insurance review,
            financing review, legal advice and tax advice.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>11. User Decisions and Assumption of Risk</h2>
          <p style={getTextStyle()}>
            Real estate transactions involve substantial risks, including
            loss of capital, unexpected repairs, vacancy, tenant disputes,
            financing changes, interest-rate changes, market declines,
            environmental conditions, title defects, regulatory changes,
            inaccurate property information and other circumstances that the
            Service cannot identify or predict.
          </p>
          <p style={getTextStyle()}>
            You retain sole control over, and responsibility for, every
            decision made in connection with a property. You agree not to
            enter into or refrain from a transaction solely because of a
            score, projection, classification, price estimate or other output
            from the Service.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>12. Third-Party and User-Supplied Data</h2>
          <p style={getTextStyle()}>
            The Service may use information supplied by you and information
            obtained from third parties, including property-data providers,
            public agencies and artificial-intelligence providers. REanalyzr
            does not control and does not independently verify all such
            information. Third-party and user-supplied information may
            contain errors, omissions, estimates, duplicate records, stale
            information or data describing a property other than the property
            intended.
          </p>
          <p style={getTextStyle()}>
            You are responsible for confirming that the correct property,
            financing terms, rent assumptions, expenses, taxes, insurance,
            condition and other inputs have been used. Third-party services
            may modify, discontinue or restrict their data or services at any
            time.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>13. Acceptable Use</h2>
          <p style={getTextStyle()}>You agree that you will not, and will not attempt to:</p>
          <ul style={getListStyle()}>
            <li>use the Service for any unlawful purpose or in violation of any applicable law or regulation;</li>
            <li>use the Service to make lending, housing, employment, insurance, or credit eligibility decisions about others, or to discriminate on the basis of race, color, national origin, religion, sex, familial status, disability, or any other class protected by fair-housing or civil-rights laws;</li>
            <li>scrape, spider, crawl, or use automated means to extract data or generated content from the Service;</li>
            <li>reverse engineer, decompile, disassemble, or attempt to derive the source code, prompts, model configuration, or proprietary scoring logic of the Service;</li>
            <li>probe, scan, or test the vulnerability of the Service or bypass any security or authentication mechanism;</li>
            <li>interfere with, disrupt, overload, or degrade the Service or any user's use of it;</li>
            <li>upload viruses, malware, or any other harmful code;</li>
            <li>impersonate any person or entity or misrepresent your affiliation with any person or entity;</li>
            <li>resell reports, generated content, or access to the Service, or operate an investment-advisory, brokerage, or similar service for third parties through a consumer account;</li>
            <li>use the Service to provide advice to another person for compensation without holding any professional license required for that activity in the relevant jurisdiction;</li>
            <li>remove, obscure, or alter any proprietary notices or disclaimers displayed on or with the Service.</li>
          </ul>
          <p style={getTextStyle()}>
            We may investigate suspected violations of this Section and take
            appropriate action, including suspending or terminating your
            access to the Service.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>14. Suspension and Termination</h2>
          <p style={getTextStyle()}>
            You may stop using the Service at any time. You may request
            deletion of your account by emailing{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>.
          </p>
          <p style={getTextStyle()}>
            We may suspend or terminate your access to the Service at any
            time, with or without notice, if we reasonably believe you have
            violated these Terms, if we are required to do so by law, or if
            continuing to provide the Service to you would create a legal,
            security, or operational risk. We may also discontinue the
            Service in whole or in part.
          </p>
          <p style={getTextStyle()}>
            If we terminate your account for a reason other than your
            material breach of these Terms, we will refund the portion of any
            paid property unlock that is unused when the termination takes
            effect, on a pro-rata basis relative to the 180-day access window.
          </p>
          <p style={getTextStyle()}>
            Sections that by their nature should survive termination —
            including Sections 4 (License), 7 (Information You Provide), 9
            through 12 (disclaimers and assumption of risk), 15 (Feedback and
            Ideas), 16 (Disclaimer of Warranties), 17 (Limitation of
            Liability), 18 (Indemnification), 19 through 24 (dispute
            resolution and governing law), and 26 through 28 (miscellaneous)
            — will survive termination.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>15. Feedback and Ideas</h2>
          <p style={getTextStyle()}>
            If you send us feedback, suggestions, feature requests, or ideas
            about the Service, you grant REanalyzr a perpetual, irrevocable,
            worldwide, royalty-free, sublicensable license to use, modify,
            and incorporate that feedback into the Service and any other
            REanalyzr product, without obligation to you.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>16. Disclaimer of Warranties</h2>
          <p style={getTextStyle()}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND ALL DATA,
            CALCULATIONS, SCORES, PROJECTIONS, REPORTS, ARTIFICIAL-INTELLIGENCE
            OUTPUTS AND OTHER CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE,"
            WITH ALL FAULTS AND WITHOUT WARRANTIES OF ANY KIND.
          </p>
          <p style={getTextStyle()}>
            REANALYZR DISCLAIMS ALL EXPRESS, IMPLIED AND STATUTORY WARRANTIES,
            INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, COMPLETENESS, QUIET
            ENJOYMENT, SYSTEM INTEGRATION AND RESULTS. REANALYZR DOES NOT
            WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE OR
            ERROR-FREE; THAT DEFECTS WILL BE CORRECTED; THAT ANY DATA OR
            OUTPUT WILL BE CURRENT OR ACCURATE; OR THAT USE OF THE SERVICE
            WILL PRODUCE ANY PARTICULAR FINANCIAL, INVESTMENT OR TRANSACTION
            RESULT.
          </p>
          <p style={getTextStyle()}>
            Some jurisdictions do not allow certain warranty exclusions, so
            some exclusions may not apply to you.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>17. Limitation of Liability</h2>
          <p style={getTextStyle()}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, REANALYZR AND ITS
            AFFILIATES, SERVICE PROVIDERS, LICENSORS, MANAGERS, MEMBERS,
            OFFICERS, EMPLOYEES AND AGENTS WILL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR
            PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, SAVINGS,
            OPPORTUNITY, GOODWILL, DATA, USE, FINANCING OR INVESTMENT VALUE,
            ARISING FROM OR RELATING TO THE SERVICE, EVEN IF ADVISED THAT
            SUCH DAMAGES WERE POSSIBLE.
          </p>
          <p style={getTextStyle()}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE TOTAL AGGREGATE
            LIABILITY OF REANALYZR AND THE OTHER RELEASED PARTIES FOR ALL
            CLAIMS ARISING FROM OR RELATING TO THE SERVICE OR THESE TERMS
            WILL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO
            REANALYZR DURING THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO
            THE CLAIM; OR (B) $100.
          </p>
          <p style={getTextStyle()}>
            The limitations above do not apply to liability that cannot
            lawfully be excluded or limited. Some jurisdictions do not permit
            certain liability limitations, so portions of this section may
            not apply to you.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>18. Indemnification</h2>
          <p style={getTextStyle()}>
            To the extent permitted by law, you agree to indemnify, defend
            and hold harmless REanalyzr and its affiliates, officers,
            employees, agents, service providers, and licensors from and
            against any third-party claim, demand, loss, liability, damage,
            or expense (including reasonable attorneys' fees) arising out of
            or relating to:
          </p>
          <ul style={getListStyle()}>
            <li>your unlawful use of the Service;</li>
            <li>information you submit to the Service, including any claim that such information infringes or violates another person's rights;</li>
            <li>your violation of these Terms or of any applicable law or regulation;</li>
            <li>your use of the Service to provide services to any third party without required authorization or licensure;</li>
            <li>your fraud, willful misconduct, or gross negligence.</li>
          </ul>
          <p style={getTextStyle()}>
            We will notify you of any claim, allow you to control its
            defense with counsel of your choosing (subject to our reasonable
            approval), and reasonably cooperate. You may not settle any
            claim without our prior written consent if the settlement
            requires REanalyzr to admit liability, pay any amount, or take
            or refrain from any action.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>19. Informal Dispute Resolution</h2>
          <p style={getTextStyle()}>
            Before filing an arbitration or lawsuit, the claimant must send
            the other party a written notice describing the claimant's name
            and contact information, the facts giving rise to the dispute,
            the specific relief requested and a good-faith calculation of any
            monetary demand.
          </p>
          <p style={getTextStyle()}>
            Notices to REanalyzr must be sent to{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>.
            REanalyzr may send a notice to the email address associated with
            your account.
          </p>
          <p style={getTextStyle()}>
            The parties will attempt in good faith to resolve the dispute
            for 30 days after receipt of a complete notice. Any applicable
            limitation period will be tolled during that 30-day period.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>20. Agreement to Individual Arbitration</h2>
          <p style={getTextStyle()}>
            Except for disputes eligible for small claims court and requests
            for relief that applicable law does not permit to be arbitrated,
            you and REanalyzr agree that every dispute, claim or controversy
            arising out of or relating to the Service, these Terms, the
            Privacy Policy or the relationship between you and REanalyzr will
            be resolved by binding individual arbitration rather than in
            court.
          </p>
          <p style={getTextStyle()}>
            This arbitration agreement is governed by the Federal Arbitration
            Act. Arbitration will be administered by the American Arbitration
            Association ("AAA") under its Consumer Arbitration Rules in
            effect when the claim is filed, as modified by these Terms. If
            AAA is unavailable or unwilling to administer the arbitration,
            the parties will select another nationally recognized arbitration
            provider, or a court of competent jurisdiction will appoint one.
          </p>
          <p style={getTextStyle()}>
            The arbitration may be conducted by telephone, videoconference,
            written submissions or an in-person hearing, as permitted by the
            applicable rules. You may elect a hearing in the county where you
            reside unless the arbitrator determines that another location is
            required for fairness. REanalyzr will pay arbitration fees to
            the extent required by the applicable Consumer Arbitration Rules
            or applicable law.
          </p>
          <p style={getTextStyle()}>
            The arbitrator may award any individual remedy that a court could
            award, but may award relief only to the individual claimant and
            only to the extent necessary to resolve that claimant's individual
            claim. Judgment on the award may be entered in any court with
            jurisdiction.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>21. Class-Action and Jury-Trial Waiver</h2>
          <p style={getTextStyle()}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AND REANALYZR AGREE
            THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL
            CAPACITY AND NOT AS A PLAINTIFF, CLASS MEMBER OR REPRESENTATIVE IN
            A CLASS, COLLECTIVE, CONSOLIDATED, COORDINATED, MASS,
            PRIVATE-ATTORNEY-GENERAL OR REPRESENTATIVE ACTION.
          </p>
          <p style={getTextStyle()}>
            Unless both parties agree in writing, an arbitrator may not
            consolidate the claims of more than one person or preside over
            any class, collective, coordinated, mass or representative
            proceeding.
          </p>
          <p style={getTextStyle()}>
            YOU AND REANALYZR EACH WAIVE THE RIGHT TO A TRIAL BY JURY TO THE
            MAXIMUM EXTENT PERMITTED BY LAW.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>22. Small Claims</h2>
          <p style={getTextStyle()}>
            Either party may bring an individual action in a small claims
            court with jurisdiction, provided the action remains individual
            and within that court's authority.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>23. Arbitration Opt-Out</h2>
          <p style={getTextStyle()}>
            You may opt out of the arbitration agreement by sending a written
            notice to{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>{' '}
            within 30 days after the date you first accept these Terms. Your
            notice must include your full name, the email address used for
            your account and an unambiguous statement that you wish to opt
            out of arbitration. Opting out of arbitration will not affect the
            remaining provisions of these Terms.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>24. Governing Law and Court Venue</h2>
          <p style={getTextStyle()}>
            These Terms and any dispute not subject to arbitration are
            governed by the laws of the State of Texas, without regard to
            conflict-of-laws principles, except to the extent federal law
            applies.
          </p>
          <p style={getTextStyle()}>
            Subject to the arbitration and small-claims provisions above,
            you and REanalyzr consent to the exclusive jurisdiction and venue
            of the state courts located in{' '}
            Collin County, Texas,
            and the United States District Court for the Eastern District of
            Texas. Nothing in this provision deprives a consumer of
            protections that cannot lawfully be waived under the law of the
            consumer's residence.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>25. Service Availability</h2>
          <p style={getTextStyle()}>
            REanalyzr is actively developed. The Service may occasionally be
            unavailable, interrupted, or contain bugs or errors; features
            may be modified, added, or removed as the product evolves; and
            the Service may operate slowly during high-traffic periods or
            third-party API outages. We provide no formal uptime, performance,
            or availability guarantees. We strongly recommend exporting the
            PDF of any analysis you rely on for a real transaction so you
            have a permanent record independent of the Service.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>26. Changes to These Terms</h2>
          <p style={getTextStyle()}>
            We may update these Terms from time to time. The "Last updated"
            date at the top of the page reflects the most recent revision.
            Changes apply prospectively only, from the effective date of the
            revised Terms.
          </p>
          <p style={getTextStyle()}>
            For material changes — including changes to dispute resolution,
            arbitration, pricing model, data sharing, or liability — we will
            provide advance notice by email to the address associated with
            your account or by an in-product notice, and where required, we
            will ask you to affirmatively accept the revised Terms before
            you can continue using the Service. Continued use of the Service
            after non-material changes take effect constitutes acceptance of
            those changes.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>27. Miscellaneous</h2>
          <p style={getTextStyle()}>
            <strong>Entire agreement.</strong> These Terms and our{' '}
            <Link to="/privacy" style={getLinkStyle()}>Privacy Policy</Link>{' '}
            are the entire agreement between you and REanalyzr concerning the
            Service and supersede any prior agreement on the same subject.
          </p>
          <p style={getTextStyle()}>
            <strong>Severability.</strong> If any provision of these Terms is
            held invalid or unenforceable, the remaining provisions will
            remain in full force and effect, and the invalid provision will
            be modified only to the extent necessary to make it enforceable.
          </p>
          <p style={getTextStyle()}>
            <strong>No waiver.</strong> Our failure to enforce any provision
            of these Terms is not a waiver of that provision or of our right
            to enforce it later.
          </p>
          <p style={getTextStyle()}>
            <strong>Assignment.</strong> You may not assign or transfer these
            Terms or any of your rights or obligations under them without our
            prior written consent. We may assign these Terms without your
            consent in connection with a merger, acquisition, financing,
            reorganization, or sale of assets.
          </p>
          <p style={getTextStyle()}>
            <strong>No agency.</strong> Nothing in these Terms creates any
            agency, partnership, joint venture, employment, or franchise
            relationship between you and REanalyzr.
          </p>
          <p style={getTextStyle()}>
            <strong>Force majeure.</strong> Neither party will be liable for
            failure or delay in performance caused by events beyond
            reasonable control, including acts of nature, labor disputes,
            infrastructure failures, cyberattacks, third-party service
            outages, or governmental action.
          </p>
          <p style={getTextStyle()}>
            <strong>Electronic communications.</strong> You consent to
            receive communications from us electronically, including notices
            required by these Terms. Electronic communications satisfy any
            legal requirement that such communications be in writing.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>28. Contact</h2>
          <p style={getTextStyle()}>
            PVA Ventures LLC
            <br />
            Email:{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>
            <br />
            Contact form:{' '}
            <Link to="/contact" style={getLinkStyle()}>reanalyzr.com/contact</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
