import nodemailer from 'nodemailer';
import { prisma } from './prisma';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Trade Nova';

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
      from: `"${APP_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
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
  const subject = `Your Verification Code - ${APP_NAME}`;

  const text = `Hello ${name || 'User'},

Your verification code is: ${code}

This code will expire in 10 minutes. Please enter this code to complete your sign-in.

If you didn't request this code, please ignore this email.

Best regards,
${APP_NAME} Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Verification Code</h2>
      
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
        ${APP_NAME} Team
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

export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string,
  name?: string
) => {
  const subject = `Reset your password - ${APP_NAME}`;

  const text = `Hello ${name || 'User'},

You requested a password reset. Click the link below to set a new password:

${resetLink}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

Best regards,
${APP_NAME} Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Reset your password</h2>
      <p>Hello ${name || 'User'},</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset password</a>
      </p>
      <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
      <p style="color: #666; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">Best regards,<br>${APP_NAME} Team</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
};
