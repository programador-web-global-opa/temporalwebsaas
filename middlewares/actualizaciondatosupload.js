const multer = require("multer");

const uploadActualizacionDatos = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const nombreArchivo = String(file.originalname || "").toLowerCase();
        const esPdfMime = file.mimetype === "application/pdf";
        const esPdfExt = nombreArchivo.endsWith(".pdf");

        if (!esPdfMime && !esPdfExt) {
            return cb(new Error("Solo se permiten archivos PDF"));
        }

        cb(null, true);
    }
});

module.exports = uploadActualizacionDatos;
