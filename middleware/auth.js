const jwt = require('jsonwebtoken');

function authenticate(req,res,next){
const header = req.headers.authorization;

if(!header || !header.startsWith('Bearer ')){
    return res.status(401).send('Missing Token')
}
const token = header.slice(7).trim();
try {
    const payload = jwt.verify(token,process.env.JWT_SECRET);
    req.user = payload;
    next();
} catch (error) {
     console.log('JWT error:', error.message);
    return res.status(401).send('Invalid or expired token');
}
}

module.exports = authenticate;