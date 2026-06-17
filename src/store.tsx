import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { products as initialProducts, type Product } from "./data";
import { ADMIN_SESSION_EVENT, createSupabaseAdminUser, getAdminSession, hasSupabaseConfig, supabaseAnonRequest, supabaseRequest } from "./lib/supabase";
import { defaultShippingRates, type ShippingRate } from "./shipping";

export type AdminRole = "admin" | "employe";
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
};
export type OrderStatus = "new" | "progress" | "done" | "return" | "cancelled";
export type CustomerOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};
export type CustomerOrder = {
  id: string;
  customerName: string;
  phone: string;
  wilaya: string;
  address: string;
  commune?: string;
  deliveryMethod: "domicile" | "bureau";
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  items: CustomerOrderItem[];
  createdAt: string;
};

type StoreValue = {
  products: Product[];
  users: AdminUser[];
  orders: CustomerOrder[];
  shippingRates: ShippingRate[];
  syncMode: "connecting" | "supabase" | "local" | "error";
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createOrder: (order: CustomerOrder) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  saveShippingRates: (rates: ShippingRate[]) => Promise<void>;
  saveUser: (user: AdminUser) => Promise<void>;
  createUser: (user: AdminUser, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
};

const defaultUsers: AdminUser[] = [
  {
    id: "rofybell-local-admin",
    name: "Admin Rofybell",
    email: "admin@rofybell.dz",
    role: "admin",
    active: true,
  },
];

const StoreContext = createContext<StoreValue | null>(null);
const PRODUCTS_KEY = "rofybell-products";
const USERS_KEY = "rofybell-users";
const ORDERS_KEY = "rofybell-orders";
const SHIPPING_KEY = "rofybell-shipping-rates";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence can fail in private browsing; state still works for the session.
  }
}

const normalizeImageUrl = (product: Product) => product.imageUrls?.length
  ? JSON.stringify(product.imageUrls)
  : product.imageUrl ?? null;

const parseImageUrls = (value: unknown) => {
  if (!value) return { imageUrl: undefined, imageUrls: undefined };
  const raw = String(value);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const urls = parsed.map(String).filter(Boolean);
      return { imageUrl: urls[0], imageUrls: urls.length ? urls : undefined };
    }
  } catch {
    // Plain URL from older products.
  }
  return { imageUrl: raw, imageUrls: undefined };
};

const toProductRow = (product: Product) => ({
  id: product.id, name: product.name, name_ar: product.nameAr || null, category: product.category, age: product.age,
  price: product.price, old_price: product.oldPrice ?? null, rating: product.rating,
  reviews: product.reviews, badge: product.badge ?? null, color: product.color,
  image_url: normalizeImageUrl(product), sprite: product.sprite, stock: product.stock, description: product.description, description_ar: product.descriptionAr || null, skills: product.skills,
});

const fromProductRow = (row: Record<string, unknown>): Product => {
  const images = parseImageUrls(row.image_url);
  return {
    id: String(row.id), name: String(row.name), nameAr: row.name_ar ? String(row.name_ar) : undefined, category: String(row.category), age: String(row.age),
    price: Number(row.price), oldPrice: row.old_price == null ? undefined : Number(row.old_price),
    rating: Number(row.rating), reviews: Number(row.reviews), badge: row.badge ? String(row.badge) : undefined,
    color: String(row.color), ...images, sprite: Number(row.sprite), stock: Number(row.stock),
    description: String(row.description), descriptionAr: row.description_ar ? String(row.description_ar) : undefined, skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
  };
};

const toOrderRow = (order: CustomerOrder) => ({
  id: order.id,
  customer_name: order.customerName,
  phone: order.phone,
  wilaya: order.wilaya,
  address: order.address,
  commune: order.commune || null,
  delivery_method: order.deliveryMethod,
  subtotal: order.subtotal,
  shipping: order.shipping,
  total: order.total,
  status: order.status,
  items: order.items,
});

