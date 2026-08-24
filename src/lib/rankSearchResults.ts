import type { Conversation } from "@/lib/search";

export type RankedConversation = Conversation & {
    researchScore: number;
};

export function rankSearchResults(
    conversations: Conversation[]
): RankedConversation[] {
    return conversations
        .map((conversation) => ({
            ...conversation,
            researchScore:
                calculateResearchScore(conversation),
        }))
        .sort(
            (a, b) =>
                b.researchScore - a.researchScore
        );
}

function calculateResearchScore(
    conversation: Conversation
): number {
    const combinedText = `
    ${conversation.title}
    ${conversation.text}
  `.toLowerCase();

    let score = 0;

    score += scoreProblemLanguage(
        combinedText
    );

    score += scoreFirstHandLanguage(
        combinedText
    );

    score += scoreCommercialLanguage(
        combinedText
    );

    score += scoreOperationalLanguage(
        combinedText
    );

    score += scoreSource(
        conversation.source
    );

    score += scoreTextSpecificity(
        conversation.text
    );

    score -= scoreSeoLanguage(
        combinedText
    );

    return Math.max(
        0,
        Math.round(score)
    );
}

function scoreProblemLanguage(
    text: string
): number {
    const terms = [
        "problem",
        "frustrating",
        "frustration",
        "annoying",
        "pain",
        "issue",
        "difficult",
        "struggle",
        "struggling",
        "hate",
        "broken",
        "slow",
        "waste",
        "wasting",
        "manual",
        "repetitive",
        "tedious",
        "nightmare",
        "bottleneck",
        "inefficient",
        "time consuming",
        "time-consuming",
    ];

    return countMatches(
        text,
        terms,
        2,
        12
    );
}

function scoreFirstHandLanguage(
    text: string
): number {
    const terms = [
        "i have to",
        "i need to",
        "i spend",
        "i spent",
        "i'm spending",
        "we have to",
        "we need to",
        "we spend",
        "we spent",
        "our team",
        "our company",
        "our clients",
        "our customers",
        "every day",
        "every week",
        "every month",
        "in my experience",
        "at my company",
        "at our company",
    ];

    return countMatches(
        text,
        terms,
        3,
        15
    );
}

function scoreCommercialLanguage(
    text: string
): number {
    const terms = [
        "revenue",
        "cost",
        "costs",
        "expensive",
        "money",
        "profit",
        "sales",
        "customer",
        "customers",
        "client",
        "clients",
        "lost",
        "losing",
        "churn",
        "retention",
        "conversion",
        "invoice",
        "billing",
        "payment",
        "payments",
        "hours",
        "staff",
        "employee",
        "employees",
    ];

    return countMatches(
        text,
        terms,
        2,
        12
    );
}

function scoreOperationalLanguage(
    text: string
): number {
    const terms = [
        "workflow",
        "process",
        "spreadsheet",
        "excel",
        "email",
        "emails",
        "copy",
        "paste",
        "copying",
        "data entry",
        "enter manually",
        "scheduling",
        "schedule",
        "approval",
        "reporting",
        "compliance",
        "paperwork",
        "crm",
        "portal",
        "system",
        "software",
        "tool",
        "tools",
        "integration",
        "integrations",
        "sync",
        "duplicate",
        "duplicated",
    ];

    return countMatches(
        text,
        terms,
        2,
        14
    );
}

function scoreSeoLanguage(
    text: string
): number {
    const terms = [
        "top 10",
        "top 5",
        "best software",
        "best tools",
        "ultimate guide",
        "complete guide",
        "everything you need to know",
        "industry trends",
        "future of",
        "market trends",
        "buyer's guide",
        "buyers guide",
        "our solution",
        "book a demo",
        "request a demo",
        "contact sales",
    ];

    return countMatches(
        text,
        terms,
        4,
        20
    );
}

function scoreSource(
    source: string
): number {
    const normalizedSource =
        source.toLowerCase();

    if (
        normalizedSource.includes(
            "reddit.com"
        )
    ) {
        return 8;
    }

    if (
        normalizedSource.includes(
            "news.ycombinator.com"
        )
    ) {
        return 8;
    }

    if (
        normalizedSource.includes(
            "stackoverflow.com"
        )
    ) {
        return 6;
    }

    if (
        normalizedSource.includes(
            "stackexchange.com"
        )
    ) {
        return 6;
    }

    if (
        normalizedSource.includes(
            "quora.com"
        )
    ) {
        return 4;
    }

    return 0;
}

function scoreTextSpecificity(
    text: string
): number {
    const length =
        text.trim().length;

    if (length >= 700) {
        return 6;
    }

    if (length >= 400) {
        return 5;
    }

    if (length >= 250) {
        return 4;
    }

    if (length >= 150) {
        return 2;
    }

    if (length >= 80) {
        return 1;
    }

    return -5;
}

function countMatches(
    text: string,
    terms: string[],
    pointsPerMatch: number,
    maximumPoints: number
): number {
    let matches = 0;

    for (const term of terms) {
        if (text.includes(term)) {
            matches += 1;
        }
    }

    return Math.min(
        matches * pointsPerMatch,
        maximumPoints
    );
}