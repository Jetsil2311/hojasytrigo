// Sample data for the demo. Every name, phone number and order here is
// invented. Phone numbers use the 555-01xx range reserved for fiction.
//
// Bump SEED_VERSION whenever the shape of this data changes: browsers holding
// an older copy will reload the fresh sample data automatically.

import { BUSINESS_NAME, DEMO_PIN } from '../config/demo'

export const SEED_VERSION = 7

// ── Option groups (product schema: { id, name, type, required, options[] }) ──
// Menu source: Hojas y Trigo's Canva menu (bison-pfjxkq.my.canva.site), Oct 2026.
// Prices are the café's published prices in MXN.

const opt = (id, name, priceModifier = 0) => ({ id, name, priceModifier })
const group = (id, name, options, { type = 'single', required = true } = {}) => ({ id, name, type, required, options })

const chilaquilesSalsa = () => group('salsa', 'Salsa', [
  opt('verdes', 'Verdes'), opt('rojos', 'Rojos'), opt('mole', 'Mole', 10),
  opt('encacahuatados', 'Encacahuatados', 10), opt('morita', 'Morita', 10),
])

// ── Menu ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'calientes', icon: 'coffee', name: 'Café y Bebidas Calientes', category: 'Bebidas', order: 0,
    desc: 'Para empezar la mañana sin prisa. Espresso de especialidad, cacao de verdad y especias de temporada.',
  },
  {
    id: 'frias', icon: 'cup-soda', name: 'Bebidas Frías', category: 'Bebidas', order: 1,
    desc: 'Para cuando el mediodía ya calienta. Matchas, malteadas, sodas con esferas y un carajillo para la sobremesa.',
  },
  {
    id: 'jugos', icon: 'citrus', name: 'Jugos Naturales', category: 'Bebidas', order: 2,
    desc: 'Verdes o frutales, recién hechos. El arranque ligero antes del brunch.',
  },
  {
    id: 'fruta', icon: 'cherry', name: 'Fruta y Açaí', category: 'Alimentos', order: 3,
    desc: 'Lo fresco primero. Fruta de temporada y açaí cremoso para abrir el apetito.',
  },
  {
    id: 'sazon', icon: 'egg-fried', name: 'Del Sazón de la Casa', category: 'Alimentos', order: 4,
    desc: 'Los desayunos de siempre, con el sazón de la casa. Huevos al gusto y molletes bien servidos.',
  },
  {
    id: 'chilaquiles', icon: 'soup', name: 'Chilaquiles y Enchiladas', category: 'Alimentos', order: 5,
    desc: 'El corazón del brunch mexicano. Los chilaquiles llegan con pan y frijoles.',
  },
  {
    id: 'panaderia', icon: 'wheat', name: 'Panadería y Dulce', category: 'Alimentos', order: 6,
    desc: 'Para la mesa que pide algo dulce. Pregunta también por el pan dulce artesanal del día.',
  },
  {
    id: 'chapatas', icon: 'sandwich', name: 'Chapatas y Rollos', category: 'Alimentos', order: 7,
    desc: 'Pan artesanal de masa madre, bien relleno. Para cuando el antojo ya es hambre.',
  },
  {
    id: 'burgers', icon: 'burger', name: 'Hamburguesas y Hot Dogs', category: 'Alimentos', order: 8,
    desc: 'El antojo de fin de semana. Sirloin, tocino y quesos sin medirse.',
  },
  {
    id: 'ensaladas', icon: 'salad', name: 'Ensaladas y Bowls', category: 'Alimentos', order: 9,
    desc: 'Ligeras, pero con carácter. Quesos, nueces y frutos rojos sobre hojas frescas.',
  },
]

const TOPPINGS = [
  { id: 'huevo', name: 'Huevo', price: 15, description: 'Al gusto, para coronar tu plato.' },
  { id: 'pechuga', name: 'Pechuga asada', price: 35, description: null },
  { id: 'milanesa', name: 'Milanesa', price: 45, description: null },
  { id: 'arrachera', name: 'Arrachera de res', price: 50, description: null },
  { id: 'helado', name: 'Helado de vainilla Häagen-Dazs', price: 25, description: 'Una bola sobre el pan tibio.' },
]

const EXTRAS_SALADOS = ['huevo', 'pechuga', 'milanesa', 'arrachera']

