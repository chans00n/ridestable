import React from 'react';

interface PaymentMethodCardProps {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
  onRemove?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

const brandIcons: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  default: '💳',
};

const brandColors: Record<string, string> = {
  visa: 'bg-blue-50 border-blue-200',
  mastercard: 'bg-red-50 border-red-200',
  amex: 'bg-green-50 border-green-200',
  discover: 'bg-orange-50 border-orange-200',
  default: 'bg-gray-50 border-gray-200',
};

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  id,
  brand,
  last4,
  expMonth,
  expYear,
  isDefault,
  onRemove,
  onSetDefault,
}) => {
  const brandColor = brandColors[brand.toLowerCase()] || brandColors.default;
  const brandIcon = brandIcons[brand.toLowerCase()] || brandIcons.default;

  return (
    <div className={`relative p-4 rounded-lg border ${brandColor} transition-all hover:shadow-md`}>
      {isDefault && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
            Default
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{brandIcon}</span>
          <div>
            <p className="font-medium text-gray-900 capitalize">
              {brand} •••• {last4}
            </p>
            <p className="text-sm text-gray-500">
              Expires {String(expMonth).padStart(2, '0')}/{expYear}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isDefault && onSetDefault && (
            <button
              onClick={() => onSetDefault(id)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Set as default
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};