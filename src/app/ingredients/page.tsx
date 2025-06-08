import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { IngredientModal } from '@/components/ui/IngredientModal';
import { Ingredient } from '@/types/ingredient';

interface StopListItem {
  id: number;
  ingredientId: number;
  shiftId: number;
  createdAt: string;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stopListItems, setStopListItems] = useState<StopListItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderIngredient = (ingredient: Ingredient) => {
    const inStopList = stopListItems.some(item => item.ingredientId === ingredient.id);

    return (
      <div
        key={ingredient.id}
        onClick={() => {
          setSelectedIngredient(ingredient);
          setIsModalOpen(true);
        }}
        className={`
          p-4 hover:bg-gray-50 cursor-pointer transition-colors
          ${inStopList ? 'bg-red-50 hover:bg-red-100/80' : ''}
          border-b border-gray-100 last:border-b-0
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{ingredient.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              В наличии: {ingredient.quantity} {ingredient.unit}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium text-violet-600">
              {formatPrice(Number(ingredient.unitPrice))}
            </span>
            <span className="text-sm text-gray-500">
              за {ingredient.unit}
            </span>
            {inStopList && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 mt-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                СТОП
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Загружаем ингредиенты и стоп-лист параллельно
        const [ingredientsResponse, stopListResponse] = await Promise.all([
          fetch('/api/ingredients'),
          fetch('/api/ingredients/stop-list')
        ]);

        if (!ingredientsResponse.ok) {
          throw new Error('Ошибка при загрузке ингредиентов');
        }

        if (!stopListResponse.ok) {
          throw new Error('Ошибка при загрузке стоп-листа');
        }

        const ingredientsData = await ingredientsResponse.json();
        const stopListData = await stopListResponse.json();

        setIngredients(ingredientsData);
        setStopListItems(stopListData);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded max-w-2xl w-full mx-4">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {ingredients.map(ingredient => renderIngredient(ingredient))}
      </div>

      <IngredientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIngredient(null);
          // Обновляем стоп-лист после закрытия модального окна
          fetch('/api/ingredients/stop-list')
            .then(response => response.json())
            .then(data => setStopListItems(data))
            .catch(console.error);
        }}
        ingredient={selectedIngredient}
      />
    </div>
  );
} 