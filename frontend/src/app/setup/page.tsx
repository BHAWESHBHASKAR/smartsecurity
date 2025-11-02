'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { IconShieldCheck, IconVideo, IconPhone, IconBuilding, IconPlus, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GoogleMapsInput from '@/components/ui/GoogleMapsInput';
import { validateIP, validatePhone, validateRTSP } from '@/lib/validation';
import api from '@/lib/api';

const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading map...</p>
    </div>
  ),
});

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    latitude: 40.7128,
    longitude: -74.0060,
    policeNumber: '',
    cameraIPs: [''],
  });

  const addCameraIP = () => {
    setFormData(prev => ({
      ...prev,
      cameraIPs: [...prev.cameraIPs, ''],
    }));
  };

  const removeCameraIP = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cameraIPs: prev.cameraIPs.filter((_, i) => i !== index),
    }));
  };

  const updateCameraIP = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      cameraIPs: prev.cameraIPs.map((ip, i) => (i === index ? value : ip)),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!validatePhone(formData.policeNumber)) {
      newErrors.policeNumber = 'Please enter a valid phone number';
    }

    const validCameraIPs = formData.cameraIPs.filter(ip => ip.trim());
    if (validCameraIPs.length === 0) {
      newErrors.cameraIPs = 'At least one camera IP or RTSP URL is required';
    } else {
      validCameraIPs.forEach((ip, index) => {
        // Accept both IP addresses and RTSP URLs
        if (!validateIP(ip) && !validateRTSP(ip)) {
          newErrors[`cameraIP_${index}`] = 'Invalid IP address or RTSP URL format';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const validCameraIPs = formData.cameraIPs.filter(ip => ip.trim());

      const response = await api.post('/users/setup', {
        storeName: formData.storeName,
        address: formData.address,
        latitude: formData.latitude || 0,
        longitude: formData.longitude || 0,
        policeNumber: formData.policeNumber,
        cameraIPs: validCameraIPs,
      });

      console.log('Setup successful:', response.data);

      // Force a full page reload to refresh the session
      window.location.replace('/client/dashboard');
    } catch (error: any) {
      console.error('Setup error:', error.response?.data);

      // Handle token expiration - redirect to login
      if (error.response?.data?.error?.code === 'UNAUTHORIZED' || error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
        return;
      }

      // If store already exists, just navigate to dashboard
      if (error.response?.data?.error?.code === 'STORE_EXISTS') {
        console.log('Store exists, navigating to dashboard');
        window.location.replace('/client/dashboard');
        return;
      }

      // Handle validation errors
      if (error.response?.data?.error?.details) {
        const validationErrors: Record<string, string> = {};
        error.response.data.error.details.forEach((detail: any) => {
          validationErrors[detail.field] = detail.message;
        });
        setErrors(validationErrors);
      } else {
        setErrors({
          general: error.response?.data?.error?.message || 'Failed to setup store. Please try again.',
        });
      }
      setIsLoading(false);
    }
  };

  const handleLocationSelect = useCallback((data: { address: string; latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    }));
    if (data.address && !showMap) {
      setShowMap(true);
    }
  }, [showMap]);

  const handleMarkerDragEnd = useCallback(async (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'SmartSecurityMonitoring/1.0',
        },
      });
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name,
        }));
      }
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={`w-full transition-all duration-700 ease-in-out ${showMap ? 'max-w-7xl' : 'max-w-2xl'}`}>
        {/* Header */}
        <div className={`text-center mb-6 transition-all duration-500 ${showMap ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3">
            <IconShieldCheck className="w-6 h-6 text-primary-foreground" stroke={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1 font-serif">
            Welcome! Let&rsquo;s Set Up Your Store
          </h1>
          <p className="text-muted-foreground text-sm">
            Please provide your store details to get started with monitoring
          </p>
        </div>

        {/* Split Layout Container */}
        <div className={`grid transition-all duration-700 ease-in-out ${showMap ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
          {/* Map Section */}
          <div className={`transition-all duration-700 ease-in-out ${showMap ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute pointer-events-none'}`}>
            {showMap && (
              <div className="h-full min-h-[600px] bg-card rounded-lg border border-border overflow-hidden shadow-lg">
                <LeafletMap
                  center={[formData.latitude, formData.longitude]}
                  zoom={13}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  className="h-full"
                />
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="transition-all duration-700 ease-in-out">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif">Store Setup</CardTitle>
                <CardDescription className="text-xs">Configure your security monitoring system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{errors.general}</AlertDescription>
                    </Alert>
                  )}
                  {Object.keys(errors).length > 0 && !errors.general && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">
                        Please fix the errors below before submitting
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Store Information */}
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 font-serif">
                      <IconBuilding className="w-4 h-4 text-primary" stroke={1.5} />
                      Store Information
                    </h2>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="storeName" className="text-sm">Store Name</Label>
                        <Input
                          id="storeName"
                          placeholder="Enter your store name"
                          value={formData.storeName}
                          onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                          className={errors.storeName ? 'border-destructive' : ''}
                        />
                        {errors.storeName && (
                          <p className="text-xs text-destructive">{errors.storeName}</p>
                        )}
                      </div>

                      <GoogleMapsInput
                        onLocationSelect={handleLocationSelect}
                        initialAddress={formData.address}
                        error={errors.address}
                      />
                    </div>
                  </div>

                  {/* Camera Setup */}
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 font-serif">
                      <IconVideo className="w-4 h-4 text-primary" stroke={1.5} />
                      Camera Setup (IP or RTSP URL)
                    </h2>
                    <div className="space-y-2">
                      {formData.cameraIPs.map((ip, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder="e.g., 192.168.1.100 or rtsp://localhost:8554/demo-video"
                              value={ip}
                              onChange={(e) => updateCameraIP(index, e.target.value)}
                              className={errors[`cameraIP_${index}`] ? 'border-destructive' : ''}
                            />
                            {errors[`cameraIP_${index}`] && (
                              <p className="text-xs text-destructive mt-1">{errors[`cameraIP_${index}`]}</p>
                            )}
                          </div>
                          {formData.cameraIPs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCameraIP(index)}
                              className="px-2 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                            >
                              <IconX className="w-4 h-4" stroke={1.5} />
                            </button>
                          )}
                        </div>
                      ))}
                      {errors.cameraIPs && (
                        <p className="text-xs text-destructive">{errors.cameraIPs}</p>
                      )}
                      {formData.cameraIPs.length < 4 && (
                        <button
                          type="button"
                          onClick={addCameraIP}
                          className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <IconPlus className="w-4 h-4" stroke={1.5} />
                          Add Another Camera
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 font-serif">
                      <IconPhone className="w-4 h-4 text-primary" stroke={1.5} />
                      Emergency Contact
                    </h2>
                    <div className="space-y-1.5">
                      <Label htmlFor="policeNumber" className="text-sm">Police Station Number</Label>
                      <Input
                        id="policeNumber"
                        type="tel"
                        placeholder="Enter police station phone number"
                        value={formData.policeNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, policeNumber: e.target.value }))}
                        className={errors.policeNumber ? 'border-destructive' : ''}
                      />
                      {errors.policeNumber && (
                        <p className="text-xs text-destructive">{errors.policeNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Setting up...' : 'Save & Continue to Dashboard'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <p className={`text-center text-muted-foreground text-xs mt-4 transition-opacity duration-500 ${showMap ? 'opacity-50' : 'opacity-100'}`}>
          Complete setup to start monitoring your store
        </p>
      </div>
    </div>
  );
}
