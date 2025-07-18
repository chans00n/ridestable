import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  MapPin, 
  Bell, 
  CreditCard, 
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';

interface ProfileMenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  action?: () => void;
  destructive?: boolean;
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems: ProfileMenuItem[] = [
    {
      icon: <User className="h-5 w-5" />,
      label: 'General Information',
      href: '/profile/general'
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: 'Saved Locations',
      href: '/profile/locations'
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: 'Notifications',
      href: '/profile/notifications'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Payment Methods',
      href: '/profile/payment-methods'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: 'Privacy & Security',
      href: '/profile/security'
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: 'Help & Support',
      href: '/help'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'Settings',
      href: '/settings'
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      label: 'Sign Out',
      action: logout,
      destructive: true
    }
  ];

  const handleMenuClick = (item: ProfileMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Member since {new Date(user?.createdAt || '').toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuClick(item)}
                  className={`
                    w-full flex items-center justify-between p-4 
                    hover:bg-accent transition-colors text-left
                    ${item.destructive ? 'text-destructive hover:bg-destructive/10' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {!item.action && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* App Version */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Stable Ride v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};