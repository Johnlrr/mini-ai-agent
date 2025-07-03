// Load environment variables from .env file
require("dotenv").config();

// Import required modules
const express = require("express"); // Express framework for server
const bodyParser = require("body-parser"); // Middleware to parse JSON bodies
const { evaluate } = require("mathjs"); // FIX: Make sure this is required

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
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
  GOOGLE_API_KEY;

const personas = {
  tutor:
    "You're a helpful and patient programming tutor. Explain concepts clearly with JavaScript examples.",
  travel:
    "You're a cheerful assistant helping users plan trips and give travel advice.",
  support:
    "You're a professional support agent. Answer questions clearly and politely.",
};

const tools = [
  {
    functionDeclarations: [
      // FIX 2: Nest functionDeclarations inside a tools array
      {
        name: "calculate",
        description:
          "Use this function to solve any mathematical calculation or expression requested by the user. It can handle addition, subtraction, multiplication, and division.",
        parameters: {
          type: "OBJECT", // Use uppercase for types in REST API
          properties: {
            expression: {
              type: "STRING",
              description:
                "A math expression to evaluate, like '2 + 3 * (4 - 1)'",
            },
          },
          required: ["expression"],
        },
      },
    ],
  },
];

const sessionMemory = {}; // { sessionId: [contents...] }

// Route to handle chat requests from the client
app.post("/chat", async (req, res) => {
  const { message, sessionId = "default", persona = "tutor" } = req.body;
  const systemInstruction = personas[persona] || personas.tutor;

  if (!sessionMemory[sessionId]) {
    sessionMemory[sessionId] = [];
  }

  // Append user message
  sessionMemory[sessionId].push({
    role: "user",
    parts: [{ text: message }],
  });

  const requestBody = {
    contents: sessionMemory[sessionId],
    tools: tools,
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
    toolConfig: {
      functionCallingConfig: {
        mode: "AUTO", // Can be "ANY", "AUTO", or "NONE". "ANY" forces a tool call.
      },
    },
  };

  try {
    const firstResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await firstResponse.json();
    //console.log("Gemini API response:", JSON.stringify(data, null, 2));
    const candidate = data.candidates?.[0];
    //console.log("Candidate:", JSON.stringify(candidate, null, 2));
    //const toolCall = candidate?.content?.parts?.[0]?.functionCall;

    // Check if the model stopped to call a function
    if (candidate?.finishReason === "TOOL_CALL") {
      const toolCall = candidate.content.parts[0].functionCall;
      const { name, args } = toolCall;

      let toolResultContent;

      if (name === "calculate") {
        try {
          // FIX 4: Use a safe evaluator instead of eval()
          const result = evaluate(args.expression);
          toolResultContent = result.toString();
        } catch (err) {
          toolResultContent = "Invalid mathematical expression.";
        }
      } else {
        toolResultContent = "Tool not found.";
      }

      // Append the model's tool call request to memory
      sessionMemory[sessionId].push(candidate.content);

      // FIX 3: Append the tool execution result using the correct functionResponse format
      sessionMemory[sessionId].push({
        role: "tool", // Note: The role is 'tool' for the response
        parts: [
          {
            functionResponse: {
              name: name,
              response: {
                content: toolResultContent,
              },
            },
          },
        ],
      });

      // Call Gemini again with the tool's result
      const secondRequestBody = {
        contents: sessionMemory[sessionId],
        tools: tools,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      };

      const secondResponse = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(secondRequestBody),
      });

      const secondData = await secondResponse.json();
      const finalReply =
        secondData.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I was unable to process the result.";

      sessionMemory[sessionId].push({
        role: "model",
        parts: [{ text: finalReply }],
      });

      return res.json({ reply: finalReply });
    }

    // No tool call, just a normal reply
    const reply = candidate?.content?.parts?.[0]?.text || "No reply.";
    sessionMemory[sessionId].push({
      role: "model",
      parts: [{ text: reply }],
    });

    res.json({ reply });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ reply: "Server error." });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
