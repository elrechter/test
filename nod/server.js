import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MySQL (AlwaysData)
const pool = mysql.createPool({
    host: "mysql-enzo.alwaysdata.net",
    user: "enzo",
    password: "Empresa.2025",
    database: "enzo_heladeriabd",
});

// Endpoint /api/productos
app.get("/api/productos", async (req, res) => {
    try {
        // Parámetros
        const id_producto = req.query.id ? Number(req.query.id) : 0;
        const id_categoria = req.query.categoria ? Number(req.query.categoria) : 0;

        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const offset = (page - 1) * limit;

        const sort = req.query.sort || "id_producto";
        const order = req.query.order?.toString().toLowerCase() === "desc" ? "DESC" : "ASC";

        const allowedSort = ["id_producto", "nombre", "precio"];
        const sortColumn = allowedSort.includes(sort) ? sort : "id_producto";

        // Base SQL
        let sql = " FROM productos WHERE 1=1";
        const params = [];

        if (id_producto > 0) {
            sql += " AND id_producto = ?";
            params.push(id_producto);
        }

        if (id_categoria > 0) {
            sql += " AND id_categoria = ?";
            params.push(id_categoria);
        }

        // Consulta principal
        const query = `
            SELECT 
                id_producto,
                nombre,
                descripcion,
                detalle,
                precio,
                precio_rebajado,
                imagen_chica,
                imagen_grande,
                proveedor,
                categoria,
                pais,
                unidades_en_existencia,
                promedio_estrellas,
                total_calificaciones,
                telefono
            ${sql}
            ORDER BY ${sortColumn} ${order}
            LIMIT ?, ?
        `;

        const [rows] = await pool.query(query, [...params, offset, limit]);

        // Consulta total
        const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${sql}`, params);

        const total = countRows[0].total;

        // Convertir precios a float
        const productos = rows.map(p => ({
            ...p,
            precio: parseFloat(p.precio),
            precio_rebajado: parseFloat(p.precio_rebajado)
        }));

        res.json({
            page,
            limit,
            total,
            productos,
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor Node.js corriendo en puerto", PORT);
});
