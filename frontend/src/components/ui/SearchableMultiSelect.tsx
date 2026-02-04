'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

interface SearchableMultiSelectProps {
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export default function SearchableMultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  className = ""
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(value => value !== option))
    } else {
      onChange([...selectedValues, option])
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-f6f6f6 border border-gray-300 rounded-lg text-left text-black focus:outline-none focus:border-gray-500 transition-colors flex items-center justify-between"
      >
        <span className="truncate">
          {selectedValues.length === 0 
            ? placeholder 
            : `${selectedValues.length} selected`
          }
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Clear All Button */}
          {selectedValues.length > 0 && (
            <div className="p-2 border-b border-gray-200">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 w-full px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all ({selectedValues.length})
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggleOption(option)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">{option}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}