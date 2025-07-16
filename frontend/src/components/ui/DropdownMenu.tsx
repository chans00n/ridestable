import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  className?: string;
  divider?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  buttonClassName?: string;
  menuClassName?: string;
  placement?: 'left' | 'right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  buttonClassName = '',
  menuClassName = '',
  placement = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      try {
        item.onClick();
        setIsOpen(false);
      } catch (error) {
        console.error('Error executing dropdown item click:', error);
      }
    }
  };

  const placementClasses = {
    left: 'right-0 origin-top-right',
    right: 'left-0 origin-top-left'
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${buttonClassName}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[9999] mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${placementClasses[placement]} ${menuClassName}`}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.divider && index > 0 && (
                  <div className="border-t border-gray-100 my-1" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  disabled={item.disabled}
                  className={`
                    w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors
                    ${item.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${item.className || ''}
                  `}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};