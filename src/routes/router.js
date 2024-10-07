import express from "express";
import {
  signUp,
  signIn,
  submitForm,
  createForm,
  getFormDataWithFormId,
  getFormDataWithUserId,
} from "../controller/controllers.js";
import verifyToken from "../auth/verifyToken.js";

const router = express.Router();

router.post("/auth/signup", signUp);
router.post("/auth/signin", signIn);
router.post("/form/create", verifyToken, createForm);
router.get("/form/getdata/:formId", getFormDataWithFormId);
router.get("/form/get", verifyToken, getFormDataWithUserId);
router.post("/form/submit", verifyToken, submitForm);

export default router;
