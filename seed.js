const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/adminModel'); 


mongoose.connect('mongodb+srv://gavinarori:g123456@cluster0.7kfoiet.mongodb.net/collections', {
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
        mongoose.connection.close(); // Close the connection after saving
    } catch (error) {
        console.error('Error creating admin:', error);
        mongoose.connection.close();
    }
}

// Run the script
addAdmin();