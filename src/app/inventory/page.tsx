'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  TruckIcon,
  ArchiveBoxXMarkIcon,
  ArrowLeftIcon,
  BeakerIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { DeliveryModal } from '@/components/ui/DeliveryModal';
import { DeliveryDetailsModal } from '@/components/ui/DeliveryDetailsModal';
import { WriteOffModal } from '@/components/ui/WriteOffModal';
import { WriteOffDetailsModal } from '@/components/ui/WriteOffDetailsModal';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type Tab = 'delivery' | 'writeoff';
type SortOrder = 'date' | 'name' | 'price-asc' | 'price-desc';
type WriteOffType = 'SPOILAGE' | 'USAGE' | 'INVENTORY' | 'OTHER';

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

interface Delivery {
  id: number;
  ingredientId: number;
  ingredient: Ingredient;
  supplierId: number;
  supplier: Supplier;
  quantity: number;
  pricePerUnit: number;
  deliveryDate: string;
  createdById: string;
}

interface WriteOff {
  id: number;
  ingredient: {
    name: string;
    unit: string;
  };
  quantity: number;
  type: WriteOffType;
  date: string;
  comment?: string | null;
  createdBy: {
    fullName: string;
  };
}

const writeOffTypes: Record<WriteOffType, string> = {
  SPOILAGE: 'Порча',
  USAGE: 'Использование',
  INVENTORY: 'Инвентаризация',
  OTHER: 'Другое',
};

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('delivery');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [selectedWriteOff, setSelectedWriteOff] = useState<WriteOff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date');

  // Запрос поставок
  const { data: deliveriesData, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const response = await fetch('/api/deliveries');
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      return response.json();
    },
  });

  // Запрос списаний
  const { data: writeOffsData, isLoading: isLoadingWriteOffs } = useQuery({
    queryKey: ['writeoffs'],
    queryFn: async () => {
      const response = await fetch('/api/writeoffs');
      if (!response.ok) {
        throw new Error('Failed to fetch write-offs');
      }
      return response.json();
    },
  });

  // Фильтрация и сортировка поставок
  const filteredAndSortedDeliveries = deliveriesData?.deliveries
    ?.filter((delivery: any) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        delivery.ingredient.name.toLowerCase().includes(searchLower) ||
        delivery.supplier.name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: any, b: any) => {
      switch (sortOrder) {
        case 'name':
          return a.ingredient.name.localeCompare(b.ingredient.name);
        case 'price-asc':
          return Number(a.pricePerUnit) - Number(b.pricePerUnit);
        case 'price-desc':
          return Number(b.pricePerUnit) - Number(a.pricePerUnit);
        case 'date':
        default:
          return new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime();
      }
    });

  // Фильтрация списаний по поисковому запросу
  const filteredWriteOffs = writeOffsData?.writeOffs.filter((writeOff: WriteOff) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      writeOff.ingredient.name.toLowerCase().includes(searchLower) ||
      writeOff.createdBy.fullName.toLowerCase().includes(searchLower) ||
      writeOffTypes[writeOff.type].toLowerCase().includes(searchLower)
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getUTCDate().toString().padStart(2, '0')}.${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.${date.getUTCFullYear()}, ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  if (isLoadingDeliveries) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TruckIcon className="w-6 h-6 text-[rgb(124,58,237)]" />
              Поставки и списания
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
                placeholder={activeTab === 'delivery' ? "Поиск по поставкам..." : "Поиск по списаниям..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            >
              <option value="date">По дате (сначала новые)</option>
              <option value="name">По названию</option>
              <option value="price-asc">Цена (по возрастанию)</option>
              <option value="price-desc">Цена (по убыванию)</option>
            </select>
          </div>
        </div>

        {/* Список поставок */}
        {activeTab === 'delivery' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {isLoadingDeliveries ? (
              <div className="p-8 text-center text-gray-500">
                Загрузка...
              </div>
            ) : filteredAndSortedDeliveries?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Поставки не найдены
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAndSortedDeliveries?.map((delivery: any) => (
                  <div
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(delivery)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <BeakerIcon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {delivery.ingredient.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {delivery.quantity} {delivery.ingredient.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(delivery.deliveryDate), 'dd.MM.yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Список списаний */}
        {activeTab === 'writeoff' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {isLoadingWriteOffs ? (
              <div className="p-8 text-center text-gray-500">
                Загрузка...
              </div>
            ) : filteredWriteOffs?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Списания не найдены
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredWriteOffs?.map((writeOff: WriteOff) => (
                  <div
                    key={writeOff.id}
                    onClick={() => setSelectedWriteOff(writeOff)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <BeakerIcon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {writeOff.ingredient.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {writeOff.quantity} {writeOff.ingredient.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(writeOff.date), 'dd.MM.yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Фиксированная панель внизу */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setActiveTab('delivery')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'delivery'
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TruckIcon className="w-5 h-5" />
                Поставки
              </button>
              <button
                onClick={() => setActiveTab('writeoff')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'writeoff'
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ArchiveBoxXMarkIcon className="w-5 h-5" />
                Списания
              </button>
            </div>
          </div>
        </div>
        {/* Отступ для фиксированной панели */}
        <div className="h-24" />

        {/* Кнопка добавления */}
        <div className="fixed bottom-24 right-4 sm:right-6 lg:right-8">
          <Button
            variant="primary"
            onClick={() => activeTab === 'delivery' ? setIsDeliveryModalOpen(true) : setIsWriteOffModalOpen(true)}
            className="shadow-lg"
          >
            {activeTab === 'delivery' ? (
              <>
                <TruckIcon className="w-5 h-5 mr-2" />
                Новая поставка
              </>
            ) : (
              <>
                <ArchiveBoxXMarkIcon className="w-5 h-5 mr-2" />
                Новое списание
              </>
            )}
          </Button>
        </div>

        {/* Модальные окна */}
        <DeliveryModal
          isOpen={isDeliveryModalOpen}
          onClose={() => setIsDeliveryModalOpen(false)}
        />

        <DeliveryDetailsModal
          isOpen={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          delivery={selectedDelivery}
        />

        <WriteOffModal
          isOpen={isWriteOffModalOpen}
          onClose={() => setIsWriteOffModalOpen(false)}
        />

        <WriteOffDetailsModal
          isOpen={!!selectedWriteOff}
          onClose={() => setSelectedWriteOff(null)}
          writeOff={selectedWriteOff}
        />
      </main>
    </div>
  );
} 