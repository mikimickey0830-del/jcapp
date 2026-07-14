export const passwordRequirementMessage = "8文字以上で、英字と数字をそれぞれ1文字以上含めてください。";

/** Shared by the browser form and the server-side password update endpoint. */
export function isValidMemberPassword(password: string) {
  // Printable ASCII only prevents full-width-only passwords while allowing
  // ordinary symbols without making them mandatory.
  return /^(?=.*[A-Za-z])(?=.*[0-9])[\x21-\x7E]{8,}$/.test(password);
}
