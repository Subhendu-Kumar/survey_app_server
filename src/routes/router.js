import {
  signUp,
  signIn,
  submitForm,
  createForm,
  getResponse,
  getFormDataWithFormId,
  getFormDataWithUserId,
} from "../controller/controllers.js";
import express from "express";
import verifyToken from "../auth/verifyToken.js";

const router = express.Router();

router.post("/auth/signup", signUp);
router.post("/auth/signin", signIn);
router.post("/form/create", verifyToken, createForm);
router.post("/form/submit", verifyToken, submitForm);
router.get("/form/getdata/:formId", getFormDataWithFormId);
router.get("/response/:form_id", verifyToken, getResponse);
router.get("/form/get", verifyToken, getFormDataWithUserId);

export default router;
