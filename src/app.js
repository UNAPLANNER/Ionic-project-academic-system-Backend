const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:8100',
  'http://localhost:8101',
  'http://localhost:4200',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
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

const evaluationRoutes = require('./routes/evaluation.routes');
const authRoutes = require('./routes/auth.routes');
const studentsRoutes = require('./routes/students.routes');
const coursesRoutes = require('./routes/courses.routes');
const usersRoutes = require('./routes/users.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

app.use('/api/evaluations', evaluationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Sistema Academico funcionando' });
});

module.exports = app;
