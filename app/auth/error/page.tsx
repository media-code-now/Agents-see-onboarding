'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.';
      case 'EmailExist':
        return 'An account with this email already exists.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to access this resource.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-500/10 p-4">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-3">
            Authentication Error
          </h1>

          <p className="text-gray-400 text-center mb-8">
            {getErrorMessage()}
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>

            <Link
              href="/auth/signup"
              className="flex items-center justify-center w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20"
            >
              Create New Account
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
