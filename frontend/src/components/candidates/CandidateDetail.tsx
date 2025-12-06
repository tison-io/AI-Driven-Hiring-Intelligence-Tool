'use client'

import CandidateHeader from './CandidateHeader'
import ScoreCards from './ScoreCards'
import ExperienceSection from './ExperienceSection'
import AIAnalysisSection from './AIAnalysisSection'
import InterviewQuestions from './InterviewQuestions'
import CandidateActions from './CandidateActions'

interface CandidateDetailProps {
  candidate: any // TODO: Replace with proper type from types/index.ts
}

export default function CandidateDetail({ candidate }: CandidateDetailProps) {
  const handleDelete = () => {
    console.log('Delete PII')
    // TODO: Implement delete functionality
  }

  const handleShortlist = () => {
    console.log('Add to shortlist')
    // TODO: Implement shortlist functionality
  }

  const handleDownloadReport = () => {
    console.log('Download report')
    // TODO: Implement download report
  }

  const handleExportCSV = () => {
    console.log('Export CSV')
    // TODO: Implement CSV export
  }

  return (
    <div className="min-h-screen bg-f6f6f6 p-8">
      <div className="max-w-6xl mx-auto">
        <CandidateHeader
          name={candidate.name}
          title={candidate.title}
          linkedinUrl={candidate.linkedinUrl}
          onDelete={handleDelete}
        />

        <ScoreCards
          roleFitScore={candidate.roleFitScore}
          confidenceScore={candidate.confidenceScore}
          biasCheck={candidate.biasCheck}
        />

        <ExperienceSection
          experience={candidate.experience}
          education={candidate.education}
        />

        <AIAnalysisSection
          keyStrengths={candidate.keyStrengths}
          potentialGaps={candidate.potentialGaps}
          missingSkills={candidate.missingSkills}
        />

        <InterviewQuestions questions={candidate.interviewQuestions} />

        <CandidateActions
          onShortlist={handleShortlist}
          onDownloadReport={handleDownloadReport}
          onExportCSV={handleExportCSV}
        />
      </div>
    </div>
  )
}