const fromOrderRow = (row: Record<string, unknown>): CustomerOrder => ({
  id: String(row.id),
  customerName: String(row.customer_name),
  phone: String(row.phone),
  wilaya: String(row.wilaya),
  address: String(row.address),
  commune: row.commune ? String(row.commune) : undefined,
  deliveryMethod: row.delivery_method === "bureau" ? "bureau" : "domicile",
  subtotal: Number(row.subtotal),
  shipping: Number(row.shipping),
  total: Number(row.total),
  status: (row.status === "progress" || row.status === "done" || row.status === "return" || row.status === "cancelled" ? row.status : "new") as OrderStatus,
  items: Array.isArray(row.items) ? row.items.map((item) => {
    const value = item as Record<string, unknown>;
    return { productId: String(value.productId), name: String(value.name), quantity: Number(value.quantity), price: Number(value.price) };
  }) : [],
  createdAt: String(row.created_at || new Date().toISOString()),
});

const toShippingRateRow = (rate: ShippingRate) => ({
  wilaya: rate.wilaya,
  domicile_price: rate.domicile,
  bureau_price: rate.bureau,
});

const fromShippingRateRow = (row: Record<string, unknown>): ShippingRate => ({
  wilaya: String(row.wilaya),
  domicile: Number(row.domicile_price),
  bureau: Number(row.bureau_price),
});

