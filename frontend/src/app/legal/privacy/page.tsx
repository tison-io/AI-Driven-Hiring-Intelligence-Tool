import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="January 2025"
    >
      <LegalSection title="">
        <p>
        This Privacy Policy explains how <strong>TalentScan AI</strong> (“we,” “us,” or “our”) collects, uses, discloses, and safeguards personal information when you access or use our AI-powered recruitment and hiring intelligence platform (the “Service”). <br></br>
        By using the Service, you acknowledge that you have read and understood this Privacy Policy.

        </p>
      </LegalSection>
      <LegalSection title="1. Scope and User Definitions">
        <p>
        This Privacy Policy applies to all individuals interacting with the Service, including:
        </p>
         <ul className='pt-1 pl-5'>
          <li><strong>Candidates:</strong> Individuals whose resumes are uploaded or whose proffesional data is accessed for evaluation.</li>
          <li><strong>Recriuters:</strong> Hiring managers, HR professionals, or authorized personnel who upload candidate information and access analytical insights.</li>
          <li><strong>Administrators:</strong> Authorized personnel responsible for platform operations, maintenance, compliance, and security oversight.</li>
         </ul>
        
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <h6>
        We collect information only from <strong>lawful, ethical, and permission-based sources</strong> necessary to provide the Service.
        </h6>
        <ol className='list-item pl-3 spac-y-2'>
          <li className='pb-2'>
            <h6><strong>a. Information Provided by Users</strong></h6>
            <p className='pl-2'>
              1. Resume files and supporting documents (PDF, DOCX, or supported formats)<br></br>
              2. Candidate contract or professional details submitted through the platform
            </p>
          </li>
          <li className='pb-2'>
            <h6><strong>b. Public Professional Information</strong></h6>
            <p className='pl-2'>
              Data from publicly accessible proffesional profile URLs (e.g., LinkedIn) where legally permissible and authorized.
            </p>
          </li>
          <li className='pb-2'>
            <h6><strong>c. System-Generated Information</strong></h6>
            <p className='pl-2'>
              AI-derived analytics such as:
              <br></br>
              <span className='pl-5'>1. Role Fit Score (0 - 100)</span><br></br>
              <span className='pl-5'>2. Skill inferences and experience summaries</span><br></br>
              <span className='pl-5'>3. Strengths and potential gaps</span><br></br>
              <span className='pl-5'>4. Bias detection indicators and confidence levels</span><br></br>
            </p>
          </li>
          <li className='pb-2'>
            <h6><strong>d. Technical and Usage Data</strong></h6>
            <p className='pl-2 '>
              Log files, timestamps, and access records<br></br>
              Authentication and session metadata<br></br>
              Audit records related to veiwing, exporting, or deleting personal data
            </p>
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="3. How We Use Information">
        <p>
          We process information solely for legitimate recruitment and platform-operation purposes, including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Evaluating candidate suitability for specific job roles using AI-assisted analysis</li>
          <li>Identifying skill gaps and providing improvement insights</li>
          <li>Supporting fair and objective hiring by detecting potential bias signals</li>
          <li>Generating <strong>Hiring Intelligence Reports</strong> for authorized recruiters</li>
          <li>Maintaining platform security, integrity, and compliance</li>
        </ul>
        <p>
          We <strong>do not sell, rent, or share personal data</strong> with third parties for marketing purposes.
        </p>
      </LegalSection>

      <LegalSection title="4. Legal Basis for Processing (Where Applicable)">
        <p>
          Depending on jurisdiction, we process personal data based on
        </p>
        <ul className='pl-2'>
          <li><strong>User consent</strong></li>
          <li><strong>Legitimate interest</strong> in recruitment optimization and fraud pevention</li>
          <li><strong>Contractual necessity</strong> to provide the service</li>
          <li><strong>Legal obligations</strong> under applicable laws</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data Storage and Security">
        <p>
          We implement <strong>industry-standard technical and organisational safeguards</strong> to protect personal data.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Authentication & Access</li>
          <li>Secure Storage</li>
          <li>Monitoring & Auditability</li>
        </ul>
        <p>Despite these measures, <strong>no system can guarantee absolute security</strong></p>
      </LegalSection>

      <LegalSection title="6. Data Retention and Deletion Rights">
        <h3 className='font-semibold'>Retention</h3>
        <p className='pt-0 mt-0 line'>
          We retain candidate data for as long as necessary to provide our
          services and comply with legal obligations. You can request deletion
          of your data at any time through your account settings.
        </p>

        <h3 className='pb-0 font-semibold'>Right to Deletion("Right to be Forgotten")</h3>
        <p>
          Authorized users or data subjects may request <strong>permanent deletion</strong> of personal data. <br></br>
          Upon valid request, we will perform a <strong>hard delete</strong> removing: <br></br>
            <span className='pl-5'>Resume files</span> <br />
            <span className='pl-5'>Structured candidate data</span> <br />
            <span className='pl-5'>Associated identifiers</span> <br />
          except where retention is legally required.
        </p>
      </LegalSection>

      <LegalSection title="7. Fairness, Ethical AI, and Transparency">
        <p>
          TalentScan AI incorporates safeguards to support <strong>responsible AI-assisted hiring:</strong>:
        </p>
        <ol className='pl-5'>
          <li><strong>Bias Detection:</strong> Our AI flags potential bias indicators in candidate profiles or hiring patterns.</li>
          <li><strong>Explainable Insights:</strong> All AI-generated scores and recommendations come with detailed explanations.</li>
          <li><strong>Ethical Compliance:</strong> We adhere to ethical AI principles and do not use data in ways that could cause harm.</li>
        </ol>
        <p>
          AI output are <strong>advisory only</strong> and must not be the sole basis for employment desicions.
        </p>
      </LegalSection>
      <LegalSection title="8. Cookies and Tracking Technologies">
        <p>
          We use essential cookies and sinilar technologies to:
          <br></br>
          <span className='pl-5'>1. Ensure secure authentication </span> <br></br>
          <span className='pl-5'>2. Maintain session state</span> <br></br>
          <span className='pl-5'>3. Enable platform functionality</span> <br></br>
          <span className='pl-5'>4. Analyze usage trends (non-personal)</span> <br></br>
          We do <strong>not use advertising or third-party tracking cookies</strong> within the service
        </p>
      </LegalSection>
      <LegalSection title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. Significant changes will be communicated via email or platform notifications. 

        </p>
      </LegalSection>
      <LegalSection title="10. Contact Us">
        <p>
          For questions about this Privacy Policy or data processing practices, contact us at:
        </p>
        <p className='pl-5'>
          <strong>TalentScan AI</strong> <br></br>
          <strong>Email:</strong> legal@talentscan.ai
        </p>
      </LegalSection>

    </LegalLayout>
  );
}
