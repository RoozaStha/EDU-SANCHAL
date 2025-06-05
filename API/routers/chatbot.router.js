const express = require("express");
const router = express.Router();

// Simulate a knowledge base or connect to OpenAI/GPT endpoint
const knowledgeBase = {
  "how to mark attendance": "To mark attendance, go to the dashboard, select class, and click on 'Take Attendance'.",
  "how to apply leave": "You can apply for leave under the 'Leave Request' section in your profile."
};

router.post("/", async (req, res) => {
  const { message } = req.body;
  const key = message.toLowerCase().trim();
  const response = knowledgeBase[key] || "I'm sorry, I don't understand that question yet.";
  res.json({ response });
});

module.exports = router;
