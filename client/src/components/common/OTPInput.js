import React, { useState, useRef, useEffect } from 'react';

const OTPInput = ({ length = 6, onComplete, disabled = false, error = false }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }


    if (newOtp.every(digit => digit !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {

    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain');
    const pasteArray = pasteData.slice(0, length).split('');
    
    if (pasteArray.every(char => !isNaN(char))) {
      const newOtp = [...otp];
      pasteArray.forEach((char, index) => {
        if (index < length) {
          newOtp[index] = char;
        }
      });
      setOtp(newOtp);
      
      
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      
   
      if (newOtp.every(digit => digit !== '') && onComplete) {
        onComplete(newOtp.join(''));
      }
    }
  };

  const clearOtp = () => {
    setOtp(new Array(length).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-2 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e.target, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
              focus:outline-none focus:ring-2 transition-colors
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }
              ${disabled 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-gray-900 hover:border-gray-400'
              }
              dark:bg-dark-card dark:border-gray-600 dark:text-white
              dark:focus:border-accent-blue dark:focus:ring-accent-blue/20
            `}
          />
        ))}
      </div>
      
      {otp.some(digit => digit !== '') && (
        <button
          type="button"
          onClick={clearOtp}
          disabled={disabled}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default OTPInput;