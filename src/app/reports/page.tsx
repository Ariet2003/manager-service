'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  ChartBarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-[rgb(124,58,237)]" />
              Отчеты
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => router.push('/dashboard')}
                className="text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Назад
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Доступные отчеты
            </h2>
            {/* Здесь будет содержимое отчетов */}
            <div className="text-sm text-gray-500">
              Раздел в разработке
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 