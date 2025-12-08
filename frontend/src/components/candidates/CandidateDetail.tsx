'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { candidatesApi } from '@/lib/api'
import CandidateHeader from './CandidateHeader'
import ScoreCards from './ScoreCards'
import ExperienceSection from './ExperienceSection'
import AIAnalysisSection from './AIAnalysisSection'
import InterviewQuestions from './InterviewQuestions'
import CandidateActions from './CandidateActions'
import DeleteCandidateModal from '../modals/DeleteCandidateModal'

interface CandidateDetailProps {
  candidate: any // TODO: Replace with proper type from types/index.ts
  candidateId: string
}

export default function CandidateDetail({ candidate, candidateId }: CandidateDetailProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDeleteConfirm = async () => {
    try {
      await candidatesApi.delete(candidateId)
      toast.success('Candidate deleted successfully')
      router.push('/candidates')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete candidate')
      throw error
    }
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
    <div className="min-h-screen bg-f6f6f6 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <CandidateHeader
          name={candidate.name}
          title={candidate.title}
          linkedinUrl={candidate.linkedinUrl}
          onDelete={() => setIsModalOpen(true)}
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

        <DeleteCandidateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          candidateName={candidate.name}
        />
      </div>
    </div>
  )
}
