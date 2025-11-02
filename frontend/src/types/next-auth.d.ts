import 'next-auth';
import type { Store } from './index';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    phone?: string;
    role: 'CLIENT' | 'ADMIN';
    token?: string;
    refreshToken?: string;
    store?: Store;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: 'CLIENT' | 'ADMIN';
      store?: Store;
    };
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: 'CLIENT' | 'ADMIN';
    accessToken: string;
    refreshToken: string;
    store?: Store;
  }
}
