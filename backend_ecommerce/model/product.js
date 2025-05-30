

const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const User = sequelize.define("product", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING(100),
    defaultValue: "",
  },
  description: {
    type: Sequelize.STRING(400),
    defaultValue: "",
  },
  category: {
    type: Sequelize.STRING(100),
    defaultValue: "",
  },

  price: {
    type: Sequelize.NUMBER,
    defaultValue: 0
  },

  stock: {
    type: Sequelize.NUMBER,
    defaultValue: 0
  },

  image: {
    type: Sequelize.STRING(100),
    defaultValue: "",
  },

  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue:true
  }

});


module.exports = User