const PRODUCTS = [
  // Café y Bebidas Calientes
  {
    id: 'americano', section: 'Café y Bebidas Calientes', name: 'Americano', price: 55, icon: 'coffee',
    desc: 'Espresso alargado, redondo y sin complicaciones. Elige tu carga.',
    long_desc: 'Sencillo para acompañar, doble carga de espresso para los días largos.',
    optionGroups: [group('carga', 'Carga', [opt('sencillo', 'Sencillo'), opt('doble', 'Doble carga', 15)])],
  },
  {
    id: 'capuchino', section: 'Café y Bebidas Calientes', name: 'Capuchino Natural', price: 75, icon: 'coffee',
    desc: 'Espresso y leche espumada en partes iguales, como debe ser.',
    long_desc: 'La espuma densa que pide una buena conversación.',
  },
  {
    id: 'latte', section: 'Café y Bebidas Calientes', name: 'Latte Natural', price: 85, icon: 'milk',
    desc: 'Más leche, menos prisa. Suave de principio a fin.',
    long_desc: 'Espresso de especialidad con leche texturizada.',
  },
  {
    id: 'capuchino-sabor', section: 'Café y Bebidas Calientes', name: 'Capuchino de Sabor', price: 85, icon: 'coffee',
    desc: 'El capuchino de siempre con el sabor que te pida el día. Elige tu sabor favorito.',
    long_desc: 'Nueve sabores para escoger, del tiramisú al mocha blanco.',
    optionGroups: [group('sabor', 'Sabor', [
      opt('chocomenta', 'Chocomenta'), opt('chocolate', 'Chocolate'), opt('mazapan', 'Mazapán'),
      opt('tiramisu', 'Tiramisú'), opt('caramelo', 'Caramelo'), opt('vainilla', 'Vainilla'),
      opt('avellana', 'Avellana'), opt('mocha', 'Mocha'), opt('mocha-blanco', 'Mocha blanco'),
    ])],
  },
  {
    id: 'capuchino-pistache', section: 'Café y Bebidas Calientes', name: 'Capuchino Pistache', price: 85, icon: 'coffee',
    desc: 'Escarchado con crema y pistache natural, para quien quiere algo distinto.',
    long_desc: 'Capuchino con escarchado de crema y pistache natural.',
  },
  {
    id: 'pumpkin-spice', section: 'Café y Bebidas Calientes', name: 'Pumpkin Spice Latte', price: 95, icon: 'milk', popular: true,
    desc: 'Calabaza y especias tibias en taza. Sabe a temporada de frío.',
    long_desc: 'El latte de temporada de la casa.',
  },
  {
    id: 'cacao', section: 'Café y Bebidas Calientes', name: 'Cacao Xibalbá 70 %', price: 85, icon: 'coffee',
    desc: 'Cacao al 70 %, intenso y profundo, para quien no toma café.',
    long_desc: 'Chocolate caliente de cacao al 70 %.',
  },
  {
    id: 'tisana', section: 'Café y Bebidas Calientes', name: 'Tisana', price: 75, icon: 'flower',
    desc: 'Una pausa tibia y sin cafeína entre bocado y bocado.',
    long_desc: 'Infusión de la casa, servida caliente.',
  },
  {
    id: 'matcha-caliente', section: 'Café y Bebidas Calientes', name: 'Matcha', price: 85, icon: 'leaf',
    desc: 'Verde, suave y con energía tranquila.',
    long_desc: 'Matcha batido con leche caliente.',
  },
  {
    id: 'dirty-chai', section: 'Café y Bebidas Calientes', name: 'Dirty Chai', price: 85, icon: 'leaf',
    desc: 'Chai especiado con un shot de espresso. Lo mejor de los dos mundos.',
    long_desc: 'Chai latte con espresso.',
  },

  // Bebidas Frías
  {
    id: 'matcha-frio', section: 'Bebidas Frías', name: 'Matcha Frío', price: 85, icon: 'leaf',
    desc: 'Matcha sobre hielo, en su versión clásica o con un giro. Elige tu sabor favorito.',
    long_desc: 'Disponible natural, con fresa o con horchata.',
    optionGroups: [group('sabor', 'Sabor', [opt('natural', 'Matcha'), opt('strawberry', 'Strawberry'), opt('horchata', 'Horchata')])],
  },
  {
    id: 'matcha-coco', section: 'Bebidas Frías', name: 'Matcha Coco', price: 95, icon: 'leaf',
    desc: 'Matcha y coco, fresco y un poco tropical.',
    long_desc: 'Matcha frío con coco.',
  },
  {
    id: 'horchata-latte', section: 'Bebidas Frías', name: 'Horchata Latte', price: 85, icon: 'cup-soda', popular: true,
    desc: 'Horchata y espresso sobre hielo. Recomendación de la casa.',
    long_desc: 'Una de las favoritas de la casa.',
  },
  {
    id: 'hawai', section: 'Bebidas Frías', name: 'Hawái', price: 85, icon: 'citrus',
    desc: 'Carambola y coffeeberry con mineral, para recargar sin café de por medio.',
    long_desc: 'Carambola, cafeína, coffeeberry, vitamina B12, L-teanina y guaraná con agua mineral.',
  },
  {
    id: 'bacalar', section: 'Bebidas Frías', name: 'Bacalar', price: 90, icon: 'cup-soda',
    desc: 'Smoothie de maracuyá, mango y piña. Una laguna en vaso.',
    long_desc: 'Maracuyá, mango y piña licuados.',
  },
  {
    id: 'panchito-pantera', section: 'Bebidas Frías', name: 'Panchito Pantera', price: 90, icon: 'cup-soda',
    desc: 'La bebida de la casa con nombre propio. Pregunta por ella en barra.',
    long_desc: 'Creación de la casa.',
  },
  {
    id: 'malteada', section: 'Bebidas Frías', name: 'Malteada', price: 95, icon: 'ice-cream',
    desc: 'Espesa, fría y hecha con helado. Elige tu sabor favorito.',
    long_desc: 'Todas se preparan con helado.',
    optionGroups: [group('sabor', 'Sabor', [
      opt('chocolate', 'Chocolate'), opt('mazapan', 'Mazapán'), opt('fresa', 'Fresa'), opt('taro', 'Taro'), opt('oreo', 'Oreo'),
    ])],
  },
  {
    id: 'soda-italiana', section: 'Bebidas Frías', name: 'Soda Italiana con Esferas', price: 75, icon: 'cup-soda',
    desc: 'Burbujas frutales con esferas que revientan en cada sorbo. Elige tu sabor.',
    long_desc: 'Soda italiana con esferas de sabor.',
    optionGroups: [group('sabor', 'Sabor', [
      opt('blueberry', 'Blueberry'), opt('maracuya', 'Maracuyá'), opt('fresa', 'Fresa'), opt('kiwi', 'Kiwi'), opt('manzana-verde', 'Manzana verde'),
    ])],
  },
  {
    id: 'smoothie', section: 'Bebidas Frías', name: 'Smoothie', price: 85, icon: 'cup-soda',
    desc: 'Fruta licuada hasta quedar sedosa. Elige tu sabor favorito.',
    long_desc: 'Seis sabores para escoger.',
    optionGroups: [group('sabor', 'Sabor', [
      opt('pina-colada', 'Piña colada'), opt('taro', 'Taro'), opt('fresa', 'Fresa'), opt('mango', 'Mango'),
      opt('maracuya', 'Maracuyá'), opt('dragonfruit', 'Dragonfruit'),
    ])],
  },
  {
    id: 'espresso-tonic', section: 'Bebidas Frías', name: 'Espresso Tónic', price: 95, icon: 'glass',
    desc: 'Agua tónica y espresso sobre hielo, amargo y burbujeante.',
    long_desc: 'Espresso servido sobre agua tónica fría.',
  },
  {
    id: 'carajillo', section: 'Bebidas Frías', name: 'Carajillo', price: 125, icon: 'martini',
    desc: 'Espresso y licor, agitados con hielo. El cierre de la sobremesa.',
    long_desc: 'Para mayores de edad.',
  },
  {
    id: 'refresco', section: 'Bebidas Frías', name: 'Refresco o Agua Mineral', price: 45, icon: 'glass',
    desc: 'Coca-Cola, Boing o agua mineral, bien frías.',
    long_desc: 'Pregunta también por la degustación de cerveza artesanal (según disponibilidad).',
    optionGroups: [group('bebida', 'Bebida', [opt('coca-cola', 'Coca-Cola'), opt('boing', 'Boing'), opt('mineral', 'Agua mineral')])],
  },

  // Jugos Naturales
  {
    id: 'aloha', section: 'Jugos Naturales', name: 'Aloha', price: 65, icon: 'citrus',
    desc: 'Piña, limón, naranja y espinaca. El verde que sí se antoja.',
    long_desc: 'Piña, limón, naranja y espinaca.',
  },
  {
    id: 'hula', section: 'Jugos Naturales', name: 'Hula', price: 65, icon: 'citrus',
    desc: 'Manzana, limón, naranja y piña. Dulce y despierto.',
    long_desc: 'Manzana, limón, naranja y piña.',
  },
  {
    id: 'nani', section: 'Jugos Naturales', name: 'Nani', price: 65, icon: 'cherry',
    desc: 'Naranja con frutos rojos, ácido en el punto justo.',
    long_desc: 'Naranja y frutos rojos.',
  },

  // Fruta y Açaí
  {
    id: 'acai', section: 'Fruta y Açaí', name: 'Açaí Bowl', price: 125, icon: 'cherry', popular: true,
    desc: 'Mezcla cremosa de açaí con fruta congelada de temporada. Elige tu base.',
    long_desc: 'Cremosa mezcla con fruta congelada de temporada.',
    optionGroups: [group('base', 'Base', [opt('frutos-rojos', 'Frutos rojos'), opt('cacao-banana', 'Cacao y banana')])],
  },
  {
    id: 'bowl-fruta', section: 'Fruta y Açaí', name: 'Bowl de Fruta Picada', price: 65, icon: 'salad',
    desc: 'Fruta fresca de temporada, picada al momento.',
    long_desc: 'Fruta de temporada.',
  },

  // Del Sazón de la Casa
  {
    id: 'huevos-mexicana', section: 'Del Sazón de la Casa', name: 'Huevos a la Mexicana', price: 125, icon: 'egg',
    desc: 'Jitomate, cebolla y chile, revueltos como en casa.',
    long_desc: 'El desayuno mexicano de siempre.',
  },
  {
    id: 'omelette', section: 'Del Sazón de la Casa', name: 'Omelette de la Casa', price: 125, icon: 'egg-fried',
    desc: 'Esponjoso y bien relleno, con ensalada tropical al lado.',
    long_desc: 'Se sirve con ensalada tropical.',
  },
  {
    id: 'huevos-divorciados', section: 'Del Sazón de la Casa', name: 'Huevos Divorciados', price: 145, icon: 'egg-fried',
    desc: 'Dos huevos, dos salsas y una tortilla a tu gusto. Elige tus salsas.',
    long_desc: 'Salsa verde, roja o mole. La tortilla puede ir frita o blanda.',
    optionGroups: [
      group('salsas', 'Salsas', [opt('verde-roja', 'Verde y roja'), opt('verde-mole', 'Verde y mole'), opt('roja-mole', 'Roja y mole')]),
      group('tortilla', 'Tortilla', [opt('frita', 'Frita'), opt('blanda', 'Blanda')]),
    ],
  },
  {
    id: 'molletes', section: 'Del Sazón de la Casa', name: 'Molletes de la Casa', price: 125, icon: 'wheat',
    desc: 'Pan tostado, frijoles y queso gratinado. Elige tu guiso.',
    long_desc: 'Con longaniza, milanesa, cochinita o jamón.',
    optionGroups: [group('guiso', 'Guiso', [opt('longaniza', 'Longaniza'), opt('milanesa', 'Milanesa'), opt('cochinita', 'Cochinita'), opt('jamon', 'Jamón')])],
    toppingIds: EXTRAS_SALADOS,
  },
  {
    id: 'molletes-guajolotes', section: 'Del Sazón de la Casa', name: 'Molletes Guajolotes', price: 155, icon: 'wheat',
    desc: 'Molletes con chilaquiles encima, pollo, queso, crema y frijoles. Sin culpa.',
    long_desc: 'De chilaquiles rojos o verdes con pollo, queso, crema y frijoles.',
    optionGroups: [group('chilaquiles', 'Chilaquiles', [opt('rojos', 'Rojos'), opt('verdes', 'Verdes')])],
    toppingIds: EXTRAS_SALADOS,
  },

  // Chilaquiles y Enchiladas
  {
    id: 'chilaquiles', section: 'Chilaquiles y Enchiladas', name: 'Chilaquiles', price: 115, icon: 'soup', popular: true,
    desc: 'Totopo crujiente bañado en la salsa que elijas, con pan y frijoles. Elige tu salsa.',
    long_desc: 'Se sirven con pan y frijoles. Agrégales huevo, pechuga, milanesa o arrachera.',
    optionGroups: [chilaquilesSalsa()],
    toppingIds: EXTRAS_SALADOS,
  },
  {
    id: 'enchiladas', section: 'Chilaquiles y Enchiladas', name: 'Enchiladas', price: 115, icon: 'soup',
    desc: 'Tortilla rellena y bañada, suizas cremosas o rojas con carácter. Elige tu salsa.',
    long_desc: 'Enchiladas suizas o rojas.',
    optionGroups: [group('salsa', 'Salsa', [opt('suizas', 'Suizas'), opt('rojas', 'Rojas')])],
    toppingIds: EXTRAS_SALADOS,
  },
  {
    id: 'enmoladas', section: 'Chilaquiles y Enchiladas', name: 'Enmoladas Veracruzanas', price: 125, icon: 'soup', popular: true,
    desc: 'Mole de receta veracruzana sobre tortilla suave. Recomendación de la casa.',
    long_desc: 'Una de las recomendaciones de la casa.',
    toppingIds: EXTRAS_SALADOS,
  },
  {
    id: 'enfrijoladas', section: 'Chilaquiles y Enchiladas', name: 'Enfrijoladas', price: 115, icon: 'soup',
    desc: 'Tortillas bañadas en frijol cremoso, sencillas y reconfortantes.',
    long_desc: 'Bañadas en salsa de frijol.',
    toppingIds: EXTRAS_SALADOS,
  },

  // Panadería y Dulce
  {
    id: 'pan-frances', section: 'Panadería y Dulce', name: 'Pan Francés de la Casa', price: 125, icon: 'wheat', popular: true,
    desc: 'Brioche, queso, crema de avellanas, fresas y betún de queso. Postre y desayuno a la vez.',
    long_desc: 'Pan brioche, queso, crema de avellanas, fresas y betún de queso. Agrégale helado de vainilla Häagen-Dazs.',
    toppingIds: ['helado'],
  },
  {
    id: 'pan-frances-pistache', section: 'Panadería y Dulce', name: 'Pan Francés Pistache', price: 150, icon: 'wheat',
    desc: 'Brioche dorado con crema de pistache natural.',
    long_desc: 'Delicioso pan brioche con crema de pistache natural.',
    toppingIds: ['helado'],
  },
  {
    id: 'club-waffles', section: 'Panadería y Dulce', name: 'Club Waffles', price: 105, icon: 'cake',
    desc: 'Tres waffles con chocolate, fruta y betún, para compartir o no.',
    long_desc: '3 waffles con chocolate, fruta y betún.',
  },
  {
    id: 'hot-cakes', section: 'Panadería y Dulce', name: 'Hot Cakes de la Casa', price: 115, icon: 'cake',
    desc: 'Cuatro piezas con fruta de la estación. Elige con qué los bañamos.',
    long_desc: '4 piezas acompañadas de fruta de la estación.',
    optionGroups: [group('cobertura', 'Cobertura', [opt('betun', 'Betún de la casa'), opt('avellanas', 'Crema de avellanas'), opt('lechera', 'Lechera')])],
  },

  // Chapatas y Rollos
  {
    id: 'chapata-casa', section: 'Chapatas y Rollos', name: 'Chapata de la Casa', price: 125, icon: 'sandwich', popular: true,
    desc: 'La chapata que más recomendamos, en pan artesanal de masa madre.',
    long_desc: 'Recomendación de la casa. Pan artesanal de masa madre.',
  },
  {
    id: 'chapata-arrachera', section: 'Chapatas y Rollos', name: 'Chapata de Arrachera', price: 150, icon: 'beef',
    desc: 'Arrachera jugosa en masa madre crujiente.',
    long_desc: 'Pan artesanal de masa madre.',
  },
  {
    id: 'chapata-milaqueso', section: 'Chapatas y Rollos', name: 'Chapata Milaqueso', price: 135, icon: 'sandwich',
    desc: 'Milanesa dorada y queso fundido, el antojo completo.',
    long_desc: 'Pan artesanal de masa madre.',
  },
  {
    id: 'chapata-tocino', section: 'Chapatas y Rollos', name: 'Chapata de Tocino', price: 125, icon: 'sandwich',
    desc: 'Tocino crujiente en pan de masa madre recién tostado.',
    long_desc: 'Pan artesanal de masa madre.',
  },
  {
    id: 'chapata-vegetariana', section: 'Chapatas y Rollos', name: 'Chapata Vegetariana', price: 120, icon: 'salad',
    desc: 'Vegetales frescos en masa madre, sin que falte nada.',
    long_desc: 'Pan artesanal de masa madre.',
  },
  {
    id: 'chapata-cheesesteak', section: 'Chapatas y Rollos', name: 'Chapata Cheesesteak', price: 170, icon: 'beef',
    desc: 'Carne y queso derretido, al estilo cheesesteak.',
    long_desc: 'Pan artesanal de masa madre.',
  },
  {
    id: 'chapata-serrano', section: 'Chapatas y Rollos', name: 'Chapata de Jamón Serrano', price: 150, icon: 'ham',
    desc: 'Jamón serrano en pan de masa madre, sencilla y elegante.',
    long_desc: 'Pan artesanal de masa madre.',
  },
  {
    id: 'rollo-agridulce', section: 'Chapatas y Rollos', name: 'Rollo Agridulce', price: 115, icon: 'sandwich',
    desc: 'Pollo, queso de cabra, arándanos y vegetales, entre lo dulce y lo salado.',
    long_desc: 'Pollo, queso de cabra, arándanos y vegetales.',
  },
  {
    id: 'rollo-arrachera', section: 'Chapatas y Rollos', name: 'Rollo de Arrachera', price: 145, icon: 'beef',
    desc: 'Arrachera con queso Monterrey y vegetales, todo enrollado.',
    long_desc: 'Queso Monterrey con carne y vegetales.',
  },

  // Hamburguesas y Hot Dogs
  {
    id: 'hamburguesa-casa', section: 'Hamburguesas y Hot Dogs', name: 'Hamburguesa de la Casa', price: 150, icon: 'burger',
    desc: 'Sirloin, tocino, champiñones y quesos. La de siempre, bien hecha.',
    long_desc: 'Sirloin, tocino, champiñones y quesos.',
  },
  {
    id: 'hamburguesa-especial', section: 'Hamburguesas y Hot Dogs', name: 'Hamburguesa Especial', price: 175, icon: 'burger',
    desc: 'Sirloin y trufa negra bañados en salsa especial de quesos.',
    long_desc: 'Sirloin, tocino, champiñones, trufa negra y queso americano en una salsa especial de quesos.',
  },
  {
    id: 'hamburguesa-hawaiana', section: 'Hamburguesas y Hot Dogs', name: 'Hamburguesa Hawaiana', price: 125, icon: 'burger',
    desc: 'El toque dulce de la piña contra lo salado de la carne.',
    long_desc: 'Hamburguesa con piña.',
  },
  {
    id: 'hot-dog-artesanal', section: 'Hamburguesas y Hot Dogs', name: 'Hot Dog Artesanal', price: 115, icon: 'sandwich',
    desc: 'Salchicha, carne y queso, con papas al lado.',
    long_desc: 'Salchicha, carne, queso y papas.',
  },
  {
    id: 'hot-dog-arrachera', section: 'Hamburguesas y Hot Dogs', name: 'Hot Dog de Arrachera', price: 150, icon: 'beef',
    desc: 'El hot dog subido de nivel con arrachera.',
    long_desc: 'Hot dog con arrachera.',
  },
  {
    id: 'alitas', section: 'Hamburguesas y Hot Dogs', name: 'Alitas o Boneless', price: 115, icon: 'drumstick',
    desc: 'Con verdura y papas. Elige corte y salsa.',
    long_desc: 'Picosas o agridulces, acompañadas de verdura y papas.',
    optionGroups: [
      group('corte', 'Corte', [opt('alitas', 'Alitas'), opt('boneless', 'Boneless')]),
      group('salsa', 'Salsa', [opt('picosas', 'Picosas'), opt('agridulce', 'Agridulce')]),
    ],
  },
  {
    id: 'club-sandwich', section: 'Hamburguesas y Hot Dogs', name: 'Club Sándwich de Jamón', price: 95, icon: 'sandwich',
    desc: 'El clásico de tres pisos, para comer con calma.',
    long_desc: 'Club sándwich de jamón.',
  },
  {
    id: 'maxi-gringa', section: 'Hamburguesas y Hot Dogs', name: 'Maxi Gringa', price: 135, icon: 'beef',
    desc: 'Tortilla de harina grande, queso fundido y el relleno que elijas.',
    long_desc: 'Tortilla de harina con queso, de cochinita o de arrachera.',
    optionGroups: [group('relleno', 'Relleno', [opt('cochinita', 'Cochinita'), opt('arrachera', 'Arrachera', 15)])],
  },

  // Ensaladas y Bowls
  {
    id: 'ensalada-verano', section: 'Ensaladas y Bowls', name: 'Ensalada Verano', price: 115, icon: 'salad',
    desc: 'Fruta, parmesano, aguacate, almendra y arándano. Fresca de punta a punta.',
    long_desc: 'Fruta, queso parmesano, aguacate, almendra y arándano.',
    toppingIds: ['pechuga', 'arrachera'],
  },
  {
    id: 'ensalada-campestre', section: 'Ensaladas y Bowls', name: 'Ensalada Campestre', price: 155, icon: 'salad',
    desc: 'Queso de cabra, frutos rojos y nueces garapiñadas.',
    long_desc: 'Queso de cabra, frutos rojos y nueces garapiñadas.',
    toppingIds: ['pechuga', 'arrachera'],
  },
  {
    id: 'ensalada-clasica', section: 'Ensaladas y Bowls', name: 'Ensalada Clásica', price: 115, icon: 'salad',
    desc: 'Jitomate, pepino, zanahoria y queso panela. Sin rodeos.',
    long_desc: 'Jitomate, pepino, zanahoria y queso panela.',
    toppingIds: ['pechuga', 'arrachera'],
  },
  {
    id: 'bowl-casa', section: 'Ensaladas y Bowls', name: 'Bowl de la Casa', price: 145, icon: 'salad',
    desc: 'Espinaca, arúgula, edamames y quinoa con la proteína que elijas.',
    long_desc: 'Base de espinacas y arúgula, edamames, quinoa y pollo o atún.',
    optionGroups: [group('proteina', 'Proteína', [opt('pollo', 'Pollo'), opt('atun', 'Atún')])],
    toppingIds: ['pechuga', 'arrachera'],
  },
]

