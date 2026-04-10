export function createSlug(text: string): string {
    return text
        .toString()
        .normalize('NFD')                   // Split accented characters into base and accent
        .replace(/[\u0300-\u036f]/g, '')    // Remove accents
        .toLowerCase()                      // Convert to lowercase
        .trim()                             // Remove leading/trailing whitespace
        .replace(/\s+/g, '-')               // Replace spaces with hyphens
        .replace(/[^\w-]+/g, '')            // Remove all non-word characters (except hyphens)
        .replace(/--+/g, '-');              // Replace multiple hyphens with a single one
}