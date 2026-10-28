require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ success: true, message: 'Watchlist API is running', data: null }));
app.use('/api/movies', movieRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found', data: null }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ success: false, message: 'Invalid JSON body', data: null });
  if (err.code === 11000)
    return res.status(409).json({ success: false, message: 'This movie already exists', data: null });
  if (err.name === 'ValidationError')
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((e) => e.message).join('. '),
      data: null,
    });
  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server', data: null });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('DB connection failed:', err.message));