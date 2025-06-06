'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  UserGroupIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PencilIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

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

export default function ShiftPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [todayClosedShift, setTodayClosedShift] = useState<{
    id: number;
    endedAt: string;
    manager: {
      fullName: string;
    };
  } | null>(null);
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

  // Проверка аутентификации при загрузке страницы
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Check authentication first
        const authResponse = await fetch('/api/auth/check');
        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
          router.push('/');
          return;
        }
        
        try {
          // Load shift and employee data
          const shiftResponse = await fetch('/api/shifts/active');
          const shiftData = await shiftResponse.json();
          console.log('Shift data:', shiftData);

          setActiveShift(shiftData.shift);
          setTodayClosedShift(shiftData.todayClosedShift);

          // Всегда загружаем список сотрудников, если нет активной смены
          if (!shiftData.shift) {
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
          }
        } catch (err) {
          console.error('Error loading data:', err);
          setError('Ошибка при загрузке данных');
        }
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  // Добавляем для отладки
  useEffect(() => {
    console.log('Active shift:', activeShift);
    console.log('Today closed shift:', todayClosedShift);
  }, [activeShift, todayClosedShift]);

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

  const handleOpenShiftClick = () => {
    if (!selectedEmployees.cashier || selectedEmployees.waiters.length === 0) {
      setError('Необходимо выбрать как минимум одного кассира и одного официанта');
      return;
    }
    if (!isConfirmModalOpen) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleOpenShift = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cashierId: selectedEmployees.cashier,
          waiterIds: selectedEmployees.waiters,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при открытии смены');
      }

      const data = await response.json();
      setActiveShift(data.shift);
      setError(null);
      setIsConfirmModalOpen(false);
    } catch (err) {
      setError('Не удалось открыть смену');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShiftClick = () => {
    setIsEndShiftModalOpen(true);
  };

  const handleEndShift = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shifts/${activeShift?.id}/end`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Ошибка при завершении смены');
      }

      const data = await response.json();
      setActiveShift(null);
      setError(null);
      setIsEndShiftModalOpen(false);
      router.push('/dashboard');

    } catch (err) {
      setError('Не удалось завершить смену');
    } finally {
      setIsLoading(false);
    }
  };

  // Формируем сообщение для модального окна
  const getConfirmationMessage = () => {
    const selectedWaiters = availableEmployees.waiters
      .filter(w => selectedEmployees.waiters.includes(w.id))
      .map(w => w.fullName)
      .sort((a, b) => a.localeCompare(b, 'ru'));
    
    const selectedCashier = availableEmployees.cashiers
      .find(c => c.id === selectedEmployees.cashier)?.fullName;

    return `Проверьте выбранных сотрудников для открытия смены
    \n\nКассир: ${selectedCashier}

Официанты:
${selectedWaiters.map(name => `• ${name}`).join('\n')}

Убедитесь, что все данные указаны верно. После открытия смены изменить состав сотрудников будет невозможно.`;
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
              Управление сменой
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => router.push('/')}
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {activeShift ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-violet-100">
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-bold text-gray-900">Активная смена</h2>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                    <p className="text-sm font-medium text-violet-600 mb-1 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Менеджер
                    </p>
                    <p className="text-gray-900 font-semibold">{activeShift.manager.fullName}</p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                    <p className="text-sm font-medium text-violet-600 mb-1 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Начало смены
                    </p>
                    <p className="text-gray-900 font-semibold">
                      {activeShift.startedAt.replace('T', ' ').replace('Z', '')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-600 mb-3 flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    Сотрудники на смене
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeShift.staff.map(({ user }) => (
                      <div
                        key={user.id}
                        className="flex items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-violet-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-5 h-5 text-violet-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-violet-600">
                              {user.role === 'WAITER' ? 'Официант' : 'Кассир'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Фиксированная панель с кнопками внизу */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-end items-center gap-4">
                  <Button
                    onClick={() => router.push('/shift/edit')}
                    className="px-4 py-2 flex items-center gap-2 justify-center"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Редактировать
                  </Button>
                  <Button
                    onClick={handleEndShiftClick}
                    variant="danger"
                    className="px-4 py-2 flex items-center gap-2 justify-center"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    Завершить
                  </Button>
                </div>
              </div>
            </div>
            {/* Добавляем отступ снизу, чтобы контент не перекрывался фиксированной панелью */}
            <div className="h-20"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-[rgb(124,58,237)]" />
                  <h2 className="text-lg font-bold text-gray-900">Выберите сотрудников для смены</h2>
                </div>
              </div>
              
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

              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-end items-center">
                    <Button
                      onClick={handleOpenShiftClick}
                      disabled={!selectedEmployees.cashier || selectedEmployees.waiters.length === 0}
                      className="px-6 py-2.5 flex items-center gap-2 justify-center"
                    >
                      Открыть смену
                      <ArrowRightIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Добавляем отступ снизу */}
              <div className="h-20"></div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleOpenShift}
          title="Подтверждение открытия смены"
          message={getConfirmationMessage()}
          confirmText="Открыть смену"
          cancelText="Отмена"
        />

        <ConfirmModal
          isOpen={isEndShiftModalOpen}
          onClose={() => setIsEndShiftModalOpen(false)}
          onConfirm={handleEndShift}
          title="Подтверждение завершения смены"
          message="Вы уверены, что хотите завершить текущую смену? Это действие нельзя отменить."
          confirmText="Завершить смену"
          cancelText="Отмена"
        />
      </main>
    </div>
  );
} 