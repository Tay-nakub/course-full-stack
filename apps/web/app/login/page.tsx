import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-2xl font-bold">เข้าสู่ระบบ</h1>
        <LoginForm />
      </div>
    </div>
  );
}
