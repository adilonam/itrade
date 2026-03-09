import { Metadata } from 'next';
import ForgotPasswordView from '@/features/auth/components/forgot-password-view';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a password reset link.'
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
