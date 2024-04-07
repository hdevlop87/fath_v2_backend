// utils/asyncHandler.js
import { sendSuccess, sendError } from '../services/responseHandler';
/**
 * Catches errors from async functions and passes them to the next middleware.
 * @param {Function} fn The async function to wrap.
 * @return {Function} A new function that handles the try-catch.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Assuming sendError is a function that sends an error response
      sendError(res, error.message);
    });
  };
  
  export default asyncHandler;