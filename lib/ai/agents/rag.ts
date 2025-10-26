import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";

/**
 * Maximum step count for the agent.
 */
const maxDuration = 5;

/**
 * Personal agent system (OpenAI + function tools only)
 */
const personalSystem = `You are a personal knowledge agent.
- Use getInformation to retrieve user-specific info from the vector store.
- If the user volunteers new personal facts, call addResource to store them immediately (no confirmation).
- Only answer using tool results. If tools return nothing relevant, reply exactly with empty string: ""`;

/**
 * Tool to add a resource to the vector store.
 */
const addResource = tool({
    description: `add a resource to your knowledge base. If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
    inputSchema: z.object({
        content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
    }),
    execute: async ({ content }) => createResource({ content }),
});

/**
 * Tool to retrieve information from the vector store.
 */
const getInformation = tool({
    description: `get information from your knowledge base to answer personal/user-related questions questions.`,
    inputSchema: z.object({
            question: z.string().describe('the users question'),
        }),
    execute: async ({ question }) => findRelevantContent(question),
});

/**
 * RAG agent — retrieve information from the vector store.
 */
export const agentRag = new Agent({
    model: 'openai/gpt-4o',
    system: personalSystem,
    tools: {
        addResource,
        getInformation,
    },
    prepareStep: async ({ stepNumber, steps }) => {
        const previousToolCalls = steps.flatMap(step => step.toolCalls);
        const previousResults = steps.flatMap(step => step.toolResults);
        console.log('[Rag Agent] Step Number: ', stepNumber);
        console.log('[Rag Agent] Previous tool calls: ', previousToolCalls.length);
        console.log('[Rag Agent] Previous results: ', previousResults.length);
        // Continue with default settings
        return {};
    },
    stopWhen: stepCountIs(maxDuration),
});
