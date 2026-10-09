function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: { message: "Request body must contain valid JSON." }
        });
    }
    if (error.name === "ValidationError") {
        const details = Object.values(error.errors).map((item) => item.message);
        return res.status(400).json({
            error: { message: "Validation failed.", details }
        });
    }
    if (error.name === "CastError") {
        return res.status(400).json({
            error: { message: "Invalid task ID." }
        });
    }
    if (error.code === 11000) {
        return res.status(409).json({
            error: { message: "An account with this email already exists." }
        });
    }

    console.error(error);
    return res.status(500).json({
        error: { message: "Internal server error." }
    });
}

module.exports = errorHandler;
