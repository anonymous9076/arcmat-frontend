// src/components/auth/RoleGuard.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ClipLoader } from 'react-spinners';

const RoleGuard = ({ children, allowedRoles = [] }) => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete
    // 1. Check if user is logged in
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // 2. Check if user has the correct role (if roles are specified)
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      router.replace('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, allowedRoles, router, loading]);

  // Show a loader while checking logic to prevent flashing content
  // if (loading) {
  //   return (
  //     <div className="h-screen w-full flex items-center justify-center">
  //       <ClipLoader size={30} color="#D9A88A" />
  //     </div>
  //   );
  // }

  return <>{children}</>;
};

export default RoleGuard;