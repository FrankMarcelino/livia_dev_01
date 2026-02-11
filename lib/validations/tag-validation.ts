import { z } from 'zod';

const baseTagFields = {
  tag_name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  tag_type: z.enum(['description', 'success', 'fail'], {
    message: 'Tipo é obrigatório',
  }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um hex válido (#RRGGBB)'),
  active: z.boolean().default(true),
  prompt_to_ai: z.string().max(2000, 'Instrução muito longa').optional().nullable(),
  is_category: z.boolean().default(false),
  change_conversation_status: z.enum(['open', 'closed']).optional().nullable(),
  send_text: z.boolean().default(false),
  send_text_message: z.string().max(1000, 'Mensagem muito longa').optional().nullable(),
};

export const createTagSchema = z.object({
  ...baseTagFields,
  tenantId: z.string().uuid(),
}).refine(
  (data) => !data.send_text || (data.send_text_message && data.send_text_message.trim().length > 0),
  { message: 'Mensagem obrigatória quando envio de texto está ativo', path: ['send_text_message'] }
);

export const updateTagSchema = z.object(baseTagFields).partial().refine(
  (data) => {
    if (data.send_text === undefined) return true;
    if (!data.send_text) return true;
    return data.send_text_message && data.send_text_message.trim().length > 0;
  },
  { message: 'Mensagem obrigatória quando envio de texto está ativo', path: ['send_text_message'] }
);

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
