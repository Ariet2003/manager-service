import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import {
  TruckIcon,
  BeakerIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: {
    id: number;
    ingredient: {
      name: string;
      unit: string;
    };
    supplier: {
      name: string;
      phone: string | null;
    };
    quantity: number;
    pricePerUnit: number;
    deliveryDate: string;
  } | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(price);
};

export function DeliveryDetailsModal({ isOpen, onClose, delivery }: DeliveryDetailsModalProps) {
  if (!delivery) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Заголовок */}
            <div className="relative bg-violet-50 rounded-t-2xl">
              <div className="px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Детали поставки
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Контент */}
            <div className="p-6 space-y-6">
              {/* Информация об ингредиенте */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <BeakerIcon className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {delivery.ingredient.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {delivery.quantity} {delivery.ingredient.unit}
                  </p>
                </div>
              </div>

              {/* Информация о поставке */}
              <div className="bg-violet-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <TruckIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-600">Поставщик:</span>
                  <span className="font-medium text-gray-900">
                    {delivery.supplier.name}
                  </span>
                </div>

                {delivery.supplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon className="w-4 h-4 text-violet-600" />
                    <span className="text-gray-600">Телефон:</span>
                    <span className="font-medium text-gray-900">
                      {delivery.supplier.phone}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-600">Дата поставки:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(delivery.deliveryDate), 'dd.MM.yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CurrencyDollarIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-600">Цена за единицу:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(Number(delivery.pricePerUnit))}
                  </span>
                </div>

                <div className="pt-2 border-t border-violet-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Общая сумма:</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(Number(delivery.pricePerUnit) * delivery.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Футер */}
            <div className="border-t p-4">
              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full"
              >
                Закрыть
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 