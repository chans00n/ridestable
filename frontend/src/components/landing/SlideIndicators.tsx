import React from 'react';

interface SlideIndicatorsProps {
  total: number;
  current: number;
  onChange: (index: number) => void;
}

const SlideIndicators: React.FC<SlideIndicatorsProps> = ({ total, current, onChange }) => {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={`h-[3px] rounded-full bg-white transition-all duration-300 ${
            index === current ? 'w-8 opacity-100' : 'w-4 opacity-50'
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default SlideIndicators;