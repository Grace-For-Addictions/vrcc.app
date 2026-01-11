import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Role-based page guard wrapper
export default function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requireAdmin = false,
  pageName = "this page"
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Admin always has access
        if (currentUser.role === 'admin' || currentUser.user_role === 'administrator') {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Check if user's role is in allowed list
        if (requireAdmin) {
          setHasAccess(false);
        } else if (allowedRoles.length === 0) {
          setHasAccess(true); // No restrictions
        } else {
          setHasAccess(
            allowedRoles.includes(currentUser.user_role) ||
            allowedRoles.includes(currentUser.role)
          );
        }
      } catch (e) {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [allowedRoles, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-400 animate-pulse mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h1>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access {pageName}. This area is restricted to authorized staff members.
          </p>

          <Link to={createPageUrl('Home')}>
            <Button className="bg-teal-600 hover:bg-teal-700">
              Return to Home
            </Button>
          </Link>

          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact your administrator.
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}