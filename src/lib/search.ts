import { tavily } from "@tavily/core";

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
        throw new Error("TAVILY_API_KEY is not configured");
    }

    const queries = [
        `${market} problems frustrations complaints forum reddit`,
        `${market} "manual process" OR "manual work"`,
        `${market} "takes hours" OR "wastes time"`,
        `${market} "hate our software" OR "frustrating software"`,
        `${market} "wish there was" OR "there should be a tool"`,
        `${market} admin operations workflow problems`,
    ];

    const searchResults = await Promise.all(
        queries.map((query) =>
            client.search(query, {
                searchDepth: "basic",
                maxResults: 8,
            })
        )
    );

    const allConversations: Conversation[] = searchResults.flatMap(
        (response) =>
            response.results.map((result) => ({
                title: result.title,
                text: result.content,
                source: getSource(result.url),
                url: result.url,
            }))
    );

    const uniqueConversations = deduplicateByUrl(allConversations);

    const usefulConversations = uniqueConversations
        .filter((conversation) => conversation.text.trim().length > 80)
        .slice(0, 30);

    return usefulConversations;
}

function deduplicateByUrl(
    conversations: Conversation[]
): Conversation[] {
    const seenUrls = new Set<string>();

    return conversations.filter((conversation) => {
        const normalizedUrl = normalizeUrl(conversation.url);

        if (seenUrls.has(normalizedUrl)) {
            return false;
        }

        seenUrls.add(normalizedUrl);
        return true;
    });
}

function normalizeUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);

        parsedUrl.hash = "";

        parsedUrl.searchParams.delete("utm_source");
        parsedUrl.searchParams.delete("utm_medium");
        parsedUrl.searchParams.delete("utm_campaign");

        return parsedUrl.toString();
    } catch {
        return url;
    }
}

function getSource(url: string): string {
    try {
        const hostname = new URL(url).hostname;

        return hostname.replace("www.", "");
    } catch {
        return "web";
    }
}