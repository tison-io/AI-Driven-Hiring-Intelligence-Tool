'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from '@/lib/toast'
import api, { candidatesApi } from '@/lib/api'
import { CandidateWithShortlist, CandidateDetailProps } from '@/types'
import CandidateHeader from './CandidateHeader'
import ScoreCards from './ScoreCards'
import ExperienceSection from './ExperienceSection'
import AIAnalysisSection from './AIAnalysisSection'
import InterviewQuestions from './InterviewQuestions'
import CandidateActions from './CandidateActions'
import DeleteCandidateModal from '../modals/DeleteCandidateModal'



export default function CandidateDetail({ candidate, candidateId }: CandidateDetailProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [isShortlisted, setIsShortlisted] = useState(candidate.isShortlisted || false)

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

      // Use api client which automatically sends cookies
      const response = await api.get(`/api/export/report/${candidateId}`, {
        responseType: 'blob',
      })

      // Create blob from response
      const blob = new Blob([response.data], { type: 'text/html' })
      
      // Trigger download
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `hiring-report-${candidate.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
      link.click()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Report downloaded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download report')
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const handleShortlist = async () => {
    try {
      await candidatesApi.toggleShortlist(candidateId)
      setIsShortlisted(!isShortlisted)
      toast.shortlist(!isShortlisted, candidate.name)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update shortlist')
    }
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
          experience={candidate.experience || candidate.workExperience || []}
          education={candidate.education?.[0]}
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
          isDownloadingReport={isDownloadingReport}
          isShortlisted={isShortlisted}
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
