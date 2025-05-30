const Sequelize = require('sequelize');
const sequelize = require("../config/dbConnection");

const Cart = sequelize.define("cart",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userId:{
      type: Sequelize.INTEGER,
    },
    amount: { type: Sequelize.INTEGER, defaultValue:0 },
    isActive: { type: Sequelize.BOOLEAN, defaultValue:true}

  }
);

module.exports = Cart;
