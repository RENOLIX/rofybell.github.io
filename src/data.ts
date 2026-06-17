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

export const products: Product[] = [];

export const ageGroups = ["Tous les formats", "30 ml", "50 ml", "Eau de parfum 50 ml"];
