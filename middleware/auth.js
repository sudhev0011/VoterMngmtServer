const jwt = require('jsonwebtoken');


const auth = (req, res, next) =>{

    const token = req.cookies.token;
    if(!token) return res.status(401).json({message: 'No token provided'});

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        console.log(decoded)
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({message: 'Invalid token'});
    }
}

const isAdmin = (req,res,next)=>{

    if(req.user.role !== 'admim'){
        return res.status(403).json({message: 'Admin access required'});
    }

    next();
}


module.exports = {auth, isAdmin};