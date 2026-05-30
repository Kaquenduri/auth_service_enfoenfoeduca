import { z } from 'zod';

export const registerSchema = z.object({

    name: z.string()
        .min(3)
        .max(100),

    last_name: z.string()
        .min(3)
        .max(100),

    email: z.email(),

    password: z.string()
        .min(6),

    role: z.string().optional(),

});