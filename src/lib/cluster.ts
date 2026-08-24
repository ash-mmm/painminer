import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type { ExtractedPain } from "@/lib/extract";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ClusterSchema = z.object({
    title: z.string(),
    description: z.string(),
    painIndexes: z.array(z.number()).min(1),
});

const ClusteringSchema = z.object({
    clusters: z.array(ClusterSchema),
});

export type PainCluster = z.infer<typeof ClusterSchema>;

export async function clusterPains(
    market: string,
    pains: ExtractedPain[]
): Promise<PainCluster[]> {
    const painText = pains
        .map(
            (pain, index) => `
Pain ${index}

Problem: ${pain.problem}
Description: ${pain.description}
Conversation index: ${pain.conversationIndex}
Severity: ${pain.severity}/10
`
        )
        .join("\n");

    const response = await openai.responses.parse({
        model: "gpt-5.6-luna",

        input: [
            {
                role: "system",
                content: `
You cluster individual customer pain points into recurring underlying problems.

Your job is to identify when different complaints are actually manifestations
of the same underlying problem.

Do not create startup ideas.
Do not invent pains.
Do not merge genuinely different problems merely because they occur in the same industry.

Prefer specific operational clusters over vague categories.

Bad cluster:
"Business problems"

Good cluster:
"Manual candidate data entry across ATS and CRM systems"
`,
            },
            {
                role: "user",
                content: `
Market: "${market}"

Group the following extracted pains into recurring underlying problems.

For every cluster return:

- title: concise recurring problem
- description: what the common underlying pain is
- painIndexes: EXACT indexes of the extracted pains belonging to this cluster

PAINS:

${painText}
`,
            },
        ],

        text: {
            format: zodTextFormat(
                ClusteringSchema,
                "pain_clustering"
            ),
        },
    });

    const result = response.output_parsed;

    if (!result) {
        throw new Error("Pain clustering failed");
    }

    return result.clusters;
}