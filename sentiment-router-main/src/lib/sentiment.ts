// Client-side sentiment analysis engine
// Uses keyword scoring + heuristics to classify sentiment

const POSITIVE_WORDS = new Set([
  'love', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic', 'awesome',
  'happy', 'good', 'best', 'thank', 'thanks', 'pleased', 'enjoy', 'perfect',
  'beautiful', 'brilliant', 'superb', 'outstanding', 'delightful', 'satisfied',
  'impressive', 'helpful', 'glad', 'appreciate', 'excited', 'nice', 'cool',
  'recommend', 'easy', 'fast', 'reliable', 'friendly', 'smooth', 'pleasant',
]);

const NEGATIVE_WORDS = new Set([
  'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'angry', 'furious',
  'disappointed', 'frustrating', 'annoying', 'broken', 'useless', 'slow',
  'ugly', 'disgusting', 'pathetic', 'unacceptable', 'ridiculous', 'problem',
  'issue', 'bug', 'error', 'fail', 'failed', 'crash', 'wrong', 'poor',
  'complaint', 'refund', 'cancel', 'unhappy', 'rude', 'scam', 'fraud',
]);

const NEGATION_WORDS = new Set([
  'not', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't",
  "couldn't", "shouldn't", 'never', 'no', 'neither', 'nor', "isn't", "aren't",
]);

export type SentimentLabel = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // 0-1 confidence
  positiveScore: number;
  negativeScore: number;
}

export interface RouteResult {
  sentiment: SentimentResult;
  route: 'positive' | 'negative' | 'neutral';
  action: string;
  response: string;
  confidenceThreshold: number;
}

const CONFIDENCE_THRESHOLD = 0.70;

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
  let posCount = 0;
  let negCount = 0;
  let negated = false;

  for (const word of words) {
    if (NEGATION_WORDS.has(word)) {
      negated = true;
      continue;
    }

    if (POSITIVE_WORDS.has(word)) {
      if (negated) { negCount++; negated = false; }
      else posCount++;
    } else if (NEGATIVE_WORDS.has(word)) {
      if (negated) { posCount++; negated = false; }
      else negCount++;
    } else {
      negated = false;
    }
  }

  const total = posCount + negCount;
  if (total === 0) {
    return { label: 'NEUTRAL', score: 0.5, positiveScore: 0, negativeScore: 0 };
  }

  const posRatio = posCount / total;
  const negRatio = negCount / total;
  const dominance = Math.abs(posRatio - negRatio);
  const confidence = 0.5 + dominance * 0.5;

  if (posRatio > negRatio) {
    return { label: 'POSITIVE', score: confidence, positiveScore: posRatio, negativeScore: negRatio };
  } else if (negRatio > posRatio) {
    return { label: 'NEGATIVE', score: confidence, positiveScore: posRatio, negativeScore: negRatio };
  }
  return { label: 'NEUTRAL', score: 0.5, positiveScore: posRatio, negativeScore: negRatio };
}

export function routeQuery(query: string): RouteResult {
  const sentiment = analyzeSentiment(query);

  if (sentiment.score < CONFIDENCE_THRESHOLD) {
    return {
      sentiment,
      route: 'neutral',
      action: 'Default Handler',
      response: `Ambiguous sentiment detected (confidence: ${(sentiment.score * 100).toFixed(0)}%). Routing to default handler for manual review.`,
      confidenceThreshold: CONFIDENCE_THRESHOLD,
    };
  }

  if (sentiment.label === 'POSITIVE') {
    return {
      sentiment,
      route: 'positive',
      action: 'Standard Response',
      response: `Positive sentiment detected! Thank you for your kind feedback. We're glad you had a great experience.`,
      confidenceThreshold: CONFIDENCE_THRESHOLD,
    };
  }

  if (sentiment.label === 'NEGATIVE') {
    return {
      sentiment,
      route: 'negative',
      action: 'Escalation Handler',
      response: `Negative sentiment detected. This query has been escalated to a senior support agent for immediate attention.`,
      confidenceThreshold: CONFIDENCE_THRESHOLD,
    };
  }

  return {
    sentiment,
    route: 'neutral',
    action: 'Default Handler',
    response: `Neutral sentiment detected. Routing to default handler for standard processing.`,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
  };
}
