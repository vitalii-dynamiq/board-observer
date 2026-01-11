/**
 * OpenAI Client Configuration
 * 
 * Configures the OpenAI client for use across the application.
 */

import OpenAI from 'openai';

// ============================================
// CONFIGURATION
// ============================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const MAX_TOKENS = parseInt(process.env.AGENT_MAX_TOKENS || '500');

if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. OpenAI integration will not work.');
}

// ============================================
// CLIENT INSTANCE
// ============================================

export const openai = OPENAI_API_KEY 
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a chat completion
 */
export async function createCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
    temperature = 0.7,
    systemPrompt,
  } = options;

  // Prepend system prompt if provided
  const allMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await openai.chat.completions.create({
    model,
    messages: allMessages,
    max_tokens: maxTokens,
    temperature,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content;
}

/**
 * Create a streaming chat completion
 */
export async function* createStreamingCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): AsyncGenerator<string, void, unknown> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const allMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const stream = await openai.chat.completions.create({
    model,
    messages: allMessages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Check if OpenAI is configured
 */
export function isConfigured(): boolean {
  return !!openai;
}

// Export configuration
export const config = {
  model: DEFAULT_MODEL,
  maxTokens: MAX_TOKENS,
  isConfigured: isConfigured(),
};

export default openai;
