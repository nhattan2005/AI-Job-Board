const express = require('express');
const careerRoutes = require('./routes/careerRoutes');

const app = express();
app.use(express.json());

app.use('/api/career', careerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});