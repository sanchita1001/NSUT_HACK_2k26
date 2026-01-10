import nodemailer from 'nodemailer';

// ===== FEATURE 12: EMAIL NOTIFICATIONS =====
export class NotificationService {
    private static transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-app-password'
        }
    });

    static async sendCriticalAlertEmail(alert: any) {
        try {
            // Only send for critical alerts (risk score > 90)
            if (alert.riskScore < 90) return;

            const mailOptions = {
                from: process.env.SMTP_USER || 'sahayak@pfms.gov.in',
                to: process.env.ALERT_EMAIL || 'officer@pfms.gov.in',
                subject: `🚨 CRITICAL ALERT: ${alert.id} - Risk Score ${alert.riskScore}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
                            <h1>🚨 Critical Fraud Alert</h1>
                        </div>
                        <div style="padding: 20px; background: #f9fafb;">
                            <h2>Alert Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Alert ID:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${alert.id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Risk Score:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${alert.riskScore}/100</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">₹${alert.amount.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Vendor:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${alert.vendor}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Scheme:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${alert.scheme}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${alert.district}</td>
                                </tr>
                            </table>

                            <h3 style="margin-top: 20px;">Detection Reasons:</h3>
                            <ul style="background: white; padding: 20px; border-left: 4px solid #dc2626;">
                                ${alert.mlReasons.map((reason: string) => `<li>${reason}</li>`).join('')}
                            </ul>

                            <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-left: 4px solid #dc2626;">
                                <strong>⚠️ Immediate Action Required</strong><br>
                                Please review this alert immediately in the Sahayak dashboard.
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:3000/dashboard/alerts" 
                                   style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                    View in Dashboard
                                </a>
                            </div>
                        </div>
                        <div style="background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p>Sahayak Fraud Detection System | Public Financial Management System</p>
                            <p>This is an automated alert. Do not reply to this email.</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Critical alert email sent for ${alert.id}`);
        } catch (error) {
            console.error('Email notification error:', error);
            // Don't throw - email failure shouldn't break alert creation
        }
    }

    static async sendWeeklySummary(stats: any) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER || 'sahayak@pfms.gov.in',
                to: process.env.ALERT_EMAIL || 'officer@pfms.gov.in',
                subject: `📊 Weekly Fraud Detection Summary`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                            <h1>📊 Weekly Summary</h1>
                        </div>
                        <div style="padding: 20px; background: #f9fafb;">
                            <h2>Detection Statistics</h2>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                                    <p style="color: #6b7280; margin: 0;">Total Alerts</p>
                                    <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${stats.totalAlerts}</p>
                                </div>
                                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                                    <p style="color: #6b7280; margin: 0;">High Risk</p>
                                    <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #dc2626;">${stats.highRisk}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log('✅ Weekly summary email sent');
        } catch (error) {
            console.error('Weekly summary email error:', error);
        }
    }
}
