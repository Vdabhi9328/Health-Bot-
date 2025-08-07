import jwt from 'jsonwebtoken'
export const authenticate = async (req, res, next) => {
    try {
        let token = req.cookies.access_token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(403, 'Unathorized');
        }
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decodeToken
        next()
    } catch (error) {
        next(500, error.message)
    }
}