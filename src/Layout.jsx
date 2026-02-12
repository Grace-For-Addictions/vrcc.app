import React, { useState, useEffect } from 'react';
import { useBeepurpleSync } from '@/components/beepurple/BeepurpleSync';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, MapPin, Heart, Calendar, Brain,
  Compass, MessageCircle, Sparkles, Menu, X,
  Phone, LogOut, User, ChevronDown, Shield, Award, Car, Sprout } from
'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import IntakeRequired from '@/components/intake/IntakeRequired';
import MandatoryIntakeModal from '@/components/intake/MandatoryIntakeModal';
import { getRoleNavItems } from '@/components/navigation/RoleBasedNav';

const navItems = [
  { name: 'Home', href: 'Home', icon: Home },
  { name: 'Community', href: 'Community', icon: Users },
  { name: 'Resources', href: 'Resources', icon: MapPin },
  { name: 'Walls', href: 'CommunityWalls', icon: Heart },
  { name: 'Events', href: 'Events', icon: Calendar },
  { name: 'Brain Science', href: 'Neuroplasticity', icon: Brain },
  { name: 'Recovery Garden', href: 'RecoveryGarden', icon: Sparkles },
  { name: 'Gamification', href: 'Gamification', icon: Award },
  { name: 'Assessment', href: 'Assessment', icon: Compass }
];

const adminNavItems = [
  { name: 'Admin Analytics', href: 'AdminDashboard', icon: Shield },
  { name: 'RecoveryCon Portal', href: 'GovDashPortal', icon: Award }
];


export default function Layout({ children, currentPageName }) {
  useBeepurpleSync(); // Enable bidirectional Beepurple sync
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [needsIntake, setNeedsIntake] = useState(false);
  const [allowedNav, setAllowedNav] = useState({ show: [], hide: [] });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load profile for readiness gating
        const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
        const userProfile = profiles[0] || null;
        setProfile(userProfile);
        
        // Calculate allowed navigation with full RBAC
        const nav = getRoleNavItems(
          currentUser.user_role || 'participant',
          currentUser.role === 'admin' || currentUser.user_role === 'administrator',
          userProfile?.readiness_level || 1,
          userProfile?.consent_acknowledged || false
        );
        setAllowedNav(nav);
        
        // Check if intake is required
        if (!currentUser.intake_completed) {
          setNeedsIntake(true);
        }
      } catch (e) {
        // Not logged in - show public nav
        setAllowedNav(getRoleNavItems(null, false));
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  // Block access if intake not completed
  if (user && needsIntake) {
    return (
      <MandatoryIntakeModal
        user={user} 
        onComplete={() => {
          setNeedsIntake(false);
          setUser({ ...user, intake_completed: true });
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --teal-500: #14b8a6;
          --teal-600: #0d9488;
          --coral-500: #f97316;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-gray-900 mt-12 font-bold rounded">Grace For Addictions</div>
                <div className="text-teal-600 pt-5 text-xs">Powered by Wix/Base44</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems
                .filter(item => allowedNav.show === 'ALL' || 
                               (allowedNav.show.includes(item.href) && !allowedNav.hide.includes(item.href)))
                .map((item) =>
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPageName === item.href ?
                'bg-teal-50 text-teal-700' :
                'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                }>

                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )}

              {(user?.role === 'admin' || user?.user_role === 'administrator' || user?.user_role === 'executive') && 
               adminNavItems
                .filter(item => allowedNav.show === 'ALL' || allowedNav.show.includes(item.href))
                .map((item) =>
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPageName === item.href ?
                'bg-red-50 text-red-700 border border-red-200' :
                'text-red-600 hover:bg-red-50'}`
                }>

                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Crisis Button */}
              <Link to={createPageUrl('Crisis')}>
                <Button variant="outline" size="sm" className="hidden sm:flex text-orange-600 border-orange-200 hover:bg-orange-50">
                  <Phone className="w-4 h-4 mr-2" />
                  Crisis Help
                </Button>
              </Link>

              {/* Chat with Grace */}
              <Link to={createPageUrl('GraceChat')}>
                <Button size="sm" className="hidden md:flex bg-teal-600 hover:bg-teal-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with Grace
                </Button>
              </Link>

              {/* User Menu */}
              {user ?
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="hidden md:inline text-sm font-medium">{user.full_name}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('PeerMatching')} className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Grace Match
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Assessment')} className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        My Assessment
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('MyServicePortal')} className="flex items-center">
                        <Sprout className="w-4 h-4 mr-2" />
                        My Service Portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> :

              <Button
                size="sm"
                variant="outline"
                onClick={() => base44.auth.redirectToLogin()}>

                  Sign In
                </Button>
              }

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>

                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-100 bg-white">

              <nav className="px-4 py-4 space-y-1">
                {navItems
                  .filter(item => allowedNav.show === 'ALL' || 
                                 (allowedNav.show.includes(item.href) && !allowedNav.hide.includes(item.href)))
                  .map((item) =>
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentPageName === item.href ?
                'bg-teal-50 text-teal-700' :
                'text-gray-600 hover:bg-gray-50'}`
                }>

                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
              )}
                <div className="pt-4 space-y-2">
                  <Link to={createPageUrl('Crisis')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-orange-600 border-orange-200">
                      <Phone className="w-4 h-4 mr-2" />
                      Crisis Help
                    </Button>
                  </Link>
                  <Link to={createPageUrl('GraceChat')} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with Grace
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          }
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Grace For Addictions</div>
                  <div className="text-xs text-gray-500">Virtual Recovery Community Center</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 max-w-md">
                A free, non-judgmental virtual recovery community serving all 99 Iowa counties. 
                Peer-led support for mental health, substance use, and justice challenges.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">No Fees</span>
                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">No Stigma</span>
                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">Just Grace</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={createPageUrl('Community')} className="text-gray-600 hover:text-teal-600">Community</Link></li>
                <li><Link to={createPageUrl('Resources')} className="text-gray-600 hover:text-teal-600">Resources</Link></li>
                <li><Link to={createPageUrl('Events')} className="text-gray-600 hover:text-teal-600">Events</Link></li>
                <li><Link to={createPageUrl('Neuroplasticity')} className="text-gray-600 hover:text-teal-600">Brain Science</Link></li>
              </ul>
            </div>

            {/* Crisis */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Crisis Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="tel:988" className="text-orange-600 hover:text-orange-700 font-medium">
                    988 Crisis Lifeline
                  </a>
                </li>
                <li>
                  <a href="tel:8447759276" className="text-gray-600 hover:text-teal-600">
                    Iowa Warm Line: 844-775-9276
                  </a>
                </li>
                <li>
                  <Link to={createPageUrl('Crisis')} className="text-gray-600 hover:text-teal-600">
                    More Crisis Resources
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Grace For Addictions. Powered by Wix/Base44.
            </p>
            <p className="text-sm text-gray-400">
              Community Rewires the Brain • Recovery is Possible 💚
            </p>
          </div>
        </div>
      </footer>
    </div>);

}