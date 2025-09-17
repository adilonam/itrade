import nodemailer from 'nodemailer';
import { prisma } from './prisma';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Trading App'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent successfully:', info.messageId);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error sending email:', error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const cleanupExpiredMfaChallenges = async () => {
  try {
    await prisma.mfaChallenge.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error cleaning up expired MFA challenges:', error);
    }
  }
};

export const sendMfaVerificationEmail = async (
  email: string,
  code: string,
  name?: string
) => {
  const subject = 'Your Verification Code - Trading App';

  const text = `Hello ${name || 'User'},

Your verification code is: ${code}

This code will expire in 10 minutes. Please enter this code to complete your sign-in.

If you didn't request this code, please ignore this email.

Best regards,
Trading App Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Trading App - Verification Code</h2>
      
      <p>Hello ${name || 'User'},</p>
      
      <p>Your verification code is:</p>
      
      <div style="background-color: #f5f5f5; border: 2px dashed #ccc; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
      </div>
      
      <p>This code will expire in <strong>10 minutes</strong>. Please enter this code to complete your sign-in.</p>
      
      <p style="color: #666; font-size: 14px;">
        If you didn't request this code, please ignore this email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Best regards,<br>
        Trading App Team
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
};
