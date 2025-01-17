import jwt from "jsonwebtoken";
import { secret } from "../config.js";

export const createToken = (user) => {
  const token = jwt.sign({ user: user }, secret, {
    expiresIn: "5d",
  });
  return token;
};
