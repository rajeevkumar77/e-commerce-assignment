// server.js
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const sequelize = require("./config/dbConnection");
const morgan = require('morgan');
const cors = require('cors');

const mainRoutes = require('./routes/mainRoutes');




const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes

app.use('/', mainRoutes);

const PORT = process.env.PORT || 5000;


sequelize.authenticate()
  .then(() => {
    console.log("DB Connected");
  })
  .catch(err => {
    console.error("Connection failed", err);
  });

// sequelize
//   .sync({
//     alter: true,
//   })
//   .then(async (result) => {
//     console.log("<-------------------- database sync completed -------------------->")
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
