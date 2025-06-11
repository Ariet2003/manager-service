import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  BeakerIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';

interface WriteOffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentPrice: number;
  inStock: number;
}

type WriteOffType = 'SPOILAGE' | 'USAGE' | 'INVENTORY' | 'OTHER';

const writeOffTypes: { value: WriteOffType; label: string }[] = [
  { value: 'SPOILAGE', label: 'Порча' },
  { value: 'USAGE', label: 'Использование' },
  { value: 'INVENTORY', label: 'Инвентаризация' },
  { value: 'OTHER', label: 'Другое' },
];

export function WriteOffModal({ isOpen, onClose }: WriteOffModalProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [type, setType] = useState<WriteOffType>('SPOILAGE');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
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

  // Фильтрация ингредиентов
  const filteredIngredients = ingredientsData?.ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Мутация для создания списания
  const createWriteOffMutation = useMutation({
    mutationFn: async (writeOffData: {
      ingredientId: number;
      quantity: number;
      type: WriteOffType;
      comment?: string;
    }) => {
      const response = await fetch('/api/writeoffs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(writeOffData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create write-off');
      }

      return response.json();
    },
    onSuccess: () => {
      // Обновляем кэш списаний и ингредиентов
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
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
    setQuantity('');
    setType('SPOILAGE');
    setComment('');
    setError(null);
    setIngredientSearch('');
    setIsConfirmOpen(false);
    setConfirmData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedIngredient || !quantity || !type) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    const quantityNum = parseFloat(quantity);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Количество должно быть положительным числом');
      return;
    }

    const selectedIngredientData = ingredientsData?.ingredients.find(i => i.id === Number(selectedIngredient));

    if (selectedIngredientData && quantityNum > selectedIngredientData.inStock) {
      setError(`Количество для списания превышает текущий остаток (${selectedIngredientData.inStock} ${selectedIngredientData.unit})`);
      return;
    }

    setConfirmData({
      ingredientId: Number(selectedIngredient),
      quantity: quantityNum,
      type,
      comment,
      ingredientName: selectedIngredientData?.name,
      unit: selectedIngredientData?.unit,
    });

    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (confirmData) {
      createWriteOffMutation.mutate({
        ingredientId: confirmData.ingredientId,
        quantity: confirmData.quantity,
        type: confirmData.type,
        comment: confirmData.comment,
      });
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  {/* Заголовок */}
                  <div className="relative bg-violet-50 rounded-t-2xl">
                    <div className="px-6 py-4">
                      <Dialog.Title className="text-xl font-semibold text-gray-900">
                        Новое списание
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                      <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {ingredient.name} (в наличии: {ingredient.inStock} {ingredient.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Тип списания */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                              <ClipboardDocumentListIcon className="w-5 h-5 text-violet-600" />
                            </div>
                            <h3 className="font-medium text-gray-900">Тип списания</h3>
                          </div>
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value as WriteOffType)}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          >
                            {writeOffTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Правая колонка */}
                      <div className="space-y-6">
                        {/* Количество */}
                        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                          <label className="block text-sm font-medium text-gray-700 mb-4">
                            {selectedIngredient ? `Напишите количество в ${ingredientsData?.ingredients.find(i => i.id === Number(selectedIngredient))?.unit}` : 'Выберите ингредиент'}
                          </label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            step="0.01"
                            min="0"
                            placeholder={selectedIngredient ? `Введите количество в ${ingredientsData?.ingredients.find(i => i.id === Number(selectedIngredient))?.unit}` : 'Сначала выберите ингредиент'}
                            disabled={!selectedIngredient}
                          />
                        </div>

                        {/* Комментарий */}
                        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                          <label className="block text-sm font-medium text-gray-700 mb-4">
                            Комментарий
                          </label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            rows={3}
                            placeholder="Введите причину списания..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end gap-3 mt-8 pt-2 border-t border-gray-100">
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
                        Списать
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
      <Transition show={isConfirmOpen} as={Fragment}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  <div className="relative bg-violet-50 rounded-t-2xl">
                    <div className="px-6 py-4">
                      <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-violet-500" />
                        Подтверждение списания
                      </Dialog.Title>
                      <button
                        onClick={() => setIsConfirmOpen(false)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
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
                            <span className="text-gray-600">Количество:</span>
                            <span className="font-medium text-gray-900">
                              {confirmData.quantity} {confirmData.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Тип списания:</span>
                            <span className="font-medium text-gray-900">
                              {writeOffTypes.find(t => t.value === confirmData.type)?.label}
                            </span>
                          </div>
                          {confirmData.comment && (
                            <div className="pt-2 border-t border-violet-100">
                              <p className="text-sm text-gray-600">Комментарий:</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {confirmData.comment}
                              </p>
                            </div>
                          )}
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
                          disabled={createWriteOffMutation.isPending}
                          className="min-w-[120px]"
                        >
                          {createWriteOffMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
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