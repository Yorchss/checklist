import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Sirve los archivos estáticos generados por "vite build"
app.use(express.static(path.join(__dirname, 'dist')));

// Cualquier ruta que no sea un archivo estático devuelve index.html
// (necesario para que funcione react-router-dom con rutas del lado del cliente)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
