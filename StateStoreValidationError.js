
/**
 * Error thrown if the StateStore provider is unable to validate it's
 * pre-conditions. The innerError field can be used to retrieve more
 * information about what went wrong.
 */
class StateStoreValidationError extends Error {
    /**
     * 
     * @param {string} message Error message.
     * @param {Error} innerError The error that caused the validation to fail.
     */
    constructor(message, innerError) {
        super(message)
        this.innerError = innerError
    }
}