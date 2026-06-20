import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {*} - The debounced value
 */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
      console.log("SetTimer id: ", handler) // <--- ADJUSTED THIS


    };



  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

