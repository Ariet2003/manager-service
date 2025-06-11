import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  BeakerIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentPrice: number;
  inStock: number;
}

export function DeliveryModal({ isOpen, onClose }: DeliveryModalProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<number | ''>('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Загрузка списка ингредиентов
  const { data: ingredientsData } = useQuery<{ ingredients: Ingredient[] }>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const response = await fetch('/api/ingredients');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      return response.json();
    },
  });

  // Загрузка списка поставщиков
  const { data: suppliersData } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      return response.json();
    },
  });

  // Фильтрация ингредиентов
  const filteredIngredients = ingredientsData?.ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Фильтрация поставщиков
  const filteredSuppliers = suppliersData?.suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // Мутация для создания новой поставки
  const createDeliveryMutation = useMutation({
    mutationFn: async (deliveryData: {
      ingredientId: number;
      supplierId: number;
      quantity: number;
      pricePerUnit: number;
    }) => {
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create delivery');
      }

      return response.json();
    },
    onSuccess: () => {
      // Обновляем кэш поставок и ингредиентов
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
      setIsConfirmOpen(false);
    },
  });

  const resetForm = () => {
    setSelectedIngredient('');
    setSelectedSupplier('');
    setQuantity('');
    setPricePerUnit('');
    setError(null);
    setIngredientSearch('');
    setSupplierSearch('');
    setIsConfirmOpen(false);
    setConfirmData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedIngredient || !selectedSupplier || !quantity || !pricePerUnit) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(pricePerUnit);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Количество должно быть положительным числом');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Цена должна быть положительным числом');
      return;
    }

    // Подготовка данных для подтверждения
    const selectedIngredientData = ingredientsData?.ingredients.find(i => i.id === Number(selectedIngredient));
    const selectedSupplierData = suppliersData?.suppliers.find(s => s.id === Number(selectedSupplier));

    setConfirmData({
      ingredientId: Number(selectedIngredient),
      supplierId: Number(selectedSupplier),
      quantity: quantityNum,
      pricePerUnit: priceNum,
      ingredientName: selectedIngredientData?.name,
      supplierName: selectedSupplierData?.name,
      unit: selectedIngredientData?.unit,
    });

    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (confirmData) {
      createDeliveryMutation.mutate({
        ingredientId: confirmData.ingredientId,
        supplierId: confirmData.supplierId,
        quantity: confirmData.quantity,
        pricePerUnit: confirmData.pricePerUnit,
      });
    }
  };

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
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
                  {/* Заголовок */}
                  <div className="relative h-16 bg-violet-50 flex items-center px-6">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      Новая поставка
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="absolute right-6 text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="px-6 py-6">
                    {error && (
                      <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Левая колонка */}
                      <div className="space-y-6">
                        {/* Выбор ингредиента */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                              <BeakerIcon className="w-5 h-5 text-violet-600" />
                            </div>
                            <h3 className="font-medium text-gray-900">Ингредиент</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Поиск ингредиента..."
                                value={ingredientSearch}
                                onChange={(e) => setIngredientSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                              />
                              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                            <select
                              value={selectedIngredient}
                              onChange={(e) => setSelectedIngredient(e.target.value as number | '')}
                              className="w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            >
                              <option value="">Выберите ингредиент</option>
                              {filteredIngredients?.map((ingredient) => (
                                <option key={ingredient.id} value={ingredient.id}>
                                  {ingredient.name} ({ingredient.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Выбор поставщика */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                              <TruckIcon className="w-5 h-5 text-violet-600" />
                            </div>
                            <h3 className="font-medium text-gray-900">Поставщик</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Поиск поставщика..."
                                value={supplierSearch}
                                onChange={(e) => setSupplierSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                              />
                              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                            <select
                              value={selectedSupplier}
                              onChange={(e) => setSelectedSupplier(e.target.value as number | '')}
                              className="w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            >
                              <option value="">Выберите поставщика</option>
                              {filteredSuppliers?.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Правая колонка */}
                      <div className="space-y-6">
                        {/* Количество */}
                        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                          <label className="block text-sm font-medium text-gray-700 mb-4">
                            Количество
                          </label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            step="0.01"
                            min="0"
                            placeholder="Введите количество"
                          />
                        </div>

                        {/* Цена */}
                        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                          <label className="block text-sm font-medium text-gray-700 mb-4">
                            Цена за единицу
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={pricePerUnit}
                              onChange={(e) => setPricePerUnit(e.target.value)}
                              className="w-full pl-3 pr-16 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                              step="0.01"
                              min="0"
                              placeholder="Введите цену"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-gray-500 text-sm">KGS</span>
                            </div>
                          </div>
                        </div>

                        {/* Предпросмотр суммы */}
                        {quantity && pricePerUnit && (
                          <div className="bg-white rounded-xl p-4 border border-violet-100 shadow-sm">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Общая сумма:</span>
                              <span className="font-medium text-violet-600">
                                {formatPrice(Number(quantity) * Number(pricePerUnit))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="min-w-[120px]"
                      >
                        Добавить
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Диалог подтверждения */}
      <Transition appear show={isConfirmOpen} as={Fragment}>
        <Dialog 
          as="div"
          className="relative z-[60]"
          onClose={() => setIsConfirmOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl">
                  <div className="relative h-14 bg-violet-50 flex items-center px-6">
                    <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-violet-500" />
                      Подтверждение поставки
                    </Dialog.Title>
                    <button
                      onClick={() => setIsConfirmOpen(false)}
                      className="absolute right-6 text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {confirmData && (
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="bg-violet-50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Ингредиент:</span>
                            <span className="font-medium text-gray-900">{confirmData.ingredientName}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Поставщик:</span>
                            <span className="font-medium text-gray-900">{confirmData.supplierName}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Количество:</span>
                            <span className="font-medium text-gray-900">
                              {confirmData.quantity} {confirmData.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Цена за единицу:</span>
                            <span className="font-medium text-violet-600">
                              {formatPrice(confirmData.pricePerUnit)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-violet-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">Общая сумма:</span>
                              <span className="font-medium text-lg text-violet-600">
                                {formatPrice(confirmData.quantity * confirmData.pricePerUnit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6">
                        <Button
                          variant="secondary"
                          onClick={() => setIsConfirmOpen(false)}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleConfirm}
                          disabled={createDeliveryMutation.isPending}
                          className="min-w-[120px]"
                        >
                          {createDeliveryMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
} 