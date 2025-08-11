'use client'

import { useRef, useState } from 'react'
import AccessibleButton from '@/components/AccessibleButton'

const PhotoPanel = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const url = URL.createObjectURL(file)
    setSrc(url)
    setFileName(file.name)
    
    // Announce to screen readers
    const announcer = document.getElementById('announcements')
    if (announcer) {
      announcer.textContent = `Photo uploaded: ${file.name}`
    }
  }

  const handleUploadClick = () => {
    inputRef.current?.click()
  }

  const handleRemovePhoto = () => {
    if (src) {
      URL.revokeObjectURL(src)
    }
    setSrc(null)
    setFileName('')
    
    // Announce to screen readers
    const announcer = document.getElementById('announcements')
    if (announcer) {
      announcer.textContent = 'Photo removed'
    }
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col">
      {/* Image container */}
      <div className="relative w-full flex-grow bg-gray-100 rounded-md overflow-hidden">
        {src ? (
          <>
            <img 
              src={src} 
              alt={`Reference photo: ${fileName}`}
              className="w-full h-full object-contain"
            />
            <AccessibleButton
              variant="ghost" size="sm" onClick={handleRemovePhoto}
              aria-label="Remove photo"
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              ✕
            </AccessibleButton>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-2 text-gray-300">📷</span>
            <p className="text-sm font-sans text-gray-400">Add a photo to get started</p>
            <AccessibleButton
              variant="primary" size="sm" onClick={handleUploadClick}
              className="mt-3"
            >
              Upload Photo
            </AccessibleButton>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload photo file"
      />
    </div>
  )
}

export default PhotoPanel
