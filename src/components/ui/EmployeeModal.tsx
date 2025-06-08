import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  UserIcon,
  CalendarIcon,
  XMarkIcon,
  ShieldCheckIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: 'MANAGER' | 'ADMIN' | 'CASHIER' | 'WAITER';
  createdAt: string;
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const roleTranslations = {
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

export function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  if (!employee) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-6"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-violet-600" />
                    Информация о сотруднике
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <IdentificationIcon className="w-5 h-5 text-violet-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{employee.fullName}</h4>
                        <p className="text-sm text-gray-500">@{employee.username}</p>
                      </div>
                    </div>
                    <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${roleBgColors[employee.role]} ${roleColors[employee.role]}`}>
                      <ShieldCheckIcon className="w-4 h-4 mr-1" />
                      {roleTranslations[employee.role]}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <CalendarIcon className="w-4 h-4 text-violet-600" />
                    <span>Дата регистрации: {formatDate(employee.createdAt)}</span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 