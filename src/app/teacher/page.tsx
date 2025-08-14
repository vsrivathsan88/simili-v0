'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReasoningMap from '@/components/ReasoningMap'
import InsightsPanel from '@/components/InsightsPanel'
import ProgressDashboard from '@/components/ProgressDashboard'
import { useSessionManager, type SessionData, type ReasoningPhase } from '@/lib/sessionManager'

export default function TeacherView() {
  const [activeTab, setActiveTab] = useState<'live' | 'insights' | 'progress'>('live')
  const [problemsTab, setProblemsTab] = useState<'list' | 'detail'>('list')
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null)
  const [phaseFilter, setPhaseFilter] = useState<ReasoningPhase | 'all'>('all')
  const [classFilter, setClassFilter] = useState<'all' | 'correct' | 'partial' | 'incorrect' | 'exploring'>('all')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const sessionApi = useSessionManager()
  const [connectedStudents, setConnectedStudents] = useState([
    { id: '1', name: 'Alex', status: 'active', currentActivity: 'Drawing fractions' },
    { id: '2', name: 'Sam', status: 'idle', currentActivity: 'Reading problem' },
    { id: '3', name: 'Jordan', status: 'active', currentActivity: 'Using manipulatives' },
  ])

  // Load current session and refresh on reasoning events
  useEffect(() => {
    const refresh = () => setSessionData(sessionApi.getCurrentSession())
    refresh()
    const onStep = () => refresh()
    const onTag = () => refresh()
    window.addEventListener('simili-reasoning-step', onStep as EventListener)
    window.addEventListener('simili-tag-reasoning-step', onTag as EventListener)
    return () => {
      window.removeEventListener('simili-reasoning-step', onStep as EventListener)
      window.removeEventListener('simili-tag-reasoning-step', onTag as EventListener)
    }
  }, [])

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
            { id: 'problems', label: '🧩 Problems', count: sessionData?.problems?.length || 0 },
          ].map((tab: any) => (
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
              {typeof tab.count === 'number' ? (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-400' : 'bg-gray-300'
                }`}>
                  {tab.count}
                </span>
              ) : null}
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
              <ProgressDashboard isOpen={true} onClose={() => {}} />
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="h-full p-6">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Problems</h3>
                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={phaseFilter}
                    onChange={(e) => setPhaseFilter(e.target.value as any)}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All phases</option>
                    <option value="hypothesis">Hypothesis</option>
                    <option value="evidence">Evidence</option>
                    <option value="revision">Revision</option>
                    <option value="check">Check</option>
                  </select>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value as any)}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="correct">Correct</option>
                    <option value="partial">Partial</option>
                    <option value="incorrect">Revision</option>
                    <option value="exploring">Exploring</option>
                  </select>
                </div>
              </div>

              {/* Summary metrics */}
              {(() => {
                const probs = sessionData?.problems || []
                const stepsAll = probs.flatMap(p => p.reasoningSteps)
                const phaseCounts: Record<string, number> = { hypothesis: 0, evidence: 0, revision: 0, check: 0 }
                const classCounts: Record<string, number> = { correct: 0, partial: 0, incorrect: 0, exploring: 0 }
                const tagCounts: Record<string, number> = {}
                const conceptCounts: Record<string, number> = {}
                stepsAll.forEach(s => {
                  if (s.phase) phaseCounts[s.phase] = (phaseCounts[s.phase] || 0) + 1
                  classCounts[s.classification] = (classCounts[s.classification] || 0) + 1
                  if (Array.isArray(s.tags)) s.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
                  if (Array.isArray(s.concepts)) s.concepts.forEach(c => { conceptCounts[c] = (conceptCounts[c] || 0) + 1 })
                })
                const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,4)
                const topConcepts = Object.entries(conceptCounts).sort((a,b)=>b[1]-a[1]).slice(0,4)
                return (
                  <div className="grid md:grid-cols-4 gap-3 mb-4">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Problems</div>
                      <div className="text-xl font-semibold text-gray-800">{probs.length}</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Steps</div>
                      <div className="text-xl font-semibold text-gray-800">{stepsAll.length}</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Phases</div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {(['hypothesis','evidence','revision','check'] as const).map(ph => (
                          <span key={ph} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">{ph}: {phaseCounts[ph]||0}</span>
                        ))}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {(['correct','partial','incorrect','exploring'] as const).map(k => (
                          <span key={k} className={`px-2 py-0.5 rounded-full capitalize ${k==='correct'?'bg-green-100 text-green-700':k==='partial'?'bg-yellow-100 text-yellow-700':k==='incorrect'?'bg-orange-100 text-orange-700':'bg-purple-100 text-purple-700'}`}>{k}: {classCounts[k]||0}</span>
                        ))}
                      </div>
                    </div>
                    {topTags.length>0 && (
                      <div className="md:col-span-2 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Top Tags</div>
                        <div className="flex flex-wrap gap-1 text-xs">
                          {topTags.map(([t,c]) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{t} ({c})</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {topConcepts.length>0 && (
                      <div className="md:col-span-2 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Top Concepts</div>
                        <div className="flex flex-wrap gap-1 text-xs">
                          {topConcepts.map(([t,c]) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{t.replace('_',' ')} ({c})</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {problemsTab === 'list' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {(sessionData?.problems || []).map((p) => {
                    const total = p.reasoningSteps.length
                    const matching = p.reasoningSteps.filter((s) =>
                      (phaseFilter === 'all' || s.phase === phaseFilter) &&
                      (classFilter === 'all' || s.classification === classFilter)
                    ).length
                    return (
                      <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                        onClick={() => { setActiveProblemId(p.id); setProblemsTab('detail') }}
                        role="button" aria-label={`Open problem ${p.index}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-800">Problem {p.index}</div>
                          <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{p.status}</span>
                        </div>
                        <div className="text-xs text-gray-600">Steps: {matching}/{total}</div>
                        {p.photoName && (
                          <div className="text-xs text-gray-500 mt-1">Photo: {p.photoName}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {problemsTab === 'detail' && activeProblemId && (
                <div className="space-y-3">
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => { setProblemsTab('list'); setActiveProblemId(null) }}
                  >
                    ← Back to problems
                  </button>
                  {(() => {
                    const p = (sessionData?.problems || []).find(pp => pp.id === activeProblemId)
                    if (!p) return <div className="text-sm text-gray-500">Problem not found.</div>
                    const steps = p.reasoningSteps.filter((s) =>
                      (phaseFilter === 'all' || s.phase === phaseFilter) &&
                      (classFilter === 'all' || s.classification === classFilter)
                    )
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-800">Problem {p.index}</div>
                          <div className="text-xs text-gray-500">{new Date(p.startedAt).toLocaleTimeString()} {p.endedAt ? `→ ${new Date(p.endedAt).toLocaleTimeString()}` : ''}</div>
                        </div>
                        <div className="space-y-2">
                          {steps.map((s) => (
                            <div key={s.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-medium text-gray-800">{s.transcript.slice(0, 80)}{s.transcript.length > 80 ? '…' : ''}</div>
                                <div className="flex items-center gap-2 text-xs">
                                  {s.phase && <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{s.phase}</span>}
                                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{s.classification}</span>
                                </div>
                              </div>
                              {Array.isArray(s.tags) && s.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {s.tags.map((t, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {steps.length === 0 && (
                            <div className="text-sm text-gray-500">No steps match current filters.</div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
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
