import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeTest: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="p-4 border border-border bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-2">Theme Test</h3>
      <p>Current theme: <span className="font-mono">{theme}</span></p>
      <p>Background: <span className="bg-background text-foreground px-2 py-1 rounded">bg-background</span></p>
      <p>Card: <span className="bg-card text-card-foreground px-2 py-1 rounded">bg-card</span></p>
      <p>Muted: <span className="bg-muted text-muted-foreground px-2 py-1 rounded">bg-muted</span></p>
      <p>Primary: <span className="bg-primary text-primary-foreground px-2 py-1 rounded">bg-primary</span></p>
    </div>
  );
};