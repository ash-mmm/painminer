import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

import type { Conversation } from "@/lib/search";
import type { ExtractedPain } from "@/lib/extract";
import type { PainCluster } from "@/lib/cluster";

import {
    calculateFrequencyScore,
    calculateSeverityScore,
    calculateEvidenceScore,
} from "@/lib/scoring";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const EvidenceSchema = z.object({
    text: z.string(),
    source: z.string(),
    url: z.string(),
});

const EvaluatedClusterSchema = z.object({
    clusterIndex: z.number(),

    willingnessToPayScore: z.number().min(0).max(10),
    automationFitScore: z.number().min(0).max(10),

    evidence: z.array(EvidenceSchema).min(1).max(3),

    opportunity: z.string(),
    customer: z.string(),
    whyTheyWouldPay: z.string(),
    validationExperiment: z.string(),
});

const AnalysisSchema = z.object({
    clusters: z.array(EvaluatedClusterSchema),
});

export type Pain = {
    title: string;
    description: string;

    score: number;

    frequencyScore: number;
    severityScore: number;
    willingnessToPayScore: number;
    automationFitScore: number;
    evidenceScore: number;

    supportingConversations: number;
    uniqueSources: number;

    evidence: {
        text: string;
        source: string;
        url: string;
    }[];

    opportunity: string;
    customer: string;
    whyTheyWouldPay: string;
    validationExperiment: string;
};

export async function analyzeClusters(
    market: string,
    clusters: PainCluster[],
    extractedPains: ExtractedPain[],
    conversations: Conversation[]
): Promise<Pain[]> {
    const clusterMetadata = clusters.map(
        (cluster, clusterIndex) => {
            const conversationIndexes =
                new Set<number>();

            const sources =
                new Set<string>();

            const severityValues: number[] = [];

            for (const painIndex of cluster.painIndexes) {
                const pain = extractedPains[painIndex];

                if (!pain) {
                    continue;
                }

                conversationIndexes.add(
                    pain.conversationIndex
                );

                severityValues.push(
                    pain.severity
                );

                const conversation =
                    conversations[pain.conversationIndex];

                if (conversation) {
                    sources.add(
                        conversation.source
                    );
                }
            }

            const supportingConversations =
                conversationIndexes.size;

            const uniqueSources =
                sources.size;

            const frequencyScore =
                calculateFrequencyScore(
                    supportingConversations,
                    conversations.length
                );

            const severityScore =
                calculateSeverityScore(
                    severityValues
                );

            const evidenceScore =
                calculateEvidenceScore(
                    supportingConversations,
                    uniqueSources
                );

            return {
                clusterIndex,
                supportingConversations,
                uniqueSources,
                frequencyScore,
                severityScore,
                evidenceScore,
            };
        }
    );

    const clusterText = clusters
        .map((cluster, clusterIndex) => {
            const metadata =
                clusterMetadata[clusterIndex];

            const members = cluster.painIndexes
                .map((painIndex) => {
                    const pain =
                        extractedPains[painIndex];

                    if (!pain) {
                        return null;
                    }

                    const conversation =
                        conversations[
                        pain.conversationIndex
                        ];

                    if (!conversation) {
                        return null;
                    }

                    return `
Pain index: ${painIndex}
Problem: ${pain.problem}
Severity: ${pain.severity}/10

Evidence:
${conversation.text}

Source: ${conversation.source}
URL: ${conversation.url}
`;
                })
                .filter(Boolean)
                .join("\n");

            return `
CLUSTER ${clusterIndex}

Title:
${cluster.title}

Description:
${cluster.description}

Supporting conversations:
${metadata.supportingConversations}

Unique sources:
${metadata.uniqueSources}

Frequency score:
${metadata.frequencyScore}/10

Severity score:
${metadata.severityScore}/10

Evidence score:
${metadata.evidenceScore}/10

MEMBERS:

${members}
`;
        })
        .join("\n\n");

    const response =
        await openai.responses.parse({
            model: "gpt-5.6-luna",

            input: [
                {
                    role: "system",
                    content: `
You are an expert startup researcher.

Frequency, severity, and evidence quality
have already been calculated by software.

DO NOT recalculate or modify them.

Your task is to assess the remaining
commercial dimensions of each pain cluster.

Do not invent evidence.
`,
                },

                {
                    role: "user",
                    content: `
Market: "${market}"

Evaluate the clusters below.

For each commercially meaningful cluster return:

clusterIndex:
The EXACT cluster number supplied.

willingnessToPayScore:
0-10 based on how likely a clear customer
would be to pay to solve the problem.

automationFitScore:
0-10 based on how suitable the problem is
for software, AI, automation, or a scalable service.

Also provide:

- 1 to 3 evidence items
- concrete business opportunity
- likely paying customer
- why they would pay
- cheap validation experiment

Do NOT provide:

- frequencyScore
- severityScore
- evidenceScore

Those are calculated separately by software.

Prefer commercially meaningful problems involving:

- employee time
- costs
- revenue
- errors
- risk
- repeated administrative work
- inefficient software
- operational bottlenecks

CLUSTERS:

${clusterText}
`,
                },
            ],

            text: {
                format: zodTextFormat(
                    AnalysisSchema,
                    "business_analysis"
                ),
            },
        });

    const result =
        response.output_parsed;

    if (!result) {
        throw new Error(
            "Business analysis failed"
        );
    }

    const pains: Pain[] =
        result.clusters
            .map((evaluation) => {
                const cluster =
                    clusters[
                    evaluation.clusterIndex
                    ];

                const metadata =
                    clusterMetadata[
                    evaluation.clusterIndex
                    ];

                if (!cluster || !metadata) {
                    return null;
                }

                const finalScore =
                    metadata.frequencyScore * 2.5 +
                    metadata.severityScore * 2.5 +
                    evaluation.willingnessToPayScore * 2 +
                    evaluation.automationFitScore * 1.5 +
                    metadata.evidenceScore * 1.5;

                return {
                    title:
                        cluster.title,

                    description:
                        cluster.description,

                    score:
                        Math.round(finalScore),

                    frequencyScore:
                        metadata.frequencyScore,

                    severityScore:
                        metadata.severityScore,

                    willingnessToPayScore:
                        evaluation.willingnessToPayScore,

                    automationFitScore:
                        evaluation.automationFitScore,

                    evidenceScore:
                        metadata.evidenceScore,

                    supportingConversations:
                        metadata.supportingConversations,

                    uniqueSources:
                        metadata.uniqueSources,

                    evidence:
                        evaluation.evidence,

                    opportunity:
                        evaluation.opportunity,

                    customer:
                        evaluation.customer,

                    whyTheyWouldPay:
                        evaluation.whyTheyWouldPay,

                    validationExperiment:
                        evaluation.validationExperiment,
                };
            })
            .filter(
                (pain): pain is Pain =>
                    pain !== null
            );

    return pains
        .sort(
            (a, b) =>
                b.score - a.score
        )
        .slice(0, 5);
}