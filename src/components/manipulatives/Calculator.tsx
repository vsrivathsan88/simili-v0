import React, { useState } from 'react';
import './Calculator.scss';

interface CalculatorProps {
  result?: string;
  onChange: (data: { result: string; history: string[] }) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ 
  result = '0',
  onChange 
}) => {
  const [display, setDisplay] = useState(result);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const inputNumber = (num: string) => {
    if (waitingForNext) {
      setDisplay(num);
      setWaitingForNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operation) {
      const currentValue = previousValue || '0';
      const newValue = calculate(parseFloat(currentValue), inputValue, operation);
      
      const historyEntry = `${currentValue} ${operation} ${inputValue} = ${newValue}`;
      const newHistory = [...history, historyEntry].slice(-5); // Keep last 5 calculations
      
      setHistory(newHistory);
      setDisplay(String(newValue));
      setPreviousValue(String(newValue));
      
      onChange({
        result: String(newValue),
        history: newHistory
      });
    }

    setWaitingForNext(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(parseFloat(previousValue), inputValue, operation);
      
      const historyEntry = `${previousValue} ${operation} ${inputValue} = ${newValue}`;
      const newHistory = [...history, historyEntry].slice(-5);
      
      setHistory(newHistory);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNext(true);
      
      onChange({
        result: String(newValue),
        history: newHistory
      });
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNext(false);
  };

  const clearHistory = () => {
    setHistory([]);
    onChange({
      result: display,
      history: []
    });
  };

  return (
    <div className="calculator">
      <div className="calculator-display">
        <div className="main-display">{display}</div>
        {operation && previousValue && (
          <div className="operation-display">{previousValue} {operation}</div>
        )}
      </div>
      
      <div className="calculator-buttons">
        {/* Row 1 */}
        <button className="calc-btn clear" onClick={clear}>C</button>
        <button className="calc-btn operation" onClick={() => inputOperation('÷')}>÷</button>
        <button className="calc-btn operation" onClick={() => inputOperation('×')}>×</button>
        <button className="calc-btn operation" onClick={() => inputOperation('-')}>−</button>
        
        {/* Row 2 */}
        <button className="calc-btn number" onClick={() => inputNumber('7')}>7</button>
        <button className="calc-btn number" onClick={() => inputNumber('8')}>8</button>
        <button className="calc-btn number" onClick={() => inputNumber('9')}>9</button>
        <button className="calc-btn operation" onClick={() => inputOperation('+')}>+</button>
        
        {/* Row 3 */}
        <button className="calc-btn number" onClick={() => inputNumber('4')}>4</button>
        <button className="calc-btn number" onClick={() => inputNumber('5')}>5</button>
        <button className="calc-btn number" onClick={() => inputNumber('6')}>6</button>
        <button className="calc-btn equals" onClick={performCalculation}>=</button>
        
        {/* Row 4 */}
        <button className="calc-btn number" onClick={() => inputNumber('1')}>1</button>
        <button className="calc-btn number" onClick={() => inputNumber('2')}>2</button>
        <button className="calc-btn number" onClick={() => inputNumber('3')}>3</button>
        
        {/* Row 5 */}
        <button className="calc-btn number zero" onClick={() => inputNumber('0')}>0</button>
        <button className="calc-btn number" onClick={() => inputNumber('.')}>.</button>
      </div>

      {history.length > 0 && (
        <div className="calculator-history">
          <div className="history-header">
            <span>Recent Calculations</span>
            <button className="clear-history" onClick={clearHistory}>Clear</button>
          </div>
          {history.map((entry, index) => (
            <div key={index} className="history-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calculator;