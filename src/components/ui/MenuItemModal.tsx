import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  BeakerIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  quantity: number;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  costPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  ingredients: Array<{
    ingredient: Ingredient;
    quantity: number;
  }>;
  createdBy: {
    fullName: string;
  };
}

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}

export function MenuItemModal({ isOpen, onClose, item }: MenuItemModalProps) {
  if (!item) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
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
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Заголовок */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg sm:text-xl font-semibold leading-6 text-gray-900">
                    {item.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Изображение блюда */}
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Описание */}
                  {item.description && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-gray-700 text-sm sm:text-base">{item.description}</p>
                    </div>
                  )}

                  {/* Цены */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                      <div className="flex items-center gap-2 text-violet-600 mb-1">
                        <CurrencyDollarIcon className="w-5 h-5" />
                        <span className="font-medium text-sm sm:text-base">Цена продажи</span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-violet-700">
                        {formatPrice(Number(item.price))}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <CurrencyDollarIcon className="w-5 h-5" />
                        <span className="font-medium text-sm sm:text-base">Себестоимость</span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-gray-700">
                        {formatPrice(Number(item.costPrice))}
                      </p>
                    </div>
                  </div>

                  {/* Ингредиенты */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <BeakerIcon className="w-5 h-5" />
                      <span className="font-medium text-sm sm:text-base">Ингредиенты</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.ingredients.map(({ ingredient, quantity }) => (
                        <div
                          key={ingredient.id}
                          className="flex items-center justify-between bg-white p-2 rounded border border-gray-100"
                        >
                          <span className="text-gray-700 text-sm sm:text-base">{ingredient.name}</span>
                          <span className="text-gray-500 text-sm">
                            {quantity} {ingredient.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Мета-информация */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100 gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Добавил: {item.createdBy.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
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