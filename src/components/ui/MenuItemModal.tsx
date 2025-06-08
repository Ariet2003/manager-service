import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  BeakerIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { ConfirmMenuStopListModal } from './ConfirmMenuStopListModal';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isInStopList, setIsInStopList] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  useEffect(() => {
    const checkStopList = async () => {
      if (!item) return;
      
      try {
        const response = await fetch('/api/menu/stop-list');
        if (!response.ok) {
          throw new Error('Ошибка при проверке стоп-листа');
        }
        const stopListItems = await response.json();
        setIsInStopList(stopListItems.some((stopItem: any) => stopItem.menuItemId === item.id));
      } catch (err) {
        console.error('Error checking stop list:', err);
      }
    };

    checkStopList();
  }, [item]);

  const handleAddToStopList = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/menu/stop-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuItemId: item.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при добавлении в стоп-лист');
      }

      setIsInStopList(true);
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const handleRemoveFromStopList = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/menu/stop-list?menuItemId=${item.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при удалении из стоп-листа');
      }

      setIsInStopList(false);
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
      setIsRemoveConfirmOpen(false);
    }
  };

  if (!item) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
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
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      {item.name}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    )}

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
                    <div>
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

                    {/* Кнопки управления стоп-листом */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      {isInStopList ? (
                        <Button
                          onClick={() => setIsRemoveConfirmOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <ExclamationTriangleIcon className="w-5 h-5" />
                          Убрать из стоп-листа
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setIsConfirmOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <ExclamationTriangleIcon className="w-5 h-5" />
                          Добавить в стоп-лист
                        </Button>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Модальное окно подтверждения добавления в стоп-лист */}
      <ConfirmMenuStopListModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleAddToStopList}
        isLoading={isLoading}
        menuItemName={item.name}
      />

      {/* Модальное окно подтверждения удаления из стоп-листа */}
      <Dialog
        open={isRemoveConfirmOpen}
        onClose={() => setIsRemoveConfirmOpen(false)}
        className="relative z-[60]"
      >
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-6 h-6 text-emerald-500" />
                  Подтверждение
                </Dialog.Title>
                <button
                  onClick={() => setIsRemoveConfirmOpen(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Вы уверены, что хотите убрать <span className="font-medium text-gray-900">{item.name}</span> из стоп-листа?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  После удаления из стоп-листа это блюдо снова станет доступно для заказа.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsRemoveConfirmOpen(false)}
                  className="px-4 py-2"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleRemoveFromStopList}
                  isLoading={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
                >
                  Убрать из стоп-листа
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  );
}