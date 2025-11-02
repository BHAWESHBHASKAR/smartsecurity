import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import api from './api';
import type { User, AuthResponse } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'client-credentials',
      name: 'Client Login',
      credentials: {
        emailOrPhone: { label: 'Email/Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailOrPhone: credentials.emailOrPhone,
              password: credentials.password,
              role: 'CLIENT',
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return null;
          }

          const authData: AuthResponse = data.data;

          return {
            id: authData.user.id,
            email: authData.user.email,
            phone: authData.user.phone,
            role: authData.user.role,
            token: authData.token,
            refreshToken: authData.refreshToken,
            store: authData.user.store,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Login',
      credentials: {
        emailOrPhone: { label: 'Email/Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailOrPhone: credentials.emailOrPhone,
              password: credentials.password,
              role: 'ADMIN',
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return null;
          }

          const authData: AuthResponse = data.data;

          return {
            id: authData.user.id,
            email: authData.user.email,
            phone: authData.user.phone,
            role: authData.user.role,
            token: authData.token,
            refreshToken: authData.refreshToken,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || '';
        token.email = user.email || '';
        token.role = user.role || 'CLIENT';
        token.accessToken = user.token || '';
        token.refreshToken = user.refreshToken || '';
        token.store = user.store;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          role: token.role as 'CLIENT' | 'ADMIN',
          store: token.store as any,
        };
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
