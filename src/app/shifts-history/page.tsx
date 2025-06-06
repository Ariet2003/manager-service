'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  ClockIcon,
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ArrowRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { ShiftModal } from '@/components/ui/ShiftModal';

interface User {
  id: string;
  fullName: string;
  username: string;
  role: string;
}

interface ShiftStaff {
  user: User;
}

interface Shift {
  id: number;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  manager: User;
  staff: ShiftStaff[];
}

export default function ShiftsHistoryPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await fetch('/api/shifts/history');
        if (!response.ok) throw new Error('Failed to fetch shifts');
        const data = await response.json();
        setShifts(data.shifts);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Дата не указана';
    return dateString.replace('T', ' ').replace(/\.\d+Z$/, '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white rounded-lg shadow-sm"></div>
              ))}
            </div>
          </div>
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
              История смен
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          История смен
        </h1>

        <div className="space-y-4">
          {shifts.map((shift) => (
            <button
              key={shift.id}
              onClick={() => handleShiftClick(shift)}
              className="w-full text-left bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-violet-600" />
                    {formatDate(shift.startedAt)}
                  </p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-violet-600" />
                    Менеджер: {shift.manager?.fullName || 'Не указан'}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <UserGroupIcon className="w-4 h-4 text-violet-600" />
                    Сотрудников на смене: {shift.staff.length}
                  </p>
                </div>
                <div className="text-gray-400">
                  <ArrowRightIcon className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <ShiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          shift={selectedShift}
        />
      </main>
    </div>
  );
} 