import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Shield, Lock, Loader2, Home, Users, FileText,
  Activity, BarChart3, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import HouseManagement from '@/components/admin/HouseManagement';
import ResidentApprovals from '@/components/admin/ResidentApprovals';
import ActivityMonitoring from '@/components/admin/ActivityMonitoring';
import FormManagement from '@/components/admin/FormManagement';
import ProgressAnalytics from '@/components/admin/ProgressAnalytics';
import ReportGenerator from '@/components/admin/ReportGenerator';

const ADMIN_CODE = 'JUSTGRACE2026';

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [authorized, setAuthorized] = useState(false);
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

  const handleAccessRequest = () => {
    if (accessCode.toUpperCase() === ADMIN_CODE) {
      setAuthorized(true);
      setError('');
    } else {
      setError('Invalid access code. Access denied.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <GraceCard className="max-w-md w-full text-center">
          <Shield className="w-16 h-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            GFA Admin Portal
          </h2>
          <p className="text-gray-600 mb-6">
            Restricted access. Staff and house managers only.
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Staff Sign In
          </Button>
        </GraceCard>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <GraceCard className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              GFA Admin Portal
            </h2>
            <p className="text-gray-600">
              Enter the secure admin access code
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Access Code
              </label>
              <div className="flex gap-3">
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAccessRequest()}
                  className="uppercase font-mono"
                />
                <Button
                  onClick={handleAccessRequest}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Key className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
              >
                {error}
              </motion.div>
            )}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              🔒 This portal is for authorized GFA staff and house managers only. 
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </GraceCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="GFA Admin Portal"
          subtitle="Recovery house management, resident oversight, and analytics"
          icon={Shield}
        />

        <Tabs defaultValue="houses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="houses">
              <Home className="w-4 h-4 mr-2" />
              Houses
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <Users className="w-4 h-4 mr-2" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="forms">
              <FileText className="w-4 h-4 mr-2" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="houses">
            <HouseManagement user={user} />
          </TabsContent>

          <TabsContent value="approvals">
            <ResidentApprovals user={user} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityMonitoring user={user} />
          </TabsContent>

          <TabsContent value="forms">
            <FormManagement user={user} />
          </TabsContent>

          <TabsContent value="analytics">
            <ProgressAnalytics user={user} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportGenerator user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}