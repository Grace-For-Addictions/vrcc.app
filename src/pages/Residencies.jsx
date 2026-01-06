import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Shield, Lock, Loader2, AlertCircle,
  QrCode, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import ProgressDashboard from '@/components/residency/ProgressDashboard';
import EventLogger from '@/components/residency/EventLogger';
import ResidentMessaging from '@/components/residency/ResidentMessaging';
import PaymentsBilling from '@/components/residency/PaymentsBilling';
import ResidentForms from '@/components/residency/ResidentForms';

export default function Residencies() {
  const [user, setUser] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  // Check if user has resident profile
  const { data: residentProfile, isLoading } = useQuery({
    queryKey: ['residentProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.ResidentProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: house } = useQuery({
    queryKey: ['recoveryHouse', residentProfile?.house_id],
    queryFn: async () => {
      if (!residentProfile?.house_id) return null;
      const houses = await base44.entities.RecoveryHouse.filter({ id: residentProfile.house_id });
      return houses[0] || null;
    },
    enabled: !!residentProfile?.house_id
  });

  const handleRequestAccess = async () => {
    if (!accessCode.trim()) {
      setError('Please enter a valid house code');
      return;
    }

    setRequesting(true);
    setError('');

    try {
      // Verify house exists
      const houses = await base44.entities.RecoveryHouse.filter({ house_code: accessCode.toUpperCase() });
      
      if (houses.length === 0) {
        setError('Invalid house code. Please check and try again.');
        setRequesting(false);
        return;
      }

      const targetHouse = houses[0];

      // Create pending resident profile
      await base44.entities.ResidentProfile.create({
        user_email: user.email,
        house_id: targetHouse.id,
        resident_status: 'pending_approval',
        intake_date: new Date().toISOString().split('T')[0]
      });

      setError('');
      alert('Access request submitted! You will be notified once approved by staff.');
    } catch (err) {
      setError('Error submitting request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <GraceCard className="max-w-md w-full text-center">
          <Lock className="w-16 h-16 mx-auto text-teal-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            GFA Recovery Residents Portal
          </h2>
          <p className="text-gray-600 mb-6">
            Sign in to access your personalized recovery housing dashboard
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            Sign In to Continue
          </Button>
        </GraceCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  // Pending approval state
  if (residentProfile && residentProfile.resident_status === 'pending_approval') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <GraceCard className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Shield className="w-20 h-20 mx-auto text-amber-500 mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Request Pending</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your access request has been submitted to the house staff for verification.
              You'll receive a notification once approved.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 border border-amber-200 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-amber-900">Awaiting Staff Approval</span>
            </div>
          </GraceCard>
        </div>
      </div>
    );
  }

  // Access request form
  if (!residentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <GraceCard>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Home className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                GFA Recovery Residents Portal
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A secure, exclusive space for GFA recovery housing residents. 
                Track your progress, connect with housemates, and manage your journey—all in one place.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Secure Access Required
                </h3>
                <p className="text-sm text-blue-800">
                  Enter the unique 6-character house code provided during your intake, 
                  or scan the QR code posted in your recovery house.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Access Code
                  </label>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter 6-character code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="uppercase font-mono text-lg tracking-widest"
                    />
                    <Button
                      onClick={handleRequestAccess}
                      disabled={requesting || accessCode.length !== 6}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {requesting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Key className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                <div className="text-center">
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan House QR Code
                  </Button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Don't have a code?</h4>
                <p className="text-sm text-gray-600">
                  Contact your house manager or intake coordinator. If you're exploring GFA housing, 
                  visit our main residencies page to learn more about available options.
                </p>
              </div>
            </div>
          </GraceCard>
        </div>
        <GraceChatWidget />
      </div>
    );
  }

  // Main portal (only for approved residents)
  if (residentProfile.resident_status === 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <GraceHeader 
            title={`Welcome to ${house?.house_name || 'Your Recovery House'}`}
            subtitle="Your secure resident portal for progress tracking, connection, and support"
            icon={Home}
          />

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="events">Log Events</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <ProgressDashboard 
                residentProfile={residentProfile} 
                house={house}
                user={user}
              />
            </TabsContent>

            <TabsContent value="events">
              <EventLogger 
                residentProfile={residentProfile}
                house={house}
              />
            </TabsContent>

            <TabsContent value="messages">
              <ResidentMessaging 
                residentProfile={residentProfile}
                house={house}
                user={user}
              />
            </TabsContent>

            <TabsContent value="billing">
              <PaymentsBilling 
                residentProfile={residentProfile}
                house={house}
              />
            </TabsContent>

            <TabsContent value="forms">
              <ResidentForms 
                residentProfile={residentProfile}
                house={house}
              />
            </TabsContent>
          </Tabs>
        </div>
        <GraceChatWidget />
      </div>
    );
  }

  return null;
}