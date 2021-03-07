const app = require("express")();
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const firm = process.env.JWTFIRM;
const dotenv = require('dotenv').config()
const {userAuthentication, adminAuthentication, userAlreadyExists} = require(`./middlewares.js`)
const {validateInformation, validateProductInformation, validateUpdatedProductInformation} = require(`./middlewares.js`)

const limiter = rateLimit({
    windowMs: 60*60*1000,
    max: 7
})

app.use(bodyParser.json());
app.use(helmet());
app.use(limiter);

app.listen(process.env.PORT || 3000, () => console.log('Server listening'));

// POST user - create new user
const {createUser} = require(`./database.js`);
app.post('/singup', userAlreadyExists, validateInformation, (req, res) => {
    const user = {
        fullname: req.body.fullname,
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        password: req.body.password,
        admin: 0
    }
    const saltRounds = 10
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) throw res.status(400).send('An error has happened')
            else {
                Object.defineProperty(user, 'hash', {value: hash})
                createUser(user, req, res)
                res.status(200).send('User created')
            }
        })
    })
})

// POST users - user login
const {validateUserAndPassword} = require(`./database.js`)
app.post('/login', limiter, async (req, res) => {
    const user = {
        user: req.body.user,
        password: req.body.password
    }
    const validate = validateUserAndPassword(user, req, res)
    if (!validate) {
        res.json({ error: 'User or password incorrect'})
        return
    }
})

// GET users - get a list with the users information
const {getUsers} = require(`./database.js`);
app.get('/users', adminAuthentication, (req, res) => {
    getUsers(req, res)
})

// POST products - create a new product
const {addNewProduct} = require(`./database.js`);
app.post('/products', adminAuthentication, validateProductInformation, async (req, res) => {
    const product = {
        name: req.body.name,
        price: +req.body.price,
        description: req.body.description
    }
    const newProduct = await addNewProduct(product, req, res);
})

// GET products - get a list of all the products
const {getProducts} = require(`./database.js`);
app.get('/products', (req, res) => {
    getProducts(req, res);
})

// PUT products - modify an specific product by providing its id
const {modifyProduct} = require(`./database.js`);
app.put('/products/:id', adminAuthentication, async (req, res) => {
    const product = {
        id: +req.params.id,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description
    }
    await modifyProduct(product, req, res)
})

// DELETE products - delete an specific product by providing its id
const {deleteProduct} = require(`./database.js`);
app.delete('/products/:id', adminAuthentication, (req, res) => {
    const product = {
        id: +req.params.id
    }
    deleteProduct(product, req, res)
})

// POST orders - create a new order
const {placeOrder} = require(`./database.js`)
const {getProductId} = require(`./database.js`)
app.post('/orders', (req, res) => {
    const firm = process.env.JWTFIRM;
    const token = req.headers.authorization.split(' ')[1]
    const payload = jwt.verify(token, firm)
    const order = {
        productsList : req.body.productsList,
        payment_id: +req.body.payment_id,
        delivery_address: req.body.deliveryAddress,
        amount: +req.body.total,
        user_id: payload.user_id
    }
    function transformData(order) {
        const objectOrder = order.productsList
        const products = objectOrder.product
        const quantities = objectOrder.quantity
        const numberOfItems = products.length
        const orderDetails = {
            item: products,
            quantity: quantities
        }
        return orderDetails
    }
    const orderDetails = transformData(order)
    const listOfProducts = orderDetails.item
    const listOfQuantities = orderDetails.quantity
    const placedOrder = placeOrder(order, orderDetails, req, res)
    if (placedOrder == false) {
        res.status(400).send("An error has occurred")
    } else {
        res.status(201).send('We received your order')
    }
})

// PUT orders - modify an specific order by providing its id
const {modifyOrderStatus} = require(`./database.js`)
app.put('/orders/:id', adminAuthentication, async (req, res)=>{
    const order = { 
        id: +req.params.id,
        status_id: req.body.status_id
    }
    modifyOrderStatus(order, res, res)
})

// DELETE orders - delete an specific order by providing its id
const {cancelOrder} = require(`./database.js`)
app.delete('/orders/:id', adminAuthentication, (req, res) => {
    const order = {
        id: req.params.id
    }
    cancelOrder(order, req, res)
})

// GET orders - get a list of all the orders
const {getAllOrders} = require(`./database.js`)
app.get('/orders', adminAuthentication, async (req, res) => {
    const ordersList = await getAllOrders(req, res)
    res.status(200).send(ordersList)
})

// GET orders - get an specific order by providing the user id
const {getOrderByUser} = require(`./database.js`)
app.get('/orders/:id', userAuthentication, async (req, res) => {
    const firm = process.env.JWTFIRM;
    const token = req.headers.authorization.split(' ')[1]
    const payload = jwt.verify(token, firm)
    const order = {
        id: req.params.id,
        user: payload.user_id
    }
    const ordersList = await getOrderByUser(order, req, res)
    res.status(200).send(ordersList)
})