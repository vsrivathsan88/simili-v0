'use client'

import { useRef, useState, useCallback } from 'react'
import Draggable from 'react-draggable'
import AccessibleButton from './AccessibleButton'

interface CalculatorProps {
  id: string
  x?: number
  y?: number
  onRemove?: (id: string) => void
}

const Calculator = ({ id, x = 100, y = 100, onRemove }: CalculatorProps) => {
  const nodeRef = useRef(null)
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)

  const inputNumber = useCallback((num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }, [display, waitingForNewValue])

  const inputOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForNewValue(true)
    setOperation(nextOperation)
  }, [display, previousValue, operation])

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '×':
        return firstValue * secondValue
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0
      default:
        return secondValue
    }
  }

  const performCalculation = useCallback(() => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }, [display, previousValue, operation])

  const clearDisplay = useCallback(() => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }, [])

  const clearEntry = useCallback(() => {
    setDisplay('0')
    setWaitingForNewValue(false)
  }, [])

  const inputDecimal = useCallback(() => {
    if (waitingForNewValue) {
      setDisplay('0.')
      setWaitingForNewValue(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }, [display, waitingForNewValue])

  const buttons = [
    { label: 'C', onClick: clearDisplay, className: 'bg-red-500 hover:bg-red-600 text-white' },
    { label: 'CE', onClick: clearEntry, className: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { label: '÷', onClick: () => inputOperation('÷'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '×', onClick: () => inputOperation('×'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    
    { label: '7', onClick: () => inputNumber('7'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '8', onClick: () => inputNumber('8'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '9', onClick: () => inputNumber('9'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '-', onClick: () => inputOperation('-'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    
    { label: '4', onClick: () => inputNumber('4'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '5', onClick: () => inputNumber('5'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '6', onClick: () => inputNumber('6'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '+', onClick: () => inputOperation('+'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    
    { label: '1', onClick: () => inputNumber('1'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '2', onClick: () => inputNumber('2'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '3', onClick: () => inputNumber('3'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '=', onClick: performCalculation, className: 'bg-green-500 hover:bg-green-600 text-white row-span-2' },
    
    { label: '0', onClick: () => inputNumber('0'), className: 'bg-gray-100 hover:bg-gray-200 text-gray-800 col-span-2' },
    { label: '.', onClick: inputDecimal, className: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
  ]

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x, y }}
      handle=".drag-handle"
    >
      <div 
        ref={nodeRef}
        className="absolute z-10 bg-white/95 rounded-lg shadow-lg border border-gray-200 p-3"
        style={{ width: 200 }}
      >
        {/* Header */}
        <div className="drag-handle cursor-move bg-gray-50 -m-3 mb-2 p-2 rounded-t-lg border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Calculator</span>
          <AccessibleButton
            onClick={() => onRemove?.(id)}
            className="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            aria-label="Remove"
          >
            ×
          </AccessibleButton>
        </div>

        {/* Display */}
        <div className="bg-gray-900 text-white p-3 rounded-lg mb-3 text-right font-mono text-lg">
          {display}
        </div>

        {/* Button Grid */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                button.onClick()
              }}
              className={`p-2 rounded text-sm font-medium transition-colors ${button.className}`}
              aria-label={button.label}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </Draggable>
  )
}

export default Calculator