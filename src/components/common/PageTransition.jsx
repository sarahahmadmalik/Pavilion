import React, { useEffect, useRef, useState } from 'react';

/**
 * PageTransition
 * Wraps page content and animates in/out on page change.
 * Uses a CSS-driven fade+slide-up approach for snappy, smooth transitions.
 */
export const PageTransition = ({ pageKey, children }) => {
  const [display, setDisplay] = useState(children);
  const [animClass, setAnimClass] = useState('page-enter-active');
  const prevKeyRef = useRef(pageKey);

  useEffect(() => {
    if (prevKeyRef.current === pageKey) return;
    prevKeyRef.current = pageKey;

    // Exit animation
    setAnimClass('page-exit-active');

    const exitTimeout = setTimeout(() => {
      // Swap content, then trigger enter
      setDisplay(children);
      setAnimClass('page-enter');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimClass('page-enter-active');
        });
      });
    }, 130); // Exit duration

    return () => clearTimeout(exitTimeout);
  }, [pageKey, children]);

  return (
    <div className={`page-transition ${animClass}`}>
      {display}
    </div>
  );
};
