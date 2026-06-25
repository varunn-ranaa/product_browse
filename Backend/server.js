const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRouter = require('./routes/product');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("Home page");
});

app.use('/products', productRouter);


app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  console.log(`Product endpoint ready at http://localhost:${PORT}/products`);
});
