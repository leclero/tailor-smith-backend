const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const iniciarServidor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ Conectado a MongoDB");

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server en puerto ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Error crítico de inicio:", err);
        process.exit(1); // Detiene la app si no hay DB
    }
};

iniciarServidor();

const ElementoSchema = new mongoose.Schema({
    nombre: String,
    precio: Number,
    archivo: String,
    tipo: String
});
const Elemento = mongoose.model('Elemento', ElementoSchema);

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

app.get('/api/elementos', async (req, res) => {
    const items = await Elemento.find();
    res.json(items);
});

app.post('/api/subir', upload.single('archivo'), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: "auto" });
        const nuevo = new Elemento({
            nombre: "Nuevo Producto",
            precio: 0,
            archivo: result.secure_url,
            tipo: req.file.mimetype.includes('video') ? 'video' : 'imagen'
        });
        await nuevo.save();
        res.json(nuevo);
    } catch (e) { res.status(500).json(e); }
});

app.put('/api/elementos', async (req, res) => {
    try {
        for (const item of req.body) {
            const id = item._id || new mongoose.Types.ObjectId();
            delete item._id; // Limpiamos el id para evitar conflictos en el update
            await Elemento.findByIdAndUpdate(id, item, { upsert: true });
        }
        res.json({ status: "ok" });
    } catch (e) { res.status(500).json(e); }
});

// RUTA PARA ELIMINAR UN PRODUCTO POR ID
app.delete('/api/elementos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Elemento.findByIdAndDelete(id);
        res.json({ status: "eliminado", id });
    } catch (e) {
        console.error("Error al eliminar:", e);
        res.status(500).json({ error: "No se pudo eliminar" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
console.log(`🚀 Server en puerto ${PORT}`);
});