/**
 * Boolean logic matcher utility
 * Implements OR logic for searchTerms and NOT logic for excludedTerms
 */

/**
 * Checks if text matches any of the search terms (OR logic)
 * @param text - The text to search in
 * @param searchTerms - Array of search terms (OR logic)
 * @returns true if any search term is found
 */
export function matchesSearchTerms(text: string, searchTerms: string[]): boolean {
    if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
        return false;
    }

    const lowerText = text.toLowerCase();

    // OR logic: return true if ANY search term is found
    return searchTerms.some((term) => {
        const trimmedTerm = term.trim();
        if (trimmedTerm.length === 0) return false;

        // Case-insensitive substring match
        return lowerText.includes(trimmedTerm.toLowerCase());
    });
}

/**
 * Checks if text contains any excluded terms (NOT logic)
 * @param text - The text to check
 * @param excludedTerms - Array of excluded terms (NOT logic)
 * @returns true if any excluded term is found (should be excluded)
 */
export function matchesExcludedTerms(text: string, excludedTerms: string[]): boolean {
    if (!Array.isArray(excludedTerms) || excludedTerms.length === 0) {
        return false;
    }

    const lowerText = text.toLowerCase();

    // NOT logic: return true if ANY excluded term is found (should exclude)
    return excludedTerms.some((term) => {
        const trimmedTerm = term.trim();
        if (trimmedTerm.length === 0) return false;

        // Case-insensitive substring match
        return lowerText.includes(trimmedTerm.toLowerCase());
    });
}

/**
 * Calculates relevance score based on how many search terms match
 * Higher score = more relevant (matches more keywords)
 * @param title - The title of the mention
 * @param content - The content of the mention
 * @param searchTerms - Array of search terms to match against
 * @returns Relevance score (0 to searchTerms.length)
 */
export function calculateRelevanceScore(
    title: string,
    content: string,
    searchTerms: string[]
): number {
    if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
        return 0;
    }

    const fullText = `${title} ${content}`.toLowerCase();
    let matchCount = 0;

    // Count how many search terms appear in the text
    searchTerms.forEach((term) => {
        const trimmedTerm = term.trim().toLowerCase();
        if (trimmedTerm.length > 0 && fullText.includes(trimmedTerm)) {
            matchCount++;
        }
    });

    return matchCount;
}

/**
 * Validates if a mention should be included based on Boolean logic
 * @param title - The title of the mention
 * @param content - The content of the mention
 * @param searchTerms - Array of search terms (OR logic)
 * @param excludedTerms - Array of excluded terms (NOT logic)
 * @returns Object with validation result and reason
 */
export function validateMention(
    title: string,
    content: string,
    searchTerms: string[],
    excludedTerms: string[]
): {
    isValid: boolean;
    reason?: string;
} {
    const fullText = `${title} ${content}`;

    // First check: Must match at least one search term (OR logic)
    if (!matchesSearchTerms(fullText, searchTerms)) {
        return {
            isValid: false,
            reason: 'no_search_term_match',
        };
    }

    // Second check: Must NOT contain any excluded terms (NOT logic)
    if (matchesExcludedTerms(fullText, excludedTerms)) {
        return {
            isValid: false,
            reason: 'contains_excluded_term',
        };
    }

    return {
        isValid: true,
    };
}
