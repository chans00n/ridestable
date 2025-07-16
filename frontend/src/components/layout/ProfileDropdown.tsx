import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon,
  Cog6ToothIcon,
  MapPinIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: UserCircleIcon,
      onClick: () => {
        navigate('/profile');
        setIsOpen(false);
      }
    },
    {
      label: 'Saved Locations',
      icon: MapPinIcon,
      onClick: () => {
        navigate('/profile/locations');
        setIsOpen(false);
      }
    },
    {
      label: 'Notification Preferences',
      icon: BellIcon,
      onClick: () => {
        navigate('/profile/notifications');
        setIsOpen(false);
      }
    },
    {
      label: 'Account Settings',
      icon: Cog6ToothIcon,
      onClick: () => {
        navigate('/profile/settings');
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-primary focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <span className="hidden md:block">{user.firstName} {user.lastName}</span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-card ring-1 ring-border z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>

          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 text-muted-foreground" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};