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

  return (
    <div style={getContainerStyle()}>
      <div style={getContentStyle()}>
        <Link to="/register" style={getBackLinkStyle()}>
          ← Back to Registration
        </Link>

        <div style={getHeaderStyle()}>
          <h1 style={getTitleStyle()}>Terms of Service</h1>
          <p style={getSubtitleStyle()}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>1. Acceptance of Terms</h2>
          <p style={getTextStyle()}>
            By accessing and using REanalyzr ("the Service"), you accept and agree to be bound by the terms and
            provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>2. Use License</h2>
          <p style={getTextStyle()}>
            Permission is granted to temporarily download one copy of REanalyzr per device for personal,
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul style={getListStyle()}>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose or for any public display;</li>
            <li>attempt to reverse engineer any software contained on REanalyzr;</li>
            <li>remove any copyright or other proprietary notations from the materials.</li>
          </ul>
          <p style={getTextStyle()}>
            This license shall automatically terminate if you violate any of these restrictions and may be terminated
            by REanalyzr at any time. Upon terminating your viewing of these materials or upon the termination of this
            license, you must destroy any downloaded materials in your possession whether in electronic or printed format.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>3. Disclaimer</h2>
          <p style={getTextStyle()}>
            The materials on REanalyzr are provided on an 'as is' basis. REanalyzr makes no warranties, expressed or implied,
            and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions
            of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <p style={getTextStyle()}>
            Further, REanalyzr does not warrant or make any representations concerning the accuracy, likely results, or reliability
            of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>4. Limitations</h2>
          <p style={getTextStyle()}>
            In no event shall REanalyzr or its suppliers be liable for any damages (including, without limitation, damages for loss of
            data or profit, or due to business interruption) arising out of the use or inability to use the materials on REanalyzr,
            even if REanalyzr or a REanalyzr authorized representative has been notified orally or in writing of the possibility of such damage.
            Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or
            incidental damages, these limitations may not apply to you.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>5. Accuracy of Materials</h2>
          <p style={getTextStyle()}>
            The materials appearing on REanalyzr could include technical, typographical, or photographic errors. REanalyzr does not
            warrant that any of the materials on its website are accurate, complete or current. REanalyzr may make changes to the
            materials contained on its website at any time without notice. However REanalyzr does not make any commitment to update the materials.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>6. Links</h2>
          <p style={getTextStyle()}>
            REanalyzr has not reviewed all of the sites linked to our website and is not responsible for the contents of any such
            linked site. The inclusion of any link does not imply endorsement by REanalyzr of the site. Use of any such linked
            website is at the user's own risk.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>7. Modifications</h2>
          <p style={getTextStyle()}>
            REanalyzr may revise these terms of service for its website at any time without notice. By using this website,
            you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>8. Governing Law</h2>
          <p style={getTextStyle()}>
            These terms and conditions are governed by and construed in accordance with the laws of Texas, United States,
            and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>9. Privacy Policy</h2>
          <p style={getTextStyle()}>
            Your privacy is important to us. Our <Link to="/privacy" style={{ color: '#0071E3', textDecoration: 'underline' }}>Privacy Policy</Link> explains how we collect, use, and protect your information
            when you use our Service.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>10. Investment Analysis Disclaimer</h2>
          <p style={getTextStyle()}>
            <strong>IMPORTANT: REanalyzr IS NOT PROVIDING FINANCIAL, INVESTMENT, TAX, OR LEGAL ADVICE.</strong>
          </p>
          <p style={getTextStyle()}>
            REanalyzr provides educational property analysis tools and calculators only. All analysis results, calculations,
            projections, and recommendations are estimates based on user-provided data, third-party market data, and algorithmic
            models. These tools are designed for informational and educational purposes only.
          </p>
          <p style={getTextStyle()}>
            <strong>You acknowledge and agree that:</strong>
          </p>
          <ul style={getListStyle()}>
            <li>No content on REanalyzr constitutes professional financial, investment, tax, legal, or real estate advice;</li>
            <li>Past performance and historical data do not guarantee future results;</li>
            <li>Real estate investments carry inherent risks including market volatility, property damage, vacancy, and total loss;</li>
            <li>You must conduct independent due diligence and consult qualified professionals before making investment decisions;</li>
            <li>REanalyzr is not a licensed investment advisor, broker-dealer, or real estate professional;</li>
            <li>Market data and calculations may contain errors, omissions, or become outdated;</li>
            <li>Local regulations, tax laws, and market conditions vary significantly and may not be reflected in our analysis.</li>
          </ul>
          <p style={getTextStyle()}>
            You assume all responsibility for investment decisions made using REanalyzr's tools and analysis.
          </p>
          <p style={getTextStyle()}>
            <strong>EXPLICIT USER ACKNOWLEDGMENT:</strong> By using this Service, you explicitly acknowledge and agree that:
          </p>
          <ul style={getListStyle()}>
            <li>You are solely responsible for all investment decisions, including financial losses;</li>
            <li>REanalyzr provides educational tools only, not investment recommendations;</li>
            <li>You will not hold REanalyzr liable for any investment outcomes, positive or negative;</li>
            <li>You understand that real estate investments carry significant risks including total loss of capital;</li>
            <li>You will consult qualified professionals (financial advisors, CPAs, attorneys, real estate agents) before making investment decisions.</li>
          </ul>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>11. Financial Calculation Disclaimer</h2>
          <p style={getTextStyle()}>
            <strong>CALCULATION ACCURACY AND LIMITATIONS:</strong>
          </p>
          <p style={getTextStyle()}>
            REanalyzr uses industry-standard financial formulas for calculations including NOI, Cap Rate, IRR, Cash-on-Cash Return,
            DSCR, and other metrics. However, you acknowledge the following limitations:
          </p>
          <ul style={getListStyle()}>
            <li><strong>Input Dependency:</strong> All calculations depend on the accuracy of data you provide. Incorrect inputs produce incorrect results;</li>
            <li><strong>Market Assumptions:</strong> Calculations use market data and assumptions that may not reflect actual future conditions;</li>
            <li><strong>Tax Calculations:</strong> Tax estimates are educational only. Actual tax liability depends on your specific tax situation, which we cannot assess;</li>
            <li><strong>Projection Uncertainty:</strong> Long-term projections (5, 10, 20+ years) are estimates based on assumptions that may not materialize;</li>
            <li><strong>Calculation Errors:</strong> While we strive for accuracy, calculation errors may occur due to software bugs or data issues;</li>
            <li><strong>No Guarantee:</strong> We provide no guarantee that our calculations match actual investment performance;</li>
            <li><strong>Third-Party Verification:</strong> You must verify all calculations with qualified professionals (CPA, financial advisor) before making investment decisions.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>TAX CALCULATIONS SPECIFICALLY:</strong> Tax calculations provided are for educational purposes only. Actual tax
            liability depends on your individual tax situation, filing status, state of residence, entity structure, and other factors
            we cannot assess. Always consult a licensed CPA or tax professional for actual tax advice.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>12. Deal Quality Score and Walk-Away Price Disclaimer</h2>
          <p style={getTextStyle()}>
            <strong>ALGORITHMIC ANALYSIS:</strong>
          </p>
          <p style={getTextStyle()}>
            REanalyzr generates a Deal Quality Score (0&ndash;100 with contextual labels) and a calculated "walk-away price"
            for each property, based on the inputs you provide and third-party market data. You explicitly acknowledge:
          </p>
          <ul style={getListStyle()}>
            <li><strong>Algorithmic Nature:</strong> The Deal Quality Score and walk-away price are produced by algorithms operating on your inputs, not by human real estate professionals;</li>
            <li><strong>Not Professional Advice:</strong> The score is an analytical read on a property's numbers, not investment advice, and not a recommendation to buy, sell, or hold;</li>
            <li><strong>Walk-Away Price Limitations:</strong> Calculated walk-away prices are estimates. Actual property value depends on condition, comps, local market timing, and factors the algorithm cannot see;</li>
            <li><strong>Market Variations:</strong> Real estate markets vary by micro-location, property condition, and timing. Algorithmic analysis cannot account for every factor;</li>
            <li><strong>Professional Appraisal Required:</strong> Always obtain a professional appraisal, inspection, and legal review before purchasing property. Never rely solely on algorithmic valuations;</li>
            <li><strong>No Guarantee of Returns:</strong> A high Deal Quality Score does not guarantee profitable investment. A low score does not guarantee the investment will lose money;</li>
            <li><strong>Score Bands Are Analytical, Not Directive:</strong> Score ranges (color-coded) reflect where a property sits relative to institutional underwriting standards, not what you should do about it;</li>
            <li><strong>Deal Negotiation:</strong> Walk-away prices are starting points for negotiation, not firm valuations;</li>
            <li><strong>User Due Diligence:</strong> You must conduct independent property inspection, title search, market research, and legal review.</li>
          </ul>
          <p style={getTextStyle()}>
            The Deal Quality Score and walk-away price are educational tools to inform your thinking, not directives to follow.
            Final investment decisions must be made with qualified professionals considering your specific financial situation and goals.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>13. Third-Party Data Sources and Liability</h2>
          <p style={getTextStyle()}>
            <strong>THIRD-PARTY DATA INTEGRATION:</strong>
          </p>
          <p style={getTextStyle()}>
            REanalyzr integrates data from multiple third-party providers to enhance analysis. You acknowledge and accept
            the following regarding third-party data:
          </p>
          <ul style={getListStyle()}>
            <li><strong>FRED API (Federal Reserve):</strong> Economic data including mortgage rates, inflation, unemployment. May be outdated or revised after publication;</li>
            <li><strong>RentCast API:</strong> Rental estimates and comparable properties. Estimates may not reflect actual market rents or property values;</li>
            <li><strong>Census API:</strong> Demographic and housing statistics. Data is historical and may not reflect current conditions;</li>
            <li><strong>OpenAI API:</strong> AI-generated insights and recommendations. Subject to limitations described in Section 11;</li>
            <li><strong>Third-Party Accuracy:</strong> We do not control third-party data accuracy, completeness, or timeliness;</li>
            <li><strong>Data Errors:</strong> Third-party data may contain errors, omissions, or become outdated without notice;</li>
            <li><strong>No Liability for Third-Party Errors:</strong> REanalyzr is not responsible for errors, omissions, or consequences resulting from third-party data inaccuracies;</li>
            <li><strong>Data Availability:</strong> Third-party services may become unavailable, causing temporary analysis limitations;</li>
            <li><strong>Independent Verification:</strong> You must independently verify all data from third-party sources before making investment decisions.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>SPECIFIC DISCLAIMERS:</strong> RentCast rent estimates are algorithmic predictions, not actual market rents.
            Always verify rental income potential with local property managers and comparable rental listings. Census demographic
            data is historical; verify current market conditions independently.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>14. AI-Generated Content and Limitations</h2>
          <p style={getTextStyle()}>
            REanalyzr incorporates artificial intelligence (AI) and machine learning technologies to enhance analysis and provide
            market insights. You acknowledge and understand the following regarding AI-generated content:
          </p>
          <ul style={getListStyle()}>
            <li><strong>Algorithmic Nature:</strong> AI insights are generated by algorithms and may not reflect human judgment or expertise;</li>
            <li><strong>Data Dependencies:</strong> AI outputs depend on training data quality and may perpetuate historical biases;</li>
            <li><strong>Error Potential:</strong> AI-generated content may contain factual errors, logical inconsistencies, or outdated information;</li>
            <li><strong>No Warranty:</strong> We provide no warranty regarding accuracy, completeness, or reliability of AI-generated insights;</li>
            <li><strong>User Responsibility:</strong> You must independently verify all AI recommendations and analysis;</li>
            <li><strong>Continuous Learning:</strong> Our AI models are continuously updated, and outputs may change over time.</li>
          </ul>
          <p style={getTextStyle()}>
            Never rely solely on AI-generated content for investment decisions. Always consult qualified professionals and
            conduct independent research.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>15. Service Availability and Ongoing Development</h2>
          <p style={getTextStyle()}>
            REanalyzr is actively developed. By using our Service, you acknowledge and accept:
          </p>
          <ul style={getListStyle()}>
            <li><strong>Service Availability:</strong> The Service may occasionally be unavailable, interrupted, or contain bugs and errors;</li>
            <li><strong>Feature Changes:</strong> Features may be modified, added, or removed as the product evolves;</li>
            <li><strong>Performance Variation:</strong> The Service may operate slowly during high-traffic periods or third-party API outages;</li>
            <li><strong>Support Response Time:</strong> Support responses target one business day; priority is given to broken paid analyses and billing issues;</li>
            <li><strong>No Service Level Agreement:</strong> We provide no formal uptime, performance, or availability guarantees;</li>
            <li><strong>Data Backup Best Practice:</strong> We strongly recommend exporting the PDF of any analysis you rely on for a real transaction, so you have a permanent record independent of our Service.</li>
          </ul>
          <p style={getTextStyle()}>
            REanalyzr is a research and screening tool. Regardless of Service maturity, always obtain
            professional verification (appraisal, inspection, CPA review, legal review) before executing
            an investment decision.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>16. Pricing and Billing</h2>
          <p style={getTextStyle()}>
            <strong>Pay-Per-Deal Model:</strong> REanalyzr uses a pay-per-deal pricing model. You do not
            need a subscription to use the Service.
          </p>
          <ul style={getListStyle()}>
            <li><strong>Signup:</strong> Free. No credit card required.</li>
            <li><strong>First analysis:</strong> Included at no cost after signup.</li>
            <li><strong>Additional deals:</strong> $4.99 per property, one-time charge.</li>
            <li><strong>Access window:</strong> Each $4.99 unlock grants 180 days of unlimited chat, the full deal workspace, and PDF export for that property.</li>
            <li><strong>No subscription:</strong> There is no recurring monthly or annual fee, no auto-renewal, and no free trial to opt out of.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>Billing and Payments:</strong>
          </p>
          <ul style={getListStyle()}>
            <li><strong>Payment Processing:</strong> Payments are processed by Stripe. Your card details are handled by Stripe and never stored on our servers.</li>
            <li><strong>Currency:</strong> Prices are shown in U.S. dollars. Non-USD payment methods are converted by Stripe at their published rates.</li>
            <li><strong>Taxes:</strong> Any applicable sales tax is added at checkout and shown before you confirm payment.</li>
            <li><strong>Failed Payments:</strong> If a payment fails, the deal unlock does not activate. No pending charges are created.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>Refunds:</strong>
          </p>
          <ul style={getListStyle()}>
            <li>If a deal analysis is broken (numbers don't reconcile, workspace fails to load, agent misinterprets the property), email <a href="mailto:support@reanalyzr.com">support@reanalyzr.com</a> and we'll refund the $4.99 within one business day.</li>
            <li>Refunds are handled on a case-by-case basis via email. There is no in-app refund flow.</li>
            <li>After the 180-day access window closes, the deal remains in your Saved Properties as read-only. Re-unlocking the same property for fresh edits costs another $4.99 for a new 180-day window.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>Price Changes:</strong> We may update the $4.99 per-deal price with 30 days advance
            notice, communicated via email or in-product notification. Deals already unlocked at the old
            price keep their 180-day access at no additional cost.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>17. Data Privacy and Third-Party Services</h2>
          <p style={getTextStyle()}>
            REanalyzr integrates with third-party data providers to enhance our analysis capabilities:
          </p>
          <ul style={getListStyle()}>
            <li><strong>FRED API:</strong> Economic data from the Federal Reserve Economic Data service;</li>
            <li><strong>RentCast API:</strong> Property rental estimates and comparable property data;</li>
            <li><strong>Census API:</strong> Demographic and housing statistics;</li>
            <li><strong>OpenAI API:</strong> Artificial intelligence processing for enhanced insights.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>Data Handling:</strong>
          </p>
          <ul style={getListStyle()}>
            <li>We may share aggregated, non-personal data with third-party providers;</li>
            <li>Property addresses and financial data may be processed by third-party APIs;</li>
            <li>We implement reasonable security measures but cannot guarantee absolute security;</li>
            <li>Data breaches will be reported in accordance with applicable law;</li>
            <li>You retain ownership of data you input into the Service.</li>
          </ul>
          <p style={getTextStyle()}>
            Our <Link to="/privacy" style={{ color: '#0071E3', textDecoration: 'underline' }}>Privacy Policy</Link> provides detailed information about data collection, use, and protection.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>18. Professional Liability and Indemnification</h2>
          <p style={getTextStyle()}>
            <strong>Limitation of Professional Liability:</strong>
          </p>
          <ul style={getListStyle()}>
            <li>REanalyzr is not licensed as an investment advisor, broker-dealer, or real estate professional;</li>
            <li>We provide software tools, not professional services;</li>
            <li>No attorney-client, advisor-client, or professional relationship is created;</li>
            <li>We assume no fiduciary duty to users;</li>
            <li>Professional licensing requirements vary by jurisdiction and are the user's responsibility.</li>
          </ul>
          <p style={getTextStyle()}>
            <strong>User Indemnification:</strong> You agree to indemnify and hold harmless REanalyzr, its officers,
            directors, employees, and agents from any claims, damages, losses, or expenses arising from:
          </p>
          <ul style={getListStyle()}>
            <li>Your use of the Service or reliance on analysis results;</li>
            <li>Investment decisions made using our tools;</li>
            <li>Violation of these Terms of Service;</li>
            <li>Infringement of third-party rights;</li>
            <li>Regulatory violations in your jurisdiction.</li>
          </ul>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>19. Regulatory Compliance and Geographic Restrictions</h2>
          <p style={getTextStyle()}>
            <strong>Geographic Limitations:</strong> REanalyzr is intended for use in the United States only.
            Use outside the United States may violate local laws and is at your own risk.
          </p>
          <p style={getTextStyle()}>
            <strong>Professional Licensing:</strong> If you are a licensed real estate professional, investment advisor,
            or other regulated professional, you are responsible for ensuring your use of REanalyzr complies with
            applicable professional standards and regulations.
          </p>
          <p style={getTextStyle()}>
            <strong>Securities Law Compliance:</strong> REanalyzr does not provide investment advice as defined by
            securities laws. Users who provide advice to others using our tools must comply with applicable
            investment advisor registration requirements.
          </p>
        </div>

        <div style={getSectionStyle()}>
          <h2 style={getSectionTitleStyle()}>20. Contact Information</h2>
          <p style={getTextStyle()}>
            If you have any questions about these Terms of Service, please contact us at <a href="mailto:support@reanalyzr.com">support@reanalyzr.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;