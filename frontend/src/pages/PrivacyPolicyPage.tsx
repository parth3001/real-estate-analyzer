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

  return (
    <div style={getContainerStyle()}>
      <div style={getContentStyle()}>
        <div style={getHeaderStyle()}>
          <h1 style={getTitleStyle()}>Privacy Policy</h1>
          <p style={getSubtitleStyle()}>Last updated: April 27, 2026</p>
        </div>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>1. Introduction</h2>
          <p style={getTextStyle()}>
            REanalyzr ("we," "us," or "our") provides a real estate investment analysis platform. This
            Privacy Policy explains what information we collect when you use REanalyzr, how we use it,
            who we share it with, and the choices you have. By using REanalyzr you agree to the practices
            described here.
          </p>
          <p style={getTextStyle()}>
            This policy works alongside our{' '}
            <Link to="/terms" style={getLinkStyle()}>Terms of Service</Link>.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>2. Information We Collect</h2>
          <p style={getTextStyle()}><strong>Account information.</strong> When you sign up we collect
          your email address (used for magic-link authentication) and any profile details you provide.
          We do not use passwords.</p>

          <p style={getTextStyle()}><strong>Property analysis inputs.</strong> When you analyze a deal,
          you provide property details such as address, purchase price, financing terms, rental income
          estimates, and operating expenses. This data is stored in your account so you can revisit and
          compare deals over time.</p>

          <p style={getTextStyle()}><strong>Pipeline and portfolio data.</strong> If you save analyses
          to your pipeline or add properties to your portfolio, that data is stored in your account.</p>

          <p style={getTextStyle()}><strong>Usage analytics.</strong> We collect information about how
          you interact with REanalyzr, such as pages visited, time spent, clicks, scroll depth, and
          interactions with forms and buttons. See section 5 for details on the analytics tools we use.</p>

          <p style={getTextStyle()}><strong>Technical data.</strong> Like most web services, our servers
          automatically log basic technical information including IP address, browser type, device type,
          and timestamps for security and reliability purposes.</p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>3. How We Use Your Information</h2>
          <ul style={getListStyle()}>
            <li>Provide deal analysis, pipeline tracking, and portfolio impact features</li>
            <li>Generate AI-assisted insights about deals you analyze</li>
            <li>Send transactional emails (magic-link sign-in, account notifications)</li>
            <li>Improve product quality and diagnose UX issues using aggregated analytics</li>
            <li>Detect and prevent abuse, fraud, and security incidents</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p style={getTextStyle()}>
            We do not sell your personal information. We do not use your property analysis data to
            train third-party AI models beyond the per-request use described in section 4.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>4. Third-Party Services</h2>
          <p style={getTextStyle()}>
            REanalyzr uses the following third-party services. Each is bound by its own privacy
            terms. We share only the minimum data required for each service to function.
          </p>

          <p style={getTextStyle()}><strong>Property and market data:</strong> RentCast (property
          details, comparable rentals), Federal Reserve Economic Data / FRED (economic indicators),
          U.S. Census Bureau (demographic data). We send the property address or ZIP code you provide;
          these services do not receive your account information.</p>

          <p style={getTextStyle()}><strong>AI insights:</strong> OpenAI (GPT-4o-mini). When you
          request enhanced AI analysis, we send the property analysis data to OpenAI to generate
          commentary. OpenAI does not use API inputs to train its models per their API data policy.</p>

          <p style={getTextStyle()}><strong>Email delivery:</strong> Resend. Used to send
          magic-link sign-in emails and transactional notifications.</p>

          <p style={getTextStyle()}><strong>Hosting and storage:</strong> Render (application hosting),
          MongoDB Atlas (database).</p>

          <p style={getTextStyle()}><strong>Analytics:</strong> See section 5.</p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>5. Cookies and Tracking</h2>
          <p style={getTextStyle()}>
            We use cookies and similar technologies to keep you signed in, remember preferences,
            and understand how visitors use REanalyzr.
          </p>

          <p style={getTextStyle()}><strong>Google Analytics 4.</strong> Aggregated event tracking
          (page views, conversion funnels). Data is anonymized at the IP level. Subject to{' '}
          <a href="https://policies.google.com/privacy" style={getLinkStyle()} target="_blank" rel="noopener noreferrer">Google's privacy policy</a>.</p>

          <p style={getTextStyle()}><strong>Microsoft Clarity.</strong> Heatmaps, scroll depth, and
          session replay. We configure Clarity in <em>Strict</em> masking mode, which masks the contents
          of all form fields and most text by default; only marketing pages (homepage, blog, sample
          analysis) are unmasked. Property addresses, financial inputs, email addresses, and other
          sensitive data are not visible in Clarity recordings. Subject to{' '}
          <a href="https://privacy.microsoft.com/en-us/privacystatement" style={getLinkStyle()} target="_blank" rel="noopener noreferrer">Microsoft's privacy statement</a>.</p>

          <p style={getTextStyle()}>You can opt out of analytics by using browser settings such as
          "Do Not Track," using a tracker-blocking extension, or disabling JavaScript. The product
          will continue to function without analytics enabled.</p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>6. Data Retention</h2>
          <p style={getTextStyle()}>
            We retain your account data, analyses, pipeline, and portfolio for as long as your
            account is active. If you delete your account, we delete or anonymize associated personal
            data within 30 days, except where retention is required by law (such as financial records
            or fraud prevention).
          </p>
          <p style={getTextStyle()}>
            Aggregated analytics data (with no individual identifiers) may be retained indefinitely
            for product analysis.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>7. Your Rights and Choices</h2>
          <p style={getTextStyle()}>
            Depending on where you live, you may have the right to access, correct, export, or
            delete the personal information we hold about you, and to object to or restrict certain
            processing. To exercise any of these rights, contact us at the address in section 11.
          </p>
          <ul style={getListStyle()}>
            <li><strong>Access and correction:</strong> View and edit your account info from your profile page</li>
            <li><strong>Data export:</strong> Email us to request an export of your saved analyses</li>
            <li><strong>Account deletion:</strong> Email us to request deletion; we'll process within 30 days</li>
            <li><strong>Marketing opt-out:</strong> Use the unsubscribe link in any marketing email</li>
          </ul>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>8. Security</h2>
          <p style={getTextStyle()}>
            We use industry-standard security practices including encryption in transit (HTTPS) and
            at rest, magic-link authentication (no passwords to leak), access controls, and regular
            security reviews. No system is perfectly secure, however, and we cannot guarantee absolute
            security. If we discover a breach affecting your data, we will notify you as required by law.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>9. Children's Privacy</h2>
          <p style={getTextStyle()}>
            REanalyzr is not directed at children under 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data,
            contact us and we will delete it.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>10. Changes to This Policy</h2>
          <p style={getTextStyle()}>
            We may update this Privacy Policy from time to time. The "Last updated" date at the top
            reflects the most recent revision. Material changes will be communicated by email or via
            an in-product notice before they take effect.
          </p>
        </section>

        <section style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>11. Contact Us</h2>
          <p style={getTextStyle()}>
            Questions about this Privacy Policy or how we handle your data? Email us at{' '}
            <a href="mailto:support@reanalyzr.com" style={getLinkStyle()}>support@reanalyzr.com</a>{' '}
            or use our <Link to="/contact" style={getLinkStyle()}>contact form</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
