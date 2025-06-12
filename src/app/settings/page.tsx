'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Notification } from '@/components/ui/Notification';
import {
  Cog6ToothIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface SalarySettings {
  waiterSalary: string;
  waiterPercent: string;
  cashierSalary: string;
  cashierPercent: string;
  managerSalary: string;
  managerPercent: string;
}

const defaultSettings: SalarySettings = {
  waiterSalary: '0',
  waiterPercent: '0',
  cashierSalary: '0',
  cashierPercent: '0',
  managerSalary: '0',
  managerPercent: '0',
};

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SalarySettings>(defaultSettings);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        const newSettings: SalarySettings = { ...defaultSettings };
        data.forEach((setting: { key: string; value: string }) => {
          if (setting.key in defaultSettings) {
            newSettings[setting.key as keyof SalarySettings] = setting.value;
          }
        });
        
        setSettings(newSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setNotification({
          show: true,
          type: 'error',
          message: 'Ошибка при загрузке настроек',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (key: keyof SalarySettings, value: string) => {
    // Разрешаем только цифры и точку
    if (!/^\d*\.?\d*$/.test(value)) return;
    
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Сохраняем каждую настройку
      const promises = Object.entries(settings).map(([key, value]) => 
        fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value }),
        })
      );

      await Promise.all(promises);
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Настройки успешно сохранены',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Ошибка при сохранении настроек',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSalarySection = (
    title: string,
    salaryKey: keyof SalarySettings,
    percentKey: keyof SalarySettings
  ) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-violet-50 border-b border-gray-200">
        <h3 className="text-md font-medium text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Оклад за смену
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={settings[salaryKey]}
                onChange={(e) => handleInputChange(salaryKey, e.target.value)}
                className="block w-full pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₽</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Процент от заказов
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={settings[percentKey]}
                onChange={(e) => handleInputChange(percentKey, e.target.value)}
                className="block w-full pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />

      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Cog6ToothIcon className="w-6 h-6 text-violet-600" />
              Настройки
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
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-violet-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Настройки зарплат
                </h2>
              </div>
            </div>

            {renderSalarySection('Официанты', 'waiterSalary', 'waiterPercent')}
            {renderSalarySection('Кассиры', 'cashierSalary', 'cashierPercent')}
            {renderSalarySection('Менеджеры', 'managerSalary', 'managerPercent')}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 flex items-center gap-2 shadow-sm"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 