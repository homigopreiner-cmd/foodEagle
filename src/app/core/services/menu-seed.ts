import { FoodCategory, MenuItem } from '../models/platform.model';

/**
 * First-run catalogue.
 *
 * Before this change the customer app carried its dishes as hard-coded
 * arrays inside pages, which is exactly why only the customer side could
 * ever change anything. Those dishes now live here ONCE, get loaded into
 * the shared MenuService, and from then on the vendor app owns them.
 *
 * Ownership is spread over the three campus stores so the admin league
 * table has something real to rank.
 *
 * Every dish carries a LONG-form description (2–3 sentences) because the
 * food-details card shows it verbatim — one short line made the details
 * screen look empty. The dishes added here deliberately use remote photos
 * (Unsplash) so they are not repeats of the images already shipped in
 * assets/images.
 */
export const SEED_MENU_ITEMS: MenuItem[] = [
  // ---- The Red Eagle Nook: coffee, drinks and rice meals -----------------
  item('1', 'red-eagle-nook', 'Spanish Latte', 'Sweet Iced Coffee',
    'Our bestseller: a creamy Spanish-style latte built on a double shot of espresso, sweet condensed milk and fresh milk, then poured over ice so it stays strong to the last sip. It is the drink most students reach for during an early morning class, and it is ordered hot just as often as it is iced.',
    100, 4.7, 128, ['drinks', 'popular'], 'assets/images/spanish-latte.jpe'),
  item('9', 'red-eagle-nook', 'Coffee Jelly', 'Iced Coffee Jelly',
    'A cold brew-based coffee shake loaded with wobbly cubes of rich coffee gelatin, lightly sweetened so the coffee flavour still comes through. The jelly gives every straw-full a chewy texture — it is the Nook answer to a dessert you can drink between lectures.',
    10, 4.9, 76, ['drinks', 'desserts'], 'assets/images/coffee_jelly.jpg'),
  item('6', 'red-eagle-nook', 'Chicken Thigh Plate', 'Chicken, Rice, Egg',
    'A sizzling hot plate meal served with a juicy fried chicken thigh, savoury brown gravy, a mound of yellow garlic rice and a fried egg on top. The plate arrives still hissing, so the gravy keeps coating the rice as you eat — it is the most-ordered rice meal in the Nook.',
    70, 4.9, 210, ['meals', 'popular'], 'assets/images/chicken_thigh.jpg'),
  item('10', 'red-eagle-nook', 'Sizzling Pork Sisig', 'Sisig, Rice, Egg',
    'Chopped grilled pork face and belly seasoned with calamansi, onions and chilli, served sizzling on a cast-iron plate with garlic rice and a fresh egg cracked over the top. Mix the egg in while it is hot and every bite stays rich — a campus classic for lunch.',
    60, 4.9, 320, ['meals', 'popular'], 'assets/images/sisig.jpg'),
  item('2', 'red-eagle-nook', 'Black Gulaman', 'Jelly & Grass Drink',
    'A refreshing cold sweet beverage made with firm gelatin and grass-jelly cubes swimming in a brown-sugar (arnibal) syrup, poured over crushed ice. Light, chewy and only mildly sweet, it is the go-to cooler for the midday heat between classes.',
    10, 4.9, 98, ['drinks'], 'assets/images/black gulaman.jpg'),
  item('n1', 'red-eagle-nook', 'Iced Americano', 'Double Espresso & Water',
    'A clean, no-nonsense double espresso lengthened with chilled water and a full glass of ice — bold, unsweetened and fully customisable at the counter. Ask for a shot of vanilla if you want it softer, but most order it black to cut through an afternoon slump.',
    70, 4.6, 54, ['drinks'], 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80'),
  item('n2', 'red-eagle-nook', 'Okinawa Pearl Milk Tea', 'Brown Sugar Milk Tea',
    'Freshly brewed black milk tea sweetened with Okinawa-style brown sugar and finished with chewy tapioca pearls cooked in small batches throughout the day. Served over ice with a wide straw so you get pearls in every pull — the Nook milk-tea favourite.',
    85, 4.9, 92, ['drinks', 'popular'], 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80'),
  item('n3', 'red-eagle-nook', 'Wintermelon Cheese Cream', 'Milk Tea with Cream Foam',
    'Sweet wintermelon milk tea topped with a thick layer of salted cream-cheese foam that you drink straight through, no straw needed. The salty foam cuts the caramel sweetness of the wintermelon — refreshing, filling and easy to share with a classmate.',
    95, 4.8, 67, ['drinks'], 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80'),
  item('n4', 'red-eagle-nook', 'Caramel Macchiato', 'Espresso, Vanilla & Caramel',
    'Espresso layered over vanilla-flavoured milk and finished with a generous drizzle of caramel — sweet, smooth and a little stronger than it looks. Served hot or over ice, it is the treat order for someone who wants coffee but not bitterness.',
    110, 4.9, 73, ['drinks', 'popular'], 'https://images.unsplash.com/photo-1485808191679-edf8637cb6a6?auto=format&fit=crop&w=600&q=80'),
  item('n5', 'red-eagle-nook', 'Classic Beef Tapsilog', 'Cured Beef, Garlic Rice, Egg',
    'Cured beef slices fried just until the edges crisp, served with a heap of garlic fried rice and a sunny-side-up egg — the classic Filipino breakfast plate any time of day. The beef is marinated overnight so it stays savoury and tender even when it is served cold.',
    105, 4.8, 61, ['meals'], 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80'),
  item('n6', 'red-eagle-nook', 'Crispy Pork Tocilog', 'Sweet Pork, Garlic Rice, Egg',
    'Sweet-marinated pork slices fried to a deep caramel glaze, paired with garlicky fried rice and a fried egg. The sweet-salty contrast makes it one of the most ordered breakfast plates on campus — comfort food that travels well to the canteen benches.',
    95, 4.6, 48, ['meals'], 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'),

  // ---- yanfayes: Ilocano grill and fried favourites -----------------------
  item('100', 'yanfayes', 'Dinakdakan', 'Ilocano Pork Sisig Style',
    'Chopped grilled pork tossed with raw onions, calamansi and bird\'s-eye chilli — an Ilocano classic finished with a spoon of creamy mayonnaise instead of pig brains. Smoky, tangy and best eaten with hot rice and an extra squeeze of calamansi.',
    50, 4.8, 86, ['meals', 'popular'], 'assets/images/dinakdakan.webp'),
  item('7', 'yanfayes', 'Fried Siomai', 'Fried Siomai',
    'Golden-fried pork-and-shrimp dumplings with a shattering crust, served with a house chilli-garlic dip and calamansi on the side. Ordered by the piece so you can grab a five-piece stack for merienda or share a plate between friends.',
    5, 4.8, 165, ['snacks'], 'assets/images/Fried siomai.jpg'),
  item('8', 'yanfayes', 'Corndog', 'Corndog',
    'A juicy hotdog wrapped in mozzarella and sealed inside a crispy golden corn batter, fried to order and dusted with a little sugar or drizzled with ketchup and mayo. Pull it apart slowly for the cheese stretch — the most photographed snack at the stall.',
    10, 4.9, 190, ['snacks', 'popular'], 'assets/images/corndog.jpg'),
  item('4', 'yanfayes', 'Cheese Stick', 'Cheese Stick',
    'Thin spring-roll wrappers rolled around a soft cheese centre, fried until blistered and dusted generously with savoury cheese powder. Crispy on the outside and squeaky in the middle — five pieces is the standard merienda order.',
    5, 4.9, 112, ['snacks'], 'assets/images/cheese stick.jpg'),
  item('5', 'yanfayes', 'Cheese Balls', 'Cheese Balls',
    'Bite-sized breaded spheres of molten cheese, fried deep golden and served with a sweet chilli dipping sauce on the side. Crunchy outside, stretchy inside — best shared while they are still hot.',
    10, 4.9, 87, ['snacks'], 'assets/images/Cheese ball.jpg'),
  item('n7', 'yanfayes', 'Chicken Curry', 'Chicken, Coconut Milk, Vegetables',
    'Tender chicken pieces simmered in rich coconut milk with curry powder, potatoes and carrots until the sauce turns thick and golden. Spooned over rice, it is the comfort lunch our regulars come back for on rainy afternoons.',
    95, 4.8, 74, ['meals', 'popular'], 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80'),
  item('n8', 'yanfayes', 'Pork Adobo', 'Soy-Vinegar Braised Pork',
    'Classic Filipino adobo: pork belly slow-cooked in soy sauce, vinegar, garlic and bay leaves until the fat renders and the sauce reduces to a glossy glaze. Simple, savoury and arguably the national dish — ours is cooked in small batches twice a day so it never sits.',
    90, 4.9, 96, ['meals', 'popular'], 'https://images.unsplash.com/photo-1626500155161-5c219cd6969a?auto=format&fit=crop&w=600&q=80'),
  item('n9', 'yanfayes', 'Pinakbet', 'Vegetables in Shrimp Paste',
    'Fresh local vegetables — squash, string beans, eggplant and bitter gourd — sautéed in shrimp paste and topped with crispy pork bits. A lighter rice meal that still tastes like a proper lutong bahay, and the best way to get a serving of vegetables on a budget.',
    80, 4.7, 52, ['meals'], 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'),
  item('n10', 'yanfayes', 'Pork BBQ Skewers', 'Grilled Sweet-Savoury Pork',
    'Thin slices of pork marinated in soy sauce, calamansi, garlic and a touch of banana ketchup, then grilled over charcoal until the edges char. Two sticks with rice is the classic merienda; eaten straight off the stick with a vinegar dip is the classic mistake.',
    35, 4.9, 118, ['snacks', 'popular'], 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'),

  // ---- DDK Corner: street snacks, sweets and cold drinks -----------------
  item('14', 'ddk-corner', 'Bananaque', 'Sweet Fried Bananas',
    'Classic Filipino street snack made with caramelised saba bananas skewered on bamboo sticks, cooked in a shallow pool of brown sugar until it sets into a glossy crackly shell. Two bananas per order, best eaten warm before the caramel softens.',
    20, 4.9, 140, ['snacks', 'popular'], 'assets/images/bananaque.jpg'),
  item('11', 'ddk-corner', 'Taho', 'Taho',
    'Warm soft silken tofu spooned fresh from the barrel with sweet brown-sugar syrup (arnibal) and chewy sago pearls, served in a cup with a wooden stick. The campus taho vendor route is a tradition — ours tastes the same as the one outside the gate.',
    20, 5.0, 280, ['desserts', 'popular'], 'assets/images/Taho.jpg'),
  item('12', 'ddk-corner', 'Turon', 'Crispy Banana Rolls',
    'Crispy deep-filled spring rolls packed with sweet saba banana slices and a scatter of jackfruit, rolled in brown sugar that melts into the wrapper as it fries. Crunchy, warm and cheap enough to order two — the after-class snack of choice.',
    7, 4.8, 155, ['snacks', 'desserts'], 'assets/images/turon.jpg'),
  item('13', 'ddk-corner', 'Yakult', 'Probiotic Milk Drink',
    'Chilled probiotic cultured milk drink straight from the ice chest, small bottle, sweet-tangy and easy to knock back between classes. A popular add-on to any fried order — most students grab two.',
    10, 4.9, 105, ['drinks'], 'assets/images/yakult.jpg'),
  item('3', 'ddk-corner', 'Pinoy Sorbetes Buns', 'Soft Buns (Pack of 6)',
    'Freshly baked soft bread rolls sold in a pack of six, slightly sweet and pillowy enough to split open for ice cream or a slather of butter. Best paired with hot coffee from the Nook or a scoop of sorbetes on a hot afternoon.',
    25, 4.9, 54, ['desserts'], 'assets/images/bread.jpg'),
  item('n11', 'ddk-corner', 'Crispy Fried Chicken', 'Golden Fried Chicken',
    'Chicken pieces brined overnight, dredged in seasoned flour and fried until the crust shatters and the meat stays juicy — served with steamed rice or gravy, your choice. The lunch-time bestseller at the corner, cooked in small batches so it is never sitting under a lamp.',
    85, 4.8, 132, ['meals', 'popular'], 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80'),
  item('n12', 'ddk-corner', 'Steamed Siomai (5 pcs)', 'Pork & Shrimp Dumplings',
    'Five plump pork-and-shrimp dumplings steamed to order and served with a chilli-garlic soy sauce for dipping. Soft wrappers, a springy filling and enough for a full merienda — add rice if you are making a meal of it.',
    45, 4.7, 88, ['snacks'], 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80'),
  item('101', 'ddk-corner', 'Sweet Bananaque', 'Banana Cue Stick',
    'Deep-fried saba bananas coated in caramelised brown sugar that sets into a crackly shell, served on a bamboo skewer. Slightly smaller and sweeter than the regular Bananaque — the two-stick order is the classic afternoon merienda.',
    15, 4.8, 42, ['snacks', 'popular'], 'assets/images/bananaque.jpg'),
  item('n13', 'ddk-corner', 'Grilled Sausage Meal', 'Sausage, Egg & Garlic Rice',
    'Juicy grilled sausages sliced and served with a fried egg and garlic rice — a quick, filling plate for students skipping the long canteen line. Add the house banana ketchup for the sweet-savoury bite the corner is known for.',
    75, 4.6, 46, ['meals'], 'https://images.unsplash.com/photo-1594998893017-36147ccfffd0?auto=format&fit=crop&w=600&q=80'),
];

function item(
  id: string,
  vendorId: string,
  title: string,
  subtitle: string,
  description: string,
  price: number,
  rating: number,
  reviews: number,
  category: FoodCategory[],
  imageUrl: string
): MenuItem {
  const now = new Date().toISOString();
  return {
    id,
    vendorId,
    title,
    subtitle,
    description,
    price,
    rating,
    reviews,
    distance: '0.5 km',
    category,
    imageUrl,
    available: true,
    createdAt: now,
    updatedAt: now,
  };
}
