const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Product = require("../model/product")
const Cart = require("../model/cart")
const CartProduct = require("../model/cartProduct")
const Order = require("../model/order")
const OrderProduct = require("../model/orderProduct")
const { ObjectId } = require("mongodb");
// Register
exports.register = async (req,res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username});
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ username, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { _id: user._id,role:"user" };
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
        let user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isValidPassword = await bcrypt.compare(password, user?.password);
        if (!isValidPassword) return res.status(400).json({ status: 0, message: 'Invaild username/password' });

        const payload = { _id: user._id,role:"user" };
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
  
    const query = {
      title: { $regex: search, $options: "i" }
    };
  
    try {
      const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
  
      const total = await Product.countDocuments(query);
  
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({status:1, message:'Product fetched', data:product });
  } catch (err) {
    res.status(500).json({status:0, message: 'Server error', error: err.message });
  }
};

exports.getUserCartDetails = async (req, res) => {
    try {
        const {userId} = req.params
        const pipeline = [
          {
            '$match': {
              'userId': new ObjectId(userId), 
              'isActive': true
            }
          }, {
            '$lookup': {
              'from': 'cart_products', 
              'localField': '_id', 
              'foreignField': 'cartId', 
              'as': 'cart_product', 
              'pipeline': [
                {
                  '$match': {
                    'isActive': true
                  }
                }, {
                  '$lookup': {
                    'from': 'products', 
                    'localField': 'productId', 
                    'foreignField': '_id', 
                    'as': 'product', 
                    'pipeline': [
                      {
                        '$project': {
                          'title': 1, 
                          'image': 1
                        }
                      }
                    ]
                  }
                }, {
                  '$unwind': {
                    'path': '$product', 
                    'preserveNullAndEmptyArrays': true
                  }
                }, {
                  '$addFields': {
                    'title': '$product.title', 
                    'image': '$product.image'
                  }
                }, {
                  '$unset': 'product'
                }
              ]
            }
          }
        ]
      const userCart = await Cart.aggregate(pipeline)
      res.status(200).json({status:1, message:'Cart fetched', data:userCart?.[0] });
    } catch (err) {
      res.status(500).json({status:0, message: 'Server error', error: err.message });
    }
  };

exports.createOrUpdateUserCart = async (req, res) => {
    try {
        const {cartId} = req.params
        const {userId,products} = req.body

        let isExist
        if(cartId && cartId!="null"){
            isExist = await Cart.findOne({_id:cartId,userId,isActive:true})
        }else{
            isExist = new Cart({userId,isActive:true})
        }
        let allSavedProduct = []
        for (const ele of products) {
            let isCartProduct = await CartProduct.findOne({cartId:isExist?._id,productId:ele?._id,isActive:true})
            if(!isCartProduct){
                isCartProduct = new CartProduct({cartId:isExist?._id,productId:ele?._id,isActive:true})
            }
            const product = await Product?.findById(ele?._id)
            isCartProduct.price = ele?.price
            isCartProduct.quantity = ele?.quantity
            await isCartProduct.save()
            allSavedProduct.push({...JSON.parse(JSON.stringify(isCartProduct)),title:product?.title,image:product?.image})
        }

        const cartProducts = await CartProduct.aggregate([
            { $match: { cartId: isExist?._id, isActive: true } },
            { $group: { 
                _id: "$cartId",
                totalAmount: { $sum: { $multiply: ["$price", "$quantity"] } }
            }}
          ]);

          console.log("isExist",isExist);
          
          if (cartProducts.length > 0) {
            isExist.amount = cartProducts[0].totalAmount
            await isExist.save()
            res.status(200).json({ status: 1, message: 'Cart updated successfully', data: {cart:isExist,items:allSavedProduct} });
          } else {
            res.status(404).json({ status: 0, message: 'No products found in the cart' });
          }
    } catch (err) {
      console.log(err);
      
      res.status(500).json({status:0, message: 'Server error', error: err.message });
    }
};

exports.deleteCartProductAndUpdateCart = async (req, res) => {
  try {
    const { cartProductId } = req.params;
    const cartProduct = await CartProduct.findOne({ _id: cartProductId });

    if (!cartProduct) {
      return res.status(404).json({ status: 0, message: 'Cart product not found' });
    }

    const cartId = cartProduct.cartId;
    await CartProduct.deleteOne({ _id: cartProductId });

    const cartProducts = await CartProduct.aggregate([
      { $match: { cartId } },
      {
        $group: {
          _id: "$cartId",
          totalAmount: { $sum: { $multiply: ["$price", "$quantity"] } }
        }
      }
    ]);

    const cart = await Cart.findById(cartId);
    cart.amount = cartProducts.length > 0 ? cartProducts[0].totalAmount : 0;
    await cart.save();

    res.status(200).json({
      status: 1,
      message: 'Cart product deleted and cart updated',
      data: { cart,cartProductId }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Server error', error: err.message });
  }
};
