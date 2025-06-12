'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  ChartBarIcon,
  ArrowLeftIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  FireIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { createAndDownloadExcel } from '@/utils/excel';

type ReportType = 'sales' | 'inventory' | 'employees' | 'popular-items';

interface ReportOption {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const reportOptions: ReportOption[] = [
  {
    id: 'sales',
    name: 'Отчет по продажам',
    description: 'Анализ продаж, выручки и способов оплаты',
    icon: DocumentChartBarIcon,
  },
  {
    id: 'inventory',
    name: 'Отчет по инвентаризации',
    description: 'Состояние склада, поставки и списания',
    icon: ClipboardDocumentListIcon,
  },
  {
    id: 'employees',
    name: 'Отчет по сменам',
    description: 'Анализ смен и эффективности персонала',
    icon: UserGroupIcon,
  },
  {
    id: 'popular-items',
    name: 'Популярные блюда',
    description: 'Статистика продаж по позициям меню',
    icon: FireIcon,
  },
];

const exportToExcel = (data: any, type: ReportType) => {
  let worksheetData: any[] = [];
  let fileName = '';

  switch (type) {
    case 'sales': {
      fileName = `Отчет_по_продажам_${format(new Date(), 'dd.MM.yyyy')}`;
      
      // Общая статистика
      worksheetData = [
        ['Общая статистика'],
        ['Всего заказов', data.stats.totalOrders],
        ['Общая выручка', `${data.stats.totalRevenue} сом`],
        ['Средний чек', `${Math.round(data.stats.averageCheck)} сом`],
        [],
        ['Способы оплаты'],
        ...Object.entries(data.stats.paymentsByType).map(([type, amount]) => [
          type === 'CASH' ? 'Наличные' :
          type === 'CARD' ? 'Карта' :
          type === 'QR' ? 'QR-код' : 'Другое',
          `${amount} сом`
        ]),
        [],
        ['Статистика по официантам'],
        ['Официант', 'Количество заказов', 'Выручка', 'Средний чек'],
        ...data.stats.waiterStats.map((waiter: any) => [
          waiter.name,
          waiter.ordersCount,
          `${waiter.totalRevenue} сом`,
          `${Math.round(waiter.totalRevenue / waiter.ordersCount)} сом`
        ]),
        [],
        ['Популярные блюда'],
        ['Название', 'Количество', 'Выручка'],
        ...data.stats.popularItems.map((item: any) => [
          item.name,
          item.quantity,
          `${item.revenue} сом`
        ]),
        [],
        ['Список заказов'],
        ['№', 'Стол', 'Дата оплаты', 'Официант', 'Кассир', 'Способ оплаты', 'Сумма'],
        ...data.orders.map((order: any) => [
          order.id,
          order.tableNumber,
          format(new Date(order.paidAt), 'dd.MM.yyyy HH:mm'),
          order.waiterName,
          order.cashierName,
          order.paymentTypes.map((type: string) =>
            type === 'CASH' ? 'Наличные' :
            type === 'CARD' ? 'Карта' :
            type === 'QR' ? 'QR-код' : 'Другое'
          ).join(', '),
          `${order.totalPrice} сом`
        ])
      ];
      break;
    }

    case 'inventory': {
      fileName = `Отчет_по_инвентаризации_${format(new Date(), 'dd.MM.yyyy')}`;
      worksheetData = [
        ['Состояние склада'],
        ['Ингредиент', 'Ед. изм.', 'На складе', 'Поставки', 'Списания'],
        ...data.ingredients.map((ingredient: any) => [
          ingredient.name,
          ingredient.unit,
          ingredient.inStock,
          ingredient.deliveries.reduce((sum: number, d: any) => sum + Number(d.quantity), 0),
          ingredient.writeOffs.reduce((sum: number, w: any) => sum + Number(w.quantity), 0)
        ])
      ];
      break;
    }

    case 'employees': {
      fileName = `Отчет_по_сменам_${format(new Date(), 'dd.MM.yyyy')}`;
      worksheetData = [
        ['Отчет по сменам'],
        [],
        ...data.shifts.flatMap((shift: any) => [
          [`Смена #${shift.id} (${format(new Date(shift.startedAt), 'dd.MM.yyyy')})`],
          ['Менеджер:', shift.manager.fullName],
          [],
          ['Персонал на смене:'],
          ['Сотрудник', 'Роль'],
          ...shift.staff.map((staff: any) => [
            staff.user.fullName,
            staff.user.role
          ]),
          [],
          ['Статистика смены:'],
          ['Количество заказов', shift.orders.length],
          ['Выручка', `${shift.orders.reduce((sum: number, order: any) => sum + Number(order.totalPrice), 0)} сом`],
          [],
          []
        ])
      ];
      break;
    }

    case 'popular-items': {
      fileName = `Отчет_по_популярным_блюдам_${format(new Date(), 'dd.MM.yyyy')}`;
      worksheetData = [
        ['Топ популярных блюд'],
        ['Название', 'Количество продаж', 'Цена', 'Выручка'],
        ...data.items.map((item: any) => [
          item.details.name,
          item._sum.quantity,
          `${item.details.price} сом`,
          `${Number(item.details.price) * item._sum.quantity} сом`
        ])
      ];
      break;
    }
  }

  createAndDownloadExcel(worksheetData, 'Отчет', fileName);
};

export default function ReportsPage() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [startDate, setStartDate] = useState<string>(
    format(new Date().setDate(1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleReportSelect = (type: ReportType) => {
    setSelectedReport(type);
    setReportData(null);
  };

  const fetchReport = async () => {
    if (!selectedReport) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reports?type=${selectedReport}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      console.log('Fetched report data:', { type: selectedReport, data });
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Export button clicked, data:', { type: selectedReport, data: reportData });
    if (!reportData || !selectedReport) return;
    exportToExcel(reportData, selectedReport);
  };

  const canExport = () => {
    console.log('Checking can export:', { 
      selectedReport, 
      hasReportData: !!reportData,
      isLoading 
    });

    if (!reportData || !selectedReport || isLoading) {
      console.log('Basic checks failed');
      return false;
    }
    
    let result = false;
    switch (selectedReport) {
      case 'sales':
        result = !!(reportData.orders?.length > 0 || reportData.stats);
        console.log('Sales check:', { 
          hasOrders: !!reportData.orders, 
          ordersLength: reportData.orders?.length,
          hasStats: !!reportData.stats,
          result 
        });
        break;
      case 'inventory':
        result = !!(reportData.ingredients?.length > 0);
        console.log('Inventory check:', { 
          hasIngredients: !!reportData.ingredients,
          ingredientsLength: reportData.ingredients?.length,
          result 
        });
        break;
      case 'employees':
        result = !!(reportData.shifts?.length > 0);
        console.log('Employees check:', { 
          hasShifts: !!reportData.shifts,
          shiftsLength: reportData.shifts?.length,
          result 
        });
        break;
      case 'popular-items':
        result = !!(reportData.items?.length > 0);
        console.log('Popular items check:', { 
          hasItems: !!reportData.items,
          itemsLength: reportData.items?.length,
          result 
        });
        break;
    }
    return result;
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'sales':
        if (!reportData.orders || !reportData.stats) return null;
        return (
          <div className="space-y-6">
            {/* Основные показатели */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Всего заказов</h3>
                <p className="text-2xl font-semibold mt-1">{reportData.stats.totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Общая выручка</h3>
                <p className="text-2xl font-semibold mt-1">
                  {Number(reportData.stats.totalRevenue).toLocaleString('ru-RU')} сом
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Средний чек</h3>
                <p className="text-2xl font-semibold mt-1">
                  {Number(reportData.stats.averageCheck).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сом
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Способы оплаты</h3>
                <div className="space-y-1 mt-2">
                  {Object.entries(reportData.stats.paymentsByType).map(([type, amount]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {type === 'CASH' ? 'Наличные' :
                         type === 'CARD' ? 'Карта' :
                         type === 'QR' ? 'QR-код' : 'Другое'}
                      </span>
                      <span className="font-medium">{Number(amount).toLocaleString('ru-RU')} сом</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Статистика по официантам */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Статистика по официантам</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Официант</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кол-во заказов</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выручка</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Средний чек</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.stats.waiterStats.map((waiter: any) => (
                      <tr key={waiter.name}>
                        <td className="px-4 py-3 text-sm">{waiter.name}</td>
                        <td className="px-4 py-3 text-sm">{waiter.ordersCount}</td>
                        <td className="px-4 py-3 text-sm">
                          {Number(waiter.totalRevenue).toLocaleString('ru-RU')} сом
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {Number(waiter.totalRevenue / waiter.ordersCount).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сом
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Популярные блюда */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Топ 10 популярных блюд</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Количество</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выручка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.stats.popularItems.map((item: any) => (
                      <tr key={item.name}>
                        <td className="px-4 py-3 text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm">
                          {Number(item.revenue).toLocaleString('ru-RU')} сом
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Список заказов */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Список заказов</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Стол</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата оплаты</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Официант</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кассир</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Способ оплаты</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.orders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-sm">{order.id}</td>
                        <td className="px-4 py-3 text-sm">{order.tableNumber}</td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(order.paidAt), 'dd.MM.yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm">{order.waiterName}</td>
                        <td className="px-4 py-3 text-sm">{order.cashierName}</td>
                        <td className="px-4 py-3 text-sm">
                          {order.paymentTypes.map((type: string) => 
                            type === 'CASH' ? 'Наличные' :
                            type === 'CARD' ? 'Карта' :
                            type === 'QR' ? 'QR-код' : 'Другое'
                          ).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {Number(order.totalPrice).toLocaleString('ru-RU')} сом
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'inventory':
        if (!reportData.ingredients) return null;
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <h3 className="text-lg font-medium">Состояние склада</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ингредиент</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ед. изм.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">На складе</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Поставки</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Списания</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.ingredients.map((ingredient: any) => (
                    <tr key={ingredient.id}>
                      <td className="px-4 py-3 text-sm">{ingredient.name}</td>
                      <td className="px-4 py-3 text-sm">{ingredient.unit}</td>
                      <td className="px-4 py-3 text-sm">{Number(ingredient.inStock).toLocaleString('ru-RU')}</td>
                      <td className="px-4 py-3 text-sm">
                        {ingredient.deliveries
                          .reduce((sum: number, d: any) => sum + Number(d.quantity), 0)
                          .toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {ingredient.writeOffs
                          .reduce((sum: number, w: any) => sum + Number(w.quantity), 0)
                          .toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'employees':
        if (!reportData.shifts) return null;
        return (
          <div className="space-y-6">
            {reportData.shifts.map((shift: any) => (
              <div key={shift.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium">
                    Смена #{shift.id} ({format(new Date(shift.startedAt), 'dd.MM.yyyy')})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Менеджер: {shift.manager.fullName}
                  </p>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Персонал на смене:</h4>
                  <div className="space-y-2">
                    {shift.staff.map((staff: any) => (
                      <div key={staff.id} className="flex items-center justify-between">
                        <span>{staff.user.fullName}</span>
                        <span className="text-sm text-gray-500">{staff.user.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Количество заказов</h4>
                      <p className="text-xl font-semibold mt-1">{shift.orders.length}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Выручка</h4>
                      <p className="text-xl font-semibold mt-1">
                        {shift.orders
                          .reduce((sum: number, order: any) => sum + Number(order.totalPrice), 0)
                          .toLocaleString('ru-RU')} сом
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'popular-items':
        if (!reportData.items) return null;
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <h3 className="text-lg font-medium">Популярные блюда</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Количество продаж</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выручка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.items.map((item: any) => (
                    <tr key={item.menuItemId}>
                      <td className="px-4 py-3 text-sm">{item.details.name}</td>
                      <td className="px-4 py-3 text-sm">{item._sum.quantity}</td>
                      <td className="px-4 py-3 text-sm">{Number(item.details.price).toLocaleString('ru-RU')} сом</td>
                      <td className="px-4 py-3 text-sm">
                        {(Number(item.details.price) * item._sum.quantity).toLocaleString('ru-RU')} сом
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-[rgb(124,58,237)]" />
              Отчеты
            </h1>
            <div className="flex items-center gap-4">
              {canExport() && (
                <Button
                  variant="primary"
                  onClick={handleExport}
                  className="text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Экспорт
                </Button>
              )}
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
        <div className="space-y-6">
          {/* Выбор отчета */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Выберите тип отчета
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleReportSelect(option.id)}
                    className={`p-4 rounded-lg border ${
                      selectedReport === option.id
                        ? 'border-[rgb(124,58,237)] bg-[rgb(124,58,237)]/5'
                        : 'border-gray-200 hover:border-[rgb(124,58,237)] hover:bg-[rgb(124,58,237)]/5'
                    } transition-colors`}
                  >
                    <option.icon
                      className={`w-6 h-6 ${
                        selectedReport === option.id
                          ? 'text-[rgb(124,58,237)]'
                          : 'text-gray-400'
                      }`}
                    />
                    <h3 className="text-sm font-medium mt-2">{option.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Параметры отчета */}
          {selectedReport && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Параметры отчета
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Начальная дата
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(124,58,237)] focus:ring-[rgb(124,58,237)] sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Конечная дата
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(124,58,237)] focus:ring-[rgb(124,58,237)] sm:text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={fetchReport}
                    disabled={isLoading}
                    className="w-full md:w-auto"
                  >
                    {isLoading ? 'Загрузка...' : 'Сформировать отчет'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Содержимое отчета */}
          {!isLoading && reportData && renderReportContent()}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(124,58,237)]"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 