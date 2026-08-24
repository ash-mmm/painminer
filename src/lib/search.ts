import { tavily } from "@tavily/core";

import {
    generateSearchQueries,
    type GeneratedQuery,
} from "@/lib/generateQueries";

import {
    rankSearchResults,
} from "@/lib/rankSearchResults";

export type Conversation = {
    title: string;
    text: string;
    source: string;
    url: string;
};

const client = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});

export async function searchConversations(
    market: string
): Promise<Conversation[]> {
    if (!process.env.TAVILY_API_KEY) {
        throw new Error(
            "TAVILY_API_KEY is not configured"
        );
    }

    const generatedQueries =
        await generateSearchQueries(market);

    logSearchPlan(
        generatedQueries
    );

    const searchResults =
        await Promise.all(
            generatedQueries.map(
                ({ query }) =>
                    client.search(query, {
                        searchDepth: "basic",
                        maxResults: 6,
                    })
            )
        );

    const allConversations:
        Conversation[] =
        searchResults.flatMap(
            (response) =>
                response.results.map(
                    (result) => ({
                        title:
                            result.title,

                        text:
                            result.content,

                        source:
                            getSource(
                                result.url
                            ),

                        url:
                            result.url,
                    })
                )
        );

    console.log(
        `Raw search results: ${allConversations.length}`
    );

    const uniqueConversations =
        deduplicateByUrl(
            allConversations
        );

    console.log(
        `After deduplication: ${uniqueConversations.length}`
    );

    const validConversations =
        uniqueConversations.filter(
            isUsefulConversation
        );

    console.log(
        `After basic filtering: ${validConversations.length}`
    );

    const rankedConversations =
        rankSearchResults(
            validConversations
        );

    logTopRankedResults(
        rankedConversations
    );

    const usefulConversations =
        rankedConversations
            .slice(0, 30)
            .map(
                ({
                    researchScore,
                    ...conversation
                }) => conversation
            );

    console.log(
        `Conversations selected: ${usefulConversations.length}`
    );

    return usefulConversations;
}

function isUsefulConversation(
    conversation: Conversation
): boolean {
    const text =
        conversation.text.trim();

    if (text.length < 80) {
        return false;
    }

    if (!conversation.url) {
        return false;
    }

    return true;
}

function deduplicateByUrl(
    conversations: Conversation[]
): Conversation[] {
    const seenUrls =
        new Set<string>();

    return conversations.filter(
        (conversation) => {
            const normalizedUrl =
                normalizeUrl(
                    conversation.url
                );

            if (
                seenUrls.has(
                    normalizedUrl
                )
            ) {
                return false;
            }

            seenUrls.add(
                normalizedUrl
            );

            return true;
        }
    );
}

function normalizeUrl(
    url: string
): string {
    try {
        const parsedUrl =
            new URL(url);

        parsedUrl.hash = "";

        parsedUrl.searchParams.delete(
            "utm_source"
        );

        parsedUrl.searchParams.delete(
            "utm_medium"
        );

        parsedUrl.searchParams.delete(
            "utm_campaign"
        );

        parsedUrl.searchParams.delete(
            "utm_term"
        );

        parsedUrl.searchParams.delete(
            "utm_content"
        );

        return parsedUrl.toString();
    } catch {
        return url;
    }
}

function getSource(
    url: string
): string {
    try {
        const hostname =
            new URL(url).hostname;

        return hostname.replace(
            "www.",
            ""
        );
    } catch {
        return "web";
    }
}

function logSearchPlan(
    queries: GeneratedQuery[]
) {
    console.log(
        "\nGenerated search plan:"
    );

    for (
        const item of queries
    ) {
        console.log(
            `[${item.angle}] ${item.query}`
        );
    }

    console.log("");
}

function logTopRankedResults(
    conversations: ReturnType<
        typeof rankSearchResults
    >
) {
    console.log(
        "\nTop ranked search results:"
    );

    conversations
        .slice(0, 10)
        .forEach(
            (
                conversation,
                index
            ) => {
                console.log(
                    `${index + 1}. [${conversation.researchScore}] ${conversation.source} — ${conversation.title}`
                );
            }
        );

    console.log("");
}