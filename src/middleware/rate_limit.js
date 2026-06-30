import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 10000,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        error: 'Too many requests, try again later.'
    }

});
