const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const Order = sequelize.define("orderProduct",
  {
     id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
    userId:{
        type:Sequelize.NUMBER,
    },
    orderId:{
        type:Sequelize.NUMBER,
    },
    productId:{
        type:Sequelize.NUMBER,
    },
    quantity: { type: Sequelize.NUMBER, defaultValue:0 },
    price: { type: Sequelize.NUMBER, defaultValue:0 },
    isActive:{type:Sequelize.BOOLEAN, defaultValue:true}
  },
  { timestamps: true }
);

module.exports = Order