import { z } from 'zod';

export const createCheckoutSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('payment'),
    packageId: z.enum(['500', '1000', '1500'], {
      message: 'Pacote inválido. Escolha 500, 1000 ou 1500.',
    }),
  }),
  z.object({
    mode: z.literal('subscription'),
    priceId: z.string().min(1, 'Price ID é obrigatório'),
  }),
]);

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
