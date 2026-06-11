const express = require('express');

const app = express();

app.use(express.json());

app.use('/api/evaluations',
  require('./routes/evaluation.routes')
);

module.exports = app;