/**
 * Spam detection utility
 * Detects spam patterns in titles and content
 */

// Common spam keywords/phrases
const SPAM_KEYWORDS = [
    'click here',
    'limited time offer',
    'act now',
    'buy now',
    'free money',
    'make money fast',
    'work from home',
    'get rich quick',
    'no credit check',
    'guaranteed income',
    'risk-free',
    '100% free',
    'winner',
    'congratulations',
    'you have won',
    'claim your prize',
    'urgent',
    'as seen on tv',
    'miracle',
    'cure all',
    'lose weight fast',
    'enlarge',
    'viagra',
    'casino',
    'lottery',
    'bitcoin investment',
    'crypto investment',
    'forex trading',
    'binary options',
];

// Emoji regex pattern
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;

interface SpamDetectionResult {
    isSpam: boolean;
    reasons: string[];
}

/**
 * Counts the number of emojis in a text
 */
function countEmojis(text: string): number {
    const matches = text.match(EMOJI_REGEX);
    return matches ? matches.length : 0;
}

/**
 * Checks if text contains too many emojis
 * Threshold: More than 3 emojis per 100 characters
 */
function hasTooManyEmojis(text: string): boolean {
    const emojiCount = countEmojis(text);
    const textLength = text.length;

    if (textLength === 0) return false;

    const emojiRatio = (emojiCount / textLength) * 100;
    return emojiRatio > 3; // More than 3% emojis
}

/**
 * Checks if text contains spam keywords
 */
function containsSpamKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SPAM_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

/**
 * Checks if text has excessive capitalization (likely spam)
 * More than 30% uppercase characters
 */
function hasExcessiveCapitalization(text: string): boolean {
    if (text.length === 0) return false;

    const upperCaseCount = (text.match(/[A-Z]/g) || []).length;
    const ratio = (upperCaseCount / text.length) * 100;

    // Exclude very short texts (less than 10 chars) from this check
    if (text.length < 10) return false;

    return ratio > 30;
}

/**
 * Checks if text has excessive punctuation (likely spam)
 * More than 3 exclamation/question marks or multiple consecutive special chars
 */
function hasExcessivePunctuation(text: string): boolean {
    // Check for multiple consecutive exclamation/question marks
    if (/([!?]{3,})/g.test(text)) return true;

    // Check for excessive special characters
    const specialCharCount = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    const ratio = (specialCharCount / text.length) * 100;

    return text.length > 20 && ratio > 15; // More than 15% special chars
}

/**
 * Detects spam patterns in title and content
 * @param title - The title of the mention
 * @param content - The content of the mention
 * @returns Spam detection result with reasons
 */
export function detectSpam(title: string, content: string): SpamDetectionResult {
    const reasons: string[] = [];
    const fullText = `${title} ${content}`;

    // Check for too many emojis
    if (hasTooManyEmojis(fullText)) {
        reasons.push('excessive_emojis');
    }

    // Check for spam keywords
    if (containsSpamKeywords(fullText)) {
        reasons.push('spam_keywords');
    }

    // Check for excessive capitalization
    if (hasExcessiveCapitalization(title) || hasExcessiveCapitalization(content)) {
        reasons.push('excessive_capitalization');
    }

    // Check for excessive punctuation
    if (hasExcessivePunctuation(title) || hasExcessivePunctuation(content)) {
        reasons.push('excessive_punctuation');
    }

    // Consider it spam if any pattern matches
    const isSpam = reasons.length > 0;

    return {
        isSpam,
        reasons,
    };
}
