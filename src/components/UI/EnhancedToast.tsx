import React from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { CheckCircle, AlertTriangle, XCircle, Info, Trash2, Edit, Plus } from 'lucide-react';

interface CustomToastProps {
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const CustomToast: React.FC<CustomToastProps> = ({ message, icon, action }) => (
  <div className="flex items-center space-x-3">
    {icon && <div className="flex-shrink-0">{icon}</div>}
    <div className="flex-1">
      <p className="text-sm font-medium">{message}</p>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

export const enhancedToast = {
  success: (message: string, options?: ToastOptions & { action?: { label: string; onClick: () => void } }) => {
    toast.success(
      <CustomToast 
        message={message} 
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        action={options?.action}
      />,
      {
        ...options,
        className: 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 shadow-lg',
      }
    );
  },

  error: (message: string, options?: ToastOptions & { action?: { label: string; onClick: () => void } }) => {
    toast.error(
      <CustomToast 
        message={message} 
        icon={<XCircle className="w-5 h-5 text-red-600" />}
        action={options?.action}
      />,
      {
        ...options,
        className: 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 shadow-lg',
      }
    );
  },

  warning: (message: string, options?: ToastOptions & { action?: { label: string; onClick: () => void } }) => {
    toast.warning(
      <CustomToast 
        message={message} 
        icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
        action={options?.action}
      />,
      {
        ...options,
        className: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 shadow-lg',
      }
    );
  },

  info: (message: string, options?: ToastOptions & { action?: { label: string; onClick: () => void } }) => {
    toast.info(
      <CustomToast 
        message={message} 
        icon={<Info className="w-5 h-5 text-blue-600" />}
        action={options?.action}
      />,
      {
        ...options,
        className: 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 shadow-lg',
      }
    );
  },

  // Toasts específicos para ações
  created: (itemName: string, options?: ToastOptions) => {
    enhancedToast.success(`✨ ${itemName} criado com sucesso!`, {
      ...options,
      autoClose: 4000
    });
  },

  updated: (itemName: string, options?: ToastOptions) => {
    enhancedToast.success(`📝 ${itemName} atualizado com sucesso!`, {
      ...options,
      autoClose: 3000
    });
  },

  deleted: (itemName: string, options?: ToastOptions & { onUndo?: () => void }) => {
    enhancedToast.success(`🗑️ ${itemName} excluído com sucesso!`, {
      ...options,
      autoClose: 5000,
      action: options?.onUndo ? {
        label: '↶ Desfazer',
        onClick: options.onUndo
      } : undefined
    });
  },

  demoLimit: (moduleName: string, limit: number) => {
    enhancedToast.warning(
      `🚫 Ops! Limite do modo DEMO atingido. Você pode cadastrar até ${limit} ${moduleName.toLowerCase()}. Que tal ativar a versão completa?`,
      {
        autoClose: 7000,
        action: {
          label: '🔓 Ativar Agora',
          onClick: () => {
            // Navegar para aba de ativação
            window.dispatchEvent(new CustomEvent('navigate-to-activation'));
          }
        }
      }
    );
  },

  activationSuccess: () => {
    enhancedToast.success('🎉 Parabéns! Sistema ativado com sucesso! Agora você tem acesso completo a todas as funcionalidades.', {
      autoClose: 6000
    });
  },

  exportDisabled: () => {
    enhancedToast.warning('📤 A exportação está disponível apenas na versão completa. Ative o sistema para liberar esta funcionalidade!', {
      autoClose: 5000,
      action: {
        label: '🔓 Ativar Sistema',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('navigate-to-activation'));
        }
      }
    });
  }
};

// Hook para usar toasts com contexto
export const useEnhancedToast = () => {
  return enhancedToast;
};