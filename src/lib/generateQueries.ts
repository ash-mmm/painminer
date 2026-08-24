import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SearchQuerySchema = z.object({
    angle: z.enum([
        "manual_work",
        "software",
        "revenue",
        "customer_acquisition",
        "scheduling",
        "payments",
        "compliance",
        "data",
        "communication",
        "retention",
    ]),

    query: z.string(),
});

const SearchPlanSchema = z.object({
    queries: z
        .array(SearchQuerySchema)
        .min(8)
        .max(10),
});

export type GeneratedQuery = z.infer<
    typeof SearchQuerySchema
>;

export async function generateSearchQueries(
    market: string
): Promise<GeneratedQuery[]> {
    try {
        const response =
            await openai.responses.parse({
                model: "gpt-5.6-luna",

                input: [
                    {
                        role: "system",
                        content: `
You are designing web searches for startup customer research.

Your job is NOT to find startup ideas.

Your job is to create search queries that are likely to uncover
first-hand or concrete evidence of operational and commercial
problems experienced by people in a specific market.

Good evidence includes people describing:

- repetitive manual work
- wasted employee time
- broken workflows
- frustrating software
- duplicated data entry
- scheduling problems
- payment problems
- compliance burden
- customer acquisition problems
- customer retention problems
- communication failures
- lost revenue
- operational bottlenecks
- workarounds
- processes that take hours
- things they wish were automated

Prefer searches likely to surface:

- forums
- Reddit discussions
- practitioner communities
- professional discussions
- support discussions
- first-hand complaints

Avoid generic SEO-style research such as:

"top challenges facing X"
"trends in X"
"future of X"
"best software for X"

The queries should search for evidence of people actually
experiencing problems.
`,
                    },

                    {
                        role: "user",
                        content: `
Market:

"${market}"

Generate between 8 and 10 distinct search queries.

Cover different research angles rather than repeating
the same problem with slightly different wording.

Use these angles where relevant:

- manual_work
- software
- revenue
- customer_acquisition
- scheduling
- payments
- compliance
- data
- communication
- retention

Make each query specific to the language and workflows
likely to exist in this market.

Every query should include enough context that a web
search engine understands the target profession or market.

Prefer queries that could reveal first-hand pain.

Example for recruitment agencies:

"recruiters manually entering candidate data ATS CRM forum"

is better than:

"recruitment industry challenges"

Do not generate startup ideas.
Only generate research queries.
`,
                    },
                ],

                text: {
                    format: zodTextFormat(
                        SearchPlanSchema,
                        "search_plan"
                    ),
                },
            });

        const result =
            response.output_parsed;

        if (!result) {
            throw new Error(
                "Query generation returned no result"
            );
        }

        return result.queries;
    } catch (error) {
        console.error(
            "Dynamic query generation failed. Using fallback queries:",
            error
        );

        return getFallbackQueries(market);
    }
}

function getFallbackQueries(
    market: string
): GeneratedQuery[] {
    return [
        {
            angle: "manual_work",
            query: `${market} manual work repetitive admin forum reddit`,
        },
        {
            angle: "software",
            query: `${market} frustrating software problems forum reddit`,
        },
        {
            angle: "revenue",
            query: `${market} losing revenue operational problems forum`,
        },
        {
            angle: "customer_acquisition",
            query: `${market} customer acquisition problems leads forum`,
        },
        {
            angle: "scheduling",
            query: `${market} scheduling problems appointments admin forum`,
        },
        {
            angle: "payments",
            query: `${market} payment invoicing billing problems forum`,
        },
        {
            angle: "compliance",
            query: `${market} compliance paperwork reporting burden forum`,
        },
        {
            angle: "data",
            query: `${market} data entry duplicate information workflow forum`,
        },
        {
            angle: "communication",
            query: `${market} communication email coordination problems forum`,
        },
        {
            angle: "retention",
            query: `${market} customer retention churn problems forum`,
        },
    ];
}