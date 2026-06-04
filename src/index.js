const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:8100',   // Ionic dev server
  'http://localhost:4200',   // Angular dev server
  'http://localhost',        // Capacitor Android
  'capacitor://localhost',   // Capacitor iOS
  'ionic://localhost',       // Ionic native
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());


//Routes evaluations
const evaluationRoutes = require("./routes/evaluation.routes");

app.use("/api/evaluations",evaluationRoutes);

// Ruta de prueba
// Routes
const authRoutes = require('./routes/auth.routes');
const studentsRoutes = require('./routes/students.routes');
const coursesRoutes = require('./routes/courses.routes');
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/courses', coursesRoutes);

//TEST
app.get('/', (req, res) => {
  res.json({ message: 'API Sistema Academico funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});