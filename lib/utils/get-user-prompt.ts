import { convertToModelMessages, UIMessage, TextPart } from 'ai';

/**
 * Get the last user message from the message array.
 * @param messages
 */
export const getUserPrompt = (messages: UIMessage[]) => {
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