const mergeShippingRates = (rates: ShippingRate[]) => defaultShippingRates.map((fallback) => {
  const found = rates.find((rate) => rate.wilaya === fallback.wilaya);
  return found || fallback;
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => readStorage(PRODUCTS_KEY, initialProducts));
  const [users, setUsers] = useState<AdminUser[]>(() => readStorage(USERS_KEY, defaultUsers));
  const [orders, setOrders] = useState<CustomerOrder[]>(() => readStorage(ORDERS_KEY, []));
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>(() => readStorage(SHIPPING_KEY, defaultShippingRates));
  const [syncMode, setSyncMode] = useState<"connecting" | "supabase" | "local" | "error">("connecting");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setSyncMode("local");
      return;
    }

    const syncPublicData = () => {
      supabaseAnonRequest<Record<string, unknown>[]>("products?select=*&order=name")
      .then((remoteProducts) => {
        if (remoteProducts.length) setProducts(remoteProducts.map(fromProductRow));
        setSyncMode("supabase");
      })
      .catch((error) => {
        console.error("Supabase products sync failed", error);
        setSyncMode("error");
      });

      supabaseAnonRequest<Record<string, unknown>[]>("shipping_rates?select=*&order=wilaya")
      .then((remoteRates) => {
        if (remoteRates.length) setShippingRates(mergeShippingRates(remoteRates.map(fromShippingRateRow)));
      })
      .catch((error) => {
        console.error("Supabase shipping sync failed", error);
        setSyncMode("error");
      });
    };

    const syncAdminData = () => {
      const session = getAdminSession();
      if (!session) return;
      if (session.user.user_metadata?.role === "admin") {
        supabaseRequest<AdminUser[]>("admin_users?select=*&order=name")
          .then((remoteUsers) => {
            if (remoteUsers.length) setUsers(remoteUsers);
          })
          .catch((error) => {
            console.error("Supabase users sync failed", error);
            setSyncMode("error");
          });
      } else {
        setUsers([]);
      }
      supabaseRequest<Record<string, unknown>[]>("orders?select=*&order=created_at.desc")
        .then((remoteOrders) => {
          setOrders(remoteOrders.map(fromOrderRow));
          setSyncMode("supabase");
        })
        .catch((error) => {
          console.error("Supabase orders sync failed", error);
          setSyncMode("error");
        });
    };

    syncPublicData();
    syncAdminData();
    window.addEventListener(ADMIN_SESSION_EVENT, syncAdminData);
    const adminRefresh = window.setInterval(syncAdminData, 15000);

    return () => {
      window.removeEventListener(ADMIN_SESSION_EVENT, syncAdminData);
      window.clearInterval(adminRefresh);
    };
  }, []);

  const saveProduct = async (product: Product) => {
    if (!hasSupabaseConfig) {
      setProducts((current) => {
        const next = current.some((item) => item.id === product.id)
          ? current.map((item) => item.id === product.id ? product : item)
          : [product, ...current];
        writeStorage(PRODUCTS_KEY, next);
        return next;
      });
      setSyncMode("local");
      return;
    }
    await supabaseRequest("products?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(toProductRow(product)) });
    setProducts((current) => current.some((item) => item.id === product.id)
      ? current.map((item) => item.id === product.id ? product : item)
      : [product, ...current]);
    setSyncMode("supabase");
  };

  const deleteProduct = async (id: string) => {
    if (!hasSupabaseConfig) {
      setProducts((current) => {
        const next = current.filter((item) => item.id !== id);
        writeStorage(PRODUCTS_KEY, next);
        return next;
      });
      setSyncMode("local");
      return;
    }
    await supabaseRequest(`products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    setProducts((current) => current.filter((item) => item.id !== id));
    setSyncMode("supabase");
  };

  const createOrder = async (order: CustomerOrder) => {
    if (!hasSupabaseConfig) {
      setOrders((current) => {
        const next = [order, ...current];
        writeStorage(ORDERS_KEY, next);
        return next;
      });
      setSyncMode("local");
      return;
    }
    const [saved] = await supabaseAnonRequest<Record<string, unknown>[]>("orders", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(toOrderRow(order)) });
    const nextOrder = saved ? fromOrderRow(saved) : order;
    setOrders((current) => [nextOrder, ...current]);
    setSyncMode("supabase");
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((current) => {
      const next = current.map((order) => order.id === id ? { ...order, status } : order);
      if (!hasSupabaseConfig) writeStorage(ORDERS_KEY, next);
      return next;
    });
    if (!hasSupabaseConfig) {
      setSyncMode("local");
      return;
    }
    try {
      await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setSyncMode("supabase");
    } catch (error) {
      console.error("Supabase order status update failed", error);
      setSyncMode("error");
      throw error;
    }
  };

  const saveShippingRates = async (rates: ShippingRate[]) => {
    const nextRates = mergeShippingRates(rates);
    if (!hasSupabaseConfig) {
      setShippingRates(nextRates);
      writeStorage(SHIPPING_KEY, nextRates);
      setSyncMode("local");
      return;
    }
    await supabaseRequest("shipping_rates?on_conflict=wilaya", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(nextRates.map(toShippingRateRow)) });
    setShippingRates(nextRates);
    setSyncMode("supabase");
  };

  const saveUser = async (user: AdminUser) => {
    if (!hasSupabaseConfig) {
      setUsers((current) => {
        const next = current.some((item) => item.id === user.id)
          ? current.map((item) => item.id === user.id ? user : item)
          : [user, ...current];
        writeStorage(USERS_KEY, next);
        return next;
      });
      setSyncMode("local");
      return;
    }
    await supabaseRequest("admin_users?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(user) });
    setUsers((current) => current.some((item) => item.id === user.id)
      ? current.map((item) => item.id === user.id ? user : item)
      : [user, ...current]);
    setSyncMode("supabase");
  };

  const createUser = async (user: AdminUser, password: string) => {
    const account = await createSupabaseAdminUser({ name: user.name, email: user.email, password, role: user.role });
    const nextUser = { ...user, id: account.id };
    setUsers((current) => {
      const next = current.some((item) => item.id === nextUser.id)
        ? current.map((item) => item.id === nextUser.id ? nextUser : item)
        : [nextUser, ...current];
      if (!hasSupabaseConfig) writeStorage(USERS_KEY, next);
      return next;
    });
    setSyncMode(hasSupabaseConfig ? "supabase" : "local");
    if (!hasSupabaseConfig) return;
    try {
      await supabaseRequest("admin_users?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(nextUser) });
    } catch (error) {
      console.warn("Supabase admin_users profile insert failed after auth signup", error);
    }
  };

  const deleteUser = async (id: string) => {
    if (!hasSupabaseConfig) {
      setUsers((current) => {
        const next = current.filter((item) => item.id !== id);
        writeStorage(USERS_KEY, next);
        return next;
      });
      setSyncMode("local");
      return;
    }
    await supabaseRequest(`admin_users?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    setUsers((current) => current.filter((item) => item.id !== id));
    setSyncMode("supabase");
  };

  return <StoreContext.Provider value={{ products, users, orders, shippingRates, syncMode, saveProduct, deleteProduct, createOrder, updateOrderStatus, saveShippingRates, saveUser, createUser, deleteUser }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("StoreProvider absent");
  return value;
}
