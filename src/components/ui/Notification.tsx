import { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface NotificationProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function Notification({ show, type, message, onClose }: NotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed right-4 top-4 z-50">
        <div className={`rounded-lg p-4 shadow-lg ${
          type === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-400" />
            )}
            <p className="text-sm font-medium">{message}</p>
            <button
              type="button"
              className="ml-auto rounded-md bg-transparent p-1.5 hover:bg-green-100 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className={`h-5 w-5 ${
                type === 'success' 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
} 