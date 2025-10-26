import { generateObject } from 'ai';

const model = 'openai/gpt-4o';

export const classify = async ( query: string) => {
    let classification = 'other';
    try {
        const { object: result } = await generateObject({
            model,
            output: 'enum',
            enum: ['personal', 'add', 'web', 'other'],
            prompt: `Classify the type user query:
            ${query}

            Determine:
            1. Query type (personal, add, web, or other)
                - personal: user is asking about personal information, like "What is my favorite food?";
                - add: the user provides a random piece of knowledge unprompted, like user said "My favorite food is pizza";
                - web: user is seeking up-to-date factual information that would be found through a web search, like "What is the current president of the United States?" or "What is the weather in Paris?";
                - other: user is asking about other information, like "What is the meaning of life?" or "What is the capital of France?";`,
        });
        classification = result;
    } catch (error) {
        console.error('[Chat] Error during classification:', error);
    }
    return classification;
}
