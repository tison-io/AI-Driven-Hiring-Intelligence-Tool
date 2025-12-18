export function generateReportHTML(candidate: any): string {
  const roleFitScore = candidate.roleFitScore || 0;
  const confidenceScore = candidate.confidenceScore || 0;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hiring Intelligence Report - ${candidate.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #29B1B4 0%, #6A80D9 50%, #AA50FF 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.95;
    }
    
    .content {
      padding: 40px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #29B1B4;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-item {
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #6A80D9;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    
    .score-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 30px;
    }
    
    .score-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #bae6fd;
    }
    
    .score-label {
      font-size: 14px;
      font-weight: 600;
      color: #0369a1;
      margin-bottom: 12px;
    }
    
    .score-value {
      font-size: 48px;
      font-weight: 700;
      color: #0c4a6e;
      margin-bottom: 8px;
    }
    
    .score-bar {
      width: 100%;
      height: 8px;
      background: #e0f2fe;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 12px;
    }
    
    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #29B1B4 0%, #6A80D9 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .list-section {
      margin-bottom: 30px;
    }
    
    .list-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    
    .strength-item {
      padding: 12px 16px;
      margin-bottom: 8px;
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      border-radius: 6px;
      color: #166534;
    }
    
    .weakness-item {
      padding: 12px 16px;
      margin-bottom: 8px;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 6px;
      color: #991b1b;
    }
    
    .skill-item {
      padding: 12px 16px;
      margin-bottom: 8px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      color: #92400e;
    }
    
    .question-item {
      padding: 16px;
      margin-bottom: 12px;
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      color: #1e40af;
      font-weight: 500;
    }
    
    .question-number {
      display: inline-block;
      width: 28px;
      height: 28px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      margin-right: 12px;
      font-size: 14px;
      font-weight: 700;
    }
    
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    
    .skill-tag {
      padding: 8px 16px;
      background: linear-gradient(135deg, #29B1B4 0%, #6A80D9 100%);
      color: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .bias-check {
      padding: 20px;
      background: #f0fdf4;
      border: 2px solid #86efac;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .bias-check-title {
      font-size: 16px;
      font-weight: 600;
      color: #166534;
      margin-bottom: 8px;
    }
    
    .bias-check-text {
      color: #166534;
      line-height: 1.6;
    }
    
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; }
      .score-card { break-inside: avoid; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1> Hiring Intelligence Report</h1>
      <p>AI-Powered Candidate Evaluation</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 class="section-title">Candidate Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${candidate.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Job Role</div>
            <div class="info-value">${candidate.jobRole}</div>
          </div>
          <div class="info-item">
            <div class="info-label">LinkedIn Profile</div>
            <div class="info-value">${candidate.linkedinUrl || 'Not provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Years of Experience</div>
            <div class="info-value">${candidate.experienceYears} years</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">AI Evaluation Scores</h2>
        <div class="score-container">
          <div class="score-card">
            <div class="score-label">Role Fit Score</div>
            <div class="score-value">${roleFitScore}<span style="font-size: 24px;">/100</span></div>
            <div class="score-bar">
              <div class="score-fill" style="width: ${roleFitScore}%"></div>
            </div>
          </div>
          <div class="score-card">
            <div class="score-label">Confidence Score</div>
            <div class="score-value">${confidenceScore}<span style="font-size: 24px;">%</span></div>
            <div class="score-bar">
              <div class="score-fill" style="width: ${confidenceScore}%"></div>
            </div>
          </div>
        </div>
      </div>
      
      ${candidate.keyStrengths?.length > 0 ? `
      <div class="section">
        <h2 class="section-title"> Key Strengths</h2>
        <div class="list-section">
          ${candidate.keyStrengths.map((strength: string) => `
            <div class="strength-item">✓ ${strength}</div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${candidate.potentialWeaknesses?.length > 0 ? `
      <div class="section">
        <h2 class="section-title"> Areas for Development</h2>
        <div class="list-section">
          ${candidate.potentialWeaknesses.map((weakness: string) => `
            <div class="weakness-item">• ${weakness}</div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${candidate.missingSkills?.length > 0 ? `
      <div class="section">
        <h2 class="section-title"> Missing Skills</h2>
        <div class="list-section">
          ${candidate.missingSkills.map((skill: string) => `
            <div class="skill-item">→ ${skill}</div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${candidate.skills?.length > 0 ? `
      <div class="section">
        <h2 class="section-title"> Technical Skills</h2>
        <div class="skills-grid">
          ${candidate.skills.map((skill: string) => `
            <span class="skill-tag">${skill}</span>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${candidate.interviewQuestions?.length > 0 ? `
      <div class="section">
        <h2 class="section-title"> Recommended Interview Questions</h2>
        <div class="list-section">
          ${candidate.interviewQuestions.map((question: string, index: number) => `
            <div class="question-item">
              <span class="question-number">${index + 1}</span>
              ${question}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="section">
        <h2 class="section-title"> Bias Analysis</h2>
        <div class="bias-check">
          <div class="bias-check-title">AI Bias Check Results</div>
          <div class="bias-check-text">${candidate.biasCheck || 'No bias concerns identified in the evaluation process.'}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>TalentScan AI</strong> - Hiring Intelligence Report</p>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <p style="margin-top: 8px; font-size: 12px;">This report is generated by AI and should be used as a screening tool with human oversight.</p>
    </div>
  </div>
</body>
</html>
  `;
}
