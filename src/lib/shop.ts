export const CATEGORIES = ["Gadgets", "Toys & Keychains", "Electronics kits", "Software", "Other"] as const;

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function productImageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

export const CATEGORY_ICON: Record<string, string> = {
  Gadgets: "🔌", "Toys & Keychains": "🕹️", "Electronics kits": "🧰", Software: "💻", Other: "✨",
};
