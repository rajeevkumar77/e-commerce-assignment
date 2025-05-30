const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const User = sequelize.define("admin", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING(100),
    defaultValue: "",
  },
  email: {
    type: Sequelize.STRING(100),
    defaultValue: "",
    allowNull: false,
  },

  password: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue:true
  }

});


module.exports = User
