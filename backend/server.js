require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/', (_, res) => res.send('AutoDevelop.ai backend running ✅'));

app.listen(port, () => console.log(`🌐  Server listening on port ${port}`));