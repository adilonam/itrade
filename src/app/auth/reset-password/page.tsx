import { Metadata } from 'next';
import ResetPasswordView from '@/features/auth/components/reset-password-view';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new password for your account.'
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
