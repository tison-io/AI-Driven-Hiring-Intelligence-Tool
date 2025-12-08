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
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)

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

  const handleDownloadReport = async () => {
    try {
      setIsDownloadingReport(true)
      
      const token = localStorage.getItem('token')
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/export/report/${candidateId}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `hiring-report-${candidate.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
      link.click()
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      toast.error('Failed to download report')
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const handleShortlist = () => {
    console.log('Add to shortlist')
    // TODO: Implement shortlist functionality
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
          isDownloadingReport={isDownloadingReport}
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
