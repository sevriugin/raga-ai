import { convertToModelMessages, UIMessage, TextPart, ModelMessage } from 'ai';

/**
 * Get the last user message from the message array.
 * @param messages
 */
export const getUserPrompt = (messages: UIMessage[]) => {
    return getUserPromptFromModelMessages(convertToModelMessages(messages));
}

export const getUserPromptFromModelMessages = (messages: ModelMessage[]): string => {
    const lastUser = [...messages]
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
