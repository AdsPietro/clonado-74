import React, { useEffect, useState } from 'react';

interface HighlightCardProps {
  children: React.ReactNode;
  isHighlighted: boolean;
  highlightDuration?: number;
  className?: string;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  children,
  isHighlighted,
  highlightDuration = 3000,
  className = ''
}) => {
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setShowHighlight(true);
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, highlightDuration);

      return () => clearTimeout(timer);
    }
  }, [isHighlighted, highlightDuration]);

  const highlightClasses = showHighlight 
    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-xl transform scale-105 ring-2 ring-green-200" 
    : "bg-white border-gray-200 hover:shadow-lg hover:border-gray-300";

  return (
    <div 
      className={`
        transition-all duration-500 ease-in-out border rounded-xl
        ${highlightClasses} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface AnimatedListItemProps {
  children: React.ReactNode;
  isNew: boolean;
  className?: string;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  isNew,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      // Pequeno delay para permitir que o elemento seja renderizado
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div 
      className={`
        transition-all duration-500 ease-out
        ${isVisible 
          ? 'opacity-100 transform translate-y-0' 
          : 'opacity-0 transform translate-y-4'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};