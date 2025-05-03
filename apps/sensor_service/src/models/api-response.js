/**
 * API Response class
 */
class ApiResponse {
    constructor(statusCode, data, message = '') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }

    static success(data, message = '') {
        return new ApiResponse(200, data, message);
    }

    static created(data, message = 'Resource created successfully') {
        return new ApiResponse(201, data, message);
    }

    static badRequest(message = 'Bad request') {
        return new ApiResponse(400, null, message);
    }

    static notFound(message = 'Resource not found') {
        return new ApiResponse(404, null, message);
    }

    static serverError(message = 'Internal server error') {
        return new ApiResponse(500, null, message);
    }

    /**
     * Convert to Express response
     */
    send(res) {
        return res.status(this.statusCode).json({
            success: this.statusCode < 400,
            data: this.data,
            message: this.message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ApiResponse;