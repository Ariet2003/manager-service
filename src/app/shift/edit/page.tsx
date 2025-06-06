'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  UserGroupIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: 'WAITER' | 'CASHIER';
}

interface Shift {
  id: number;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  manager: {
    id: string;
    fullName: string;
  };
  staff: Array<{
    user: Employee;
  }>;
}

export default function EditShiftPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<{
    waiters: Employee[];
    cashiers: Employee[];
  }>({ waiters: [], cashiers: [] });
  const [selectedEmployees, setSelectedEmployees] = useState<{
    waiters: string[];
    cashier: string | null;
  }>({
    waiters: [],
    cashier: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем активную смену
        const shiftResponse = await fetch('/api/shifts/active');
        const shiftData = await shiftResponse.json();
        
        if (!shiftData.shift) {
          router.push('/shift');
          return;
        }
        
        setActiveShift(shiftData.shift);

        // Загружаем всех доступных сотрудников
        const employeesResponse = await fetch('/api/employees/available');
        const employeesData = await employeesResponse.json();
        
        // Сортируем сотрудников по алфавиту
        const sortedData = {
          waiters: [...employeesData.waiters].sort((a, b) => 
            a.fullName.localeCompare(b.fullName, 'ru')
          ),
          cashiers: [...employeesData.cashiers].sort((a, b) => 
            a.fullName.localeCompare(b.fullName, 'ru')
          ),
        };
        
        setAvailableEmployees(sortedData);

        // Устанавливаем текущий выбор сотрудников
        const currentWaiters = shiftData.shift.staff
          .filter((s: { user: Employee }) => s.user.role === 'WAITER')
          .map((s: { user: Employee }) => s.user.id);
        
        const currentCashier = shiftData.shift.staff
          .find((s: { user: Employee }) => s.user.role === 'CASHIER')?.user.id || null;

        setSelectedEmployees({
          waiters: currentWaiters,
          cashier: currentCashier,
        });
      } catch (err) {
        setError('Ошибка при загрузке данных');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const toggleWaiter = (waiterId: string) => {
    setSelectedEmployees(prev => ({
      ...prev,
      waiters: prev.waiters.includes(waiterId)
        ? prev.waiters.filter(id => id !== waiterId)
        : [...prev.waiters, waiterId],
    }));
  };

  const selectCashier = (cashierId: string) => {
    setSelectedEmployees(prev => ({
      ...prev,
      cashier: prev.cashier === cashierId ? null : cashierId,
    }));
  };

  const handleUpdateShift = () => {
    if (!selectedEmployees.cashier || selectedEmployees.waiters.length === 0) {
      setError('Необходимо выбрать как минимум одного кассира и одного официанта');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shifts/${activeShift?.id}/staff`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cashierId: selectedEmployees.cashier,
          waiterIds: selectedEmployees.waiters,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении смены');
      }

      router.push('/shift');
    } catch (err) {
      setError('Не удалось обновить смену');
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-violet-600 font-medium flex items-center gap-2">
          <ClockIcon className="w-5 h-5 animate-spin" />
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-[rgb(124,58,237)]" />
              Редактирование смены
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-violet-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center sticky top-0 bg-white">
              <span className="w-1 h-6 bg-[rgb(124,58,237)] rounded mr-3"></span>
              <UserGroupIcon className="w-6 h-6 text-[rgb(124,58,237)] mr-2" />
              Официанты
            </h2>
            <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {availableEmployees.waiters.map((waiter) => (
                  <button
                    key={waiter.id}
                    onClick={() => toggleWaiter(waiter.id)}
                    className={`
                      p-4 rounded-lg text-left transition-all flex items-center gap-3
                      ${selectedEmployees.waiters.includes(waiter.id)
                        ? 'bg-violet-100 border-violet-300 border shadow-inner'
                        : 'bg-white border-gray-200 border shadow-sm hover:border-violet-200'
                      }
                    `}
                  >
                    <UserIcon className={`w-5 h-5 ${
                      selectedEmployees.waiters.includes(waiter.id)
                        ? 'text-[rgb(124,58,237)]'
                        : 'text-gray-400'
                    }`} />
                    <p className={`font-semibold ${
                      selectedEmployees.waiters.includes(waiter.id)
                        ? 'text-[rgb(124,58,237)]'
                        : 'text-gray-900'
                    }`}>{waiter.fullName}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-violet-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center sticky top-0 bg-white">
              <span className="w-1 h-6 bg-[rgb(124,58,237)] rounded mr-3"></span>
              <UserIcon className="w-6 h-6 text-[rgb(124,58,237)] mr-2" />
              Кассиры
            </h2>
            <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {availableEmployees.cashiers.map((cashier) => (
                  <button
                    key={cashier.id}
                    onClick={() => selectCashier(cashier.id)}
                    className={`
                      p-4 rounded-lg text-left transition-all flex items-center gap-3
                      ${selectedEmployees.cashier === cashier.id
                        ? 'bg-violet-100 border-violet-300 border shadow-inner'
                        : 'bg-white border-gray-200 border shadow-sm hover:border-violet-200'
                      }
                    `}
                  >
                    <UserIcon className={`w-5 h-5 ${
                      selectedEmployees.cashier === cashier.id
                        ? 'text-[rgb(124,58,237)]'
                        : 'text-gray-400'
                    }`} />
                    <p className={`font-semibold ${
                      selectedEmployees.cashier === cashier.id
                        ? 'text-[rgb(124,58,237)]'
                        : 'text-gray-900'
                    }`}>{cashier.fullName}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/shift')}
              className="px-6 py-2.5"
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpdateShift}
              disabled={!selectedEmployees.cashier || selectedEmployees.waiters.length === 0}
              className="px-6 py-2.5 flex items-center gap-2"
            >
              Сохранить
              <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmUpdate}
          title="Подтверждение изменения смены"
          message={`Вы уверены, что хотите изменить состав сотрудников на смене?

Новый состав:

Кассир: ${selectedEmployees.cashier 
  ? availableEmployees.cashiers.find(c => c.id === selectedEmployees.cashier)?.fullName 
  : 'Не выбран'}

Официанты:${selectedEmployees.waiters
  .map(id => availableEmployees.waiters.find(w => w.id === id)?.fullName)
  .filter(Boolean)
  .map(name => `\n• ${name}`)
  .join('')}`}
          confirmText="Сохранить"
          cancelText="Отмена"
        />
      </main>
    </div>
  );
} 