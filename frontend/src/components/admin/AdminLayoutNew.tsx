import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut,
  Shield,
  BarChart3,
  FileText,
  ChevronsUpDown,
  Plus,
  Moon,
  Sun,
  Map,
  Plug,
  Mail,
  MessageSquare
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showToast } from '@/components/ui/Toast';
import { adminApi } from '@/services/adminApi';
import { useTheme } from '@/contexts/ThemeContext';

const navigation = [
  {
    title: "Overview",
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Financial', href: '/admin/financial', icon: DollarSign },
      { name: 'Pricing', href: '/admin/pricing', icon: Settings },
      { name: 'Business Hours', href: '/admin/business-hours', icon: Calendar },
      { name: 'Service Areas', href: '/admin/service-areas', icon: Map },
      { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
      { name: 'SMS Templates', href: '/admin/sms-templates', icon: MessageSquare },
      { name: 'Policies', href: '/admin/policies', icon: FileText },
    ]
  },
  {
    title: "Administration",
    items: [
      { name: 'Admin Users', href: '/admin/users', icon: Shield },
      { name: 'Integrations', href: '/admin/integrations', icon: Plug },
      { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export default function AdminLayoutNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link to="/admin/dashboard">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Shield className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold text-foreground">Stable Ride</span>
                      <span className="text-xs text-muted-foreground">Admin Portal</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {navigation.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={location.pathname === item.href}
                          tooltip={item.name}
                        >
                          <Link to={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src="/placeholder-avatar.jpg" alt={adminUser.firstName} />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(adminUser.firstName, adminUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {adminUser.firstName} {adminUser.lastName}
                        </span>
                        <span className="truncate text-xs">{adminUser.email}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src="/placeholder-avatar.jpg" alt={adminUser.firstName} />
                          <AvatarFallback className="rounded-lg">
                            {getInitials(adminUser.firstName, adminUser.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {adminUser.firstName} {adminUser.lastName}
                          </span>
                          <span className="truncate text-xs">{adminUser.email}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            Role: {adminUser.role?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/security">Security</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center gap-2">
              <h1 className="text-lg font-semibold">Admin Portal</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              
              {/* Quick actions */}
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}