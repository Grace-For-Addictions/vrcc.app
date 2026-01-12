import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { hasPermission, hasConditionalPermission } from './PermissionHelper';
import { AlertCircle } from 'lucide-react';

// Component-level permission check
export default function PermissionCheck({ 
  children, 
  object, 
  action, 
  context = {},
  fallback = null,
  showDenied = false
}) {
  const [user, setUser] = useState(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkPerm = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const userRole = currentUser.user_role || currentUser.role;
        const hasAccess = context.created_by || context.assigned_coach
          ? hasConditionalPermission(userRole, object, action, {
              ...context,
              current_user_email: currentUser.email
            })
          : hasPermission(userRole, object, action);
        
        setAllowed(hasAccess);
      } catch (e) {
        setAllowed(false);
      }
    };
    
    checkPerm();
  }, [object, action, context]);

  if (!allowed) {
    if (showDenied) {
      return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-sm text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span>You don't have permission to {action} {object}</span>
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}