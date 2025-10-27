import {embed, embedMany} from 'ai';
import {openai} from '@ai-sdk/openai';
import {db} from '../db';
import {cosineDistance, desc, eq, gt, sql} from 'drizzle-orm';
import {embeddings} from '../db/schema/embeddings';
import {resources} from '../db/schema/resources';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string): string[] => {
    return input
        .trim()
        .split('.')
        .filter(i => i !== '');
};

export const generateEmbeddings = async (
    value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
    const chunks = generateChunks(value);
    const {embeddings} = await embedMany({
        model: embeddingModel,
        values: chunks,
    });
    return embeddings.map((e, i) => ({content: chunks[i], embedding: e}));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll('\\n', ' ');
    const {embedding} = await embed({
        model: embeddingModel,
        value: input,
    });
    return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
    const userQueryEmbedded = await generateEmbedding(userQuery);

    // similarity between a query and an embedding row
    const rowSimilarity = sql<number>`1 - (
        ${cosineDistance(embeddings.embedding, userQueryEmbedded)}
    )`;

    // we want max similarity per resource across its embeddings
    const maxSimilarity = sql<number>`max(${rowSimilarity})`;

    return db
        .select({
            content: resources.content,
            similarity: maxSimilarity,
        })
        .from(resources)
        .innerJoin(embeddings, eq(embeddings.resourceId, resources.id))
        .groupBy(resources.id)
        .having(gt(maxSimilarity, 0.5))
        .orderBy(desc(maxSimilarity))
        .limit(4);
};
