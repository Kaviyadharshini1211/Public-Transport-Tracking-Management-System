require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const user = await User.create({
        name: 'Debug User',
        email: 'debug_error@example.com',
        password: 'password123',
        role: 'driver'
      });
      console.log('Success:', user);
    } catch (err) {
      console.error('Mongoose Error:', err);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection Error:', err);
    process.exit(1);
  });
