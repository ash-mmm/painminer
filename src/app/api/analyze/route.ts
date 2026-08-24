import { searchConversations } from "@/lib/search";
import { analyzeConversations } from "@/lib/analyze";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const market = body.market;

        if (!market) {
            return Response.json(
                { error: "Market is required" },
                { status: 400 }
            );
        }

        const conversations = await searchConversations(market);

        const pains = await analyzeConversations(
            market,
            conversations
        );

        return Response.json({
            market,
            conversationsAnalyzed: conversations.length,
            pains,
        });
    } catch (error) {
        console.error("Analysis failed:", error);

        return Response.json(
            { error: "Analysis failed" },
            { status: 500 }
        );
    }
}