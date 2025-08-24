'use client'

import { useState } from 'react'
import { Filter, Calendar, Tag, TrendingUp, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterOptions {
  seoScoreMin: number
  seoScoreMax: number
  pageType: string
  dateRange: string
  author: string
  hasComments: boolean
  hasSections: boolean
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  activeFiltersCount: number
}

export function AdvancedFilters({ onFilterChange, activeFiltersCount }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    seoScoreMin: 0,
    seoScoreMax: 100,
    pageType: 'all',
    dateRange: 'all',
    author: 'all',
    hasComments: false,
    hasSections: false,
  })

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      seoScoreMin: 0,
      seoScoreMax: 100,
      pageType: 'all',
      dateRange: 'all',
      author: 'all',
      hasComments: false,
      hasSections: false,
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700"
        >
          <Filter className="w-4 h-4 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge 
              className="ml-2 bg-orange-500 text-white"
              variant="secondary"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gray-900 border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-400 hover:text-white"
            >
              Reset
            </Button>
          </div>

          {/* SEO Score Range */}
          <div className="space-y-2">
            <Label className="flex items-center text-gray-300">
              <TrendingUp className="w-4 h-4 mr-2" />
              SEO Score Range: {filters.seoScoreMin} - {filters.seoScoreMax}
            </Label>
            <div className="px-2">
              <Slider
                value={[filters.seoScoreMin, filters.seoScoreMax]}
                onValueChange={([min, max]) => {
                  handleFilterChange('seoScoreMin', min)
                  handleFilterChange('seoScoreMax', max)
                }}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Page Type */}
          <div className="space-y-2">
            <Label className="flex items-center text-gray-300">
              <Tag className="w-4 h-4 mr-2" />
              Page Type
            </Label>
            <Select
              value={filters.pageType}
              onValueChange={(value) => handleFilterChange('pageType', value)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="product">Product Page</SelectItem>
                <SelectItem value="blog">Blog Post</SelectItem>
                <SelectItem value="legal">Legal Page</SelectItem>
                <SelectItem value="support">Support Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              Modified Date
            </Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange('dateRange', value)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label className="flex items-center text-gray-300">
              <User className="w-4 h-4 mr-2" />
              Author
            </Label>
            <Select
              value={filters.author}
              onValueChange={(value) => handleFilterChange('author', value)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Authors</SelectItem>
                <SelectItem value="me">Me</SelectItem>
                <SelectItem value="team">Team Members</SelectItem>
                <SelectItem value="external">External Contributors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters */}
          <div className="space-y-2">
            <Label className="text-gray-300">Additional Filters</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={filters.hasComments}
                  onChange={(e) => handleFilterChange('hasComments', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-orange-500"
                />
                <span>Has Comments</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={filters.hasSections}
                  onChange={(e) => handleFilterChange('hasSections', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-orange-500"
                />
                <span>Has Content Sections</span>
              </label>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''} applied
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}