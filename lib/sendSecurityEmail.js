import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email configuration
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_USER?.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export async function sendSecurityCodeEmail(email, securityCode) {
   try {
      const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                  <img src="https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png" alt="CrashKart Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto 10px auto;">
                  <h1 style="color: #ef4444; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">crashkart</h1>
                  <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">Admin Access Verification</p>
              </div>

            <h2 style="color: #1f2937; margin-top: 0;">Admin Access Verification</h2>
            <p style="color: #4b5563; font-size: 16px;">Hello,</p>
            
            <p style="color: #4b5563; font-size: 16px;">You've requested access to the CrashKart admin panel. Please use the following security code to verify your identity:</p>

            <div style="background-color: #f0fdf4; border: 2px solid #86efac; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; font-size: 12px; color: #4b5563; margin-bottom: 10px;">SECURITY CODE</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 8px; font-family: monospace;">${securityCode}</p>
            </div>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                    <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. Never share this code with anyone.
                </p>
            </div>

            <p style="color: #4b5563; font-size: 14px; margin-top: 30px;">
                If you didn't request this code, please ignore this email and report it to our security team immediately.
            </p>

            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">© 2025 CrashKart. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message, please do not reply.</p>
            </div>
        </div>
    `;

    const mailOptions = {
      from: `"CRASHKART" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'CrashKart Admin - Security Code Verification',
      html: emailContent,
      attachments: []
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ Security code email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Security code email error:', error);
    return { success: false, error: error.message };
  }
}
