import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type { Conversation } from "@/lib/search";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ExtractedPainSchema = z.object({
    problem: z.string(),
    description: z.string(),
    conversationIndex: z.number(),
    severity: z.number().min(1).max(10),
});

const ExtractionSchema = z.object({
    pains: z.array(ExtractedPainSchema),
});

export type ExtractedPain = z.infer<typeof ExtractedPainSchema>;

export async function extractPains(
    market: string,
    conversations: Conversation[]
): Promise<ExtractedPain[]> {
    const conversationText = conversations
        .map(
            (conversation, index) => `
Conversation ${index}

Title: ${conversation.title}
Text: ${conversation.text}
Source: ${conversation.source}
URL: ${conversation.url}
`
        )
        .join("\n");

    const response = await openai.responses.parse({
        model: "gpt-5.6-luna",

        input: [
            {
                role: "system",
                content: `
You extract concrete customer and business pain points from online conversations.

At this stage, do NOT:
- generate startup ideas
- cluster similar pains
- estimate willingness to pay
- invent problems
- rank business opportunities

Your only job is to identify specific pains explicitly supported by the supplied conversations.

A pain should describe a concrete undesirable situation such as:
- repetitive manual work
- wasted employee time
- software frustration
- administrative burden
- errors
- lost revenue
- delays
- poor coordination
- duplicated work
- compliance burden
- payment problems
- scheduling problems
- customer acquisition problems
- customer retention problems

Ignore generic opinions that do not describe a meaningful problem.
`,
            },
            {
                role: "user",
                content: `
Market: "${market}"

Extract individual pain points from these conversations.

For every pain:

- problem: short, specific description
- description: what is actually going wrong
- conversationIndex: EXACT index of the conversation supporting it
- severity: 1 to 10 based only on how serious the problem appears in that conversation

A single conversation may contain more than one pain.

Multiple conversations may describe similar pains.
DO NOT merge them yet.

CONVERSATIONS:

${conversationText}
`,
            },
        ],

        text: {
            format: zodTextFormat(
                ExtractionSchema,
                "pain_extraction"
            ),
        },
    });

    const result = response.output_parsed;

    if (!result) {
        throw new Error("Pain extraction failed");
    }

    return result.pains;
}