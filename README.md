### This is my mini project with AI agent - learning purpose

## I will detail the process into 5 steps

# 1. Add Agent Instructions (persona)

You can add the **systemInstruction** field in your body request to denote the persona for it.
In this project I describe three personas: **tutor, travel, support**, and let user choose the persona they want to work with.

# 2. Add Memory (Conversational Context)

Maintain a **messages** array and append each exchange - so that we can send full message history to Gemini in every request.
Major modifications are **sessionMemory** to keep track of separate conversations for different users or browser tabs, so each session has its own chat history and context. Right now I just use default (every users would share the same conversation history).
