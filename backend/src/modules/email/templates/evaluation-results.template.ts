export const evaluationResultsTemplate = (
  candidateName: string,
  jobTitle: string,
  score: number,
  resultsUrl: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hiring Intelligence Report</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          background-color: #f4f5fb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
        }
        .header {
          text-align: center;
          padding: 32px 24px 16px;
          border-bottom: 1px solid #f0f0f5;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #eef5ff;
          color: #6c5ce7;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 8px;
          text-transform: uppercase;
        }
        .title {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1.3;
          margin: 24px 32px 8px;
          text-align: center;
        }
        .intro {
          font-size: 15px;
          color: #6b7280;
          text-align: center;
          margin: 0 32px 28px;
          line-height: 1.6;
        }
        .score-card {
          background-color: #f7f8fc;
          border-radius: 16px;
          margin: 0 32px;
          padding: 32px 24px 24px;
          text-align: center;
        }
        .score-value {
          font-size: 48px;
          font-weight: 700;
          color: #6c5ce7;
          margin: 16px 0 8px;
        }
        .score-label {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
          margin-top: 16px;
        }
        .score-desc {
          font-size: 13px;
          color: #6b7280;
          margin-top: 6px;
          line-height: 1.5;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #f0f0f5;
          color: #4b5563;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 16px;
          text-transform: uppercase;
        }
        .cta-button {
          display: block;
          margin: 28px 32px 8px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #17a2b8 0%, #6366f1 50%, #a855f7 100%);
          color: #ffffff;
          text-align: center;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.3px;
        }
        .secure-note {
          font-size: 12px;
          color: #9ca3af;
          margin: 8px 0 0;
          text-align: center;
        }
        .body-content {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.7;
          margin: 0 32px;
          padding: 28px 0 0;
          border-top: 1px solid #f0f0f5;
        }
        .body-content p {
          margin: 16px 0;
        }
        .signature {
          margin-top: 16px;
          font-weight: 600;
          color: #6c5ce7;
        }
        .footer {
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
          padding: 24px 32px;
          background-color: #f9fafb;
          margin-top: 28px;
          line-height: 1.6;
        }
        .footer-logo {
          margin-top: 12px;
          font-weight: 700;
          font-size: 16px;
          background: linear-gradient(135deg, #17a2b8 0%, #6366f1 50%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .title {
            font-size: 22px;
            margin: 20px 20px 8px;
          }
          .intro {
            font-size: 14px;
            margin: 0 20px 24px;
          }
          .score-card {
            margin: 0 20px;
            padding: 24px 16px 20px;
          }
          .score-value {
            font-size: 40px;
          }
          .cta-button {
            margin: 24px 20px 8px;
            padding: 14px 20px;
            font-size: 15px;
          }
          .body-content {
            margin: 0 20px;
            padding: 24px 0 0;
          }
          .footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TechStar Recruiters</div>
          <div class="badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            Verified Evaluation by TalentScan AI
          </div>
        </div>

        <h1 class="title">Your Hiring Intelligence Report is Ready.</h1>
        
        <p class="intro">
          We've partnered with <strong>TalentScan AI</strong> to provide you with objective, 
          data-driven feedback on your application for the <strong>${jobTitle}</strong> position.
        </p>

        <div class="score-card">
          <div class="score-value">${score}%</div>
          <div class="score-label">Role Fit Match</div>
          <div class="score-desc">
            Our AI analysis evaluated your background and skills alignment with the ${jobTitle} position requirements.
          </div>
          <div class="chip">🔍 Ethics-Verified Analysis</div>
        </div>

        <a href="${resultsUrl}" class="cta-button">View Full Results</a>
        
        <div class="secure-note">
          🔒 Secure link powered by TalentScan AI. Expires in 30 days.
        </div>

        <div class="body-content">
          <p>Hi ${candidateName},</p>
          
          <p>
            At TechStar Recruiters, we value your time and your career growth. 
            We believe that every candidate deserves transparent and objective feedback. 
            This report provides a detailed breakdown of how your skills align with our 
            <strong>${jobTitle}</strong> requirements and offers actionable insights for your 
            professional development.
          </p>
          
          <p>
            Regardless of the final outcome, we hope this evaluation serves as a valuable 
            asset in your career journey.
          </p>
          
          <div class="signature">
            To your success,<br>
            The TechStar Recruiters Recruitment Team
          </div>
        </div>

        <div class="footer">
          <div>
            Disclaimer: TalentScan AI provides decision-support tools. All final hiring 
            decisions are made by human recruiters at TechStar Recruiters. 
            <a href="#" style="color: #6c5ce7; text-decoration: underline;">Privacy Policy</a>
          </div>
          <div class="footer-logo">TalentScan AI</div>
        </div>
      </div>
    </body>
    </html>
  `;
};
