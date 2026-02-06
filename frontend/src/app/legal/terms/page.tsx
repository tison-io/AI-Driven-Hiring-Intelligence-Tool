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
          By accessing and using TalentScan AI, you agree to be bound by these
          Terms of Service. If you do not agree to these terms, please do not
          use our platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of Service">
        <p>
          TalentScan AI provides AI-powered recruitment intelligence services,
          including candidate evaluation, resume analysis, and bias detection.
          Our platform is designed to assist recruiters in making informed,
          unbiased hiring decisions.
        </p>
      </LegalSection>

      <LegalSection title="3. User Accounts">
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

      <LegalSection title="4. Acceptable Use">
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

      <LegalSection title="6. Disclaimers">
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
          Email: legal@talentscanai.com
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
