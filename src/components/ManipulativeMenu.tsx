'use client'

import { useState } from 'react'
import AccessibleButton from './AccessibleButton'

interface ManipulativeMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'number-line' | 'graph-paper' | 'fraction-bar' | 'circle' | 'square' | 'triangle' | 'calculator') => void
  anchorRef?: React.RefObject<HTMLElement>
}

const ManipulativeMenu = ({ isOpen, onClose, onSelect, anchorRef }: ManipulativeMenuProps) => {
  if (!isOpen) return null

  const handleSelect = (type: 'number-line' | 'graph-paper' | 'fraction-bar' | 'circle' | 'square' | 'triangle' | 'calculator') => {
    console.log('ManipulativeMenu: Selected', type)
    onSelect(type)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-30" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 bg-white/95 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl p-3 min-w-[220px]">
        <div className="text-sm font-bold text-gray-800 px-2 py-2 border-b border-gray-100 text-center" style={{ fontFamily: 'Kalam, cursive' }}>
          🔬 Pi Lab Tools
        </div>
        <div className="text-xs text-gray-500 px-2 py-1 text-center">
          Add to your workspace
        </div>
        
        <div className="py-2 space-y-1">
          <button
            onClick={() => handleSelect('fraction-bar')}
            className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50 rounded-lg transition-colors duration-short border border-transparent hover:border-blue-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🟨</span>
              <div>
                <div className="font-medium text-gray-800">Fraction Bar</div>
                <div className="text-xs text-gray-500">Model parts • compare ratios</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleSelect('number-line')}
            className="w-full text-left px-3 py-3 text-sm hover:bg-green-50 rounded-lg transition-colors duration-short border border-transparent hover:border-green-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📏</span>
              <div>
                <div className="font-medium text-gray-800">Number Line</div>
                <div className="text-xs text-gray-500">Measure • compare intervals</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleSelect('graph-paper')}
            className="w-full text-left px-3 py-3 text-sm hover:bg-purple-50 rounded-lg transition-colors duration-short border border-transparent hover:border-purple-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <div>
                <div className="font-medium text-gray-800">Graph Paper</div>
                <div className="text-xs text-gray-500">Plot points • coordinates</div>
              </div>
            </div>
          </button>
          
          <div className="border-t border-gray-200 my-2"></div>
          
          <button
            onClick={() => handleSelect('circle')}
            className="w-full text-left px-3 py-3 text-sm hover:bg-orange-50 rounded-lg transition-colors duration-short border border-transparent hover:border-orange-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚪</span>
              <div>
                <div className="font-medium text-gray-800">Circle Tool</div>
                <div className="text-xs text-gray-500">Investigate radius • area</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleSelect('calculator')}
            className="w-full text-left px-3 py-3 text-sm hover:bg-gray-50 rounded-lg transition-colors duration-short border border-transparent hover:border-gray-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🧮</span>
              <div>
                <div className="font-medium text-gray-800">Notebook Calc</div>
                <div className="text-xs text-gray-500">Show your steps clearly</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}

export default ManipulativeMenu
