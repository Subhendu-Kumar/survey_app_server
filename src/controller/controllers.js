import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createToken } from "../auth/createToken.js";
import { userSchema } from "../utils/validations_zod.js";

const prisma = new PrismaClient();

export const signUp = async (req, res) => {
  const validateReq = userSchema.safeParse(req.body);
  if (!validateReq.success) {
    return res.status(400).json({
      message: validateReq.error.issues[0].message,
    });
  }
  const { username, email, password } = validateReq?.data;
  try {
    const existinguser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existinguser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }
    const user_id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        user_id,
        username,
        email,
        password: hashedPassword,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
      },
    });
    res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existinguser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        password: true,
      },
    });
    if (!existinguser) {
      return res.status(400).json({
        message: "User doesn't exists",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existinguser?.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const { password: _, ...userWithoutPassword } = existinguser;
    const token = createToken(userWithoutPassword);
    res.status(200).json({
      message: "User signed in successfully",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};
