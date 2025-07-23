import React from 'react';
import { Bell, Plus, Trash2, UserCheck, Calendar, DollarSign } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Tenant } from '../../types';
import { toast } from 'react-toastify';

interface NotificationDemoProps {
  tenants: Tenant[];
  properties: any[];
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => void;
}

export const NotificationDemo: React.FC<NotificationDemoProps> = ({
  tenants,
  properties,
  onAddTenant
}) => {
  const [demoTenants, setDemoTenants] = useLocalStorage<Tenant[]>('demo-tenants', []);

  const createDemoTenant = (daysOverdue: number) => {
    if (properties.length === 0) {
      toast.warning('Crie pelo menos uma propriedade primeiro!');
      return;
    }

    // Calcular data de pagamento baseada nos dias de atraso
    const agreedPaymentDate = new Date();
    agreedPaymentDate.setDate(agreedPaymentDate.getDate() - daysOverdue);

    const demoTenantData: Omit<Tenant, 'id'> = {
      propertyId: properties[0].id,
      name: `Inquilino Teste ${daysOverdue}d`,
      email: `teste${daysOverdue}dias@example.com`,
      cpf: `000.000.000-${String(daysOverdue).padStart(2, '0')}`,
      phone: `(11) 9999-${String(daysOverdue).padStart(4, '0')}`,
      startDate: new Date(),
      agreedPaymentDate: agreedPaymentDate, // Data no passado para simular atraso
      monthlyRent: 1500 + (daysOverdue * 100), // Rent variável
      deposit: 1500,
      paymentMethod: 'À vista',
      formalizedContract: true,
      status: 'active'
    };

    onAddTenant(demoTenantData);
    
    toast.success(`✅ Inquilino teste criado com ${daysOverdue} dias de atraso!`);
  };

  const clearDemoData = () => {
    setDemoTenants([]);
    toast.info('🧹 Dados de demonstração limpos!');
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
      <div className="flex items-center mb-4">
        <Bell className="w-6 h-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Demonstração de Notificações</h3>
          <p className="text-sm text-gray-600">
            Crie inquilinos de teste com diferentes dias de atraso para testar o sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {[2, 3, 4, 5].map(days => (
          <button
            key={days}
            onClick={() => createDemoTenant(days)}
            className="flex flex-col items-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              days >= 4 ? 'bg-red-100 text-red-600' :
              days >= 3 ? 'bg-yellow-100 text-yellow-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
              {days} dias de atraso
            </span>
            <span className="text-xs text-gray-500">
              R$ {(1500 + (days * 100)).toLocaleString('pt-BR')}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-blue-200">
        <div className="flex items-center text-sm text-gray-600">
          <UserCheck className="w-4 h-4 mr-2" />
          <span>{tenants.filter(t => t.name.includes('Teste')).length} inquilinos de teste criados</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={clearDemoData}
            className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar Testes
          </button>

          <div className="text-xs text-gray-500 bg-white bg-opacity-50 px-3 py-2 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              As notificações são verificadas diariamente às 09:00
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Como testar:</strong> Crie inquilinos de teste, clique no sino de notificações 
          no header e depois em "Verificar Agora" para simular a verificação diária de atrasos.
        </p>
      </div>
    </div>
  );
};