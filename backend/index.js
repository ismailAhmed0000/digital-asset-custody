require('dotenv').config();
const express = require('express');
const cors = require('cors');
const metalRoutes = require('./routes/metal');
const customerRoutes = require('./routes/customer');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/metals', metalRoutes);
app.use('/api/customers', customerRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});