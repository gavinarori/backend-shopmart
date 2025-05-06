const express = require('express')
const { dbConnect } = require('./utiles/db')
const app = express()
const cors = require('cors')
const http = require('http')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const socket = require('socket.io')

const server = http.createServer(app)

app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true
}))

const io = socket(server, {
    cors: {
        origin: '*',
        credentials: true
    }
})

// ---------------------------
// Active Users Data
// ---------------------------
let allCustomer = []
let allSeller = []
let admin = {}

// ---------------------------
// Utility Functions
// ---------------------------
const addUser = (customerId, socketId, userInfo) => {
    const exists = allCustomer.some(u => u.customerId === customerId)
    if (!exists) {
        allCustomer.push({ customerId, socketId, userInfo })
    }
}

const addSeller = (sellerId, socketId, userInfo) => {
    const exists = allSeller.some(s => s.sellerId === sellerId)
    if (!exists) {
        allSeller.push({ sellerId, socketId, userInfo })
    }
}

const findCustomer = (customerId) => {
    return allCustomer.find(c => c.customerId === customerId)
}

const findSeller = (sellerId) => {
    return allSeller.find(s => s.sellerId === sellerId)
}

const remove = (socketId) => {
    allCustomer = allCustomer.filter(c => c.socketId !== socketId)
    allSeller = allSeller.filter(s => s.socketId !== socketId)
}

const removeAdmin = (socketId) => {
    if (admin.socketId === socketId) {
        admin = {}
    }
}

const emitActiveCounts = () => {
    io.emit('activeUserCount', {
        sellers: allSeller.length,
        customers: allCustomer.length,
        admin: admin?.socketId ? 1 : 0
    })
}

// ---------------------------
// Socket.IO Connection
// ---------------------------
io.on('connection', (soc) => {
    console.log('socket server is connected...', soc.id)

    soc.on('add_user', (customerId, userInfo) => {
        addUser(customerId, soc.id, userInfo)
        io.emit('activeSeller', allSeller)
        io.emit('activeCustomer', allCustomer)
        emitActiveCounts()
    })

    soc.on('add_seller', (sellerId, userInfo) => {
        addSeller(sellerId, soc.id, userInfo)
        io.emit('activeSeller', allSeller)
        io.emit('activeCustomer', allCustomer)
        io.emit('activeAdmin', { status: true })
        emitActiveCounts()
    })

    soc.on('add_admin', (adminInfo) => {
        delete adminInfo.email
        admin = adminInfo
        admin.socketId = soc.id
        io.emit('activeSeller', allSeller)
        io.emit('activeAdmin', { status: true })
        emitActiveCounts()
    })

    soc.on('send_seller_message', (msg) => {
        const customer = findCustomer(msg.receverId)
        if (customer) {
            soc.to(customer.socketId).emit('seller_message', msg)
        }
    })

    soc.on('send_customer_message', (msg) => {
        const seller = findSeller(msg.receverId)
        if (seller) {
            soc.to(seller.socketId).emit('customer_message', msg)
        }
    })

    soc.on('send_message_admin_to_seller', (msg) => {
        const seller = findSeller(msg.receverId)
        if (seller) {
            soc.to(seller.socketId).emit('receved_admin_message', msg)
        }
    })

    soc.on('send_message_seller_to_admin', (msg) => {
        if (admin.socketId) {
            soc.to(admin.socketId).emit('receved_seller_message', msg)
        }
    })

    soc.on('disconnect', () => {
        console.log('user disconnect')
        remove(soc.id)
        removeAdmin(soc.id)
        io.emit('activeAdmin', { status: false })
        io.emit('activeSeller', allSeller)
        io.emit('activeCustomer', allCustomer)
        emitActiveCounts()
    })
})

// ---------------------------
// Middleware
// ---------------------------
app.use(bodyParser.json())
app.use(cookieParser())

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`)
    console.log('Cookies:', req.cookies)
    next()
})

// ---------------------------
// Routes
// ---------------------------
app.use('/api', require('./routes/chatRoutes'))
app.use('/api', require('./routes/dashboard/ dashboardIndexRoutes'))
app.use('/api/wallet', require('./routes/wallet.routes'))
app.use('/api/mpesa', require('./routes/mpesa.routes'))
app.use('/api/pay', require('./routes/payments.routes'))
app.use('/api/home', require('./routes/home/homeRoutes'))
app.use('/api', require('./routes/home/cardRoutes'))
app.use('/api', require('./routes/authRoutes'))
app.use('/api', require('./routes/home/customerAuthRoutes'))
app.use('/api', require('./routes/dashboard/sellerRoutes'))
app.use('/api', require('./routes/dashboard/categoryRoutes'))
app.use('/api', require('./routes/dashboard/productRoutes'))

app.get('/', (req, res) => res.send('Hello World!'))

// ---------------------------
// Start Server
// ---------------------------
const port = process.env.PORT
dbConnect()
server.listen(port, () => console.log(`Server is running on port ${port}!`))
