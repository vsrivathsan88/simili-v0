'use client'

import { useState } from 'react'
import AccessibleButton from './AccessibleButton'
import NumberLine from './NumberLine'
import GraphPaper from './GraphPaper'
import FractionBar from './FractionBar'
import GeometricShape from './GeometricShape'
import Calculator from './Calculator'

type WidgetType = 'number-line' | 'graph-paper' | 'fraction-bar' | 'circle' | 'square' | 'triangle' | 'calculator' | null

interface WidgetPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedWidget: WidgetType
  onWidgetChange: (widget: WidgetType) => void
}

const widgets = [
  { type: 'fraction-bar' as const, name: 'Fraction Bar', emoji: '🟨', description: 'Explore parts of a whole' },
  { type: 'number-line' as const, name: 'Number Line', emoji: '📏', description: 'Place and compare numbers' },
  { type: 'graph-paper' as const, name: 'Graph Paper', emoji: '📊', description: 'Plot points and coordinates' },
  { type: 'circle' as const, name: 'Circle', emoji: '⚪', description: 'Measure radius and area' },
  { type: 'square' as const, name: 'Square', emoji: '⬜', description: 'Explore area and perimeter' },
  { type: 'triangle' as const, name: 'Triangle', emoji: '🔺', description: 'Learn about angles and height' },
  { type: 'calculator' as const, name: 'Calculator', emoji: '🧮', description: 'Calculate step by step' },
]

const WidgetPanel = ({ isOpen, onClose, selectedWidget, onWidgetChange }: WidgetPanelProps) => {
  if (!isOpen) return null

  const handleWidgetSelect = (widgetType: WidgetType) => {
    if (selectedWidget === widgetType) {
      // If clicking the same widget, close it
      onWidgetChange(null)
    } else {
      // Otherwise, switch to the new widget
      onWidgetChange(widgetType)
    }
  }

  const renderActiveWidget = () => {
    if (!selectedWidget) return null

    // For panel mode, we render non-draggable versions
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">
            {widgets.find(w => w.type === selectedWidget)?.name}
          </h4>
          <button
            onClick={() => onWidgetChange(null)}
            className="w-6 h-6 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-sm text-gray-500 hover:text-red-500"
            aria-label="Close widget"
          >
            ✕
          </button>
        </div>
        
        {/* Render widget content based on type */}
        {selectedWidget === 'fraction-bar' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Click segments to shade fractions</div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-blue-700">3/8 = 0.375 = 37.5%</div>
                <div className="text-sm text-blue-600 mt-1">Interactive fraction bar would go here</div>
              </div>
            </div>
          </div>
        )}
        
        {selectedWidget === 'number-line' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Click to place markers</div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-green-700">0 ——•—•——— 10</div>
                <div className="text-sm text-green-600 mt-1">Interactive number line would go here</div>
              </div>
            </div>
          </div>
        )}
        
        {selectedWidget === 'graph-paper' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Click to plot coordinates</div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-purple-700">📍 (2,3) 📍 (-1,4)</div>
                <div className="text-sm text-purple-600 mt-1">Interactive graph paper would go here</div>
              </div>
            </div>
          </div>
        )}
        
        {['circle', 'square', 'triangle'].includes(selectedWidget) && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Drag handles to resize and explore</div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-orange-700">
                  {selectedWidget === 'circle' && '⚪ Area: πr²'}
                  {selectedWidget === 'square' && '⬜ Area: s²'}
                  {selectedWidget === 'triangle' && '🔺 Area: ½bh'}
                </div>
                <div className="text-sm text-orange-600 mt-1">Interactive {selectedWidget} would go here</div>
              </div>
            </div>
          </div>
        )}
        
        {selectedWidget === 'calculator' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Calculate step by step</div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-700">2 + 3 × 4 = ?</div>
                <div className="text-sm text-gray-600 mt-1">Interactive calculator would go here</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 This tool helps you explore math concepts. Try different values and see what happens!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Kalam, cursive' }}>
            Math Tools
          </h2>
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close tools panel"
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full"
          >
            ✕
          </AccessibleButton>
        </div>

        {/* Widget Selector */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-3">Choose a tool:</div>
          <div className="grid grid-cols-2 gap-2">
            {widgets.map((widget) => (
              <button
                key={widget.type}
                onClick={() => handleWidgetSelect(widget.type)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedWidget === widget.type
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-lg mb-1">{widget.emoji}</div>
                <div className="text-sm font-medium text-gray-800">{widget.name}</div>
                <div className="text-xs text-gray-500">{widget.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Widget Area */}
        <div className="flex-1 p-4 overflow-auto">
          {selectedWidget ? (
            <div className="relative">
              <div className="mb-4">
                <h3 className="text-md font-bold text-gray-800 mb-1" style={{ fontFamily: 'Kalam, cursive' }}>
                  {widgets.find(w => w.type === selectedWidget)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {widgets.find(w => w.type === selectedWidget)?.description}
                </p>
              </div>
              
              {/* Widget rendered here - fixed positioning for panel */}
              <div className="relative flex justify-center items-start pt-4">
                <div className="transform-none relative">
                  {renderActiveWidget()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4 opacity-50">🔧</div>
              <p className="text-gray-500 text-sm">
                Select a tool above to get started
              </p>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="p-4 bg-blue-50 border-t border-gray-200">
          <p className="text-xs text-blue-700">
            💡 Tip: Use tools to explore concepts, then draw your ideas on the canvas!
          </p>
        </div>
      </div>
    </div>
  )
}

export default WidgetPanel
