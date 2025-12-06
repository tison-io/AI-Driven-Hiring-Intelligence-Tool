import { useState, useEffect } from 'react'
import { candidatesApi } from '@/lib/api'

export function useCandidateDetail(id: string) {
  const [candidate, setCandidate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await candidatesApi.getById(id)
        setCandidate(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch candidate details')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchCandidate()
    }
  }, [id])

  return { candidate, isLoading, error }
}
