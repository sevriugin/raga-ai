import { createResource } from '@/lib/actions/resources';
import { openai } from '@ai-sdk/openai';
import {
    convertToModelMessages,
    streamText,
    tool,
    UIMessage,
    stepCountIs,
    TextPart,
} from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';
import { agentRag, agentWeb, classify } from '@/lib/ai/agents';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const system_messages = [
    `You are a helpful assistant. Check your knowledge base before answering any questions. Only respond to questions using information from tool calls. if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    `You are a helpful assistant. Check your knowledge base before answering questions about the user. For, example, if user asked "What is my favorite food?" For the user related questions only respond to them using information from tool calls. if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`
]

/**
 * Get the last user message from the message array.
 * @param messages
 */
const getUserPrompt = (messages: UIMessage[]) => {
    const lastUser = [...convertToModelMessages(messages)]
        .reverse()
        .find(m => m.role === 'user');

    const content = lastUser?.content;
    if (!content) return '';

    if (typeof content === 'string') return content;

    if (Array.isArray(content)) {
        return content
            .filter((c): c is TextPart => 'text' in c)
            .map(p => p.text)
            .join('');
    }

    return '';
}

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const query = getUserPrompt(messages);

    console.log('[Chat] User prompt: ', query);

    /**
     * First step: Classify the query type
     */
    let classification = await classify(query);

    console.log('[Chat] Classification: ', classification);

    let agentResult;

    if (classification === 'personal' || classification === 'add') {
        agentResult = await agentRag.generate({ prompt: query })
    } else if (classification === 'web') {
        agentResult = await agentWeb.generate({ prompt: query })
    }
    console.log('[Chat] Agent Result: ', agentResult?.text);

    const result = streamText({
        model: openai('gpt-4o'),
        system: system_messages[1],
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        tools: {
            addResource: tool({
                description: `add a resource to your knowledge base. If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
                inputSchema: z.object({
                    content: z
                        .string()
                        .describe('the content or resource to add to the knowledge base'),
                }),
                execute: async ({ content }) => createResource({ content }),
            }),
            getInformation: tool({
                description: `get information from your knowledge base to answer questions.`,
                inputSchema: z.object({
                    question: z.string().describe('the users question'),
                }),
                execute: async ({ question }) => findRelevantContent(question),
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}
