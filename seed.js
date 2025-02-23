const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/adminModel'); 


mongoose.connect('mongodb+srv://arorigavincode:PR5e0w6ZTOwmcjCf@cluster0.isldo.mongodb.net/shopmart-collections', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Database connected');
}).catch(err => {
    console.error('Database connection error:', err);
});

async function addAdmin() {
    try {
        const adminData = {
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'securepassword', 
            image: 'path/to/image.jpg',
            role: 'admin'
        };

        const saltRounds = 10; 
        adminData.password = await bcrypt.hash(adminData.password, saltRounds);

       
        const admin = new Admin(adminData);
        await admin.save();

        console.log('Admin user created successfully');
        mongoose.connection.close(); 
    } catch (error) {
        console.error('Error creating admin:', error);
        mongoose.connection.close();
    }
}

addAdmin();