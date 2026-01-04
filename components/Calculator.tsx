import React, { useState } from 'react';
import { Delete, Eraser, Equal } from 'lucide-react';

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setWaitingForOperand(false);
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (expression && !waitingForOperand) {
       // Simple eval for basic operations (safe in this context as input is controlled)
       try {
         // Replace visual 'x' with '*' for calculation
         const sanitizedExpression = expression.replace(/×/g, '*') + inputValue;
         // eslint-disable-next-line
         const result = eval(sanitizedExpression); 
         setDisplay(String(result));
         setExpression(String(result) + ' ' + nextOperator + ' ');
       } catch (e) {
         setDisplay('Erro');
       }
    } else {
      setExpression(display + ' ' + nextOperator + ' ');
    }
    setWaitingForOperand(true);
  };

  const calculate = () => {
     if (expression && !waitingForOperand) {
       try {
         const sanitizedExpression = expression.replace(/×/g, '*') + display;
         // eslint-disable-next-line
         const result = eval(sanitizedExpression);
         setDisplay(String(result));
         setExpression('');
         setWaitingForOperand(true);
       } catch (e) {
         setDisplay('Erro');
       }
     }
  };

  const handleDelete = () => {
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const btnClass = "h-16 w-full text-2xl font-semibold rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-sm";
  const numBtn = `${btnClass} bg-white text-gray-800 border border-gray-200`;
  const opBtn = `${btnClass} bg-brand-100 text-brand-700`;
  const equalBtn = `${btnClass} bg-brand-600 text-white`;

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50">
      <div className="flex-1 flex flex-col justify-end items-end bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="text-gray-400 text-lg h-6 mb-2">{expression}</div>
        <div className="text-5xl font-bold text-gray-800 break-all">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button onClick={clear} className={`${btnClass} bg-red-100 text-red-600 col-span-2`}>AC</button>
        <button onClick={handleDelete} className={opBtn}><Delete size={24} /></button>
        <button onClick={() => performOperation('/')} className={opBtn}>÷</button>

        <button onClick={() => inputDigit('7')} className={numBtn}>7</button>
        <button onClick={() => inputDigit('8')} className={numBtn}>8</button>
        <button onClick={() => inputDigit('9')} className={numBtn}>9</button>
        <button onClick={() => performOperation('×')} className={opBtn}>×</button>

        <button onClick={() => inputDigit('4')} className={numBtn}>4</button>
        <button onClick={() => inputDigit('5')} className={numBtn}>5</button>
        <button onClick={() => inputDigit('6')} className={numBtn}>6</button>
        <button onClick={() => performOperation('-')} className={opBtn}>-</button>

        <button onClick={() => inputDigit('1')} className={numBtn}>1</button>
        <button onClick={() => inputDigit('2')} className={numBtn}>2</button>
        <button onClick={() => inputDigit('3')} className={numBtn}>3</button>
        <button onClick={() => performOperation('+')} className={opBtn}>+</button>

        <button onClick={() => inputDigit('0')} className={`${numBtn} col-span-2`}>0</button>
        <button onClick={inputDot} className={numBtn}>.</button>
        <button onClick={calculate} className={equalBtn}><Equal size={28} /></button>
      </div>
    </div>
  );
};
