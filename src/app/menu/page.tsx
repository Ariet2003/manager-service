'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  CakeIcon,
  BeakerIcon,
  ClockIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { MenuItemModal } from '@/components/ui/MenuItemModal';
import { IngredientModal } from '@/components/ui/IngredientModal';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Ingredient } from '@/types/ingredient';

type SortOrder = 'name' | 'price-asc' | 'price-desc' | 'date';
type ViewMode = 'menu' | 'ingredients';

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
    ingredient: {
      id: number;
      name: string;
      unit: string;
      quantity: number;
    };
    quantity: number;
  }>;
  createdBy: {
    fullName: string;
  };
}

interface MenuResponse {
  menuItems: MenuItem[];
}

interface IngredientsResponse {
  ingredients: Ingredient[];
}

interface StopListItem {
  id: number;
  menuItemId: number;
  shiftId: number;
  createdAt: string;
}

interface IngredientStopListItem {
  id: number;
  ingredientId: number;
  shiftId: number;
  createdAt: string;
}

export default function MenuPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('name');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stopListItems, setStopListItems] = useState<StopListItem[]>([]);
  const [ingredientStopListItems, setIngredientStopListItems] = useState<IngredientStopListItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [menuResponse, stopListResponse] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/menu/stop-list')
        ]);

        if (!menuResponse.ok) {
          throw new Error('Ошибка при загрузке меню');
        }

        if (!stopListResponse.ok) {
          throw new Error('Ошибка при загрузке стоп-листа');
        }

        const menuData = await menuResponse.json();
        const stopListData = await stopListResponse.json();

        setMenuItems(menuData.menuItems);
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

  const { data: ingredientsData, isLoading: isIngredientsLoading } = useQuery<IngredientsResponse>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const response = await fetch('/api/ingredients');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      return response.json();
    },
  });

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'ingredients') {
      try {
        const [ingredientsResponse, stopListResponse] = await Promise.all([
          fetch('/api/ingredients'),
          fetch('/api/ingredients/stop-list')
        ]);

        if (!ingredientsResponse.ok) {
          throw new Error('Ошибка при загрузке ингредиентов');
        }

        if (!stopListResponse.ok) {
          throw new Error('Ошибка при загрузке стоп-листа ингредиентов');
        }

        const ingredientsData = await ingredientsResponse.json();
        const stopListData = await stopListResponse.json();

        setIngredientStopListItems(stopListData);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      }
    }
  };

  const isInStopList = (menuItemId: number) => {
    return stopListItems.some(item => item.menuItemId === menuItemId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Нет данных';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredAndSortedItems = menuItems
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const filteredAndSortedIngredients = ingredientsData?.ingredients
    ? ingredientsData.ingredients
        .filter((ingredient) =>
          ingredient.name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
          switch (sortOrder) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'price-asc':
              return Number(a.currentPrice) - Number(b.currentPrice);
            case 'price-desc':
              return Number(b.currentPrice) - Number(a.currentPrice);
            case 'date':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            default:
              return 0;
          }
        })
    : [];

  const renderMenuItem = (item: MenuItem) => {
    const inStopList = isInStopList(item.id);
    
    return (
      <div
        key={item.id}
        onClick={() => {
          setSelectedItem(item);
          setIsModalOpen(true);
        }}
        className={`
          p-4 hover:bg-gray-50 cursor-pointer transition-colors
          ${inStopList ? 'bg-red-50 hover:bg-red-100/80' : ''}
          border-b border-gray-100 last:border-b-0
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              {item.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium text-violet-600">
              {formatPrice(Number(item.price))}
            </span>
            <span className="text-sm text-gray-500">
              {formatPrice(Number(item.costPrice))}
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

  const isIngredientInStopList = (ingredientId: number) => {
    return ingredientStopListItems.some(item => item.ingredientId === ingredientId);
  };

  if (isLoading || isIngredientsLoading) {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CakeIcon className="w-6 h-6 text-[rgb(124,58,237)]" />
              Меню и товары
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
        <div className="mb-8 space-y-4">
          {/* Поиск и сортировка */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={viewMode === 'menu' ? "Поиск блюд..." : "Поиск ингредиентов..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            >
              <option value="name">По названию</option>
              <option value="price-asc">По цене (возр.)</option>
              <option value="price-desc">По цене (убыв.)</option>
              <option value="date">По дате добавления</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {viewMode === 'menu' ? (
              // Отображение блюд
              filteredAndSortedItems.map(renderMenuItem)
            ) : (
              // Отображение ингредиентов
              filteredAndSortedIngredients.map((ingredient) => {
                const inStopList = isIngredientInStopList(ingredient.id);
                
                return (
                  <div
                    key={ingredient.id}
                    onClick={() => setSelectedIngredient(ingredient)}
                    className={`
                      p-4 hover:bg-gray-50 cursor-pointer transition-colors
                      ${inStopList ? 'bg-red-50 hover:bg-red-100/80' : ''}
                      border-b border-gray-100 last:border-b-0
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                          <BeakerIcon className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {ingredient.name}
                          </h3>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <ShoppingCartIcon className="w-4 h-4" />
                              В наличии: {formatQuantity(ingredient.quantity, ingredient.unit)}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              Поставка: {formatDate(ingredient.lastDeliveryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-violet-600">
                          {formatPrice(Number(ingredient.currentPrice))}
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
              })
            )}
          </div>
        </div>

        {/* Фиксированная панель внизу */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleViewModeChange('menu')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
                  viewMode === 'menu'
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CakeIcon className="w-5 h-5" />
                Блюда
              </button>
              <button
                onClick={() => handleViewModeChange('ingredients')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
                  viewMode === 'ingredients'
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BeakerIcon className="w-5 h-5" />
                Ингредиенты
              </button>
            </div>
          </div>
        </div>
        {/* Отступ для фиксированной панели */}
        <div className="h-24" />

        <MenuItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
            // Обновляем стоп-лист после закрытия модального окна
            fetch('/api/menu/stop-list')
              .then(response => response.json())
              .then(data => setStopListItems(data))
              .catch(console.error);
          }}
          item={selectedItem}
        />
        
        <IngredientModal
          isOpen={!!selectedIngredient}
          onClose={() => {
            setSelectedIngredient(null);
            // Обновляем стоп-лист ингредиентов после закрытия модального окна
            fetch('/api/ingredients/stop-list')
              .then(response => response.json())
              .then(data => setIngredientStopListItems(data))
              .catch(console.error);
          }}
          ingredient={selectedIngredient}
        />
      </main>
    </div>
  );
}