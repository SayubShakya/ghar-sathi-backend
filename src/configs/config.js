const dotenv = require('dotenv');
dotenv.config();
const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI:
    process.env.MONGODB_URI ,
  JWT_SECRET: process.env.JWT_SECRET ,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION ,
 
};

module.exports = config;

