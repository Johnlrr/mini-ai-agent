### This is my mini project with AI agent - learning purpose

## I will detail the process into 5 steps

# 1. Add Agent Instructions (persona)

You can add the **systemInstruction** field in your body request to denote the persona for it.
In this project I describe three personas: **tutor, travel, support**, and let user choose the persona they want to work with.

# 2. Add Memory (Conversational Context)

Maintain a **messages** array and append each exchange - so that we can send full message history to Gemini in every request.
Major modifications are **sessionMemory** to keep track of separate conversations for different users or browser tabs, so each session has its own chat history and context. Right now I just use default (every users would share the same conversation history).

# 3. Add tool (Function Calling)

In this step, I let the AI call the functional tool when needed. Gemini supports **functionCalling** via `functionDeclarations`.

Main updates:

- Define `tools` with a function called `calculate`, which has a parameter `expression`.
- Pass `toolConfig` with `functionCallingConfig.mode = "AUTO"` to let Gemini decide when to use tools. (because mode AUTO is default, the AI can still understand if we don't define it)
- Check if the model returned a tool call (via `finishReason === "TOOL_CALL"`).
- Execute the tool manually in the backend and send the result back using `functionResponse`.
- Make a **second request** to Gemini with the updated context (including tool output), so it can generate a natural reply based on the result.
