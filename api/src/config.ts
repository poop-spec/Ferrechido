export function requiredSetting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required application setting: ${name}`);
  }
  return value;
}
