import React from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

const PrivacyPolicyPage: React.FC = () => {
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
    lineHeight: 1.7,
    color: '#374151',
    paddingLeft: '20px',
    marginBottom: '16px'
  });

  const getLinkStyle = () => ({
    color: '#0071E3',
    textDecoration: 'none'
  });

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
        <div style={getHeaderStyle()}>
          <h1 style={getTitleStyle()}>Privacy Policy</h1>
          <p style={getSubtitleStyle()}>Last updated: July 27, 2026</p>
        </div>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>1. Introduction</h2>
          <p style={getTextStyle()}>
            REanalyzr provides a real estate investment analysis platform. This
            Privacy Policy explains what information we collect when you use
            REanalyzr, how we use it, who we share it with, and the choices you
            have. By using REanalyzr you agree to the practices described here.
          </p>
          <p style={getTextStyle()}>
            This policy works alongside our{' '}
            <Link to="/terms" style={getLinkStyle()}>Terms of Service</Link>.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>2. Eligibility and Geographic Scope</h2>
          <p style={getTextStyle()}>
            REanalyzr is intended for individuals who are at least 18 years old
            and located in the United States. The Service is not directed to
            children, and we do not knowingly collect personal information from
            anyone under 13.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>3. Categories of Information We Collect</h2>
          <p style={getTextStyle()}>We may collect the following categories of information:</p>

          <p style={getTextStyle()}>
            <strong>Account and contact information.</strong> This includes your
            email address, account identifiers, profile information,
            authentication events and communications with us.
          </p>

          <p style={getTextStyle()}>
            <strong>Property and financial-analysis information.</strong> This
            includes property addresses, ZIP codes, purchase prices, financing
            terms, expected rent, operating expenses, renovation assumptions,
            ownership assumptions, saved analyses, pipeline information and
            portfolio information.
          </p>

          <p style={getTextStyle()}>
            <strong>Generated information and inferences.</strong> We generate
            calculations, scores, projections, classifications and AI-assisted
            narrative content based on the information you provide and
            information obtained from third-party sources.
          </p>

          <p style={getTextStyle()}>
            <strong>Payment and transaction information.</strong> Payments are
            processed by Stripe. We do not ordinarily receive or store your
            complete payment-card number. We may receive transaction
            identifiers, payment status, billing country, card type, the last
            four digits of a payment card and fraud-prevention information.
          </p>

          <p style={getTextStyle()}>
            <strong>Device, log and usage information.</strong> We may collect
            IP address, approximate location derived from IP address, browser
            and device type, operating system, referring pages, pages viewed,
            clicks, timestamps, error logs, session information and
            interactions with the Service.
          </p>

          <p style={getTextStyle()}>
            <strong>Cookies and similar technologies.</strong> We and our
            service providers may use cookies, local storage, pixels, software
            development kits and similar technologies for authentication,
            security, preferences, analytics and performance.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>4. How We Use Information</h2>
          <p style={getTextStyle()}>We use personal information to:</p>
          <ul style={getListStyle()}>
            <li>create and secure accounts and deliver magic-link authentication;</li>
            <li>provide calculations, projections, saved analyses, pipeline and portfolio features;</li>
            <li>obtain property and market information requested by the user;</li>
            <li>generate AI-assisted content;</li>
            <li>process payments and refunds;</li>
            <li>provide customer support and transactional communications;</li>
            <li>detect fraud, abuse and security incidents;</li>
            <li>troubleshoot, maintain and improve the Service;</li>
            <li>understand product usage and performance;</li>
            <li>comply with legal obligations and enforce our agreements; and</li>
            <li>create aggregated or de-identified information that does not reasonably identify an individual.</li>
          </ul>
          <p style={getTextStyle()}>
            We will not attempt to reidentify information that we maintain as
            de-identified, except to test whether our de-identification
            processes are effective or as otherwise permitted by law.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>5. How We Disclose Information</h2>
          <p style={getTextStyle()}>
            We may disclose information to service providers and contractors
            that help us operate the Service, including:
          </p>
          <ul style={getListStyle()}>
            <li>property and market-data providers, such as RentCast, FRED and the U.S. Census Bureau;</li>
            <li>artificial-intelligence providers, such as OpenAI;</li>
            <li>payment processors, such as Stripe;</li>
            <li>authentication and email-delivery providers, such as Resend;</li>
            <li>hosting, database and infrastructure providers, such as Render and MongoDB Atlas;</li>
            <li>analytics and session-measurement providers, such as Google Analytics and Microsoft Clarity;</li>
            <li>professional advisers, auditors and insurers; and</li>
            <li>government authorities or other parties when required by law or reasonably necessary to protect rights, safety and security.</li>
          </ul>
          <p style={getTextStyle()}>
            We may also disclose information in connection with a merger,
            financing, acquisition, reorganization, bankruptcy, sale of assets
            or similar corporate transaction.
          </p>
          <p style={getTextStyle()}>
            Our service providers may process information in the United States
            and other locations where they or their subprocessors operate.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>6. AI Processing</h2>
          <p style={getTextStyle()}>
            When an AI-assisted feature is used, we may transmit relevant
            property information, financial assumptions and generated
            calculations to an artificial-intelligence provider to generate a
            response. We seek to avoid sending your account email address to
            the AI provider as part of the analysis prompt.
          </p>
          <p style={getTextStyle()}>
            AI providers may temporarily retain information for security,
            abuse-prevention or service-operation purposes in accordance with
            their contractual terms and policies. We do not authorize
            third-party AI providers to use your property-analysis information
            to train their generally available models unless we separately
            disclose that practice and obtain any consent required by law.
          </p>
          <p style={getTextStyle()}>
            Do not submit Social Security numbers, bank-account credentials,
            payment-card numbers, medical information or other sensitive
            personal information that is not necessary to analyze a property.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>7. Analytics, Cookies and Session Measurement</h2>
          <p style={getTextStyle()}>
            We use analytics technologies to understand use of the Service and
            improve performance. Depending on your settings and the page you
            visit, these technologies may collect device identifiers,
            IP-derived location, page views, clicks, scrolling, referral
            information and interaction information.
          </p>
          <p style={getTextStyle()}>
            We use Google Analytics to measure traffic and product usage. We
            configure our analytics implementation to avoid intentionally
            sending property addresses, email addresses or financial form
            contents as analytics event parameters.
          </p>
          <p style={getTextStyle()}>
            We may use Microsoft Clarity for heatmaps and session measurement.
            We configure masking controls designed to prevent form-field
            contents and designated application information from appearing in
            recordings. Masking technology is not infallible, and we limit
            session measurement on authenticated or sensitive portions of the
            Service where reasonably practicable.
          </p>
          <p style={getTextStyle()}>
            Our Service does not currently respond to the legacy browser "Do
            Not Track" signal, and does not currently detect or process
            opt-out preference signals such as Global Privacy Control. We do
            not use personal information for cross-context behavioral
            advertising, so these signals do not currently change how your
            information is handled. If that changes, we will update this
            Policy and implement the required signal handling.
          </p>
          <p style={getTextStyle()}>
            You may control non-essential analytics through your browser's
            cookie and site-data settings, your browser's private browsing
            mode, or a tracking-blocking extension. We do not currently offer
            an in-product cookie settings panel. Blocking required
            authentication or security technologies may prevent portions of
            the Service from functioning.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>8. Sale and Sharing of Personal Information</h2>
          <p style={getTextStyle()}>
            We do not sell personal information for monetary compensation.
          </p>
          <p style={getTextStyle()}>
            We do not knowingly sell or share personal information of
            individuals under 16.
          </p>
          <p style={getTextStyle()}>
            Certain analytics or advertising technologies may constitute a
            "sale" or "sharing" under some state privacy laws even when no
            money is exchanged. We use analytics providers as service
            providers only, with advertising and cross-site personalization
            features disabled. We do not use personal information for
            cross-context behavioral advertising, and we do not sell or share
            personal information as those terms are defined by the California
            Consumer Privacy Act.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>9. Data Retention</h2>
          <p style={getTextStyle()}>
            We retain information for only as long as reasonably necessary for
            the purposes described in this Policy, including:
          </p>
          <ul style={getListStyle()}>
            <li>account, saved-property, pipeline and portfolio information while your account remains active;</li>
            <li>transaction and refund records for the period required for accounting, tax, fraud-prevention and legal purposes;</li>
            <li>support communications for a reasonable period after the issue is resolved;</li>
            <li>security and authentication logs for a limited period appropriate to security and fraud prevention; and</li>
            <li>analytics information according to the retention settings configured with the applicable provider.</li>
          </ul>
          <p style={getTextStyle()}>
            When you request account deletion, we will generally delete or
            de-identify associated personal information from active systems
            within 30 days, subject to information we must retain for legal,
            security, fraud-prevention, dispute-resolution or accounting
            purposes. Residual copies may remain in encrypted backups until
            they expire through our ordinary backup cycle. If a backup is
            restored, we will take reasonable steps to reapply applicable
            deletion requests.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>10. Security</h2>
          <p style={getTextStyle()}>
            We use industry-standard security practices including encryption
            in transit (HTTPS) and at rest, magic-link authentication (no
            passwords to leak), access controls, and regular security reviews.
            No system is perfectly secure, however, and we cannot guarantee
            absolute security. If we discover a breach affecting your data, we
            will notify you as required by law.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>11. Privacy Rights</h2>
          <p style={getTextStyle()}>
            Depending on your state of residence and whether the applicable
            law applies to REanalyzr, you may have rights to request access
            to, correction of, deletion of or a portable copy of certain
            personal information. You may also have the right to opt out of
            certain targeted advertising, sale, sharing or profiling
            activities and to appeal our response to a request.
          </p>
          <p style={getTextStyle()}>
            You may submit a request by emailing{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>.
            We may need to verify your identity before completing a request.
            We will not discriminate against you for exercising a privacy
            right.
          </p>
          <p style={getTextStyle()}>
            You may use an authorized agent where permitted by law. We may
            request evidence of the agent's authority and may separately
            verify your identity.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>12. California Information</h2>
          <p style={getTextStyle()}>
            California's "Shine the Light" law may permit California residents
            to request information concerning certain disclosures of personal
            information for third parties' direct-marketing purposes. We do
            not disclose personal information to third parties for their own
            direct-marketing purposes in the manner covered by that law.
          </p>
          <p style={getTextStyle()}>
            California residents may also have rights under the California
            Consumer Privacy Act if and when that law applies to REanalyzr.
            Those rights may include the right to know, correct, delete and
            obtain a portable copy of personal information, and to opt out of
            the sale or sharing of personal information. Statutory exceptions
            may apply.
          </p>
          <p style={getTextStyle()}>
            California law requires us to explain how we respond to browser Do
            Not Track signals and whether third parties may collect
            information regarding users' online activities over time and
            across different services. Please see "Analytics, Cookies and
            Session Measurement" above.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>13. Changes to This Policy</h2>
          <p style={getTextStyle()}>
            We may update this Privacy Policy from time to time. The "Last
            updated" date at the top reflects the most recent revision.
            Material changes will be communicated by email or via an
            in-product notice before they take effect.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>14. Contact</h2>
          <p style={getTextStyle()}>
            PVA Ventures LLC
            <br />
            <span style={getTodoStyle()}>[BUSINESS MAILING ADDRESS — TBD]</span>
            <br />
            Email:{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>
            <br />
            Contact form: <Link to="/contact" style={getLinkStyle()}>reanalyzr.com/contact</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
