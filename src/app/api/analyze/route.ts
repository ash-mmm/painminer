import { searchConversations } from "@/lib/search";
import { extractPains } from "@/lib/extract";
import { clusterPains } from "@/lib/cluster";
import { analyzeClusters } from "@/lib/analyze";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const market = body.market;

        if (!market || !market.trim()) {
            return Response.json(
                {
                    error: "Market is required",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(`Searching market: ${market}`);

        const conversations =
            await searchConversations(market);

        console.log(
            `Found ${conversations.length} conversations`
        );

        const extractedPains = await extractPains(
            market,
            conversations
        );

        console.log(
            `Extracted ${extractedPains.length} individual pains`
        );

        const clusters = await clusterPains(
            market,
            extractedPains
        );

        console.log(
            `Created ${clusters.length} pain clusters`
        );

        const pains = await analyzeClusters(
            market,
            clusters,
            extractedPains,
            conversations
        );

        console.log(
            `Selected ${pains.length} business opportunities`
        );

        return Response.json({
            market,

            conversationsAnalyzed:
                conversations.length,

            individualPainsExtracted:
                extractedPains.length,

            clustersFound:
                clusters.length,

            pains,
        });
    } catch (error) {
        console.error(
            "Analysis failed:",
            error
        );

        return Response.json(
            {
                error: "Analysis failed",
            },
            {
                status: 500,
            }
        );
    }
}