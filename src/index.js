const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


//Routes evaluations
const evaluationRoutes = require("./routes/evaluation.routes");

app.use("/api/evaluations",evaluationRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Sistema Academico funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});