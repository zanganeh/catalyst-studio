'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DemoLayout } from '@/components/studio/deployment/demo-layout'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shuffle, Check } from 'lucide-react'

export default function StyleGuidePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromWireframe = searchParams.get('from') === 'wireframe'
  const [isApproved, setIsApproved] = useState(false)

  useEffect(() => {
    if (fromWireframe) {
      // Auto-generate style guide when coming from wireframe
      const timer = setTimeout(() => {
        // Style guide is already shown, just needs approval
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [fromWireframe])

  const handleApprove = () => {
    setIsApproved(true)
    sessionStorage.setItem('styleGuideApproved', 'true')
    setTimeout(() => {
      router.push('/demo/export?from=style-guide')
    }, 500)
  }

  return (
    <DemoLayout
      title="Style Guide"
      subtitle="Step 4: AI-Generated Design System"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        {/* Header with concept selector */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <select className="px-3 py-1.5 border rounded-md text-sm">
              <option>Concept 1</option>
              <option>Concept 2</option>
              <option>Concept 3</option>
            </select>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          </div>
          <Button 
            onClick={handleApprove}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isApproved}
          >
            {isApproved ? 'Approved ✓' : 'Approve & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Colors & Typography */}
          <div className="col-span-4 space-y-6">
            {/* Colors Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Colors</h3>
              
              {/* Neutrals */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-3">Neutrals</p>
                <div className="space-y-2">
                  <div className="h-12 bg-gray-50 rounded-lg border"></div>
                  <div className="h-12 bg-gray-100 rounded-lg border"></div>
                  <div className="h-12 bg-gray-200 rounded-lg border"></div>
                  <div className="h-12 bg-gray-300 rounded-lg border"></div>
                  <div className="h-12 bg-gray-400 rounded-lg border"></div>
                  <div className="h-12 bg-gray-500 rounded-lg border"></div>
                  <div className="h-12 bg-gray-700 rounded-lg border"></div>
                  <div className="h-12 bg-gray-900 rounded-lg border"></div>
                  <div className="h-12 bg-black rounded-lg border"></div>
                </div>
              </div>

              {/* Brand Colors Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="h-32 bg-blue-600 rounded-lg p-3 text-white relative">
                    <p className="text-sm font-medium">Mariner</p>
                    <p className="absolute bottom-3 left-3 text-xs opacity-90">2266BB</p>
                    <p className="absolute bottom-3 right-3 text-xs opacity-90">Main</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-32 bg-orange-600 rounded-lg p-3 text-white relative">
                    <p className="text-sm font-medium">Roof Terracotta</p>
                    <p className="absolute bottom-3 left-3 text-xs opacity-90">BB4422</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-32 bg-green-500 rounded-lg p-3 text-white relative">
                    <p className="text-sm font-medium">Mountain Meadow</p>
                    <p className="absolute bottom-3 left-3 text-xs opacity-90">22BB88</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-32 bg-yellow-400 rounded-lg p-3 text-gray-900 relative">
                    <p className="text-sm font-medium">Key Lime Pie</p>
                    <p className="absolute bottom-3 left-3 text-xs opacity-90">CCBB22</p>
                  </div>
                </div>
              </div>

              {/* Add New Color */}
              <button className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors mt-3">
                <span className="text-2xl">+</span>
              </button>
            </div>

            {/* Typography Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Typography</h3>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Heading</p>
                  <p className="text-2xl font-bold">Urbanist</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Google</span>
                    <span className="text-xs text-gray-400">Free</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Body</p>
                  <p className="text-xl">Open Sans</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Google</span>
                    <span className="text-xs text-gray-400">Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - UI Styling */}
          <div className="col-span-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">UI Styling</h3>
              
              {/* Buttons & Forms */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">Buttons & Forms</p>
                  <div className="space-y-3">
                    <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Button
                    </button>
                    <button className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium ml-3">
                      Button
                    </button>
                  </div>
                </div>

                {/* Cards & Images */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">Cards & Images</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg"></div>
                    <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-lg"></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Medium length section heading goes here
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="text-blue-600 mt-4">
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="col-span-4">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Explore Now</span>
                  <span>Discover More</span>
                  <span>Join Us</span>
                  <span>More Links</span>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs">
                    Sign Up
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 text-white">
                <h1 className="text-3xl font-bold mb-4">
                  Experience the<br />
                  Heart of Bathurst<br />
                  City
                </h1>
                <p className="text-sm text-gray-300 mb-6 max-w-sm">
                  Discover the vibrant atmosphere of Bathurst City, where culture and 
                  adventure meet. Explore local attractions, including the iconic Mount 
                  Panorama racetrack, right at your doorstep.
                </p>
                <div className="flex gap-3">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    Explore
                  </button>
                  <button className="px-6 py-2 bg-transparent text-white border border-white rounded-lg text-sm font-medium">
                    Learn More
                  </button>
                </div>
                
                {/* Image placeholder */}
                <div className="mt-8 aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg"></div>
              </div>
            </div>

            {/* Scheme Shuffle */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Scheme shuffle</span>
              <button className="text-sm text-gray-600">SPACE</button>
            </div>
          </div>
        </div>
      </div>
    </DemoLayout>
  )
}