import { Informor } from '../types/informor'

// Chave para armazenamento no localStorage
const STORAGE_KEY = 'informors-data';

// Dados iniciais para primeira execução
const INITIAL_INFORMORS: Informor[] = [
  { id: '1', nome: 'Aluguel', valor: 1200, vencimento: '2025-01-10' },
  { id: '2', nome: 'Luz', valor: 250, vencimento: '2025-01-15' },
  { id: '3', nome: 'Água', valor: 180, vencimento: '2025-01-20' }
];

// Funções auxiliares para localStorage
const loadFromStorage = (): Informor[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar se é um array válido
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar Informors do localStorage:', error);
  }
  
  // Se não há dados ou erro, usar dados iniciais e salvar
  saveToStorage(INITIAL_INFORMORS);
  return INITIAL_INFORMORS;
};

const saveToStorage = (informors: Informor[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(informors));
  } catch (error) {
    console.error('Erro ao salvar Informors no localStorage:', error);
  }
};

// Array em memória sincronizado com localStorage
let INFORMORS_DATA: Informor[] = loadFromStorage();

// Simula latência de rede para demonstrar loading states
const simulateNetworkDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Busca todos os Informors
 */
export async function fetchInformors(): Promise<Informor[]> {
  await simulateNetworkDelay()
  
  // Simula possível erro de rede (5% de chance)
  if (Math.random() < 0.05) {
    throw new Error('Erro de conexão com o servidor')
  }
  
  // Recarregar dados do localStorage para garantir sincronização
  INFORMORS_DATA = loadFromStorage();
  
  return [...INFORMORS_DATA];
}

/**
 * Salva um novo Informor
 */
export async function salvarInformor(dados: Omit<Informor, 'id'>): Promise<Informor> {
  await simulateNetworkDelay(600)
  
  // Simula possível erro de validação no servidor (3% de chance)
  if (Math.random() < 0.03) {
    throw new Error('Dados inválidos no servidor')
  }
  
  const novoInformor: Informor = {
    ...dados,
    id: Date.now().toString()
  }
  
  // Recarregar dados atuais do localStorage
  INFORMORS_DATA = loadFromStorage();
  
  // Adicionar novo Informor
  INFORMORS_DATA.push(novoInformor);
  
  // Salvar no localStorage
  saveToStorage(INFORMORS_DATA);
  
  return novoInformor
}

/**
 * Exclui um Informor pelo ID
 */
export async function excluirInformor(id: string): Promise<void> {
  await simulateNetworkDelay(400)
  
  // Simula possível erro (2% de chance)
  if (Math.random() < 0.02) {
    throw new Error('Erro ao excluir Informor')
  }
  
  // Recarregar dados atuais do localStorage
  INFORMORS_DATA = loadFromStorage();
  
  const index = INFORMORS_DATA.findIndex(inf => inf.id === id);
  if (index === -1) {
    throw new Error('Informor não encontrado')
  }
  
  // Remover do array
  INFORMORS_DATA.splice(index, 1);
  
  // Salvar no localStorage
  saveToStorage(INFORMORS_DATA);
}

/**
 * Atualiza um Informor existente
 */
export async function atualizarInformor(id: string, dados: Partial<Omit<Informor, 'id'>>): Promise<Informor> {
  await simulateNetworkDelay(500)
  
  // Recarregar dados atuais do localStorage
  INFORMORS_DATA = loadFromStorage();
  
  const index = INFORMORS_DATA.findIndex(inf => inf.id === id);
  if (index === -1) {
    throw new Error('Informor não encontrado')
  }
  
  const informorAtualizado = { ...INFORMORS_DATA[index], ...dados };
  INFORMORS_DATA[index] = informorAtualizado;
  
  // Salvar no localStorage
  saveToStorage(INFORMORS_DATA);
  
  return informorAtualizado
}

/**
 * Limpa todos os dados (útil para testes ou reset)
 */
export async function limparTodosInformors(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    INFORMORS_DATA = [];
  } catch (error) {
    console.error('Erro ao limpar dados dos Informors:', error);
    throw new Error('Erro ao limpar dados');
  }
}

/**
 * Exporta todos os dados para backup
 */
export async function exportarInformors(): Promise<string> {
  INFORMORS_DATA = loadFromStorage();
  return JSON.stringify(INFORMORS_DATA, null, 2);
}

/**
 * Importa dados de backup
 */
export async function importarInformors(jsonData: string): Promise<void> {
  try {
    const dados = JSON.parse(jsonData);
    if (!Array.isArray(dados)) {
      throw new Error('Formato de dados inválido');
    }
    
    // Validar estrutura básica dos dados
    for (const item of dados) {
      if (!item.id || !item.nome || typeof item.valor !== 'number' || !item.vencimento) {
        throw new Error('Estrutura de dados inválida');
      }
    }
    
    INFORMORS_DATA = dados;
    saveToStorage(INFORMORS_DATA);
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    throw new Error('Erro ao importar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}