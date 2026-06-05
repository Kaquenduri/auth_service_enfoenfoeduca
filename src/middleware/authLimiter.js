import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({

    windowMs: 10 * 60 * 1000,

    max: 4,

    skipSuccessfulRequests: true,

    message: {
        error: 'Too many login attempts'
    }

});
