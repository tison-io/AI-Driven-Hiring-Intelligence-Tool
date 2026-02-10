import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="January 2025"
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          These Terms of Use (“Terms”) govern your access to and use of the <strong>TalentScan AI</strong> platform and related services (collectively, the “Service”).
          By accessing and using TalentScan AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of Service">
        <p>
          TalentScan AI is a web-based artificial intelligence platform designed to assist recruitment and talent evaluation workflows.
          The service analyzes resumes, LinkedIn profiles, and other permission-based data to generate:
        </p>
        <ol className='pl-5 '>
          <li>Structured candidate summaries</li>
          <li>Skills and Experience inferences</li>
          <li><strong>Role-Fit Scores (0 - 100) </strong></li>
          <li>Bias and Fairness indicators</li>
          <li>Hiring intelligence reports</li>
        </ol>
        <p>These outputs are intended <strong>solely as decision-support tools</strong> and do not replace human judgement in recruitment or employment decisions</p>
      </LegalSection>

      <LegalSection title="3. User Roles and Accounts">
        <p>
          You are responsible for:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
          <li>Providing accurate and up-to-date information</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Permitted Use and Restrictions">
        {/* todo: update the details of this section */}
        <p>
          You agree not to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the platform for any unlawful purpose</li>
          <li>Upload malicious code or attempt to breach security</li>
          <li>Reverse engineer or copy our AI models</li>
          <li>Share your account with unauthorized users</li>
          <li>Use the platform to discriminate against candidates</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Intellectual Property">
        <p>
          All content, features, and functionality of TalentScan AI are owned
          by us and protected by copyright, trademark, and other intellectual
          property laws. You retain ownership of the data you upload.
        </p>
      </LegalSection>

      <LegalSection title="6. AI Evaluations and Disclaimers">
        <p>
          TalentScan AI is provided "as is" without warranties of any kind.
          While we strive for accuracy, AI-generated insights should be used
          as one factor in hiring decisions, not the sole determining factor.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of Liability">
        <p>
          We shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of the platform. Our
          total liability shall not exceed the amount you paid for the service.
        </p>
      </LegalSection>

      <LegalSection title="8. Termination">
        <p>
          We reserve the right to suspend or terminate your account if you
          violate these terms. You may terminate your account at any time
          through your account settings.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to Terms">
        <p>
          We may update these Terms of Service from time to time. We will
          notify you of significant changes via email or platform notification.
          Continued use after changes constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>
          For questions about these Terms of Service, please contact us at:
        </p>
        <p className="font-medium">
          <strong>TalentScan AI</strong> <br />
          Email: inquiries@scanai.com
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
