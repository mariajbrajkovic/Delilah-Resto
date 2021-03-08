const { Sequelize, QueryTypes } = require('sequelize');
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const firm = process.env.JWTFIRM

const db = new Sequelize(process.env.DBNAME, process.env.DBUSER, process.env.DBPASS, {
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    dialect: process.env.DBDIALECT
})

// POST user - create new user
async function createUser(user, req, res, hash) {
    const newUser = await db.query(`
    INSERT INTO users (username, fullname, email, phone, address, password, admin)
    VALUES (:username, :fullname, :email, :phone, :address, :password, :admin)
    `, {
        replacements: user, hash,
        type: QueryTypes.INSERT
    })
    console.table(newUser)
    const allUsers = await db.query(`
    SELECT * from users`, {
        type: QueryTypes.SELECT
    })
}

async function userExists(user) {
    const exists = await db.query(`SELECT * FROM users WHERE (username = :username) OR (email = :email)`,{
        type: QueryTypes.SELECT,
        replacements: user
    })
    return exists
}

// POST users - user login
async function  validateUserAndPassword(user, req, res) {
    const validation = await db.query(
        `SELECT * FROM users WHERE (username = :user) OR (email = :user) AND (password = :password) `,
        {
        type: QueryTypes.SELECT,
        replacements: user
    })
    if (validation.lenght === 0) {
        return res.status(400).send('Error 404. User not found.')
    } else {
        const token = jwt.sign(validation[0], firm)
        console.log(token)
        return res.status(200).json({success: 'Successful login', token: jwt.sign(validation[0], firm)})
    }
}

// GET users - get a list with the users information
async function getUsers(req, res) {
    const users = await db.query(
        `SELECT * FROM users`, {
        type: QueryTypes.SELECT,
    })
    if (users.length === 0) {
        res.status(404).send('There are no users')
    } else {
        res.status(200).send(users)
    }
    console.table(users)
}

// POST products - create a new product
async function addNewProduct(newProduct, req, res) {
    const product = await db.query(`
    INSERT INTO products (name, price, description)
    VALUES (:name, :price, :description)
    `, {
        replacements: newProduct,
        type: QueryTypes.INSERT
    })
    res.status(201).json(newProduct);
    res.status(404).end();
    console.table(product)
}

// GET products - get a list of all the products
async function getProducts(req, res) {
    const products = await db.query( `
    SELECT name, price FROM products`, {
        type: QueryTypes.SELECT
    })
    res.status(200).json(products)
    res.status(404).end()
    console.table(products)
}

// PUT products - modify an specific product by providing its id
async function modifyProduct(product, req, res){
    const searchProduct = await db.query(
        `SELECT product_id FROM products WHERE (product_id = :id) `, {
            type: QueryTypes.SELECT,
            replacements: product
    })
    if (searchProduct.length === 0) {
        res.status(404).send('Product not found')
    } else {
        const set = Object.keys(product).filter(key => product[key] != null && key != "id").map(key => `${key} = :${key}`).join(", ")
        console.log(product)
        const query = `UPDATE products SET ${set} WHERE product_id = :id` 
        const updatedProduct = await db.query(query,
            {
                type: QueryTypes.UPDATE,
                replacements: product
            }
        )
        const searchUpdatedProduct = await db.query(
            `SELECT name, price, description FROM products WHERE (product_id = :id) `, {
                type: QueryTypes.SELECT,
                replacements: product
        })
        console.table(searchUpdatedProduct)
        res.status(200).json(searchUpdatedProduct)
    }
}

// DELETE products - delete an specific product by providing its id
async function deleteProduct(product, req, res){
    console.log(product)
    const deletedProduct = await db.query(`
    DELETE FROM products WHERE product_id = :id
    `, {
        replacements: product,
        type: QueryTypes.DELETE
    })
    res.status(204).send('Item succesfully deleted')
}

