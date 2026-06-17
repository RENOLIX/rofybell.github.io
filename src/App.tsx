import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  Clock3,
  Gift,
  Heart,
  ImagePlus,
  Instagram,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Trash2,
  Truck,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { PressButton } from "./components/PressButton";
import { type Product } from "./data";
import {
  getAdminSession,
  signInAdmin,
  signOutAdmin,
  uploadProductImage,
} from "./lib/supabase";
import { LanguageProvider, useLanguage } from "./language";
import { algeriaWilayas, type ShippingRate } from "./shipping";
import {
  useStore,
  type AdminRole,
  type AdminUser,
  type CustomerOrder,
  type OrderStatus,
} from "./store";
import rofybellLogo from "./assets/rofybell-logo.png";

const money = (value: number) => `${value.toLocaleString("fr-DZ")} DA`;
const sitePhone = "0558413077";
const siteEmail = "contact@rofybell.dz";
const heroImage =
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=88";
const storyImage =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1300&q=86";

const productName = (product: Product, isArabic: boolean) =>
  isArabic && product.nameAr ? product.nameAr : product.name;
const productDescription = (product: Product, isArabic: boolean) =>
  isArabic && product.descriptionAr ? product.descriptionAr : product.description;

type CartLine = { product: Product; quantity: number };
type CartValue = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, quantity?: number) => void;
  change: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartContext absent");
  return value;
}

