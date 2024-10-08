import cors from "cors";
import express from "express";
import router from "./routes/router.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello, JavaScript with Express!");
});

app.use("/api/v1", router);

app
  .listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  })
  .on("error", (error) => {
    console.error(error);
  });