// POST orders - create a new order
async function placeOrder (order, orderDetails, req, res){
    const listOfProducts = orderDetails.item
    const listOfQuantities = orderDetails.quantity
    console.log(listOfProducts)
    const orderInformation = await db.query(`
        INSERT INTO orders (status_id, payment_id, user_id, delivery_address)
        VALUES (1, :payment_id, :user_id, :delivery_address)`, 
        {
            replacements: {'payment_id': order.payment_id, 'user_id': order.user_id, 'delivery_address': order.delivery_address},
            type: QueryTypes.INSERT
    })
    console.log(orderInformation)
    const order_id = orderInformation[0]
    for (let index = 0; index < listOfProducts.length; index++) {
        const element = {
            name: listOfProducts[index]
        }
        console.log(element)
        let product_id = await db.query (
            `SELECT product_id FROM products WHERE (name = :name) `,
            {
                type: QueryTypes.SELECT,
                replacements: element
        })
        let price = await db.query (
            `SELECT 
            price
            FROM products
            WHERE (name = :name) `,
            {
                type: QueryTypes.SELECT,
                replacements: element
        })
        console.log(product_id)
        console.log(price)
        const subtotal = Object.values(price[0]) * listOfQuantities[index]
        console.log(subtotal)
        console.log(typeof(subtotal))
        const postOrder = await db.query(`
        INSERT INTO order_details (order_id, product_id, quantity, subtotal)
        VALUES (:order_id , :product_id, :quantity, :subtotal)`,
        {
            replacements: {'order_id': order_id, 'product_id': Object.values(product_id[0]), 'quantity': listOfQuantities[index], 'subtotal': subtotal},
            type: QueryTypes.INSERT
        })
    }
    const subtotals = await db.query (`
        SELECT subtotal 
        FROM order_details 
        WHERE order_id = :order_id
    `, {
        replacements: {'order_id': order_id},
        type: QueryTypes.SELECT
    })
    let amount = 0
    for (let index = 0; index < subtotals.length; index++) {
        amount = amount + +Object.values(subtotals[index]);
    }
    console.log(amount)
    const total = await db.query (`
        UPDATE orders
        SET amount = :amount
        WHERE order_id = :order_id
    `,
    {
        replacements: {'amount': amount, 'order_id': order_id},
        type: QueryTypes.UPDATE
    })
}

// PUT orders - modify an specific order by providing its id
async function modifyOrderStatus(order, req, res){
    const status = await db.query(
        `UPDATE orders
        SET status_id = :status_id
        WHERE order_id = :id`,
        {
            type: QueryTypes.UPDATE,
            replacements: order
        }
    )
    console.table(status)
    res.status(200).send("Order status succesfully updated")
    res.status(404).end()
}

// DELETE orders - delete an specific order by providing its id
async function cancelOrder(order, req, res) {
    const orderToCancel = await db.query (`
    SELECT * FROM orders WHERE order_id= :id
    `, {
        replacements: order,
        type: QueryTypes.SELECT
    })
    console.log(orderToCancel.length)
    const canceledOrder = await db.query (`
    DELETE FROM orders WHERE order_id= :id
    `, {
        replacements: order,
        type: QueryTypes.DELETE
    })
    const cancelProducts = await db.query (`
    DELETE FROM order_details WHERE order_id= :id
    `, {
        replacements: order,
        type: QueryTypes.DELETE
    })
    if (orderToCancel.length === 1){
        res.status(201).send("Order cancelled")
    } else {
        res.status(404).send("Order not found")
    }
}

// GET orders - get a list of all the orders
async function getAllOrders(req, res) {
    const join = await db.query(`
        SELECT CONCAT(name, 'x', quantity) AS Description
        FROM order_details
        INNER JOIN products
        ON products.product_id = order_details.product_id`, {
        type: QueryTypes.SELECT
    })
    const orders = await db.query(`
        SELECT
        status.status,
        o.date,
        o.order_id,
        payment_method.payment_method,
        o.amount,
        users.fullname,
        users.address
        FROM orders o, order_details od, products p
        INNER JOIN payment_method ON payment_method.payment_id = payment_id
        INNER JOIN users ON users.user_id = user_id
        INNER JOIN status ON status_id = status.status_id
        INNER JOIN order_details ON order_id = order_id
        `, 
    {
        type: QueryTypes.SELECT
    })
    return orders
}

// GET orders - get an specific order by providing the user id
async function validateUserForOrder (id, orderId) {
    const isValid = await db.query(
        `SELECT user_id, order_id FROM orders WHERE (user_id = :id) AND (order_id = :order_id)`,
        {
            type: QueryTypes.SELECT,
            replacements: {'id': id, 'order_id': orderId}
        }
    )
    console.log(isValid)
    return isValid
}

async function getOrderByUser(order) {
    const join = await db.query(`
        SELECT CONCAT(name, ' x ', quantity) AS description, order_id 
        FROM order_details
        INNER JOIN products 
        ON products.product_id = order_details.product_id
        WHERE (order_id = :id)
    `, {
        type: QueryTypes.SELECT,
        replacements: order
    })
    const orderToSee = await db.query(
        `SELECT 
        orders.order_id,
        status.status,
        orders.amount,
        payment_method.payment_method,
        users.address
        FROM orders 
        INNER JOIN status ON orders.status_id = status.status_id
        INNER JOIN payment_method ON orders.payment_id = payment_method.payment_id
        INNER JOIN users ON users.user_id = orders.user_id
        WHERE (order_id = :id) `,
    {
        type: QueryTypes.SELECT,
        replacements: order
    })
    return orderToSee
}

module.exports = {
    createUser,
    userExists,
    validateUserAndPassword,
    getUsers,
    addNewProduct,
    getProducts,
    modifyProduct,
    deleteProduct,
    placeOrder,
    modifyOrderStatus,
    cancelOrder,
    getAllOrders,
    getOrderByUser,
    validateUserForOrder
}
