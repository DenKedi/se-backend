module.exports = (err, req, res, next) => {
    console.error(err.stack); // Logge den Fehler für Debugging
    
    const statusCode = err.statusCode || 500; // Standard-Statuscode auf 500 setzen
    res.status(statusCode).json({
      success: false,
      message: err.message || "Serverfehler", 
      name: err.name,
    });
  };