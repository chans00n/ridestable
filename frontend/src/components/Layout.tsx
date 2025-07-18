import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileDropdown } from './layout/ProfileDropdown'
import { ThemeSwitcher } from './ThemeSwitcher'
import { MobileNavigation } from './layout/MobileNavigation'

export const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAuthPage = ['/login', '/register', '/forgot-password', '/auth/reset-password', '/auth/verify-email'].includes(location.pathname)
  const isLandingPage = location.pathname === '/'
  const hideNavigation = isAuthPage || isLandingPage

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {!hideNavigation && (
        <nav className="bg-card shadow-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center"
                  >
                    <img 
                      src="/logo_black.png" 
                      alt="Stable Ride" 
                      className="h-8 w-8 dark:hidden"
                    />
                    <img 
                      src="/logo_white.png" 
                      alt="Stable Ride" 
                      className="h-8 w-8 hidden dark:block"
                    />
                  </motion.div>
                </Link>
                {user && (
                  <div className="hidden md:ml-10 md:flex md:items-center md:space-x-4">
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname === '/dashboard'
                          ? 'text-primary bg-primary/10'
                          : 'text-foreground hover:text-primary hover:bg-accent'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/booking"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname === '/booking'
                          ? 'text-primary bg-primary/10'
                          : 'text-foreground hover:text-primary hover:bg-accent'
                      }`}
                    >
                      Book a Ride
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Theme Switcher */}
                <ThemeSwitcher />
                
                {user ? (
                  <div className="hidden md:flex md:items-center">
                    <ProfileDropdown />
                  </div>
                ) : (
                  <div className="hidden md:flex md:items-center md:space-x-4">
                    <Link
                      to="/login"
                      className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
                
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {mobileMenuOpen ? (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden"
              >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {user ? (
                    <>
                      <div className="px-3 py-2 text-sm text-foreground border-b border-border">
                        {user.firstName || ''} {user.lastName || ''}
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/booking"
                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Book a Ride
                      </Link>
                      <Link
                        to="/bookings"
                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Bookings
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      )}
      <main>
        <Outlet />
      </main>
      
      {/* Mobile Navigation */}
      {user && <MobileNavigation />}
    </div>
  )
}