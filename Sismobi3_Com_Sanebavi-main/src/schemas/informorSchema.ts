import { z } from 'zod'
import { Informor } from '../types/informor'

export const informorSchema = z.object({
  id: z.string().optional(), // Ajustado para aceitar qualquer string, não apenas UUID
  nome: z.string().min(1, 'O nome é obrigatório'),
  valor: z.number().positive('O valor deve ser positivo'),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato YYYY-MM-DD)')
})

export type InformorsValidated = z.infer<typeof informorSchema>