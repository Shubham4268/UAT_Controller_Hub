import { AnimatedBackground } from '@/components/auth/AnimatedBackground';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/common/ThemeToggleStandalone';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background animated blobs - rendered client-side only */}
      <AnimatedBackground />

      {/* Theme toggle in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
