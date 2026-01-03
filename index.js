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

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ Conectado a MongoDB en Railway"))
    .catch(err => console.error("❌ Error de conexión:", err));

// Esquema de la base de datos
const ElementoSchema = new mongoose.Schema({
    nombre: String,
    precio: Number,
    archivo: String,
    tipo: String
});
const Elemento = mongoose.model('Elemento', ElementoSchema);

// Configuración Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

// RUTAS API
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
        // Esta ruta sincroniza los cambios que hagas en el panel de Admin
        for (const item of req.body) {
            await Elemento.findByIdAndUpdate(item._id || new mongoose.Types.ObjectId(), item, { upsert: true });
        }
        res.json({ status: "ok" });
    } catch (e) { res.status(500).json(e); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server en puerto ${PORT}`));