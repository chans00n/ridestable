import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Plus, 
  Briefcase, 
  Home,
  Calendar,
  ChevronRight,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { showToast } from '../components/ui/Toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Get random fun message
const getFunMessage = (name: string) => {
  const messages = [
    `${getGreeting()}, ${name}!`,
    `Hey there, ${name}!`,
    `Welcome back, ${name}!`,
    `Ready to ride, ${name}?`,
    `Let's go places, ${name}!`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  placeId?: string;
  icon: 'home' | 'work' | 'custom';
}

export const DashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchSavedLocations();
  }, []);

  const fetchSavedLocations = async () => {
    try {
      const response = await api.get('/dashboard/locations');
      // Transform the API response to match our interface
      const locations = response.data.data.items.map((loc: any) => ({
        id: loc.id,
        name: loc.type === 'HOME' ? 'Home' : loc.type === 'WORK' ? 'Work' : loc.name,
        address: loc.address,
        placeId: loc.placeId,
        icon: loc.type.toLowerCase() as 'home' | 'work' | 'custom'
      }));
      setSavedLocations(locations);
    } catch (error) {
      console.error('Failed to load saved locations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = () => {
    navigate('/booking');
  };

  const handleScheduleAhead = () => {
    navigate('/booking');
  };

  const handleRequestForFriend = () => {
    navigate('/booking', { state: { forFriend: true } });
  };

  const handleSavedLocationClick = (location: SavedLocation) => {
    navigate('/booking', { 
      state: { 
        dropoffAddress: location.address,
        dropoffPlaceId: location.placeId 
      } 
    });
  };

  const handleAddLocation = (type: 'work' | 'custom') => {
    navigate('/profile/locations', { state: { addType: type } });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section with Greeting */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-8 pb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground mb-6"
        >
          {getFunMessage(user?.firstName || 'there')}
        </motion.h1>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div 
            className="relative"
            onClick={handleQuickSearch}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Where are you going?"
              className="pl-12 pr-4 py-6 text-lg bg-card border-border cursor-pointer"
              readOnly
              onFocus={(e) => {
                e.preventDefault();
                handleQuickSearch();
              }}
            />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-2 gap-3 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            className="justify-start gap-2 py-3"
            onClick={handleScheduleAhead}
          >
            <Calendar className="h-4 w-4" />
            Schedule ahead
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 py-3"
            onClick={handleRequestForFriend}
          >
            <Plus className="h-4 w-4" />
            Request for a friend
          </Button>
        </motion.div>
      </div>

      <div className="px-4 space-y-6">
        {/* Saved Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-3">
            {/* Work Location */}
            {savedLocations.find(loc => loc.icon === 'work') ? (
              <button
                onClick={() => handleSavedLocationClick(savedLocations.find(loc => loc.icon === 'work')!)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Work</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {savedLocations.find(loc => loc.icon === 'work')?.address}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <button
                onClick={() => handleAddLocation('work')}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Work</p>
                  <p className="text-sm text-muted-foreground">Add shortcut</p>
                </div>
                <Plus className="h-5 w-5 text-muted-foreground" />
              </button>
            )}

            {/* Custom Shortcuts */}
            {savedLocations.filter(loc => loc.icon === 'custom').slice(0, 2).map((location) => (
              <button
                key={location.id}
                onClick={() => handleSavedLocationClick(location)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{location.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {location.address}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}

            {/* Add Custom Shortcut */}
            <button
              onClick={() => handleAddLocation('custom')}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Custom shortcut</p>
                <p className="text-sm text-muted-foreground">Add shortcut</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Schedule Ahead CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Plan ahead. Ride relaxed.
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed mb-4">
                    Schedule your ride to the airport. Get up to $100 in credit if it's 10+ min late. 
                    That's our on-time pickup promise. Terms apply.
                  </p>
                  <Button
                    variant="secondary"
                    className="bg-white text-orange-600 hover:bg-white/90"
                    onClick={handleScheduleAhead}
                  >
                    Schedule a ride →
                  </Button>
                </div>
                <div className="hidden sm:block">
                  <div className="w-32 h-32 bg-white/20 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Location Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">You are here</h3>
            <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};