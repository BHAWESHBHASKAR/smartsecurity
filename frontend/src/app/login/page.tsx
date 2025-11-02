'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateEmail, validatePhone } from '@/lib/validation';

type LoginRole = 'CLIENT' | 'ADMIN';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginRole>('CLIENT');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone is required';
    } else if (!validateEmail(emailOrPhone) && !validatePhone(emailOrPhone)) {
      newErrors.emailOrPhone = 'Please enter a valid email or phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await signIn(
        activeTab === 'CLIENT' ? 'client-credentials' : 'admin-credentials',
        {
          emailOrPhone,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        setErrors({ general: 'Invalid email/phone or password' });
        setIsLoading(false);
        return;
      }

      // Redirect based on role
      if (activeTab === 'CLIENT') {
        router.push('/client/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Smart Security
          </h1>
          <p className="text-muted-foreground text-sm">
            AI-Powered Monitoring System
          </p>
        </div>

        {/* Login Card with Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription className="text-xs">Choose your account type to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LoginRole)}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="CLIENT" className="flex items-center gap-2 text-sm">
                  <User className="w-3 h-3" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="ADMIN" className="flex items-center gap-2 text-sm">
                  <UserCog className="w-3 h-3" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="CLIENT">
                <form onSubmit={handleSubmit} className="space-y-3">
                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{errors.general}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="emailOrPhone" className="text-sm">Email or Phone</Label>
                    <Input
                      id="emailOrPhone"
                      type="text"
                      placeholder="Enter your email or phone number"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      autoComplete="username"
                      className={errors.emailOrPhone ? 'border-destructive' : ''}
                    />
                    {errors.emailOrPhone && (
                      <p className="text-xs text-destructive">{errors.emailOrPhone}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ADMIN">
                <form onSubmit={handleSubmit} className="space-y-3">
                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{errors.general}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="emailOrPhone-admin" className="text-sm">Email or Phone</Label>
                    <Input
                      id="emailOrPhone-admin"
                      type="text"
                      placeholder="Enter your email or phone number"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      autoComplete="username"
                      className={errors.emailOrPhone ? 'border-destructive' : ''}
                    />
                    {errors.emailOrPhone && (
                      <p className="text-xs text-destructive">{errors.emailOrPhone}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password-admin" className="text-sm">Password</Label>
                    <Input
                      id="password-admin"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4 space-y-2">
          <p className="text-muted-foreground text-xs">
            Secure access to your monitoring system
          </p>
          <p className="text-muted-foreground text-xs">
            New customer? <Link href="/register" className="text-primary hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
