'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, requireAuth, router]);

  return {
    user: session?.user,
    token: session?.accessToken,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

export function useRequireAuth(role?: 'CLIENT' | 'ADMIN') {
  const { user, isLoading, isAuthenticated } = useAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && role && user?.role !== role) {
      // Redirect to appropriate dashboard if wrong role
      if (user?.role === 'CLIENT') {
        router.push('/client/dashboard');
      } else if (user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, role, isLoading, isAuthenticated, router]);

  return { user, isLoading, isAuthenticated };
}
