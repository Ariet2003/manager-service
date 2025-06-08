import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BeakerIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { ConfirmStopListModal } from './ConfirmStopListModal';
import { Ingredient } from '@/types/ingredient';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

export function IngredientModal({ isOpen, onClose, ingredient }: IngredientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isInStopList, setIsInStopList] = useState(false);

  useEffect(() => {
    const checkStopList = async () => {
      if (!ingredient) return;
      
      try {
        const response = await fetch('/api/ingredients/stop-list');
        if (!response.ok) {
          throw new Error('Ошибка при проверке стоп-листа');
        }
        const stopListItems = await response.json();
        setIsInStopList(stopListItems.some((stopItem: any) => stopItem.ingredientId === ingredient.id));
      } catch (err) {
        console.error('Error checking stop list:', err);
      }
    };

    checkStopList();
  }, [ingredient]);

  if (!ingredient) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleAddToStopList = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ingredients/stop-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredientId: ingredient.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при добавлении в стоп-лист');
      }

      // После успешного добавления в стоп-лист
      const stopListResponse = await fetch('/api/ingredients/stop-list');
      if (!stopListResponse.ok) {
        throw new Error('Ошибка при обновлении стоп-листа');
      }
      
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
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
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                      <BeakerIcon className="w-5 h-5 text-violet-600" />
                      Информация об ингредиенте
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

                    {/* Название и основная информация */}
                    <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {ingredient.name}
                      </h4>
                      <div className="flex items-center gap-2 text-violet-600">
                        <ScaleIcon className="w-5 h-5" />
                        <span className="font-medium">Единица измерения: {ingredient.unit}</span>
                      </div>
                    </div>

                    {/* Количество и цена */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                          <BeakerIcon className="w-5 h-5" />
                          <span className="font-medium">В наличии</span>
                        </div>
                        <p className="text-lg font-semibold text-emerald-700">
                        {ingredient.inStock} {ingredient.unit}
                        </p>
                      </div>

                      <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                        <div className="flex items-center gap-2 text-violet-600 mb-1">
                          <CurrencyDollarIcon className="w-5 h-5" />
                          <span className="font-medium">Текущая цена</span>
                        </div>
                        <p className="text-lg font-semibold text-violet-700">
                          {formatPrice(Number(ingredient.currentPrice))} / {ingredient.unit}
                        </p>
                      </div>
                    </div>

                    {/* Дата последней поставки */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <ClockIcon className="w-5 h-5" />
                        <span className="font-medium">Дата поставки:</span>
                        <span>{formatDate(ingredient.lastDeliveryDate || ingredient.createdAt)}</span>
                      </div>
                    </div>

                    {/* Кнопка добавления в стоп-лист */}
                    {!isInStopList && (
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => setIsConfirmOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <ExclamationTriangleIcon className="w-5 h-5" />
                          Добавить в стоп-лист
                        </Button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmStopListModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleAddToStopList}
        isLoading={isLoading}
        ingredientName={ingredient.name}
      />
    </>
  );
} 