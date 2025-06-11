import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import {
  BeakerIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface WriteOffDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeOff: {
    id: number;
    ingredient: {
      name: string;
      unit: string;
    };
    quantity: number;
    type: 'SPOILAGE' | 'USAGE' | 'INVENTORY' | 'OTHER';
    date: string;
    comment?: string | null;
    createdBy: {
      fullName: string;
    };
  } | null;
}

const writeOffTypes = {
  SPOILAGE: 'Порча',
  USAGE: 'Использование',
  INVENTORY: 'Инвентаризация',
  OTHER: 'Другое',
};

export function WriteOffDetailsModal({ isOpen, onClose, writeOff }: WriteOffDetailsModalProps) {
  if (!writeOff) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getUTCDate().toString().padStart(2, '0')}.${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.${date.getUTCFullYear()}, ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Заголовок */}
            <div className="relative bg-violet-50 rounded-t-2xl">
              <div className="px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Детали списания
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Контент */}
            <div className="p-6 space-y-6">
              {/* Информация об ингредиенте */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <BeakerIcon className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {writeOff.ingredient.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Количество: {writeOff.quantity} {writeOff.ingredient.unit}
                  </p>
                </div>
              </div>

              {/* Информация о списании */}
              <div className="bg-violet-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-600">Тип списания:</span>
                  <span className="font-medium text-gray-900">
                    {writeOffTypes[writeOff.type]}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-600">Списал:</span>
                  <span className="font-medium text-gray-900">
                    {writeOff.createdBy.fullName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-gray-600">Дата:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(writeOff.date)}
                  </span>
                </div>

                {writeOff.comment && (
                  <div className="pt-2 border-t border-violet-100">
                    <p className="text-sm text-gray-600 mb-1">Комментарий:</p>
                    <p className="text-sm text-gray-900">
                      {writeOff.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Футер */}
            <div className="border-t p-4">
              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full"
              >
                Закрыть
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 