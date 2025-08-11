'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReasoningMap from '@/components/ReasoningMap'
import InsightsPanel from '@/components/InsightsPanel'
import ProgressDashboard from '@/components/ProgressDashboard'

export default function TeacherView() {
  const [activeTab, setActiveTab] = useState<'live' | 'insights' | 'progress'>('live')
  const [connectedStudents, setConnectedStudents] = useState([
    { id: '1', name: 'Alex', status: 'active', currentActivity: 'Drawing fractions' },
    { id: '2', name: 'Sam', status: 'idle', currentActivity: 'Reading problem' },
    { id: '3', name: 'Jordan', status: 'active', currentActivity: 'Using manipulatives' },
  ])

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* Teacher Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>👩‍🏫</span>
              <span>Teacher Dashboard</span>
            </h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
              <span className="text-sm font-medium text-blue-700">
                {connectedStudents.filter(s => s.status === 'active').length} students active
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Back to Student View
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: 'live', label: '🔴 Live Sessions', count: connectedStudents.length },
            { id: 'insights', label: '📊 Learning Insights', count: null },
            { id: 'progress', label: '📈 Progress Tracking', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-400' : 'bg-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'live' && (
          <div className="h-full flex">
            {/* Student List */}
            <div className="w-1/4 bg-white border-r border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Connected Students</h3>
              <div className="space-y-3">
                {connectedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      student.status === 'active'
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{student.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        student.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <p className="text-sm text-gray-600">{student.currentActivity}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {student.status === 'active' ? 'Working now' : '2 min ago'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live Reasoning Map */}
            <div className="flex-1 p-6">
              <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Live Mathematical Reasoning</h3>
                <ReasoningMap isVisible={true} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="h-full p-6">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
              <InsightsPanel 
                isOpen={true} 
                onClose={() => {}} 
                sessionStarted={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="h-full p-6">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-6">Student Progress Overview</h3>
              <ProgressDashboard />
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Status */}
      <div className="fixed bottom-6 right-6 bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-sm font-medium">Pi is analyzing</span>
      </div>
    </div>
  )
}
