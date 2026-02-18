// Helper utility functions
// Date formatting, file validation, score calculations

export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}