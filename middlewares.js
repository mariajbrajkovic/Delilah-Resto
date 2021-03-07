const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const firm = process.env.JWTFIRM

// Middleware for admins login
function adminAuthentication (req, res, next) {
    console.log('Only admins')
    try {
        const token = req.headers.authorization.split(' ')[1]
        const payload = jwt.verify(token, firm)
        if (payload && payload.admin === 1) {
            return next()
        } else {
                res.status(403).send('Access forbidden')
        }
    } catch(err) {
        console.log(err)
        res.status(400).send('Could not find admin')
    }
}

// Middleware verify token
async function verifyToken (req, res, next) {
    const token = req.headers.authorization.split(' ')[1]
    const payload = jwt.verify(token, firm)
    console.log(payload)
    if (payload) {
        next()
    } else {
        res.status(401).end()
    }
}

// Middleware user already exists
const {userExists} = require(`./database.js`)
async function userAlreadyExists (req, res, next) {
    const user = {
        username: req.body.username,
        email: req.body.email
    }
    const search = await userExists(user)
    if(search.length === 0) {
        next()
    } else {
        res.status(409).send('Username or email already exists.')
    }
}

// Middleware validate new user information
async function validateInformation(req, res, next) {
    if (typeof req.body.fullname !== 'string' || req.body.user === null) {
        res.status(400).send('Invalid name and surname.')
    }
    if (typeof req.body.username !== 'string' || req.body.user === null) {
        res.status(400).send('Invalid username.')
    }
    if (req.body.email.includes('@') === false || req.body.email === null) {
        res.status(400).send('Invalid email.')
    }
    if (typeof req.body.phone !== 'number' || req.body.phone === null) {
        res.status(400).send('Invalid phone number.')
    }
    if (typeof req.body.address !== 'string' || req.body.address === null) {
        res.status(400).send('Invalid address.')
    }
    if (typeof req.body.password !== 'string' || req.body.password === null) {
        res.status(400).send('Password is mandatory.')
    }
    else {
        next()
    }
}

// Middleware validate new product information
async function validateProductInformation(req, res, next) {
    if (typeof req.body.name !== 'string' || req.body.name === null) {
        res.status(400).send('Invalid name.')
    }
    if (typeof req.body.price !== 'number' || req.body.price === null) {
        res.status(400).send('Invalid price.')
    }
    if (typeof req.body.description !== 'string') {
        res.status(400).send('Invalid description.')
    }
    else {
        next()
    }
}

// Middleware validate updated product information
async function validateUpdatedProductInformation(req, res, next) {
    if (typeof req.body.name !== 'string' || req.body.name === null) {
        res.status(400).send('Invalid name.')
    }
    if (typeof req.body.price !== 'number' || req.body.price === null) {
        res.status(400).send('Invalid price.')
    }
    if (typeof req.body.description !== 'string') {
        res.status(400).send('Invalid description.')
    }
    else {
        next()
    }
}

// Middleware validate user and order
const {validateUserForOrder} = require(`./database.js`)
async function userAuthentication (req, res, next) {
    console.log('Only valid users')
    try {
        const token = req.headers.authorization.split(' ')[1]
        const payload = jwt.verify(token, firm)
        const user = payload.user_id
        const order = req.params.id
        const validateUser = await validateUserForOrder(user, order)
        if (validateUser.length === 1) {
            return next()
        } else {
            res.status(403).send('An error has ocurred while validating user')
        }
    } catch(err) {
        console.log(err)
        res.status(400).send('Could not find user')
    }
}

module.exports = {
    userAuthentication,
    adminAuthentication,
    userAlreadyExists,
    validateInformation,
    validateProductInformation,
    validateUpdatedProductInformation,
    verifyToken
}