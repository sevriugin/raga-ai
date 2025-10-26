import { Experimental_Agent as Agent } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * Web agent system (Gemini + google_search tool only)
 */
const webSystem = `You are a web search agent using Google Search.
- Use google_search to find relevant public information.
- Only answer using search results. If insufficient, reply exactly: "Sorry, I don't know."`;

/**
 * RAG agent — retrieve information from the vector store.
 */
export const agentWeb = new Agent({
    model: 'google/gemini-2.5-flash',
    system: webSystem,
    tools: {
        google_search: google.tools.googleSearch({}),
    },
    prepareStep: async ({ stepNumber, steps }) => {
        const previousToolCalls = steps.flatMap(step => step.toolCalls);
        const previousResults = steps.flatMap(step => step.toolResults);
        console.log('[Web Agent] Step Number: ', stepNumber);
        console.log('[Web Agent] Previous tool calls: ', previousToolCalls.length);
        console.log('[Web Agent] Previous results: ', previousResults.length);
        // Continue with default settings
        return {};
    },
});
