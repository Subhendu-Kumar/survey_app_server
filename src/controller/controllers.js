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

export const createForm = async (req, res) => {
  const { data, formId } = req.body;
  const { title, description, questions } = data;
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json({ message: "No user data found, user is unauthorized" });
  }
  const user_id = user.user_id;
  try {
    const existingForm = await prisma.form.findUnique({
      where: { form_id: formId },
    });
    if (existingForm) {
      return res
        .status(400)
        .json({ message: "Form with this ID already exists." });
    }
    await prisma.$transaction(async (prisma) => {
      const createdForm = await prisma.form.create({
        data: {
          form_id: formId,
          user_id: user_id,
          title,
          description,
        },
      });
      for (const question of questions) {
        const question_id = uuidv4();
        const createdQuestion = await prisma.question.create({
          data: {
            question_id,
            form_id: createdForm.form_id,
            question_text: question.title,
            question_type: question.type,
            is_required: question.isRequired,
          },
        });
        if (question.type === "multiple_choice") {
          for (const optionText of question.options) {
            const option_id = uuidv4();
            await prisma.option.create({
              data: {
                option_id,
                question_id: createdQuestion.question_id,
                option_text: optionText,
              },
            });
          }
        }
      }
    });
    res.status(201).json({
      message: "form created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

export const getFormDataWithFormId = async (req, res) => {
  const { formId } = req.params;
  try {
    const form = await prisma.form.findUnique({
      where: { form_id: formId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    if (!form) {
      return res
        .status(400)
        .json({ message: "Form with this ID is not exists." });
    }
    const formattedForm = {
      form_id: form.form_id,
      title: form.title,
      description: form.description,
      questions: form.questions.map((question) => ({
        question_id: question.question_id,
        title: question.question_text,
        type: question.question_type,
        isRequired: question.is_required,
        options: question.options.map((option) => ({
          option_id: option.option_id,
          title: option.option_text,
        })),
      })),
    };
    res.status(200).json(formattedForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

export const getFormDataWithUserId = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json({ message: "No user data found, user is unauthorized" });
  }
  const user_id = user.user_id;
  try {
    const form = await prisma.form.findMany({
      where: {
        user_id: user_id,
      },
      select: {
        form_id: true,
        title: true,
        description: true,
        updated_at: true,
        is_active: true,
      },
    });
    if (!form) {
      return res.status(400).json({
        message: "No forms found for this user",
      });
    }
    res.status(200).json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

export const submitForm = async (req, res) => {
  const { form_id, responses } = req.body;
  const user_id = req.user.user_id;
  const response_id = uuidv4();
  try {
    const result = await prisma.$transaction(async (prisma) => {
      const createdResponse = await prisma.response.create({
        data: {
          response_id,
          form_id,
          user_id,
        },
      });
      const createdAnswers = await prisma.responseAnswer.createMany({
        data: responses.map((answer) => ({
          response_answer_id: uuidv4(),
          response_id: createdResponse.response_id,
          question_id: answer.question_id,
          answer_text: answer.answer_text,
          option_id: answer.option_id || null,
        })),
      });
      return { createdResponse, createdAnswers };
    });

    res.status(200).json({
      message: "form submitted successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

export const getResponse = async (req, res) => {
  const { form_id } = req.params;
  const user_id = req.user.user_id;
  const existingForm = await prisma.form.findUnique({
    where: {
      form_id,
    },
  });
  if (!existingForm) {
    return res.status(404).json({
      message: "form with this id doesn't exists",
    });
  }
  if (existingForm.user_id !== user_id) {
    return res.status(403).json({
      message: "you don't have permission to access this form",
    });
  }
  try {
    const result = await prisma.$transaction(async (prisma) => {
      const questions = await prisma.question.findMany({
        where: {
          form_id: form_id,
        },
      });
      const responses = await prisma.response.findMany({
        where: {
          form_id: form_id,
        },
        include: {
          answers: true,
        },
      });
      return { questions, responses };
    });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};
