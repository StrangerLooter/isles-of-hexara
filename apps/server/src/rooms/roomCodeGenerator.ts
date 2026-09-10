import crypto from 'node:crypto';

// Unambiguous alphabet: excludes 0, O, 1, I, L
export const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 6;

export function generateRandomCode(length = ROOM_CODE_LENGTH): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % ROOM_CODE_ALPHABET.length;
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}

export function generateUniqueRoomCode(
  isCodeTaken: (code: string) => boolean,
  maxAttempts = 50
): string {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateRandomCode();
    if (!isCodeTaken(code)) {
      return code;
    }
  }
  // Fallback if heavily populated
  return generateRandomCode(8);
}
