const jwt = require("jsonwebtoken");
const userModel = require("../../database/models/user");

const verifyUser = async (req) => {
  try {
    req.email = null;
    req.loggedInUserId = null;
    const bearer = req.req.headers.authorization;
    if (bearer) {
      const token = bearer.split(" ");
      const authorization = token && token.length > 1 && token[1];
      const payload = await jwt.verify(
        authorization,
        process.env.JWT_SECRET_KEY
      );
      req.email = payload.email;
      const user = await userModel.findOne({email: payload.email});
      req.loggedInUserId = user.id;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = verifyUser;
