import { useState, useEffect } from 'react'
import { candidatesApi } from '@/lib/api'
import { CandidatesFilters } from '@/types'

export function useCandidates(filters?: CandidatesFilters, page: number = 1, limit: number = 6) {
  const [candidates, setCandidates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await candidatesApi.getAll(filters)
        const sortedData = data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        const total = sortedData.length
        const totalPages = Math.ceil(total / limit)
        const startIndex = (page - 1) * limit
        const paginatedData = sortedData.slice(startIndex, startIndex + limit)
        
        setCandidates(paginatedData)
        setPagination({ total, page, totalPages })
      } catch (err: any) {
        setError(err.message || 'Failed to fetch candidates')
        setCandidates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidates()
  }, [filters, page, limit])

  const refetch = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await candidatesApi.getAll(filters)
      const sortedData = data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      const total = sortedData.length
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const paginatedData = sortedData.slice(startIndex, startIndex + limit)
      
      setCandidates(paginatedData)
      setPagination({ total, page, totalPages })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidates')
      setCandidates([])
    } finally {
      setIsLoading(false)
    }
  }

  return { candidates, isLoading, error, pagination, refetch }
}
