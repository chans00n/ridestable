import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, CalendarDays, User } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: 'Rides',
    icon: <Car className="h-5 w-5" />,
    href: '/dashboard'
  },
  {
    label: 'Trips',
    icon: <CalendarDays className="h-5 w-5" />,
    href: '/bookings'
  },
  {
    label: 'You',
    icon: <User className="h-5 w-5" />,
    href: '/profile'
  }
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href === '/dashboard' && location.pathname === '/');
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 
                transition-colors relative
                ${isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
              )}
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};