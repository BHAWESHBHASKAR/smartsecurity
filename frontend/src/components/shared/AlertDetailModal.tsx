'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, AlertTriangle, Phone } from 'lucide-react';
import Image from 'next/image';

interface AlertDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alert: {
        id: string;
        detectionType: string;
        imageUrl: string;
        timestamp: Date;
        status: string;
        location?: {
            address: string;
            latitude: number;
            longitude: number;
        };
        storeName?: string;
        storeContact?: {
            phone: string;
            policeNumber: string;
        };
    };
    onCallPolice?: () => void;
    onCallClient?: () => void;
    onResolve?: () => void;
    isAdmin?: boolean;
}

export function AlertDetailModal({
    open,
    onOpenChange,
    alert,
    onCallPolice,
    onCallClient,
    onResolve,
    isAdmin = false,
}: AlertDetailModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Security Alert Details
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {alert.detectionType} detected at {alert.storeName || 'Store'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Alert Image */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary">
                        {alert.imageUrl ? (
                            <Image
                                src={alert.imageUrl}
                                alt="Alert detection"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <AlertTriangle className="w-16 h-16 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Alert Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Detection Type</p>
                            <Badge variant="destructive" className="capitalize">
                                {alert.detectionType}
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={alert.status === 'ACTIVE' ? 'destructive' : 'secondary'} className="capitalize">
                                {alert.status.toLowerCase()}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Time and Location */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs font-medium">Time</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(alert.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {alert.location && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium">Location</p>
                                    <p className="text-xs text-muted-foreground">{alert.location.address}</p>
                                </div>
                            </div>
                        )}

                        {isAdmin && alert.storeContact && (
                            <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium">Contact Information</p>
                                    <p className="text-xs text-muted-foreground">
                                        Client: {alert.storeContact.phone}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Police: {alert.storeContact.policeNumber}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                        {isAdmin ? (
                            <>
                                {onCallPolice && (
                                    <Button onClick={onCallPolice} variant="destructive" size="sm" className="flex-1">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Police
                                    </Button>
                                )}
                                {onCallClient && (
                                    <Button onClick={onCallClient} variant="secondary" size="sm" className="flex-1">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Client
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                {onResolve && alert.status === 'ACTIVE' && (
                                    <Button onClick={onResolve} variant="default" size="sm" className="flex-1">
                                        Turn Siren OFF
                                    </Button>
                                )}
                                {onCallPolice && (
                                    <Button onClick={onCallPolice} variant="destructive" size="sm" className="flex-1">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Police
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
