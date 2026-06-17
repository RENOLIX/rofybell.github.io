export type Product = {
  id: string;
  name: string;
  nameAr?: string;
  category: string;
  age: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  color: string;
  imageUrl?: string;
  imageUrls?: string[];
  sprite: number;
  stock: number;
  description: string;
  descriptionAr?: string;
  skills: string[];
};

export const products: Product[] = [
  {
    id: "rofybell-hydra-cream",
    name: "Rofybell Hydra Cream",
    category: "Femme",
    age: "50 ml",
    price: 5200,
    oldPrice: 6200,
    rating: 4.9,
    reviews: 142,
    badge: "Best-seller",
    color: "#f5f1ed",
    imageUrls: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=88",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=88",
    ],
    sprite: 0,
    stock: 24,
    description:
      "Creme hydratante riche, fini propre et lumineux. Elle nourrit la peau, adoucit les zones seches et garde une texture confortable toute la journee.",
    skills: ["Hydratation", "Confort", "Eclat"],
  },
  {
    id: "rofybell-glow-serum",
    name: "Rofybell Glow Serum",
    category: "Femme",
    age: "30 ml",
    price: 6900,
    rating: 4.8,
    reviews: 96,
    badge: "Glow",
    color: "#f7eadc",
    imageUrls: [
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=88",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=88",
    ],
    sprite: 1,
    stock: 18,
    description:
      "Serum leger pour reveiller le teint et donner un effet peau fraiche. Il s'integre facilement dans une routine matin ou soir.",
    skills: ["Teint lumineux", "Texture legere", "Routine quotidienne"],
  },
  {
    id: "rofybell-signature-perfume",
    name: "Rofybell Signature Perfume",
    category: "Homme",
    age: "Eau de parfum 50 ml",
    price: 9900,
    oldPrice: 11900,
    rating: 5,
    reviews: 173,
    badge: "Signature",
    color: "#f2e2cf",
    imageUrls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=88",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=88",
    ],
    sprite: 2,
    stock: 12,
    description:
      "Parfum elegant aux notes de jasmin, ambre clair et musc propre. Un sillage feminin, moderne et facile a porter.",
    skills: ["Jasmin", "Ambre clair", "Musc propre"],
  },
];

export const ageGroups = ["Tous les formats", "30 ml", "50 ml", "Eau de parfum 50 ml"];
