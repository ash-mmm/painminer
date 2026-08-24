import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type { Conversation } from "@/lib/search";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const EvidenceSchema = z.object({
    text: z.string(),
    source: z.string(),
    url: z.string(),
});

const PainSchema = z.object({
    title: z.string(),

    description: z.string(),

    score: z.number().min(0).max(100),

    evidence: z.array(EvidenceSchema).min(1).max(3),

    opportunity: z.string(),

    customer: z.string(),

    whyTheyWouldPay: z.string(),

    validationExperiment: z.string(),
});

const PainAnalysisSchema = z.object({
    pains: z.array(PainSchema).min(3).max(5),
});

export type Pain = z.infer<typeof PainSchema>;

export async function analyzeConversations(
    market: string,
    conversations: Conversation[]
): Promise<Pain[]> {
    const conversationText = conversations
        .map(
            (conversation, index) => `
Conversation ${index + 1}

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
You are an expert startup researcher looking for commercially valuable
problems that could become products or businesses.

Your goal is NOT simply to summarize complaints.

Your goal is to identify problems where:

- a clear customer exists
- the problem costs time, money, revenue, or operational efficiency
- the problem occurs repeatedly
- existing solutions appear inadequate
- someone could realistically pay for a better solution

Prefer business and professional problems over vague consumer dissatisfaction.

Every piece of evidence MUST correspond to one of the supplied conversations.

When returning evidence:

- copy or closely paraphrase the relevant evidence
- return the exact Source field from that conversation
- return the exact URL field from that conversation

Never invent URLs.
Never invent sources.
Do not use a URL from one conversation to support evidence from another.
`,
            },

            {
                role: "user",
                content: `
Analyze the following conversations related to the market:

"${market}"

Identify between 3 and 5 problems potentially worth building a business around.

Prioritize problems involving:

- repetitive manual work
- administrative overhead
- revenue loss
- expensive workflows
- staff time
- fragmented tools
- poor software
- compliance or reporting burden
- customer acquisition
- customer retention
- scheduling
- communication
- operational inefficiency
- data entry
- payments
- approvals
- coordination between systems or people

Avoid prioritizing problems merely because they are emotionally unpleasant.

For example:

"Patients are scared of dentists"

is generally less commercially attractive than:

"Dental practices lose revenue because patients fail to attend appointments"

unless there is a clear paying customer and business mechanism.

For every problem provide:

1. A concise title.

2. A clear description of the recurring problem.

3. A score from 0 to 100.

The score should reflect:

- 25% severity / cost
- 25% frequency
- 20% likelihood someone would pay
- 15% suitability for software or automation
- 15% evidence strength

4. Between 1 and 3 pieces of evidence.

For EACH piece of evidence return:

- text: the relevant evidence
- source: EXACTLY the Source provided in the conversation
- url: EXACTLY the URL provided in the conversation

5. A concrete business opportunity.

Avoid generic ideas such as:

"An AI platform for dentists."

Prefer specific ideas such as:

"Software that automatically prepares insurance claim documentation
from patient records for independent dental practices."

6. The most likely paying customer.

7. Why that customer would pay.

Connect this to:

- employee hours saved
- additional revenue
- reduced costs
- fewer errors
- better retention
- reduced operational risk

8. A cheap validation experiment that can be performed BEFORE building
the product.

Only use information supported by the supplied conversations.

CONVERSATIONS:

${conversationText}
`,
            },
        ],

        text: {
            format: zodTextFormat(
                PainAnalysisSchema,
                "pain_analysis"
            ),
        },
    });

    const result = response.output_parsed;

    if (!result) {
        throw new Error(
            "OpenAI did not return a valid structured response"
        );
    }

    return result.pains;
}