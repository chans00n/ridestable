import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeShowcase: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Theme Showcase</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Current theme: {theme}</span>
          <Button onClick={toggleTheme} variant="outline">
            Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
          </Button>
        </div>
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>All theme colors in current mode</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 rounded bg-background border" />
            <p className="text-sm">Background</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded bg-foreground" />
            <p className="text-sm">Foreground</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded bg-primary" />
            <p className="text-sm">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded bg-secondary" />
            <p className="text-sm">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded bg-muted" />
            <p className="text-sm">Muted</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded bg-accent" />
            <p className="text-sm">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded bg-destructive" />
            <p className="text-sm">Destructive</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded border" />
            <p className="text-sm">Border</p>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>All button variants</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </CardContent>
      </Card>

      {/* Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields and form controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter password" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs Component</CardTitle>
          <CardDescription>Tab navigation example</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
            </TabsContent>
            <TabsContent value="password" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" />
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" defaultValue="English" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Text styles and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <h2 className="text-3xl font-semibold">Heading 2</h2>
          <h3 className="text-2xl font-medium">Heading 3</h3>
          <p className="text-base">Regular paragraph text with normal weight.</p>
          <p className="text-sm text-muted-foreground">Small muted text for descriptions.</p>
          <p className="text-lg font-medium">Large medium text for emphasis.</p>
        </CardContent>
      </Card>
    </div>
  );
};