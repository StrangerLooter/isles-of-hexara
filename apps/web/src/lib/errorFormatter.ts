/**
 * Contextual Assistance and Game Action Error Formatter
 * Translates technical error codes into readable, actionable tabletop guidance
 * Meeting Isles of Hexara Design Principle (Section 11 & Section 37)
 */

export function formatGameError(rawError: string | null | undefined): string {
  if (!rawError) return 'Action cannot be completed.';

  const str = String(rawError);

  if (str.includes('DISTANCE_RULE_VIOLATED') || str.includes('Distance rule')) {
    return 'Too close to another settlement! The Distance Rule requires at least 2 paths between all settlements.';
  }

  if (str.includes('NOT_CONNECTED') || str.includes('not connected')) {
    return 'Unconnected placement! Roads and settlements must connect to your existing territory.';
  }

  if (str.includes('OCCUPIED') || str.includes('occupied')) {
    return 'This intersection or path is already claimed by another structure.';
  }

  if (str.includes('INSUFFICIENT_RESOURCES') || str.includes('Insufficient resources')) {
    return 'Insufficient resources! Check the Build Menu for required timber, brick, wool, grain, or ore.';
  }

  if (str.includes('NO_PIECES_LEFT') || str.includes('no pieces')) {
    return 'No remaining pieces of this type in your captain reserve.';
  }

  if (str.includes('NOT_YOUR_TURN') || str.includes('Not your turn')) {
    return 'It is not your turn to act. Please wait for the current captain to conclude their turn.';
  }

  if (str.includes('ROBBER_SAME_HEX') || str.includes('same hex')) {
    return 'The Robber must be moved to a different island terrain hex.';
  }

  if (str.includes('NEED_ROLL') || str.includes('roll first')) {
    return 'Cast the dice first to generate archipelago resources before taking actions.';
  }

  if (str.includes('ALREADY_ROLLED')) {
    return 'Dice have already been cast for this turn.';
  }

  if (str.includes('DEV_CARD_LIMIT_REACHED')) {
    return 'Limit reached: You may only mobilize one Development Card per turn.';
  }

  if (str.includes('DEV_CARD_JUST_BOUGHT')) {
    return 'Newly recruited Development Cards cannot be played on the turn they were purchased.';
  }

  if (str.includes('RATE_LIMIT_EXCEEDED')) {
    return 'Easy, Captain! Please wait a moment between rapid commands.';
  }

  // Strip prefix like "Action failed: " if present
  return str.replace(/^Action failed:\s*/i, '');
}
