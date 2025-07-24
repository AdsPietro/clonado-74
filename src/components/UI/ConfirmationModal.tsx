import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { LoadingButton } from './LoadingSpinner';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          iconBg: 'bg-red-100',
          confirmButton: 'danger' as const
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          confirmButton: 'secondary' as const
        };
      case 'info':
        return {
          icon: <Check className="w-6 h-6 text-blue-600" />,
          iconBg: 'bg-blue-100',
          confirmButton: 'primary' as const
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          iconBg: 'bg-red-100',
          confirmButton: 'danger' as const
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200 scale-100">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-full ${typeStyles.iconBg}`}>
              {typeStyles.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <LoadingButton
              loading={loading}
              onClick={onConfirm}
              variant={typeStyles.confirmButton}
            >
              {confirmText}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UseConfirmationModalReturn {
  showConfirmation: (options: {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => void;
  ConfirmationModalComponent: React.ReactNode;
}

export const useConfirmationModal = (): UseConfirmationModalReturn => {
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'danger',
    loading: false
  });

  const showConfirmation = React.useCallback((options: {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => {
    setModalState({
      isOpen: true,
      title: options.title,
      message: options.message,
      onConfirm: options.onConfirm || (() => {}),
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      type: options.type || 'danger',
      loading: false
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    setModalState(prev => ({ ...prev, loading: true }));
    
    try {
      await modalState.onConfirm();
      setModalState(prev => ({ ...prev, isOpen: false, loading: false }));
    } catch (error) {
      console.error('Error in confirmation action:', error);
      setModalState(prev => ({ ...prev, loading: false }));
    }
  }, [modalState.onConfirm]);

  const handleClose = React.useCallback(() => {
    if (!modalState.loading) {
      setModalState(prev => ({ ...prev, isOpen: false }));
    }
  }, [modalState.loading]);

  const ConfirmationModalComponent = (
    <ConfirmationModal
      isOpen={modalState.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      type={modalState.type}
      loading={modalState.loading}
    />
  );

  return {
    showConfirmation,
    ConfirmationModalComponent
  };
};