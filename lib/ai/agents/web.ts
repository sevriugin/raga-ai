import { Experimental_Agent as Agent } from 'ai';
import { google } from '@ai-sdk/google';
import { getUserPromptFromModelMessages } from "@/lib/utils/get-user-prompt";
import { findRelevantContent } from "@/lib/ai/embedding";

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
    prepareStep: async ({ stepNumber, messages, steps }) => {
        const previousToolCalls = steps.flatMap(step => step.toolCalls);
        const previousResults = steps.flatMap(step => step.toolResults);
        console.log(`[Web Agent] Step Number: ${stepNumber} previous tool calls/results: ${previousToolCalls.length}/${previousResults.length}` );

        /**
         * Add user-related context
         */
        const userPrompt = getUserPromptFromModelMessages(messages);
        console.log('[Web Agent] Prompt: ', userPrompt);
        const context = await findRelevantContent(userPrompt);
        if (context.length > 0) {
            console.log('[Web Agent] Most relevant context is found:', context[0].content);
            const system = `${webSystem}\n Use user related context to refine search ${context[0].content}`
            return { system }
        }
        // Continue with default settings
        return {};
    },
});
