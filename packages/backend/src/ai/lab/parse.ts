// Parses a model reply the way production does, for lab runs through the Codex CLI.
import { AiInvalidReply, AiTechnicalPause, parseDecisionReply, parseReply } from '../client';
import type { BotRequest } from '../client';

export function labParse(text: string, request: BotRequest, details: boolean) {
  try {
    return details
      ? parseDecisionReply(text, request.choices, request)
      : parseReply(text, request.choices, request.state.stage === 'end' ? 800 : 500);
  } catch (error) {
    if (error instanceof AiTechnicalPause) throw error;
    throw new AiInvalidReply(`Invalid model reply: ${error}`);
  }
}
