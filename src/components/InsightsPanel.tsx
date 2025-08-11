'use client'

import { useState } from 'react'
import AccessibleButton from '@/components/AccessibleButton'
import ProgressDashboard from './ProgressDashboard'
import { useSessionManager } from '@/lib/sessionManager'

interface InsightsPanelProps {
  isOpen: boolean
  onClose: () => void
  sessionStarted: boolean
}

interface ReasoningStep {
  id: string
  timestamp: Date
  action: string
  description: string
  type: 'drawing' | 'tool' | 'interaction'
}

const InsightsPanel = ({ isOpen, onClose, sessionStarted }: InsightsPanelProps) => {
  const sessionManager = useSessionManager()
  const [activeTab, setActiveTab] = useState<'trace' | 'steps' | 'progress'>('trace')
  const [showProgressDashboard, setShowProgressDashboard] = useState(false)
  
  // Mock data for demonstration
  const reasoningSteps: ReasoningStep[] = [
    {
      id: '1',
      timestamp: new Date(),
      action: 'Started drawing',
      description: 'Student began with pen tool, exploring the problem space',
      type: 'drawing'
    },
    {
      id: '2', 
      timestamp: new Date(),
      action: 'Switched to eraser',
      description: 'Student reconsidered approach, erasing initial marks',
      type: 'tool'
    }
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div 
        className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-medium"
        style={{
          borderLeft: '3px dashed #CBD5E1',
          borderRadius: '12px 0 0 8px', // Hand-drawn left edge
        }}
        role="dialog"
        aria-labelledby="insights-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 id="insights-title" className="text-xl font-bold text-ink font-handwritten">
            Insights & Reasoning
          </h2>
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close insights panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line">
          <button
            onClick={() => setActiveTab('trace')}
            className={`flex-1 px-6 py-3 text-sm font-medium font-handwritten transition-colors ${
              activeTab === 'trace' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-ink/70 hover:text-ink hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === 'trace'}
          >
            Visual Trace
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex-1 px-6 py-3 text-sm font-medium font-handwritten transition-colors ${
              activeTab === 'steps' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-ink/70 hover:text-ink hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === 'steps'}
          >
            Step Log
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!sessionStarted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-casual">
                Start a session to begin collecting reasoning insights
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'trace' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ink font-handwritten">Visual Reasoning Map</h3>
                  <div 
                    className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                    style={{ borderRadius: '8px 12px 6px 10px' }}
                  >
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="text-sm text-gray-500 font-casual">
                        Visual trace will appear here as student works
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-base font-medium text-ink font-handwritten">Key Observations</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-sm text-ink font-casual">
                          ✅ Student shows systematic approach to problem-solving
                        </p>
                      </div>
                      <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
                        <p className="text-sm text-ink font-casual">
                          💡 Evidence of metacognitive thinking (self-correction)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'steps' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ink font-handwritten">Reasoning Steps</h3>
                  <div className="space-y-3">
                    {reasoningSteps.map((step) => (
                      <div 
                        key={step.id} 
                        className="p-4 bg-gray-50 rounded-lg border border-line"
                        style={{ borderRadius: '6px 10px 8px 4px' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                            step.type === 'drawing' ? 'bg-primary' :
                            step.type === 'tool' ? 'bg-warning' : 'bg-success'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-ink font-handwritten">
                                {step.action}
                              </span>
                              <span className="text-xs text-ink/50">
                                {step.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-ink/70 font-casual">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-line p-6">
          <div className="flex gap-3">
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => console.log('Export PNG')}
              disabled={!sessionStarted}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Canvas
            </AccessibleButton>
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => console.log('Export Session')}
              disabled={!sessionStarted}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Session
            </AccessibleButton>
          </div>
        </div>
      </div>
    </>
  )
}

export default InsightsPanel
