'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmployeeModal } from '@/components/ui/EmployeeModal';
import {
  UserGroupIcon,
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: 'MANAGER' | 'ADMIN' | 'CASHIER' | 'WAITER';
  createdAt: string;
}

const roleTranslations = {
  ALL: 'Все роли',
  MANAGER: 'Менеджер',
  ADMIN: 'Администратор',
  CASHIER: 'Кассир',
  WAITER: 'Официант',
};

const roleColors = {
  MANAGER: 'text-blue-600',
  ADMIN: 'text-red-600',
  CASHIER: 'text-green-600',
  WAITER: 'text-violet-600',
};

const roleBgColors = {
  MANAGER: 'bg-blue-50 border-blue-100',
  ADMIN: 'bg-red-50 border-red-100',
  CASHIER: 'bg-green-50 border-green-100',
  WAITER: 'bg-violet-50 border-violet-100',
};

type RoleFilter = 'ALL' | 'MANAGER' | 'ADMIN' | 'CASHIER' | 'WAITER';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) throw new Error('Failed to fetch employees');
        const data = await response.json();
        setEmployees(data.employees);
      } catch (error) {
        console.error('Error:', error);
        setError('Не удалось загрузить список сотрудников');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || employee.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-violet-600 font-medium flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 animate-spin" />
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
              <UserGroupIcon className="w-6 h-6 text-[rgb(124,58,237)]" />
              Сотрудники
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Поиск по имени или логину..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                {Object.entries(roleTranslations).map(([role, label]) => (
                  <option key={role} value={role}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => handleEmployeeClick(employee)}
                className="text-left bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-violet-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-violet-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.fullName}</h3>
                      <p className="text-sm text-gray-500">{employee.username}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${roleBgColors[employee.role]} ${roleColors[employee.role]}`}>
                    {roleTranslations[employee.role]}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>С {formatDate(employee.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Фиксированная кнопка внизу */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end">
              <Button
                onClick={() => router.push('/employees/new')}
                className="px-4 py-2 flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Добавить сотрудника
              </Button>
            </div>
          </div>
        </div>
        {/* Отступ для фиксированной кнопки */}
        <div className="h-20" />
      </main>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
} 