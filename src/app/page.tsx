'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Используем router.push вместо window.location для лучшей производительности
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Добро пожаловать
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Пожалуйста, войдите в систему
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Input
              label="Имя пользователя"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Введите имя пользователя"
              className="h-11 sm:h-12 text-base"
            />

            <Input
              label="Пароль"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Введите пароль"
              className="h-11 sm:h-12 text-base"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm sm:text-base">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-base"
              isLoading={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </div>
        </div>
      </main>
  );
}
