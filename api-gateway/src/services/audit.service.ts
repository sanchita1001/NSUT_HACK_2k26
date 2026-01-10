import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models';
import { v4 as uuidv4 } from 'uuid';

// Event types for comprehensive logging
export enum AuditEventType {
    // Authentication
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    USER_REGISTER = 'USER_REGISTER',
    AUTH_FAILED = 'AUTH_FAILED',

    // Alerts
    ALERT_CREATED = 'ALERT_CREATED',
    ALERT_UPDATED = 'ALERT_UPDATED',
    ALERT_STATUS_CHANGED = 'ALERT_STATUS_CHANGED',
    ALERT_VIEWED = 'ALERT_VIEWED',

    // Fraud Detection
    TRANSACTION_ANALYZED = 'TRANSACTION_ANALYZED',
    FRAUD_RULE_TRIGGERED = 'FRAUD_RULE_TRIGGERED',
    ML_MODEL_SCORED = 'ML_MODEL_SCORED',
    RISK_SCORE_CALCULATED = 'RISK_SCORE_CALCULATED',

    // Analyst Actions
    ANALYST_COMMENT_ADDED = 'ANALYST_COMMENT_ADDED',
    ANALYST_ASSIGNED = 'ANALYST_ASSIGNED',
    ALERT_ESCALATED = 'ALERT_ESCALATED',
    ALERT_RESOLVED = 'ALERT_RESOLVED',

    // System
    SIMULATOR_RUN = 'SIMULATOR_RUN',
    CONFIG_CHANGED = 'CONFIG_CHANGED',
    SYSTEM_ERROR = 'SYSTEM_ERROR',
    API_REQUEST = 'API_REQUEST',

    // Data Operations
    VENDOR_CREATED = 'VENDOR_CREATED',
    VENDOR_UPDATED = 'VENDOR_UPDATED',
    SCHEME_CREATED = 'SCHEME_CREATED',
    SCHEME_UPDATED = 'SCHEME_UPDATED',
}

export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

interface AuditLogData {
    eventType: AuditEventType;
    actor: {
        id: string;
        name: string;
        role: string;
        email?: string;
    };
    action: string;
    target: {
        type: string;
        id: string;
    };
    beforeState?: any;
    afterState?: any;
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        apiEndpoint?: string;
        duration?: number;
        errorMessage?: string;
        [key: string]: any;
    };
    severity?: AuditSeverity;
}

export class AuditLogService {
    /**
     * Create an audit log entry
     */
    static async log(data: AuditLogData, correlationId?: string): Promise<void> {
        try {
            const logEntry = {
                id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                correlationId: correlationId || uuidv4(),
                eventType: data.eventType,
                actor: data.actor.name || data.actor.email || 'System',
                action: data.action,
                target: `${data.target.type}:${data.target.id}`,
                details: JSON.stringify({
                    actor: data.actor,
                    beforeState: data.beforeState,
                    afterState: data.afterState,
                    metadata: data.metadata,
                }),
                severity: data.severity || AuditSeverity.INFO,
            };

            await AuditLog.create(logEntry);

            // Log to console for debugging
            console.log(`[AUDIT] ${data.eventType} by ${data.actor.name} on ${data.target.type}:${data.target.id}`);
        } catch (error) {
            // Don't throw - audit logging failure shouldn't break the main flow
            console.error('Audit logging failed:', error);
        }
    }

    /**
     * Log user authentication events
     */
    static async logAuth(
        eventType: AuditEventType,
        user: any,
        success: boolean,
        metadata?: any
    ): Promise<void> {
        await this.log({
            eventType,
            actor: {
                id: user?.id || 'unknown',
                name: user?.name || 'Unknown User',
                role: user?.role || 'unknown',
                email: user?.email,
            },
            action: success ? 'Authentication successful' : 'Authentication failed',
            target: {
                type: 'User',
                id: user?.id || 'unknown',
            },
            metadata,
            severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
        });
    }

    /**
     * Log alert-related events with state tracking
     */
    static async logAlert(
        eventType: AuditEventType,
        alert: any,
        actor: any,
        beforeState?: any,
        afterState?: any,
        metadata?: any
    ): Promise<void> {
        await this.log({
            eventType,
            actor: {
                id: actor?.id || 'system',
                name: actor?.name || 'System',
                role: actor?.role || 'system',
            },
            action: `Alert ${eventType.toLowerCase().replace('alert_', '')}`,
            target: {
                type: 'Alert',
                id: alert.id,
            },
            beforeState,
            afterState,
            metadata: {
                ...metadata,
                riskScore: alert.riskScore,
                amount: alert.amount,
                vendor: alert.vendor,
            },
            severity: alert.riskScore > 80 ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
        });
    }

    /**
     * Log fraud detection events
     */
    static async logFraudDetection(
        eventType: AuditEventType,
        transaction: any,
        mlResult: any,
        metadata?: any
    ): Promise<void> {
        await this.log({
            eventType,
            actor: {
                id: 'ml-service',
                name: 'ML Fraud Detection',
                role: 'system',
            },
            action: 'Fraud analysis completed',
            target: {
                type: 'Transaction',
                id: transaction.id || 'unknown',
            },
            afterState: mlResult,
            metadata: {
                ...metadata,
                riskScore: mlResult.riskScore,
                isAnomaly: mlResult.isAnomaly,
                reasons: mlResult.mlReasons,
            },
            severity: mlResult.riskScore > 70 ? AuditSeverity.WARNING : AuditSeverity.INFO,
        });
    }

    /**
     * Log API requests (middleware)
     */
    static async logApiRequest(
        req: Request,
        res: Response,
        duration: number,
        correlationId: string
    ): Promise<void> {
        const user = (req as any).user;

        await this.log({
            eventType: AuditEventType.API_REQUEST,
            actor: {
                id: user?.id || 'anonymous',
                name: user?.name || 'Anonymous',
                role: user?.role || 'guest',
            },
            action: `${req.method} ${req.path}`,
            target: {
                type: 'API',
                id: req.path,
            },
            metadata: {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
            severity: res.statusCode >= 500 ? AuditSeverity.ERROR : AuditSeverity.INFO,
        }, correlationId);
    }
}

/**
 * Express middleware for automatic API request logging
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
    const correlationId = uuidv4();
    const startTime = Date.now();

    // Attach correlation ID to request
    (req as any).correlationId = correlationId;

    // Log after response is sent
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        AuditLogService.logApiRequest(req, res, duration, correlationId).catch(err =>
            console.error('API audit logging failed:', err)
        );
    });

    next();
}
