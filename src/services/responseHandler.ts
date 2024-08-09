// responseHelper.js

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        status: 'success',
        data,
        message,
    });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500) => {
    res.status(statusCode).json({
        status: 'error',
        data: null,
        message,
    });
};

export const withErrorHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            console.error(error.message);
            return sendError(res, error.message);
        }
    };
};

