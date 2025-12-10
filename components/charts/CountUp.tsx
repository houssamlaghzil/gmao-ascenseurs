'use client';

/**
 * CountUp - Compteur animé
 * Anime un nombre de 0 à sa valeur finale
 */

import { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function CountUp({
  end,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    countRef.current = 0;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = easeOut * end;
      countRef.current = currentCount;
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, duration]);

  const formattedValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.round(count).toLocaleString('fr-FR');

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
