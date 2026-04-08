const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Harry Physics API is ready for lessons, simulations, and quizzes.",
    timestamp: new Date().toISOString(),
    modules: ["lessons", "kinematics", "quiz-feedback"],
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
