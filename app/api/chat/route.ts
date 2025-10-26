import { convertToModelMessages, streamText, UIMessage, stepCountIs } from 'ai';
import { agentRag, agentWeb, classify } from '@/lib/ai/agents';
import { getUserPrompt } from '@/lib/utils/get-user-prompt';

const model = 'openai/gpt-4o';

const system_message = `You are a helpful agent that works with other 2 agents providing personal knowledge via RAG, web search. You also process user queries if the agents dont provide any response`

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const query = getUserPrompt(messages);

    const classification = await classify(query);
    console.log('[Chat] Classification: ', classification);

    if (classification === 'personal' || classification === 'add') {
        return agentRag.stream({ prompt: query }).toUIMessageStreamResponse()
    } else if (classification === 'web') {
        return agentWeb.stream({ prompt: query }).toUIMessageStreamResponse()
    }

    return streamText({
        model,
        system: system_message,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
    }).toUIMessageStreamResponse();
}
