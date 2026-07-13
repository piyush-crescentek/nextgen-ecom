'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  cursorClassName?: string;
  onComplete?: () => void;
}

export default function TypingAnimation({
  text,
  speed = 100,
  className = '',
  showCursor = true,
  cursorClassName = '',
  onComplete
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span
          className={`inline-block w-0.5 h-[1em] bg-current ml-1 ${isComplete ? 'animate-blink' : 'opacity-100'
            } ${cursorClassName}`}
        />
      )}
    </span>
  );
}