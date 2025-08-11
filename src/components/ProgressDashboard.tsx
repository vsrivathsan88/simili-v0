'use client'

import { useState, useEffect } from 'react'
import { useSessionManager, type StudentProgress } from '@/lib/sessionManager'
import AccessibleButton from './AccessibleButton'

interface ProgressDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const ProgressDashboard = ({ isOpen, onClose }: ProgressDashboardProps) => {
  const sessionManager = useSessionManager()
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sessions' | 'skills'>('overview')

  useEffect(() => {
    if (isOpen) {
      const progressData = sessionManager.getProgress()
      setProgress(progressData)
    }
  }, [isOpen, sessionManager])

  if (!isOpen || !progress) return null

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'advanced': return 'text-green-600 bg-green-100'
      case 'proficient': return 'text-blue-600 bg-blue-100'
      case 'developing': return 'text-yellow-600 bg-yellow-100'
      case 'beginner': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-4 bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Learning Progress</h2>
              <p className="text-blue-100">Track your mathematical journey</p>
            </div>
            <AccessibleButton
              onClick={onClose}
              className="w-8 h-8 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              aria-label="Close progress dashboard"
            >
              ×
            </AccessibleButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'sessions', label: 'Sessions', icon: '📝' },
              { id: 'skills', label: 'Skills', icon: '🎯' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 160px)' }}>
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600">{progress.overallStats.totalSessions}</div>
                <div className="text-blue-700 font-medium">Total Sessions</div>
                <div className="text-sm text-blue-600">Math explorations completed</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600">
                  {formatDuration(progress.overallStats.totalTimeSpent)}
                </div>
                <div className="text-green-700 font-medium">Time Spent</div>
                <div className="text-sm text-green-600">Learning and exploring</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-600">
                  {progress.overallStats.conceptsMastered.length}
                </div>
                <div className="text-purple-700 font-medium">Concepts Mastered</div>
                <div className="text-sm text-purple-600">Advanced level achieved</div>
              </div>

              {/* Favorite Tools */}
              <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🛠️ Favorite Math Tools</h3>
                <div className="space-y-2">
                  {progress.overallStats.favoriteManipulatives.slice(0, 3).map((tool, index) => (
                    <div key={tool} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="capitalize font-medium text-gray-700">
                        {tool.replace('-', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Achievement */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Latest Achievement</h3>
                {progress.overallStats.conceptsMastered.length > 0 ? (
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎉</div>
                    <div className="font-medium text-gray-700 capitalize">
                      {progress.overallStats.conceptsMastered[progress.overallStats.conceptsMastered.length - 1].replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">Mastered!</div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-2xl mb-2">🌱</div>
                    <div>Keep exploring to unlock achievements!</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">📝 Recent Sessions</h3>
              <div className="grid gap-4">
                {progress.sessions.slice(-10).reverse().map(session => (
                  <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{session.name}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(session.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duration: </span>
                        <span className="font-medium">{formatDuration(session.metadata.sessionDuration)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tools Used: </span>
                        <span className="font-medium">{session.metadata.totalManipulativesUsed}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Drawings: </span>
                        <span className="font-medium">{session.metadata.totalShapesDrawn}</span>
                      </div>
                    </div>
                    {session.metadata.conceptsExplored.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {session.metadata.conceptsExplored.slice(0, 3).map(concept => (
                          <span key={concept} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                            {concept.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'skills' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">🎯 Skill Progression</h3>
              <div className="grid gap-4">
                {Object.entries(progress.overallStats.skillProgression).map(([concept, data]) => (
                  <div key={concept} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 capitalize">
                        {concept.replace('_', ' ')}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(data.level)}`}>
                        {data.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{data.activities} activities completed</span>
                      <span>Last practiced: {new Date(data.lastPracticed).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          data.level === 'advanced' ? 'bg-green-500' :
                          data.level === 'proficient' ? 'bg-blue-500' :
                          data.level === 'developing' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (data.activities / 10) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressDashboard
