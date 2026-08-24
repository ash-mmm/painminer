export function calculateFrequencyScore(
    supportingConversationCount: number,
    totalConversationCount: number
): number {
    if (totalConversationCount === 0) {
        return 0;
    }

    const ratio =
        supportingConversationCount / totalConversationCount;

    if (ratio >= 0.30) return 10;
    if (ratio >= 0.25) return 9;
    if (ratio >= 0.20) return 8;
    if (ratio >= 0.15) return 7;
    if (ratio >= 0.12) return 6;
    if (ratio >= 0.10) return 5;
    if (ratio >= 0.07) return 4;
    if (ratio >= 0.05) return 3;
    if (ratio >= 0.03) return 2;

    return 1;
}

export function calculateSeverityScore(
    severityValues: number[]
): number {
    if (severityValues.length === 0) {
        return 0;
    }

    const average =
        severityValues.reduce(
            (sum, severity) => sum + severity,
            0
        ) / severityValues.length;

    return Math.round(average * 10) / 10;
}

export function calculateEvidenceScore(
    supportingConversationCount: number,
    uniqueSourceCount: number
): number {
    let conversationScore = 0;

    if (supportingConversationCount >= 8) {
        conversationScore = 6;
    } else if (supportingConversationCount >= 6) {
        conversationScore = 5;
    } else if (supportingConversationCount >= 4) {
        conversationScore = 4;
    } else if (supportingConversationCount >= 3) {
        conversationScore = 3;
    } else if (supportingConversationCount >= 2) {
        conversationScore = 2;
    } else if (supportingConversationCount >= 1) {
        conversationScore = 1;
    }

    let sourceScore = 0;

    if (uniqueSourceCount >= 4) {
        sourceScore = 4;
    } else if (uniqueSourceCount === 3) {
        sourceScore = 3;
    } else if (uniqueSourceCount === 2) {
        sourceScore = 2;
    } else if (uniqueSourceCount === 1) {
        sourceScore = 1;
    }

    return Math.min(
        10,
        conversationScore + sourceScore
    );
}