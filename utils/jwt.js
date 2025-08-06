const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const generateToken = (payload)=>{

    try {
        console.log('jsglj')
        return jwt.sign({userId:payload.userId, role:payload.role}, process.env.TOKEN_KEY, {expiresIn: '1d'})
    } catch (error) {
        console.log('Error generating access Token', error);
        throw error
    }
}

module.exports = generateToken;