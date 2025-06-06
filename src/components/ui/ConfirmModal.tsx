import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
}: ConfirmModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <div className="text-sm text-gray-500 whitespace-pre-wrap">
                    {message.split('\n').map((line, index) => (
                      <p key={index} className={`mb-2 ${
                        line.startsWith('•') ? 'pl-4' : 
                        line.includes(':') ? 'font-medium' : ''
                      }`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 flex-col sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="px-4 py-2 w-full sm:w-auto justify-center"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className="px-4 py-2 w-full sm:w-auto justify-center"
                  >
                    {confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 