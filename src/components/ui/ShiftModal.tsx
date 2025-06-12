import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

type ShiftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
};

export function ShiftModal({ isOpen, onClose, shift }: ShiftModalProps) {
  if (!shift) return null;

  const totalRevenue = shift.orders?.reduce((sum: number, order: any) => {
    if (!order.payments) return sum;
    return sum + order.payments.reduce((orderSum: number, payment: any) => {
      return orderSum + Number(payment.amount || 0);
    }, 0);
  }, 0) || 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Дата не указана';
    return dateString.replace('T', ' ').replace(/\.\d+Z$/, '');
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                  Информация о смене
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Основная информация</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Менеджер: {shift.manager?.fullName || 'Не указан'}</p>
                      <p>Начало: {formatDate(shift.startedAt)}</p>
                      {shift.endedAt && (
                        <p>Конец: {formatDate(shift.endedAt)}</p>
                      )}
                      <p>Выручка: {totalRevenue.toFixed(2)} сом</p>
                    </div>
                  </div>

                  {shift.staff?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900">Персонал на смене</h3>
                      <div className="mt-2 text-sm text-gray-600">
                        {shift.staff.map((staffMember: any) => (
                          <p key={staffMember.id}>
                            {staffMember.user?.fullName || 'Имя не указано'} - {staffMember.user?.role || 'Роль не указана'}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {shift.menuStopList?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900">Стоп-лист меню</h3>
                      <div className="mt-2 text-sm text-gray-600">
                        {shift.menuStopList.map((item: any) => (
                          <p key={item.id}>{item.menuItem?.name || 'Название не указано'}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {shift.ingredientStopList?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900">Стоп-лист ингредиентов</h3>
                      <div className="mt-2 text-sm text-gray-600">
                        {shift.ingredientStopList.map((item: any) => (
                          <p key={item.id}>{item.ingredient?.name || 'Название не указано'}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                    onClick={onClose}
                  >
                    Закрыть
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 