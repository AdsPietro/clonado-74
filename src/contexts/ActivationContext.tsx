// src/contexts/ActivationContext.tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

// --- 1. Definições de Tipos ---

interface DeveloperContactInfo {
  email: string;
  phone: string;
}

interface ActivationContextType {
  isActivated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  developerContactInfo: DeveloperContactInfo;
  activateSystem: (key: string) => Promise<boolean>;
  deactivateSystem: () => void;
}

// --- 2. Criação do Contexto ---

// O valor padrão é 'undefined' para garantir que o hook useActivation
// force o uso dentro de um ActivationProvider.
const ActivationContext = createContext<ActivationContextType | undefined>(undefined);

// --- 3. Componente Provedor de Ativação ---

interface ActivationProviderProps {
  children: React.ReactNode;
}

export const ActivationProvider: React.FC<ActivationProviderProps> = ({ children }) => {
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Começa como true para carregar o estado inicial

  // Informações de contato do desenvolvedor (podem vir de uma API ou config)
  const developerContactInfo: DeveloperContactInfo = useMemo(() => ({
    email: 'suporte@sismobi.com',
    phone: '(99) 9999-9999',
  }), []);

  // Efeito para carregar o estado de ativação do localStorage ao montar
  useEffect(() => {
    const checkActivationStatus = async () => {
      const storedKey = localStorage.getItem('sismobi-activation-key');
      
      // Simula uma verificação no servidor
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Em um cenário real, você faria uma chamada ao backend aqui para revalidar a chave
      // ou verificar se ela ainda é válida/não expirou.
      if (storedKey === 'VALID-KEY-FROM-SERVER') {
        setIsActivated(true);
      } else {
        setIsActivated(false);
      }
      setIsLoading(false); // Termina o carregamento inicial
    };

    checkActivationStatus();
  }, []);

  // Função para ativar o sistema (simula chamada ao backend)
  const activateSystem = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // --- SIMULAÇÃO DE CHAMADA AO BACKEND ---
      // Em um cenário real, você faria algo como:
      // const response = await fetch('/api/activate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ activationKey: key }),
      // });
      // const data = await response.json();
      // if (response.ok && data.success) {
      //   localStorage.setItem('sismobi-activation-key', data.validatedKey);
      //   setIsActivated(true);
      //   toast.success('Sistema ativado com sucesso!');
      //   return true;
      // } else {
      //   toast.error(`Chave inválida. ${data.message || 'Contate o desenvolvedor.'}`);
      //   return false;
      // }

      // Simulação para demonstração:
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula latência de rede

      if (key === 'MINHA-CHAVE-SECRETA-DO-BOLT') { // Esta seria a chave que o backend validaria
        localStorage.setItem('sismobi-activation-key', 'VALID-KEY-FROM-SERVER'); // Armazena um token/chave validada
        setIsActivated(true);
        toast.success('🎉 Sistema ativado com sucesso! Todos os recursos foram liberados.');
        return true;
      } else {
        toast.error(`❌ Chave inválida. Contate o desenvolvedor: ${developerContactInfo.email}`);
        return false;
      }
    } catch (error) {
      console.error('Erro ao ativar sistema:', error);
      toast.error(`🔧 Erro na comunicação. Tente novamente ou contate o suporte: ${developerContactInfo.phone}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para desativar o sistema (útil para testes)
  const deactivateSystem = () => {
    localStorage.removeItem('sismobi-activation-key');
    setIsActivated(false);
    toast.info('Sistema desativado. Modo DEMO ativado.');
  };

  // O valor do contexto é memorizado para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => ({
    isActivated,
    isDemoMode: !isActivated, // Modo demo é o oposto de ativado
    isLoading,
    developerContactInfo,
    activateSystem,
    deactivateSystem,
  }), [isActivated, isLoading, developerContactInfo]);

  return (
    <ActivationContext.Provider value={contextValue}>
      {children}
    </ActivationContext.Provider>
  );
};

// --- 4. Hook Personalizado para Consumir o Contexto ---

export const useActivation = () => {
  const context = useContext(ActivationContext);
  if (context === undefined) {
    throw new Error('useActivation must be used within an ActivationProvider');
  }
  return context;
};