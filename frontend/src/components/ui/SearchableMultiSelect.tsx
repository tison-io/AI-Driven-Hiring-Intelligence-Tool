'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

interface SearchableMultiSelectProps {
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SearchableMultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  className = "",
  disabled = false
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

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

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

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === 1
    ? selectedValues[0]
    : `${selectedValues.length} selected`

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg text-left transition-colors flex items-center justify-between ${
          disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#f6f6f6] border-gray-300 text-black hover:border-gray-400 focus:outline-none focus:border-gray-500'
        }`}
      >
        <span className="truncate text-sm">
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        } ${disabled ? 'opacity-50' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                autoFocus
              />
            </div>
          </div>

          {/* Selected count and Clear All Button */}
          {selectedValues.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {selectedValues.length} item{selectedValues.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                {searchQuery ? 'No matching options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggleOption(option)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 flex-1 select-none">{option}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}