function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("rofybell-cart") || "[]") as CartLine[];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => localStorage.setItem("rofybell-cart", JSON.stringify(lines)), [lines]);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const add = (product: Product, quantity = 1) => {
    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          )
        : [...current, { product, quantity }];
    });
    setOpen(true);
  };
  const change = (id: string, quantity: number) =>
    setLines((current) =>
      current
        .map((line) => (line.product.id === id ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0),
    );
  const remove = (id: string) =>
    setLines((current) => current.filter((line) => line.product.id !== id));
  const clear = () => setLines([]);

  return (
    <CartContext.Provider value={{ lines, count, total, open, setOpen, add, change, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src={rofybellLogo}
      className={compact ? "brand-logo compact" : "brand-logo"}
      alt="Rofybell cosmetics"
    />
  );
}

function ProductArt({
  product,
  className = "",
  imageUrl,
}: {
  product: Product;
  className?: string;
  imageUrl?: string;
}) {
  const { isArabic } = useLanguage();
  const src = imageUrl || product.imageUrls?.[0] || product.imageUrl;
  return (
    <div
      className={`product-art ${className}`}
      role="img"
      aria-label={productName(product, isArabic)}
      style={{ backgroundColor: product.color, backgroundImage: src ? `url(${src})` : undefined }}
    />
  );
}

function Header() {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="glass-nav shell">
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <Menu />
        </button>
        <Link to="/" aria-label="Accueil Rofybell">
          <Logo compact />
        </Link>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"}>
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/boutique">Boutique</NavLink>
          <NavLink to="/a-propos">Rituel</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/boutique" className="icon-button hide-mobile" aria-label="Rechercher">
            <Search />
          </Link>
          <button className="cart-button" onClick={() => setOpen(true)} aria-label={`Panier, ${count} produits`}>
            <ShoppingCart />
            <span>{count}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function CartDrawer() {
  const { lines, total, open, setOpen, change, remove } = useCart();
  const { isArabic } = useLanguage();

  return (
    <>
      <button className={`drawer-backdrop ${open ? "visible" : ""}`} onClick={() => setOpen(false)} aria-label="Fermer le panier" />
      <aside className={`cart-drawer ${open ? "visible" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Votre selection</span>
            <h2>Panier</h2>
          </div>
          <button className="icon-button" onClick={() => setOpen(false)} aria-label="Fermer">
            <X />
          </button>
        </div>
        <div className="cart-lines">
          {lines.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart />
              <h3>Votre panier est encore vide</h3>
              <p>Ajoutez une creme, un serum ou un parfum signature.</p>
              <Link className="button primary" to="/boutique" onClick={() => setOpen(false)}>
                Explorer la boutique
              </Link>
            </div>
          ) : (
            lines.map((line) => (
              <article className="cart-line" key={line.product.id}>
                <ProductArt product={line.product} />
                <div>
                  <Link to={`/produit/${line.product.id}`} onClick={() => setOpen(false)}>
                    {productName(line.product, isArabic)}
                  </Link>
                  <small>{line.product.age}</small>
                  <strong>{money(line.product.price)}</strong>
                  <div className="quantity-mini">
                    <button onClick={() => change(line.product.id, line.quantity - 1)} aria-label="Diminuer">
                      <Minus />
                    </button>
                    <span>{line.quantity}</span>
                    <button onClick={() => change(line.product.id, line.quantity + 1)} aria-label="Augmenter">
                      <Plus />
                    </button>
                  </div>
                </div>
                <button className="remove-line" onClick={() => remove(line.product.id)} aria-label="Supprimer">
                  <Trash2 />
                </button>
              </article>
            ))
          )}
        </div>
        {lines.length > 0 && (
          <div className="drawer-total">
            <div>
              <span>Sous-total</span>
              <strong>{money(total)}</strong>
            </div>
            <p>Livraison calculee a l'etape suivante.</p>
            <Link to="/commande" className="button primary full" onClick={() => setOpen(false)}>
              Passer la commande <ArrowRight />
            </Link>
            <button className="text-button" onClick={() => setOpen(false)}>
              Continuer mes achats
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const { isArabic } = useLanguage();

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.2) }}
    >
      <Link to={`/produit/${product.id}`} className="product-visual">
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className="heart" onClick={(event) => event.preventDefault()} aria-label="Ajouter aux favoris">
          <Heart />
        </button>
        <ProductArt product={product} />
      </Link>
      <div className="product-copy">
        <div className="product-meta">
          <span>{product.category}</span>
          <span>
            <Star fill="currentColor" /> {product.rating}
          </span>
        </div>
        <Link to={`/produit/${product.id}`}>
          <h3>{productName(product, isArabic)}</h3>
        </Link>
        <p>{product.age}</p>
        <div className="product-bottom">
          <div>
            <strong>{money(product.price)}</strong>
            {product.oldPrice && <del>{money(product.oldPrice)}</del>}
          </div>
          <button className="add-button" onClick={() => add(product)} aria-label="Ajouter au panier">
            <ShoppingCart />
            <Plus />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function SectionTitle({ kicker, title, copy }: { kicker: string; title: string; copy?: string }) {
  return (
    <div className="section-title">
      <span className="eyebrow">{kicker}</span>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  );
}

function HomePage() {
  const { products } = useStore();
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="hero">
        <img src={heroImage} alt="Cremes et parfums Rofybell" />
        <div className="hero-wash" />
        <motion.div
          className="shell hero-content"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1>Cosmetics pour elle et lui.</h1>
          <p>
            Rofybell reunit des soins visage et des parfums pour femme et homme :
            des textures agreables, des senteurs propres et une commande simple avec paiement a la livraison.
          </p>
          <div className="hero-actions">
            <PressButton to="/boutique" size="lg">
              <span className="press-button-content">
                Decouvrir la boutique <ArrowRight />
              </span>
            </PressButton>
            <PressButton label="Voir le rituel" to="/a-propos" size="lg" variant="secondary" />
          </div>
        </motion.div>
      </section>

      <section className="benefit-bar shell">
        <div>
          <Truck />
          <span>
            <strong>Livraison Algerie</strong>
            <small>Domicile ou bureau</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>Paiement a la livraison</strong>
            <small>Simple et rassurant</small>
          </span>
        </div>
        <div>
          <Gift />
          <span>
            <strong>Coffrets cadeaux</strong>
            <small>Presentation soignee</small>
          </span>
        </div>
        <div>
          <Sparkles />
          <span>
            <strong>Selection premium</strong>
            <small>Textures et sillages choisis</small>
          </span>
        </div>
      </section>

      <section className="section ritual-strip">
        <div className="shell ritual-grid">
          <div>
          <span className="eyebrow">Routine Rofybell</span>
            <h2>Trois essentiels pour une peau nette, douce et lumineuse.</h2>
            <p>
              Commencez par hydrater la peau, ajoutez un serum eclat puis terminez avec une
              fragrance signature. Une routine courte, elegante et facile a garder chaque jour.
            </p>
          </div>
          <div className="ritual-cards">
            <span>01 Nettoyer</span>
            <span>02 Hydrater</span>
            <span>03 Parfumer</span>
          </div>
        </div>
      </section>

      <section className="section products-section">
        <div className="shell">
          <div className="title-row">
            <SectionTitle kicker="Selection du moment" title="Les favoris Rofybell" />
            <Link to="/boutique">
              Voir toute la boutique <ArrowRight />
            </Link>
          </div>
          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="section shell story-band">
        <div className="story-visual">
          <img src={storyImage} alt="Routine beaute Rofybell" />
        </div>
        <div className="story-copy">
          <span className="eyebrow">Pourquoi Rofybell ?</span>
          <h2>Des formules simples, sensorielles et faciles a adopter.</h2>
          <p>
            Rofybell rassemble des textures agreables, des parfums doux et des routines pensees
            pour les peaux qui veulent de l'eclat sans complication.
          </p>
          <ul>
            <li>
              <Check /> Soins adaptes aux routines du matin et du soir
            </li>
            <li>
              <Check /> Parfums propres, feminins et faciles a porter
            </li>
            <li>
              <Check /> Livraison disponible en Algerie avec paiement a la reception
            </li>
          </ul>
          <Link className="button dark" to="/a-propos">
            Decouvrir le rituel <ArrowRight />
          </Link>
        </div>
      </section>

      <Newsletter />
    </>
  );
}

function ShopPage() {
  const { products } = useStore();
  const [category, setCategory] = useState<"Toutes" | "Femme" | "Homme">("Toutes");
  const [query, setQuery] = useState("");
  const filtered = products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.age}`.toLowerCase();
    return (category === "Toutes" || product.category === category) && text.includes(query.toLowerCase());
  });

  return (
    <main className="page-shell shell">
      <div className="shop-heading">
        <div>
          <span className="eyebrow">La boutique</span>
          <h1>
            Trouver le prochain <em>rituel favori.</em>
          </h1>
        </div>
        <p>{filtered.length} produit(s) disponible(s)</p>
      </div>
      <div className="shop-toolbar">
        <div className="search-field">
          <Search />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher creme, serum, parfum..." />
        </div>
      </div>
      <div className="filter-block">
        <span>Selection</span>
        <div className="filter-chips compact">
          {(["Toutes", "Femme", "Homme"] as const).map((item) => (
            <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="product-grid shop-grid">
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <Search />
          <h2>Aucun produit ne correspond</h2>
          <p>Essayez une autre categorie ou un autre mot-cle.</p>
        </div>
      )}
    </main>
  );
}

function ProductPage() {
  const { products } = useStore();
  const { isArabic } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const product = products.find((item) => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelectedImage(product?.imageUrls?.[0] || product?.imageUrl);
  }, [product]);

  if (!product) return <NotFound />;

  const galleryImages = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const recommendations = products.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <main className="product-page shell">
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft /> Retour a la boutique
      </button>
      <div className="product-detail">
        <div className="detail-gallery">
          <ProductArt product={product} imageUrl={selectedImage} />
          <div className="thumbnail-row">
            {galleryImages.map((url, index) => (
              <button
                type="button"
                className={url === selectedImage ? "active" : ""}
                key={`${url}-${index}`}
                onClick={() => setSelectedImage(url)}
                aria-label={`Afficher la photo ${index + 1}`}
              >
                <span className="gallery-thumb" style={{ backgroundImage: `url(${url})` }} />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <div className="detail-top">
            <span className="product-badge static">{product.badge || "Selection Rofybell"}</span>
            <button className="icon-button" aria-label="Ajouter aux favoris">
              <Heart />
            </button>
          </div>
          <span className="eyebrow">
            {product.category} / {product.age}
          </span>
          <h1>{productName(product, isArabic)}</h1>
          <div className="rating">
            <span>
              <Star fill="currentColor" /> {product.rating}
            </span>
            <small>{product.reviews} avis</small>
          </div>
          <p className="detail-description">{productDescription(product, isArabic)}</p>
          <div className="skill-list">
            {product.skills.map((skill) => (
              <span key={skill}>
                <Sparkles /> {skill}
              </span>
            ))}
          </div>
          <div className="detail-price">
            <strong>{money(product.price)}</strong>
            {product.oldPrice && <del>{money(product.oldPrice)}</del>}
          </div>
          <div className="stock">
            <i /> En stock / expedition sous 24-48h
          </div>
          <div className="purchase-row">
            <div className="quantity">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuer">
                <Minus />
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} aria-label="Augmenter">
                <Plus />
              </button>
            </div>
            <button className="button primary purchase" onClick={() => add(product, quantity)}>
              Ajouter au panier <ShoppingBag />
            </button>
          </div>
          <div className="detail-assurances">
            <div>
              <Truck />
              <span>
                <strong>Livraison rapide</strong>
                <small>Tarif par wilaya</small>
              </span>
            </div>
            <div>
              <ShieldCheck />
              <span>
                <strong>Paiement a la livraison</strong>
                <small>Validation simple</small>
              </span>
            </div>
            <div>
              <Gift />
              <span>
                <strong>Presentation cadeau</strong>
                <small>Coffrets disponibles</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="detail-story">
        <div>
          <span className="eyebrow">Le rituel</span>
          <h2>Un geste simple, un rendu premium.</h2>
          <p>
            Chaque fiche produit met en avant les notes, les benefices et le bon usage pour aider
            le client a commander vite, sans confusion.
          </p>
        </div>
        <div className="detail-stats">
          <span>
            <strong>24h</strong>confirmation
          </span>
          <span>
            <strong>COD</strong>paiement livraison
          </span>
          <span>
            <strong>4.9</strong>note moyenne
          </span>
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="section recommendations">
          <div className="title-row">
            <SectionTitle kicker="A associer" title="Completer le rituel" />
          </div>
          <div className="product-grid">
            {recommendations.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function AboutPage() {
  const { products } = useStore();
  const { isArabic } = useLanguage();
  const showcaseProducts = products.slice(0, 3);

  return (
    <main>
      <section className="about-hero shell">
        <span className="eyebrow">Rofybell</span>
        <h1>
          Des cosmetiques doux, lumineux et accessibles, crees pour les routines modernes.
        </h1>
        <p>
          Rofybell propose une selection courte et claire : une creme hydratante, un serum eclat
          et un parfum signature. L'objectif est simple : aider chaque cliente a construire une
          routine belle, efficace et facile a commander.
        </p>
      </section>
      <section className="about-grid shell">
        <div className="about-art">
          {showcaseProducts.map((product, index) => (
            <article className={`about-product-mini mini-${index + 1}`} key={product.id}>
              <ProductArt product={product} />
              <span>{productName(product, isArabic)}</span>
            </article>
          ))}
        </div>
        <div>
          <span className="eyebrow">Experience</span>
          <h2>Une routine courte, une sensation premium.</h2>
          <p>
            Chaque produit a ete choisi pour un usage quotidien : texture confortable, parfum
            elegant, presentation soignee et commande rapide partout en Algerie.
          </p>
          <div className="values">
            <div>
              <strong>01</strong>
              <h3>Hydrater</h3>
              <p>Une creme douce pour apporter confort, souplesse et eclat naturel.</p>
            </div>
            <div>
              <strong>02</strong>
              <h3>Illuminer</h3>
              <p>Un serum leger pour raviver le teint et lisser l'apparence de la peau.</p>
            </div>
            <div>
              <strong>03</strong>
              <h3>Signer</h3>
              <p>Un parfum feminin aux notes propres pour terminer la routine avec elegance.</p>
            </div>
          </div>
        </div>
      </section>
      <Newsletter />
    </main>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <main className="contact-page shell">
      <div className="contact-intro">
        <span className="eyebrow">Service client</span>
        <h1>
          Une question ?<br />
          Parlons routine.
        </h1>
        <p>Besoin d'un conseil produit, d'un suivi de commande ou d'un coffret cadeau ? Ecrivez-nous.</p>
        <div className="contact-cards">
          <a href={`tel:${sitePhone}`}>
            <Phone />
            <span>
              <strong>Appelez-nous</strong>
              <small>{sitePhone}</small>
            </span>
          </a>
          <a href={`mailto:${siteEmail}`}>
            <Mail />
            <span>
              <strong>Ecrivez-nous</strong>
              <small>{siteEmail}</small>
            </span>
          </a>
          <div>
            <Clock3 />
            <span>
              <strong>Horaires</strong>
              <small>Sam - Jeu, 9h a 18h</small>
            </span>
          </div>
          <div>
            <MapPin />
            <span>
              <strong>Adresse</strong>
              <small>Alger, Algerie</small>
            </span>
          </div>
        </div>
      </div>
      <form className="contact-form" onSubmit={submit}>
        {sent ? (
          <div className="success-message">
            <Check />
            <h2>Message bien recu</h2>
            <p>Notre equipe vous repondra tres vite.</p>
            <PressButton label="Envoyer un autre message" type="button" variant="secondary" onClick={() => setSent(false)} />
          </div>
        ) : (
          <>
            <div className="form-title">
              <span>Bonjour</span>
              <h2>Comment pouvons-nous aider ?</h2>
            </div>
            <label>
              Votre nom
              <input required placeholder="Nom et prenom" />
            </label>
            <label>
              Votre email
              <input required type="email" placeholder="vous@email.com" />
            </label>
            <label>
              Sujet
              <select defaultValue="Conseil produit">
                <option>Conseil produit</option>
                <option>Suivi de commande</option>
                <option>Coffret cadeau</option>
                <option>Autre demande</option>
              </select>
            </label>
            <label>
              Votre message
              <textarea required rows={5} placeholder="Dites-nous tout..." />
            </label>
            <PressButton label="Envoyer" type="submit" size="lg" full />
          </>
        )}
      </form>
    </main>
  );
}

function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const { createOrder, shippingRates } = useStore();
  const { isArabic } = useLanguage();
  const [done, setDone] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"domicile" | "bureau">("domicile");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedRate = shippingRates.find((rate) => rate.wilaya === selectedWilaya);
  const shipping = selectedRate ? selectedRate[deliveryMethod] : 0;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lines.length) return;
    const form = new FormData(event.currentTarget);
    const order: CustomerOrder = {
      id: crypto.randomUUID(),
      customerName: String(form.get("customerName") || ""),
      phone: String(form.get("phone") || ""),
      wilaya: String(form.get("wilaya") || ""),
      address: String(form.get("address") || ""),
      commune: String(form.get("commune") || "") || undefined,
      deliveryMethod,
      subtotal: total,
      shipping,
      total: total + shipping,
      status: "new",
      items: lines.map((line) => ({
        productId: line.product.id,
        name: productName(line.product, isArabic),
        quantity: line.quantity,
        price: line.product.price,
      })),
      createdAt: new Date().toISOString(),
    };
    setSaving(true);
    setError("");
    try {
      await createOrder(order);
      clear();
      setDone(true);
    } catch {
      setError("La commande n'a pas pu etre envoyee. Verifiez la configuration Supabase.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <main className="order-success shell">
        <div>
          <PackageCheck />
          <span className="eyebrow">Commande confirmee</span>
          <h1>Merci pour votre confiance.</h1>
          <p>Votre commande Rofybell est en preparation. Nous vous contacterons rapidement.</p>
          <Link className="button primary" to="/">
            Retour a l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout shell">
      <form className="checkout-form" onSubmit={submit}>
        <span className="eyebrow">Finaliser la commande</span>
        <h1>Confirmation de commande</h1>
        <div className="form-grid">
          <label className="wide">
            Nom et prenom
            <input required name="customerName" placeholder="Nom et prenom" />
          </label>
          <label className="wide">
            Numero de telephone
            <input required name="phone" inputMode="numeric" maxLength={10} placeholder="05 50 00 00 00" />
          </label>
          <label className="wide">
            Wilaya
            <select required name="wilaya" value={selectedWilaya} onChange={(event) => setSelectedWilaya(event.target.value)}>
              <option value="" disabled>
                Choisir la wilaya
              </option>
              {algeriaWilayas.map((wilaya) => (
                <option key={wilaya}>{wilaya}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Adresse precise
            <input required name="address" placeholder="Rue, quartier, batiment, etage..." />
          </label>
          <label className="wide">
            Commune
            <input name="commune" placeholder="Commune ou point de repere" />
          </label>
        </div>
        <div className="delivery-methods">
          <p>Methode de livraison</p>
          <label>
            <input type="radio" name="deliveryMethod" checked={deliveryMethod === "domicile"} onChange={() => setDeliveryMethod("domicile")} /> Livraison a domicile{" "}
            {selectedRate && <strong>{money(selectedRate.domicile)}</strong>}
          </label>
          <label>
            <input type="radio" name="deliveryMethod" checked={deliveryMethod === "bureau"} onChange={() => setDeliveryMethod("bureau")} /> Livraison au bureau{" "}
            {selectedRate && <strong>{money(selectedRate.bureau)}</strong>}
          </label>
        </div>
        <div className="payment-card">
          <span>
            <Truck /> Paiement a la livraison
          </span>
          <Check />
        </div>
        <div className="checkout-total-card">
          <span>Total a payer</span>
          <strong>{money(total + shipping)}</strong>
        </div>
        {error && <div className="admin-login-error">{error}</div>}
        <PressButton disabled={!lines.length || saving} full size="lg" type="submit">
          {saving ? "Envoi de la commande..." : "Confirmer la commande"} <ArrowRight />
        </PressButton>
      </form>
      <aside className="order-summary">
        <h2>Votre commande</h2>
        {lines.map((line) => (
          <div className="summary-line" key={line.product.id}>
            <ProductArt product={line.product} />
            <span>
              <strong>{productName(line.product, isArabic)}</strong>
              <small>Quantite : {line.quantity}</small>
            </span>
            <b>{money(line.product.price * line.quantity)}</b>
          </div>
        ))}
        <div className="summary-totals">
          <p>
            <span>Sous-total</span>
            <strong>{money(total)}</strong>
          </p>
          <p>
            <span>Livraison</span>
            <strong>{money(shipping)}</strong>
          </p>
          <p>
            <span>Methode</span>
            <strong>{deliveryMethod === "domicile" ? "Domicile" : "Bureau"}</strong>
          </p>
          <p className="grand-total">
            <span>Total</span>
            <strong>{money(total + shipping)}</strong>
          </p>
        </div>
      </aside>
    </main>
  );
}

function AdminPage() {
  const [session, setSession] = useState(() => getAdminSession());
  const [section, setSection] = useState("dashboard");

  if (!session) return <AdminLogin onSuccess={() => window.location.reload()} />;

  const isAdmin = session.user.user_metadata?.role === "admin";
  const currentSection = !isAdmin && section === "team" ? "dashboard" : section;
  const navigationItems: Array<[string, typeof LayoutDashboard, string]> = [
    ["dashboard", LayoutDashboard, "Vue d'ensemble"],
    ["products", Box, "Produits"],
    ["orders", ShoppingCart, "Commandes"],
    ["shipping", Truck, "Livraison"],
    ...(isAdmin ? ([["team", Users, "Equipe"]] as Array<[string, typeof LayoutDashboard, string]>) : []),
  ];
  const titles: Record<string, string> = {
    dashboard: "Vue d'ensemble",
    products: "Catalogue produits",
    orders: "Commandes",
    shipping: "Prix de livraison",
    team: "Utilisateurs et acces",
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <nav>
          {navigationItems.map(([itemId, Icon, label]) => (
            <button className={currentSection === itemId ? "active" : ""} onClick={() => setSection(itemId)} key={itemId}>
              <Icon /> {label}
            </button>
          ))}
        </nav>
        <button
          className="admin-logout"
          onClick={() => {
            signOutAdmin();
            setSession(null);
          }}
        >
          <X /> Deconnexion
        </button>
        <Link to="/">
          <Store /> Voir la boutique
        </Link>
      </aside>
      <section className="admin-content">
        <header>
          <div>
            <span className="eyebrow">Administration Rofybell</span>
            <h1>{titles[currentSection]}</h1>
            <p className="sync-status supabase">actif</p>
          </div>
        </header>
        {currentSection === "dashboard" && <Dashboard />}
        {currentSection === "products" && <AdminProducts />}
        {currentSection === "orders" && <AdminOrders />}
        {currentSection === "shipping" && <AdminShipping />}
        {isAdmin && currentSection === "team" && <AdminUsers />}
      </section>
    </main>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInAdmin(email, password);
      onSuccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <Logo />
        <span className="eyebrow">Espace securise</span>
        <h1>Administration Rofybell</h1>
        <p>Connectez-vous pour gerer les produits, les commandes, les livraisons et l'equipe.</p>
        <label>
          Adresse email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Mot de passe
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <div className="admin-login-error">{error}</div>}
        <PressButton full size="lg" type="submit" disabled={loading} label={loading ? "Connexion..." : "Se connecter"} />
        <Link to="/">Retour a la boutique</Link>
      </form>
    </main>
  );
}

function Dashboard() {
  const { orders, products } = useStore();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const average = orders.length ? Math.round(revenue / orders.length) : 0;
  const pending = orders.filter((order) => order.status !== "done").length;
  const lowStock = products.filter((product) => product.stock <= 3).length;
  const latestOrders = orders.slice(0, 4);

  return (
    <>
      <div className="metric-grid">
        <div>
          <span>Chiffre d'affaires</span>
          <strong>{money(revenue)}</strong>
          <small>{orders.length ? "Total des commandes" : "Aucune vente"}</small>
        </div>
        <div>
          <span>Commandes</span>
          <strong>{orders.length}</strong>
          <small>{pending ? `${pending} a traiter` : orders.length ? "Toutes traitees" : "Aucune commande"}</small>
        </div>
        <div>
          <span>Panier moyen</span>
          <strong>{money(average)}</strong>
          <small>{orders.length ? "Calcule depuis Supabase" : "Pas encore calcule"}</small>
        </div>
        <div>
          <span>Alertes stock</span>
          <strong>{lowStock}</strong>
          <small>{lowStock ? "Stocks faibles" : "Tout est pret"}</small>
        </div>
      </div>
      <div className="admin-empty-state dashboard-orders">
        <PackageCheck />
        <h2>{orders.length ? "Dernieres commandes" : "Aucune commande pour le moment"}</h2>
        {latestOrders.length ? (
          <div className="dashboard-order-list">
            {latestOrders.map((order) => (
              <div key={order.id}>
                <strong>{order.customerName}</strong>
                <span>
                  {order.wilaya} / {money(order.total)}
                </span>
                <em className={order.status}>{statusLabel(order.status)}</em>
              </div>
            ))}
          </div>
        ) : (
          <p>Les commandes validees depuis le checkout apparaitront ici.</p>
        )}
      </div>
    </>
  );
}

const blankProduct = (): Product => ({
  id: crypto.randomUUID(),
  name: "",
  nameAr: "",
  category: "Femme",
  age: "Peau seche",
  price: 0,
  oldPrice: undefined,
  rating: 4.9,
  reviews: 0,
  badge: "",
  color: "#f4eef8",
  imageUrl: "",
  imageUrls: undefined,
  sprite: 0,
  stock: 0,
  description: "",
  descriptionAr: "",
  skills: [],
});

function AdminProducts() {
  const { products, saveProduct, deleteProduct, syncMode } = useStore();
  const [draft, setDraft] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setDraft(null);
    setError("");
    setUploading(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      await saveProduct({
        ...draft,
        badge: draft.badge || undefined,
        oldPrice: draft.oldPrice || undefined,
        imageUrl: draft.imageUrls?.[0] || draft.imageUrl || undefined,
        imageUrls: draft.imageUrls?.length ? draft.imageUrls : draft.imageUrl ? [draft.imageUrl] : undefined,
      });
      close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!draft || !event.target.files?.length) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(event.target.files)) {
        urls.push(await uploadProductImage(file));
      }
      const current = draft.imageUrls?.length ? draft.imageUrls : draft.imageUrl ? [draft.imageUrl] : [];
      const next = [...current, ...urls];
      setDraft({ ...draft, imageUrl: next[0], imageUrls: next });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Televersement impossible");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <section className="admin-table-card">
        <div className="admin-table-head">
          <div>
            <span className="eyebrow">Catalogue</span>
            <h2>{products.length} produit{products.length > 1 ? "s" : ""}</h2>
            <small>Source : {syncMode}</small>
          </div>
          <PressButton onClick={() => setDraft(blankProduct())}>
            <Plus /> Ajouter un produit
          </PressButton>
        </div>
        <div className="product-admin-grid">
          {products.map((product) => (
            <article key={product.id}>
              <ProductArt product={product} />
              <div>
                <span>{product.category}</span>
                <h3>{product.name}</h3>
                <p>
                  {money(product.price)} / Stock {product.stock}
                </p>
              </div>
              <div className="table-actions">
                <button onClick={() => setDraft(product)} aria-label={`Modifier ${product.name}`}>
                  <Pencil />
                </button>
                <button className="danger" onClick={() => deleteProduct(product.id)} aria-label={`Supprimer ${product.name}`}>
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {draft && (
        <div className="admin-modal-backdrop">
          <form className="admin-modal" onSubmit={submit}>
            <div className="admin-modal-head">
              <div>
                <span className="eyebrow">Produit</span>
                <h2>{products.some((product) => product.id === draft.id) ? "Modifier le produit" : "Nouveau produit"}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Fermer">
                <X />
              </button>
            </div>
            <div className="admin-product-media">
              <ProductArt product={draft} />
              <div>
                <strong>Photos du produit</strong>
                <p>La premiere photo devient l'image principale dans la boutique.</p>
                <label className="upload-button">
                  <ImagePlus /> {uploading ? "Televersement..." : "Televerser des photos"}
                  <input accept="image/*" type="file" multiple onChange={uploadImage} />
                </label>
                {!!(draft.imageUrls?.length || draft.imageUrl) && (
                  <div className="admin-photo-strip">
                    {(draft.imageUrls?.length ? draft.imageUrls : draft.imageUrl ? [draft.imageUrl] : []).map((url, index) => (
                      <button
                        type="button"
                        key={`${url}-${index}`}
                        onClick={() => {
                          const source = draft.imageUrls?.length ? draft.imageUrls : draft.imageUrl ? [draft.imageUrl] : [];
                          const next = source.filter((_, itemIndex) => itemIndex !== index);
                          setDraft({ ...draft, imageUrl: next[0], imageUrls: next.length ? next : undefined });
                        }}
                        aria-label={`Retirer la photo ${index + 1}`}
                      >
                        <img src={url} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="admin-form-grid">
              <label>
                Nom
                <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>
              <label>
                Nom arabe
                <input dir="rtl" value={draft.nameAr || ""} onChange={(event) => setDraft({ ...draft, nameAr: event.target.value })} />
              </label>
              <label>
                Categorie
                <select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                  <option value="Femme">Femme</option>
                  <option value="Homme">Homme</option>
                </select>
              </label>
              <label>
                Type de peau / Format
                <input required value={draft.age} onChange={(event) => setDraft({ ...draft, age: event.target.value })} />
              </label>
              <label>
                Prix (DA)
                <input required min="0" type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} />
              </label>
              <label>
                Ancien prix
                <input min="0" type="number" value={draft.oldPrice || ""} onChange={(event) => setDraft({ ...draft, oldPrice: event.target.value ? Number(event.target.value) : undefined })} />
              </label>
              <label>
                Stock
                <input required min="0" type="number" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} />
              </label>
              <label>
                Badge
                <input value={draft.badge || ""} onChange={(event) => setDraft({ ...draft, badge: event.target.value || undefined })} />
              </label>
              <label className="wide">
                Image URL
                <input value={draft.imageUrl || ""} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value, imageUrls: event.target.value ? [event.target.value] : undefined })} />
              </label>
              <label className="wide">
                Description
                <textarea required rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </label>
              <label className="wide">
                Description arabe
                <textarea dir="rtl" rows={4} value={draft.descriptionAr || ""} onChange={(event) => setDraft({ ...draft, descriptionAr: event.target.value })} />
              </label>
              <label className="wide">
                Notes / benefices separes par des virgules
                <input value={draft.skills.join(", ")} onChange={(event) => setDraft({ ...draft, skills: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
              </label>
            </div>
            {error && <div className="admin-login-error">{error}</div>}
            <div className="admin-modal-actions">
              <PressButton label="Annuler" type="button" variant="secondary" onClick={close} />
              <PressButton label={saving ? "Enregistrement..." : "Enregistrer le produit"} type="submit" disabled={saving} />
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function AdminUsers() {
  const { users, saveUser, createUser, deleteUser } = useStore();
  const [draft, setDraft] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setError("");
    try {
      if (draft.id) await saveUser(draft);
      else await createUser({ ...draft, id: crypto.randomUUID() }, password);
      setDraft(null);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Creation utilisateur impossible");
    }
  };
  const close = () => {
    setDraft(null);
    setPassword("");
    setError("");
  };

  return (
    <>
      <section className="admin-table-card">
        <div className="admin-table-head">
          <div>
            <span className="eyebrow">Acces internes</span>
            <h2>{users.length} utilisateur{users.length > 1 ? "s" : ""}</h2>
          </div>
          <PressButton onClick={() => setDraft({ id: "", name: "", email: "", role: "employe", active: true })}>
            <UserPlus /> Ajouter un utilisateur
          </PressButton>
        </div>
        <div className="user-table">
          {users.map((user) => (
            <div className="user-row" key={user.id}>
              <span>{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              <em className={user.role}>{user.role === "admin" ? "Administrateur" : "Employe"}</em>
              <b className={user.active ? "active" : "inactive"}>{user.active ? "Actif" : "Suspendu"}</b>
              <div className="table-actions">
                <button onClick={() => setDraft(user)} aria-label={`Modifier ${user.name}`}>
                  <Pencil />
                </button>
                <button className="danger" onClick={() => deleteUser(user.id)} aria-label={`Supprimer ${user.name}`}>
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {draft && (
        <div className="admin-modal-backdrop">
          <form className="admin-modal compact" onSubmit={submit}>
            <div className="admin-modal-head">
              <div>
                <span className="eyebrow">Equipe</span>
                <h2>{draft.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Fermer">
                <X />
              </button>
            </div>
            <div className="admin-form-grid">
              <label className="wide">
                Nom complet
                <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>
              <label className="wide">
                Adresse email
                <input required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
              </label>
              {!draft.id && (
                <label className="wide">
                  Mot de passe
                  <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caracteres minimum" />
                </label>
              )}
              <label>
                Role
                <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as AdminRole })}>
                  <option value="admin">Administrateur</option>
                  <option value="employe">Employe</option>
                </select>
              </label>
              <label>
                Statut
                <select value={draft.active ? "active" : "inactive"} onChange={(event) => setDraft({ ...draft, active: event.target.value === "active" })}>
                  <option value="active">Actif</option>
                  <option value="inactive">Suspendu</option>
                </select>
              </label>
            </div>
            {error && <div className="admin-login-error">{error}</div>}
            <div className="role-note">Le compte est cree avec le mot de passe defini ici. Aucun mot de passe n'est enregistre dans le navigateur.</div>
            <div className="admin-modal-actions">
              <PressButton label="Annuler" type="button" variant="secondary" onClick={close} />
              <PressButton label={draft.id ? "Enregistrer" : "Creer l'utilisateur"} type="submit" />
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function statusLabel(status: OrderStatus) {
  return status === "new"
    ? "Nouvelle"
    : status === "progress"
      ? "En cours"
      : status === "done"
        ? "Terminee"
        : status === "return"
          ? "Retour"
          : "Annulee";
}

function AdminOrders() {
  const { orders, updateOrderStatus } = useStore();
  const [editing, setEditing] = useState<CustomerOrder | null>(null);

  return (
    <>
      <section className="admin-table-card">
        <div className="admin-table-head">
          <h2>{orders.length} commande{orders.length > 1 ? "s" : ""}</h2>
        </div>
        {orders.length ? (
          <div className="orders-table">
            {orders.map((order) => (
              <div key={order.id}>
                <strong>#{order.id.slice(0, 8)}</strong>
                <span>
                  {order.customerName}
                  <small>{order.phone}</small>
                </span>
                <span>
                  {order.wilaya}
                  <small>
                    {order.deliveryMethod === "domicile" ? "Domicile" : "Bureau"} / {order.commune || order.address}
                  </small>
                </span>
                <span>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} produit(s)
                  <small>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</small>
                </span>
                <strong>{money(order.total)}</strong>
                <div className="order-actions">
                  <select className={`status-select ${order.status}`} value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}>
                    <option value="new">Nouvelle</option>
                    <option value="progress">En cours</option>
                    <option value="done">Terminee</option>
                    <option value="return">Retour</option>
                    <option value="cancelled">Annulee</option>
                  </select>
                  <button onClick={() => setEditing(order)} aria-label={`Voir la commande ${order.id.slice(0, 8)}`}>
                    <Pencil />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state small">
            <ShoppingCart />
            <h2>Aucune commande</h2>
            <p>Les commandes clients apparaitront ici apres validation du checkout.</p>
          </div>
        )}
      </section>
      {editing && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal compact">
            <div className="admin-modal-head">
              <div>
                <span className="eyebrow">Commande #{editing.id.slice(0, 8)}</span>
                <h2>{editing.customerName}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Fermer">
                <X />
              </button>
            </div>
            <div className="order-detail">
              <p>
                <strong>Telephone</strong>
                <span>{editing.phone}</span>
              </p>
              <p>
                <strong>Adresse</strong>
                <span>{editing.address}</span>
              </p>
              <p>
                <strong>Commune</strong>
                <span>{editing.commune || "-"}</span>
              </p>
              <p>
                <strong>Wilaya</strong>
                <span>{editing.wilaya}</span>
              </p>
              <p>
                <strong>Livraison</strong>
                <span>
                  {editing.deliveryMethod === "domicile" ? "Domicile" : "Bureau"} / {money(editing.shipping)}
                </span>
              </p>
              <label>
                Statut
                <select
                  className={`status-select ${editing.status}`}
                  value={editing.status}
                  onChange={async (event) => {
                    const status = event.target.value as OrderStatus;
                    await updateOrderStatus(editing.id, status);
                    setEditing({ ...editing, status });
                  }}
                >
                  <option value="new">Nouvelle</option>
                  <option value="progress">En cours</option>
                  <option value="done">Terminee</option>
                  <option value="return">Retour</option>
                  <option value="cancelled">Annulee</option>
                </select>
              </label>
              <div className="order-items-detail">
                {editing.items.map((item) => (
                  <div key={`${item.productId}-${item.name}`}>
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <p className="order-total">
                <strong>Total</strong>
                <span>{money(editing.total)}</span>
              </p>
              <em className={editing.status}>{statusLabel(editing.status)}</em>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminShipping() {
  const { shippingRates, saveShippingRates } = useStore();
  const [draft, setDraft] = useState<ShippingRate[]>(shippingRates);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(shippingRates), [shippingRates]);

  const updateRate = (wilaya: string, field: "domicile" | "bureau", value: number) => {
    setDraft((current) => current.map((rate) => (rate.wilaya === wilaya ? { ...rate, [field]: Math.max(0, value) } : rate)));
    setSaved(false);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await saveShippingRates(draft);
    setSaved(true);
  };

  return (
    <form className="admin-table-card" onSubmit={submit}>
      <div className="admin-table-head">
        <div>
          <span className="eyebrow">Tarifs par wilaya</span>
          <h2>Domicile et bureau</h2>
        </div>
        <PressButton type="submit">
          <Check /> Enregistrer
        </PressButton>
      </div>
      {saved && <div className="admin-save-note">Les prix de livraison sont enregistres et utilises dans le checkout.</div>}
      <div className="shipping-table">
        <div className="shipping-head">
          <span>Wilaya</span>
          <span>Domicile</span>
          <span>Bureau</span>
        </div>
        {draft.map((rate) => (
          <div className="shipping-row" key={rate.wilaya}>
            <strong>{rate.wilaya}</strong>
            <label>
              <input min="0" type="number" value={rate.domicile} onChange={(event) => updateRate(rate.wilaya, "domicile", Number(event.target.value))} /> DA
            </label>
            <label>
              <input min="0" type="number" value={rate.bureau} onChange={(event) => updateRate(rate.wilaya, "bureau", Number(event.target.value))} /> DA
            </label>
          </div>
        ))}
      </div>
    </form>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <section className="newsletter">
      <div className="shell">
        <div>
          <span className="eyebrow">La note Rofybell</span>
          <h2>Offres, routines et nouveaux parfums.</h2>
        </div>
        {joined ? (
          <div className="newsletter-thanks">
            <Check /> Inscription confirmee.
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (email) setJoined(true);
            }}
          >
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Votre adresse email" />
            <button className="button dark">
              Je m'inscris <ArrowRight />
            </button>
            <small>Seulement les belles nouvelles.</small>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Cremes, serums, parfums et coffrets avec une experience boutique complete.</p>
          <div>
            <a href="#instagram" aria-label="Instagram">
              <Instagram />
            </a>
            <a href={`mailto:${siteEmail}`} aria-label="Email">
              <Mail />
            </a>
          </div>
        </div>
        <div>
          <strong>Boutique</strong>
          <Link to="/boutique">Tous les produits</Link>
          <Link to="/commande">Commander</Link>
        </div>
        <div>
          <strong>Rofybell</strong>
          <Link to="/a-propos">Rituel</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/admin">Espace admin</Link>
        </div>
        <div>
          <strong>Besoin d'aide ?</strong>
          <a href={`tel:${sitePhone}`}>{sitePhone}</a>
          <a href={`mailto:${siteEmail}`}>{siteEmail}</a>
          <span>Sam - Jeu / 9h - 18h</span>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>2026 Rofybell. Tous droits reserves.</span>
        <span>developed by SITEMAGIQUE</span>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <main className="not-found shell">
      <span>404</span>
      <h1>Cette page n'existe pas.</h1>
      <p>Revenons a la boutique.</p>
      <Link className="button primary" to="/">
        Retour a l'accueil
      </Link>
    </main>
  );
}

function StoreLayout() {
  const location = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), [location.pathname]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/boutique" element={<ShopPage />} />
        <Route path="/produit/:id" element={<ProductPage />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/commande" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <CartDrawer />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={<StoreLayout />} />
        </Routes>
      </CartProvider>
    </LanguageProvider>
  );
}
