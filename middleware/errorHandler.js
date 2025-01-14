const errorHandler = (err, req, res, next) => {
    console.error(err.stack); 

    const statusCode = err.statusCode || 500; 
    const errorResponse = {
        success: false,
        message: err.message || "Server error",
        name: err.name,
    };

    // Für Express errors
    if (res) {
        return res.status(statusCode).json(errorResponse);
    }

    // Für Socket errors
    if (req && req.socket) {
        req.socket.emit("error", errorResponse);
    }
};

module.exports = errorHandler;