const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Product = require("../model/product")
const Cart = require("../model/cart")
const CartProduct = require("../model/cartProduct")
const Order = require("../model/order")
const OrderProduct = require("../model/orderProduct")
const { ObjectId } = require("mongodb");
const { Op } = require('sequelize');
const sequelize = require('../config/dbConnection');
// Register
exports.register = async (req,res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ where: {username}});
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = await User.create({ username, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { id: user.id,role:"user" };
        const token = jwt.sign(payload, process.env.USER_SECRET_KEY);

        return res.status(200).json({ status: 1, message: 'Successfull register', token });
    } catch (err) {
      console.log(err);
      
        return res.status(500).json({ status: 0, message: 'Something went wrong', err });
    }
}

exports.login = async (req,res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ where: {username} });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isValidPassword = await bcrypt.compare(password, user?.password);
        if (!isValidPassword) return res.status(400).json({ status: 0, message: 'Invaild username/password' });

        const payload = { id: user.id,role:"user" };
        const token = jwt.sign(payload, process.env.USER_SECRET_KEY);

        return res.status(200).json({ status: 1, message: 'Successfull login', token });
    } catch (err) {
        return res.status(500).json({ status: 0, message: 'Something went wrong', err });
    }
}

exports.getAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || "";
  
    try {
      const { rows: products, count: total } = await Product.findAndCountAll({
        where: {
          isActive: true,
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
          ]
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: [['createdAt', 'DESC']]
      })
  
      return res.json({
        status: 1,
        message: "Data fetched",
        data: products,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      res.status(500).json({ status: 0, message: 'Server error', error: err.message });
    }
  };
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({status:1, message:'Product fetched', data:product });
  } catch (err) {
    res.status(500).json({status:0, message: 'Server error', error: err.message });
  }
};

exports.getUserCartDetails = async (req, res) => {
    try {
        const {userId} = req.params
        // const pipeline = [
        //   {
        //     '$match': {
        //       'userId': new ObjectId(userId), 
        //       'isActive': true
        //     }
        //   }, {
        //     '$lookup': {
        //       'from': 'cart_products', 
        //       'localField': 'id', 
        //       'foreignField': 'cartId', 
        //       'as': 'cart_product', 
        //       'pipeline': [
        //         {
        //           '$match': {
        //             'isActive': true
        //           }
        //         }, {
        //           '$lookup': {
        //             'from': 'products', 
        //             'localField': 'productId', 
        //             'foreignField': 'id', 
        //             'as': 'product', 
        //             'pipeline': [
        //               {
        //                 '$project': {
        //                   'title': 1, 
        //                   'image': 1
        //                 }
        //               }
        //             ]
        //           }
        //         }, {
        //           '$unwind': {
        //             'path': '$product', 
        //             'preserveNullAndEmptyArrays': true
        //           }
        //         }, {
        //           '$addFields': {
        //             'title': '$product.title', 
        //             'image': '$product.image'
        //           }
        //         }, {
        //           '$unset': 'product'
        //         }
        //       ]
        //     }
        //   }
        // ]

        const query = `
        SELECT
            c.*,
            cp.*,
            p.title AS product_title,
            p.image AS product_image
        FROM
            carts c
        LEFT JOIN
            cart_products cp ON c.id = cp.cartid AND cp.is_active = TRUE
        LEFT JOIN
            products p ON cp.productid = p.id
        WHERE
            c.userid = :userId AND c.is_active = TRUE;
      `
      
      const [results, metadata] = await sequelize.query(query,
        {
          replacements: { userId: userId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      res.status(200).json({ status: 1, message: 'Cart fetched', data: results });
    } catch (err) {
      res.status(500).json({status:0, message: 'Server error', error: err.message });
    }
  };


exports.createOrUpdateUserCart = async (req, res) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    const { cartId } = req.params;
    const { userId, products } = req.body;

    let isExist;

    if (cartId && cartId !== "null") {
      isExist = await Cart.findOne({
        where: { id: cartId, userId, isActive: true },
        transaction: t
      });
    } else {
      isExist = await Cart.create({ userId, isActive: true }, { transaction: t });
    }

    let allSavedProduct = [];

    for (const ele of products) {
      let isCartProduct = await CartProduct.findOne({
        where: {
          cartId: isExist.id,
          productId: ele.id,
          isActive: true
        },
        transaction: t
      });

      if (!isCartProduct) {
        isCartProduct = await CartProduct.create({
          cartId: isExist.id,
          productId: ele.id,
          isActive: true,
          price: ele.price,
          quantity: ele.quantity
        }, { transaction: t });
      } else {
        isCartProduct.price = ele.price;
        isCartProduct.quantity = ele.quantity;
        await isCartProduct.save({ transaction: t });
      }

      const product = await Product.findByPk(ele.id, { transaction: t });

      allSavedProduct.push({
        ...isCartProduct.toJSON(),
        title: product?.title,
        image: product?.image
      });
    }

    // Calculate totalAmount
    const cartProducts = await CartProduct.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalAmount']
      ],
      where: {
        cartId: isExist.id,
        isActive: true
      },
      raw: true,
      transaction: t
    });

    const totalAmount = cartProducts[0]?.totalAmount || 0;

    if (totalAmount > 0) {
      isExist.amount = totalAmount;
      await isExist.save({ transaction: t });
      await t.commit();
      return res.status(200).json({
        status: 1,
        message: 'Cart updated successfully',
        data: { cart: isExist, items: allSavedProduct }
      });
    } else {
      await t.rollback();
      return res.status(404).json({ status: 0, message: 'No products found in the cart' });
    }

  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ status: 0, message: 'Server error', error: err.message });
  }
};


exports.deleteCartProductAndUpdateCart = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { cartProductId } = req.params;

    // Find the cart product
    const cartProduct = await CartProduct.findOne({
      where: { id: cartProductId },
      transaction: t
    });

    if (!cartProduct) {
      await t.rollback();
      return res.status(404).json({ status: 0, message: 'Cart product not found' });
    }

    const cartId = cartProduct.cartId;

    // Delete the cart product
    await CartProduct.destroy({
      where: { id: cartProductId },
      transaction: t
    });

    // Calculate total amount from remaining cart products
    const cartProducts = await CartProduct.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalAmount']
      ],
      where: { cartId: cartId },
      raw: true,
      transaction: t
    });

    const totalAmount = cartProducts[0]?.totalAmount || 0;

    // Update the cart amount
    const cart = await Cart.findByPk(cartId, { transaction: t });
    if (cart) {
      cart.amount = totalAmount;
      await cart.save({ transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      status: 1,
      message: 'Cart product deleted and cart updated',
      data: { cart, cartProductId }
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ status: 0, message: 'Server error', error: err.message });
  }
};
