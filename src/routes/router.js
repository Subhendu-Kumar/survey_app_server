import express from "express";
import { signUp, signIn, createForm } from "../controller/controllers.js";
import verifyToken from "../auth/verifyToken.js";

const router = express.Router();

router.post("/auth/signup", signUp);
router.post("/auth/signin", signIn);
router.post("/form/create", verifyToken, createForm);

export default router;
