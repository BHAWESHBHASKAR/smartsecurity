import { prisma } from './prisma';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  ALERT_CREATED = 'ALERT_CREATED',
  ALERT_RESOLVED = 'ALERT_RESOLVED',
  SIREN_ACTIVATED = 'SIREN_ACTIVATED',
  SIREN_DEACTIVATED = 'SIREN_DEACTIVATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

interface SecurityLogData {
  eventType: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
}

export async function logSecurityEvent(data: SecurityLogData): Promise<void> {
  try {
    // In a production environment, you might want to:
    // 1. Store in a separate security logs table
    // 2. Send to a logging service (e.g., Datadog, Sentry)
    // 3. Alert on critical events
    
    console.log('[SECURITY]', {
      timestamp: new Date().toISOString(),
      ...data,
    });

    // For now, we'll just log to console
    // In production, implement proper logging infrastructure
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Helper functions for common security events
export async function logLoginAttempt(
  userId: string | null,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    userId: userId || undefined,
    ipAddress,
    userAgent,
    success,
  });
}

export async function logAlertCreation(
  alertId: string,
  userId: string,
  storeId: string,
  detectionType: string
): Promise<void> {
  await logSecurityEvent({
    eventType: SecurityEventType.ALERT_CREATED,
    userId,
    details: { alertId, storeId, detectionType },
    success: true,
  });
}

export async function logSirenAction(
  action: 'ON' | 'OFF',
  userId: string,
  storeId: string,
  alertId?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: action === 'ON' ? SecurityEventType.SIREN_ACTIVATED : SecurityEventType.SIREN_DEACTIVATED,
    userId,
    details: { storeId, alertId },
    success: true,
  });
}

export async function logUserManagement(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  adminId: string,
  targetUserId: string
): Promise<void> {
  const eventTypeMap = {
    CREATE: SecurityEventType.USER_CREATED,
    UPDATE: SecurityEventType.USER_UPDATED,
    DELETE: SecurityEventType.USER_DELETED,
  };

  await logSecurityEvent({
    eventType: eventTypeMap[action],
    userId: adminId,
    details: { targetUserId, action },
    success: true,
  });
}

export async function logUnauthorizedAccess(
  userId: string | null,
  resource: string,
  ipAddress?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId: userId || undefined,
    ipAddress,
    details: { resource },
    success: false,
  });
}
