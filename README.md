## Mini AI Agent Project (Learning Purpose)

This project demonstrates building a conversational AI agent with memory, persona, and tool (function calling) support using Gemini.

---

## Project Steps

### 1. Add Agent Instructions (Persona)

Add a **system_instruction** field in your request body to set the agent's persona. This project includes three personas: **tutor**, **travel**, and **support**. The user can choose which persona to interact with.

### 2. Add Memory (Conversational Context)

Maintain a **sessionMemory** array for each session, appending every exchange. This allows sending the full conversation history to Gemini with each request. Each session (user or browser tab) has its own chat history and context. By default, all users share the same session unless a unique sessionId is provided.

### 3. Add Tool (Function Calling)

Enable Gemini's function calling by defining tools (e.g., a `calculate` function with an `expression` parameter). The backend checks if Gemini requests a tool call, executes it, and sends the result back. A second request is made to Gemini with the tool output so it can generate a natural reply.

### 4. Add Multi-tool Support and Instructional Routing

Extend the agent with multiple tools (e.g., `getTime`, `defineWord`) and enhance the system prompt to guide Gemini on when to use each tool:

- Math question → use `calculate`
- Time question → use `getTime`
- Definition → use `defineWord`

### 5. Add Agent Routing (Auto Persona Selecting)

Support **automatic persona routing** using an internal router agent.

#### How it works:

- If the request body has a `persona`, use it.
- If not, pass the user message to a Gemini router agent.
- The router's reply determines the persona, selected dynamically via `routePersona()`.

This allows users to chat freely without choosing a persona upfront; the system adapts to the query type automatically.

> You can still manually override routing by passing `persona` in the request body.

---

## Message Exchange Flow

1. **User Sends Message**
   - Request includes: `message`, optional `sessionId`, optional `persona`.
2. **Determine Persona**
   - If `persona` provided, use it. Otherwise, Gemini routes using a system prompt (tutor, travel, support).
3. **Update Session Memory**
   - Append user message to `sessionMemory[sessionId]`.
4. **Send to Gemini**
   - Payload includes:
     - `contents`: full chat history
     - `tools`: function declarations
     - `system_instruction`: selected persona
     - `toolConfig.mode = "AUTO"`
5. **Gemini Responds**
   - Normal reply → return directly.
   - Function call → execute tool.
6. **If Tool Called**
   - Extract function name & args.
   - Run server-side function (e.g., `calculate`, `getTime`, `defineWord`).
   - Append tool call & response to memory.
7. **Gemini Continues**
   - Re-send updated memory to Gemini for final reply.
8. **Respond to User**
   - Return final reply + `routedTo` persona.
