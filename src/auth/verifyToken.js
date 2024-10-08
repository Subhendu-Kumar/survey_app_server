import jwt from "jsonwebtoken";
import { secret } from "../config.js";

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "No token Provided",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedData = await jwt.verify(token, secret);
    req.user = decodedData.user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default verifyToken;
