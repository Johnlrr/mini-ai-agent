// Load environment variables from .env file
require("dotenv").config();

// Import required modules
const express = require("express"); // Express framework for server
const bodyParser = require("body-parser"); // Middleware to parse JSON bodies

// Create an Express application
const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Set the port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Get Google API key from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Gemini API endpoint with API key
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
  GOOGLE_API_KEY;

const personas = {
  tutor:
    "You're a helpful and patient programming tutor. Explain concepts clearly with JavaScript examples.",
  travel:
    "You're a cheerful assistant helping users plan trips and give travel advice.",
  support:
    "You're a professional support agent. Answer questions clearly and politely.",
};

// Route to handle chat requests from the client
app.post("/chat", async (req, res) => {
  // Extract user's message from the request body
  const userMessage = req.body.message;
  const { message, persona = "tutor" } = req.body;
  const systemInstruction = personas[persona] || personas.tutor;

  // Prepare the request body for Gemini API
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
  };

  try {
    // Send POST request to Gemini API
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // If Gemini API returns an error, log and respond with error
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error response:", errorText);
      return res.status(500).json({ reply: "Gemini API error." });
    }

    // Parse the response from Gemini API
    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    // Extract the reply text from the Gemini API response
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply.";

    // Send the reply back to the client
    res.json({ reply });
  } catch (err) {
    // Handle network or server errors
    console.error("❌ Fetch failed:", err.message);
    res.status(500).json({ reply: "Server error." });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
