import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  UserCircleIcon,
  MapPinIcon,
  BellIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

export const ProfileLayout: React.FC = () => {
  const navItems = [
    { path: '/profile', label: 'General', icon: UserCircleIcon, exact: true },
    { path: '/profile/locations', label: 'Saved Locations', icon: MapPinIcon },
    { path: '/profile/notifications', label: 'Notifications', icon: BellIcon },
    { path: '/profile/payment-methods', label: 'Payment Methods', icon: CreditCardIcon }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Account Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card shadow rounded-lg">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};