const CAROUSEL = [
  { id: 'slide-pumpkin', linkedId: 'pumpkin-spice', altText: 'De temporada', order: 0 },
  { id: 'slide-chilaquiles', linkedId: 'chilaquiles', altText: 'El clásico del brunch', order: 1 },
  { id: 'slide-pistache', linkedId: 'pan-frances-pistache', altText: 'Para el antojo dulce', order: 2 },
]

const CUSTOMERS = [
  ['Renata Cienfuegos', 1], ['Mateo Arredondo', 2], ['Regina Villaseñor', 3],
  ['Joaquín Escamilla', 4], ['Lucía Bárcenas', 5], ['Tomás Zamudio', 6],
  ['Iker Saucedo', 7], ['Renée Ballesteros', 8], ['Julián Covarrubias', 9],
  ['Inés Larrañaga', 10], ['Bruno Echeverría', 11], ['Constanza Peralta', 12],
  ['Damián Ochoa', 13], ['Elisa Montalvo', 14],
]

// ── Deterministic randomness so every fresh demo looks the same ──────────────

const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

const DAY = 86400000

const dayKey = (ms) => {
  const d = new Date(ms)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

const lineTotal = (it) =>
  (it.price
    + it.selectedOptions.reduce((s, o) => s + o.priceModifier, 0)
    + it.selectedToppings.reduce((s, t) => s + t.price, 0)) * it.qty

const contentFor = (items, total) => [
  `Pedido ${BUSINESS_NAME}`, '', 'Items:',
  ...items.map((it, i) => `${i + 1}. ${it.qty} x ${it.name} - $${lineTotal(it).toFixed(2)}`),
  '', `Total: $${total.toFixed(2)}`,
].join('\n')

export const buildSeed = (nowMs) => {
  const rand = rng(20261025)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const today = new Date(nowMs)
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()

  const toppingById = Object.fromEntries(TOPPINGS.map((t) => [t.id, t]))
  const sellable = PRODUCTS.filter((p) => p.isActive !== false)

  // Popular products show up more often in the order history.
  const weighted = sellable.flatMap((p) => (p.popular ? [p, p, p, p] : [p]))

  const makeItem = (p) => {
    const selectedOptions = []
    ;(p.optionGroups || []).forEach((g) => {
      if (g.required || rand() < 0.35) {
        const opt = pick(g.options)
        selectedOptions.push({ groupId: g.id, groupName: g.name, optionId: opt.id, optionName: opt.name, priceModifier: opt.priceModifier })
      }
    })
    const selectedToppings = (p.toppingIds || [])
      .filter(() => rand() < 0.2)
      .map((id) => ({ id, name: toppingById[id].name, price: toppingById[id].price }))
    return {
      id: p.id, name: p.name, price: p.price, qty: rand() < 0.2 ? 2 : 1, itemNote: null,
      selectedOptions, selectedToppings,
    }
  }

  const customers = {}
  CUSTOMERS.forEach(([name, n], i) => {
    const id = `cliente-${n}`
    customers[id] = {
      name,
      phone: `55555501${String(n).padStart(2, '0')}`,
      loyaltyBalance: 0,
      visitCount: 0,
      createdAt: new Date(todayStart - (40 + i * 9) * DAY + 10 * 3600000),
      lastVisit: new Date(todayStart - (40 + i * 9) * DAY + 10 * 3600000),
    }
  })
  const customerIds = Object.keys(customers)

  const orders = {}
  const sessions = {}
  let seq = 1

  for (let back = 29; back >= 0; back--) {
    const dayStart = todayStart - back * DAY
    const isToday = back === 0
    const weekday = new Date(dayStart).getDay()
    const base = weekday === 0 || weekday === 6 ? 13 : 9
    const count = isToday ? 9 : base + Math.floor(rand() * 6)

    let cashSales = 0
    let cardSales = 0
    let loyaltyRedemptions = 0

    for (let k = 0; k < count; k++) {
      let createdAt
      if (isToday && k >= count - 4) {
        // The orders still in progress arrived in the last few minutes.
        createdAt = nowMs - [18, 12, 7, 3][k - (count - 4)] * 60000
      } else if (isToday) {
        // Spread today's paid orders over the last few hours so "today" is never empty.
        createdAt = nowMs - (count - k) * 24 * 60000 - Math.floor(rand() * 8 * 60000)
      } else {
        createdAt = dayStart + (8 * 60 + Math.floor(rand() * 12 * 60)) * 60000
      }

      const items = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => makeItem(pick(weighted)))
      const total = items.reduce((s, it) => s + lineTotal(it), 0)
      const fromMenu = rand() < 0.3
      const customerId = rand() < 0.3 ? customerIds[Math.floor(rand() ** 2.6 * customerIds.length)] : null

      let status = 'Pagado'
      if (isToday && k >= count - 4) status = ['Listo', 'Preparando', 'Nuevo', 'Nuevo'][k - (count - 4)]

      const paid = status === 'Pagado'
      const cash = paid && rand() < 0.45 ? total : 0
      const card = paid ? total - cash : 0
      cashSales += cash
      cardSales += card

      const loyaltyEarned = customerId && paid ? Math.round(total * 0.1 * 100) / 100 : 0
      if (customerId) {
        const c = customers[customerId]
        c.loyaltyBalance = Math.round((c.loyaltyBalance + loyaltyEarned) * 100) / 100
        c.visitCount += 1
        c.lastVisit = new Date(createdAt)
      }

      const id = `orden-${String(seq).padStart(4, '0')}`
      orders[id] = {
        orderId: `${fromMenu ? 'MN' : 'POS'}-${String(1000 + seq)}`,
        items,
        total,
        content: contentFor(items, total),
        status,
        source: fromMenu ? 'menu' : 'pos',
        paymentMethods: paid ? { cash, card, loyalty: 0 } : null,
        customerId,
        customerName: customerId ? customers[customerId].name : null,
        generalNote: !paid && k === count - 1 ? 'Para llevar, por favor.' : null,
        loyaltyEarned,
        loyaltyRedeemed: 0,
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt + 6 * 60000),
      }
      seq++
    }

    if (back <= 14) {
      const key = dayKey(dayStart)
      const deposits = []
      const withdrawals = isToday
        ? [{ amount: 120, description: 'Compra de hielo', ts: new Date(nowMs - 95 * 60000).toISOString() }]
        : []
      const openingFloat = 500
      const expected = openingFloat + cashSales - withdrawals.reduce((s, w) => s + w.amount, 0)
      const variance = isToday ? 0 : [0, 0, 0, -10, 5, 0, -20][Math.floor(rand() * 7)]
      sessions[key] = {
        date: key,
        openingFloat,
        cashSales,
        cardSales,
        loyaltyRedemptions,
        deposits,
        withdrawals,
        closingCash: isToday ? null : expected + variance,
        isClosed: !isToday,
        createdAt: new Date(dayStart + 7.5 * 3600000),
        ...(isToday ? {} : { closedAt: new Date(dayStart + 21 * 3600000) }),
      }
    }
  }

  const parkedItems = [makeItem(PRODUCTS.find((p) => p.id === 'latte')), makeItem(PRODUCTS.find((p) => p.id === 'pan-frances'))]

  return {
    settings: {
      general: {
        orderNotificationPhone: '',
        adminPin: DEMO_PIN,
        pinGateConfig: {
          overview: false, metricas: false, promociones: false, menu: false,
          pedidos: false, pos: false, clientes: false, caja: false,
        },
        loyaltyConfig: { mode: 'cashback', percent: 10 },
        printingEnabled: false,
        printMethod: 'windows',
        receiptBusinessName: BUSINESS_NAME,
        receiptFooterMessage: 'Gracias por tu visita. Vuelve pronto.',
        autoPrintOnPayment: false,
      },
    },
    sections: Object.fromEntries(SECTIONS.map((s) => [s.id, { ...s, visible: true, image: '' }])),
    products: Object.fromEntries(PRODUCTS.map((p, i) => [p.id, {
      ...p,
      order: i,
      isActive: p.isActive ?? true,
      optionGroups: p.optionGroups || [],
      toppingIds: p.toppingIds || [],
      imageUrl: '',
      image: '',
      flavors: [],
    }])),
    toppings: Object.fromEntries(TOPPINGS.map(({ id, ...t }) => [id, { ...t, isActive: true }])),
    carousel: Object.fromEntries(CAROUSEL.map(({ id, ...s }) => [id, { ...s, linkType: 'product', active: true, imageUrl: '' }])),
    promotions: {
      'promo-viernes': {
        title: 'Viernes de cafetería por la noche',
        message: 'Los viernes abrimos de 18:30 a 21:30 solo para cafetería.',
        isActive: true,
        createdAt: new Date(todayStart - 3 * DAY),
      },
      'promo-domicilio': {
        title: 'Servicio a domicilio',
        message: 'Haz tu pedido por teléfono al 55 2696 6163.',
        isActive: false,
        createdAt: new Date(todayStart - 20 * DAY),
      },
    },
    customers,
    orders,
    parked_orders: {
      'apartado-1': {
        orderId: 'POS-0999',
        items: parkedItems,
        total: parkedItems.reduce((s, it) => s + lineTotal(it), 0),
        status: 'Nuevo',
        source: 'pos',
        customer: { id: 'cliente-3', name: customers['cliente-3'].name, phone: customers['cliente-3'].phone },
        generalNote: 'Pasa por él en 15 minutos.',
        parkedAt: new Date(nowMs - 12 * 60000),
      },
    },
    register_sessions: sessions,
  }
}
