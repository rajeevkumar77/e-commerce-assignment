
const Sequelize = require('sequelize');
const sequelize = require("../config/dbConnection");

const CartProduct = sequelize.define("cartProduct",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.INTEGER,
    },
    orderId: {
      type: Sequelize.INTEGER,
    },
    productId: {
      type: Sequelize.INTEGER,
    },
    quantity: { type: Sequelize.INTEGER, defaultValue:0 },
    price: { type: Sequelize.INTEGER, defaultValue:0 },
    isActive:{type:Sequelize.BOOLEAN, defaultValue:true}
  }
);

module.exports = CartProduct
