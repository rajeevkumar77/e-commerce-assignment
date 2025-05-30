

const Sequelize = require("sequelize");

const sequelize = require("../config/dbConnection");

const User = sequelize.define("product", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.TEXT,
    defaultValue: "",
  },
  description: {
    type: Sequelize.TEXT,
    defaultValue: "",
  },
  category: {
    type: Sequelize.TEXT,
    defaultValue: "",
  },

  price: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },

  stock: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },

  image: {
    type: Sequelize.TEXT,
    defaultValue: "",
  },

  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue:true
  }

});


module.exports = User
