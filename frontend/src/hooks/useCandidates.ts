import { useState, useEffect } from 'react'
import { candidatesApi } from '@/lib/api'

interface CandidatesFilters {
  search?: string
  experience_min?: number
  experience_max?: number
  score_min?: number
  score_max?: number
  skill?: string
  jobRole?: string
}

export function useCandidates(filters?: CandidatesFilters) {
  const [candidates, setCandidates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await candidatesApi.getAll(filters)
        setCandidates(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch candidates')
        setCandidates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidates()
  }, [filters])

  const refetch = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await candidatesApi.getAll(filters)
      setCandidates(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidates')
      setCandidates([])
    } finally {
      setIsLoading(false)
    }
  }

  return { candidates, isLoading, error, refetch }
}
