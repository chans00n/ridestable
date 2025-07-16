import React, { useState } from 'react';
import { formatCurrency } from '../../utils/format';

interface GratuitySelectorProps {
  subtotal: number;
  selectedPercentage: number;
  onPercentageChange: (percentage: number) => void;
}

export const GratuitySelector: React.FC<GratuitySelectorProps> = ({
  subtotal,
  selectedPercentage,
  onPercentageChange,
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const presetOptions = [15, 18, 20, 25];
  const gratuityAmount = subtotal * (selectedPercentage / 100);

  const handlePresetClick = (percentage: number) => {
    setIsCustom(false);
    setCustomValue('');
    onPercentageChange(percentage);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setCustomValue(selectedPercentage.toString());
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const percentage = parseFloat(value) || 0;
    if (percentage >= 0 && percentage <= 100) {
      onPercentageChange(percentage);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Gratuity for Driver
        </label>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(gratuityAmount)}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {presetOptions.map((percentage) => (
          <button
            key={percentage}
            type="button"
            onClick={() => handlePresetClick(percentage)}
            className={`
              py-2 px-3 rounded-lg text-sm font-medium transition-all
              ${selectedPercentage === percentage && !isCustom
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
              }
            `}
          >
            {percentage}%
          </button>
        ))}
        
        <button
          type="button"
          onClick={handleCustomClick}
          className={`
            py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${isCustom
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
            }
          `}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Enter percentage"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        100% of the gratuity goes to your driver
      </p>
    </div>
  );
};