'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  fullName: string;
}

interface OrderItem {
  id: number;
  menuItem: {
    name: string;
  };
  quantity: number;
  price: number;
}

interface Payment {
  id: number;
  amount: number;
  paymentType: 'CASH' | 'CARD' | 'QR' | 'OTHER';
  paidAt: string;
}

interface Order {
  id: number;
  tableNumber: string;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  totalPrice: number;
  createdAt: string;
  paidAt: string | null;
  waiter: User;
  cashier: User | null;
  items: OrderItem[];
  payments: Payment[];
}

type SortOrder = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc';

function OrderModal({ order: initialOrder, isOpen, onClose, onOrderUpdate }: { 
  order: Order | null; 
  isOpen: boolean; 
  onClose: () => void;
  onOrderUpdate: (updatedOrder: Order) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(initialOrder);

  // Обновляем локальное состояние при изменении initialOrder
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отмене заказа');
      }

      const updatedOrder = {
        ...order,
        status: 'CANCELLED' as const
      };

      // Обновляем локальное состояние
      setOrder(updatedOrder);
      // Обновляем состояние в родительском компоненте
      onOrderUpdate(updatedOrder);

      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

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
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <TableCellsIcon className="w-6 h-6 text-violet-600" />
                      Заказ №{order.id} - Стол {order.tableNumber}
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

                    {/* Статус и сумма */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`rounded-lg p-4 border ${
                        order.status === 'PAID' 
                          ? 'bg-emerald-50 border-emerald-100' 
                          : order.status === 'CANCELLED'
                          ? 'bg-red-50 border-red-100'
                          : 'bg-yellow-50 border-yellow-100'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(order.status)}
                          <span className="font-medium text-sm sm:text-base">
                            Статус заказа
                          </span>
                        </div>
                        <p className={`text-lg sm:text-xl font-semibold ${
                          order.status === 'PAID'
                            ? 'text-emerald-700'
                            : order.status === 'CANCELLED'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        }`}>
                          {getStatusText(order.status)}
                        </p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                        <div className="flex items-center gap-2 text-violet-600 mb-1">
                          <BanknotesIcon className="w-5 h-5" />
                          <span className="font-medium text-sm sm:text-base">Сумма заказа</span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-violet-700">
                          {formatPrice(order.totalPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Позиции заказа */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                        <span className="font-medium text-sm sm:text-base">Позиции заказа</span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between bg-white p-3 rounded border border-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 text-sm sm:text-base">
                                {item.menuItem.name}
                              </span>
                              <span className="text-gray-500 text-sm">
                                × {item.quantity}
                              </span>
                            </div>
                            <span className="text-gray-900 font-medium text-sm sm:text-base">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Оплата */}
                    {order.payments.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <CurrencyDollarIcon className="w-5 h-5" />
                          <span className="font-medium text-sm sm:text-base">Оплата</span>
                        </div>
                        <div className="space-y-2">
                          {order.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex justify-between bg-white p-3 rounded border border-gray-100"
                            >
                              <span className="text-gray-700 text-sm sm:text-base">
                                {getPaymentTypeText(payment.paymentType)}
                              </span>
                              <span className="text-gray-900 font-medium text-sm sm:text-base">
                                {formatPrice(payment.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Информация о персонале */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <UserIcon className="w-5 h-5" />
                          <span className="font-medium text-sm sm:text-base">Официант</span>
                        </div>
                        <p className="text-gray-900 text-sm sm:text-base">
                          {order.waiter.fullName}
                        </p>
                      </div>
                      {order.cashier && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <UserIcon className="w-5 h-5" />
                            <span className="font-medium text-sm sm:text-base">Кассир</span>
                          </div>
                          <p className="text-gray-900 text-sm sm:text-base">
                            {order.cashier.fullName}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Время */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100 gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>Создан: {formatDate(order.createdAt)}</span>
                      </div>
                      {order.paidAt && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>Оплачен: {formatDate(order.paidAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Кнопка отмены заказа */}
                    {order.status === 'OPEN' && (
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button
                          onClick={() => setIsConfirmOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <XMarkIcon className="w-5 h-5" />
                          Отменить заказ
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

      {/* Модальное окно подтверждения отмены */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        className="relative z-[60]"
      >
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                  Подтверждение отмены
                </Dialog.Title>
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Вы уверены, что хотите отменить заказ №{order.id}?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Это действие нельзя будет отменить.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  isLoading={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                >
                  Отменить заказ
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'PAID':
      return 'text-emerald-700 bg-emerald-50';
    case 'CANCELLED':
      return 'text-red-700 bg-red-50';
    default:
      return 'text-yellow-700 bg-yellow-50';
  }
};

const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'PAID':
      return 'Оплачен';
    case 'CANCELLED':
      return 'Отменён';
    default:
      return 'Открыт';
  }
};

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'PAID':
      return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
    case 'CANCELLED':
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
  }
};

const getPaymentTypeText = (type: Payment['paymentType']) => {
  switch (type) {
    case 'CASH':
      return 'Наличные';
    case 'CARD':
      return 'Карта';
    case 'QR':
      return 'QR-код';
    default:
      return 'Другое';
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке заказов');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const searchLower = search.toLowerCase();
    return (
      order.tableNumber.toLowerCase().includes(searchLower) ||
      order.waiter.fullName.toLowerCase().includes(searchLower) ||
      (order.cashier?.fullName.toLowerCase().includes(searchLower) ?? false) ||
      order.items.some(item => item.menuItem.name.toLowerCase().includes(searchLower))
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortOrder) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-desc':
        return b.totalPrice - a.totalPrice;
      case 'price-asc':
        return a.totalPrice - b.totalPrice;
      default:
        return 0;
    }
  });

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

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
            <XCircleIcon className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-6 h-6 sm:w-7 sm:h-7 text-violet-600" />
              История заказов
            </h1>
            <div className="flex items-center">
              <Button
                variant="secondary"
                onClick={() => router.push('/dashboard')}
                className="text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 shadow-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Назад</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Поиск заказов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm text-sm sm:text-base"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base"
            >
              <option value="date-desc">Сначала новые</option>
              <option value="date-asc">Сначала старые</option>
              <option value="price-desc">По сумме (убыв.)</option>
              <option value="price-asc">По сумме (возр.)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {sortedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex gap-4">
                <div className="flex flex-col justify-center items-center border-r border-gray-100 pr-4">
                  <span className="text-xs text-gray-500">Заказ</span>
                  <span className="text-sm font-semibold text-violet-600">№{order.id}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <div className="flex items-center justify-between sm:justify-start">
                        <div className="flex items-center gap-2">
                          <TableCellsIcon className="w-5 h-5 text-violet-600" />
                          <span className="font-medium text-gray-900">Стол {order.tableNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:hidden">
                          <BanknotesIcon className="w-5 h-5 text-violet-600" />
                          <span className="font-medium text-violet-600 text-base">
                            {formatPrice(order.totalPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-violet-600" />
                          <span className="text-gray-600 text-sm sm:text-base">{order.waiter.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:hidden">
                          {getStatusIcon(order.status)}
                          <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center justify-end gap-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-violet-600" />
                        <span className="font-medium text-violet-600 text-lg">
                          {formatPrice(order.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <OrderModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
} 