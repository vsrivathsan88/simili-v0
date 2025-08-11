'use client'

import { useState } from 'react'
import { useCollaboration } from '@/lib/collaborationManager'
import { useSessionManager } from '@/lib/sessionManager'
import AccessibleButton from './AccessibleButton'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
}

const ShareDialog = ({ isOpen, onClose }: ShareDialogProps) => {
  const collaboration = useCollaboration()
  const sessionManager = useSessionManager()
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [importCode, setImportCode] = useState('')
  const [activeTab, setActiveTab] = useState<'share' | 'import'>('share')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerateShare = () => {
    try {
      const shareableSession = collaboration.generateShareLink()
      setShareCode(shareableSession.shareCode)
    } catch (error) {
      console.error('Failed to generate share link:', error)
      alert('Failed to generate share link. Please make sure you have an active session.')
    }
  }

  const handleCopyLink = async () => {
    if (!shareCode) return
    
    const shareUrl = `${window.location.origin}?share=${shareCode}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleImport = () => {
    if (!importCode.trim()) return
    
    const imported = collaboration.importSharedSession(importCode.trim())
    if (imported) {
      sessionManager.loadSession(imported.id)
      alert(`Successfully imported: ${imported.name}`)
      onClose()
      // Reload page to show imported session
      window.location.reload()
    } else {
      alert('Invalid share code. Please check and try again.')
    }
  }

  const handleQuickShare = () => {
    handleGenerateShare()
    setTimeout(() => {
      if (shareCode) handleCopyLink()
    }, 100)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Share Your Work</h2>
              <p className="text-blue-100 text-sm">Collaborate with classmates</p>
            </div>
            <AccessibleButton
              onClick={onClose}
              className="w-8 h-8 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              aria-label="Close share dialog"
            >
              ×
            </AccessibleButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'share'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📤 Share My Work
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'import'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📥 Join Someone's Work
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <h3 className="font-semibold text-gray-800 mb-2">Share Your Math Workspace</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Generate a share code that your classmates can use to see your work
                </p>
              </div>

              {!shareCode ? (
                <div className="space-y-3">
                  <AccessibleButton
                    onClick={handleGenerateShare}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium"
                  >
                    🔗 Generate Share Code
                  </AccessibleButton>
                  
                  <AccessibleButton
                    onClick={handleQuickShare}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                  >
                    ⚡ Quick Share (Copy Link)
                  </AccessibleButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-lg font-mono font-bold text-blue-600 mb-2">
                        {shareCode}
                      </div>
                      <p className="text-xs text-gray-600">
                        Share this code with your classmates
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <AccessibleButton
                      onClick={handleCopyLink}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                        copied 
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                      }`}
                    >
                      {copied ? '✅ Copied!' : '📋 Copy Link'}
                    </AccessibleButton>
                    
                    <AccessibleButton
                      onClick={() => setShareCode(null)}
                      className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 border border-gray-300"
                    >
                      🔄 New Code
                    </AccessibleButton>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    💡 Tip: Your classmates can paste this link in their browser or use the "Join" tab
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🤝</div>
                <h3 className="font-semibold text-gray-800 mb-2">Join a Shared Workspace</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Enter a share code to see someone else's math work
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="import-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Share Code
                  </label>
                  <input
                    id="import-code"
                    type="text"
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    placeholder="happy-cat-42"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>

                <AccessibleButton
                  onClick={handleImport}
                  disabled={!importCode.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium"
                >
                  🚀 Import Workspace
                </AccessibleButton>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-xs text-yellow-800">
                  <strong>📚 Note:</strong> This will create a copy of the shared workspace in your sessions. 
                  You can then work on it independently.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareDialog
