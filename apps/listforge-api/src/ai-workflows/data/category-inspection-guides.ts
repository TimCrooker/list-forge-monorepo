/**
 * Category Inspection Guides Database
 *
 * Contains category-specific inspection guides that tell the AI
 * exactly where to look and what to extract for each product type.
 *
 * These guides are based on expert reseller knowledge about:
 * - Where identifying information is located
 * - What codes/patterns to look for
 * - What affects value in each category
 * - Brand-specific quirks and markers
 */

import {
  CategoryInspectionGuide,
  CategoryId,
} from '@listforge/core-types';

/**
 * Luxury Handbags (Louis Vuitton, Chanel, Hermès, Gucci, etc.)
 */
export const luxuryHandbagsGuide: CategoryInspectionGuide = {
  categoryId: 'luxury_handbags',
  categoryName: 'Luxury Handbags & Purses',
  categoryKeywords: [
    'handbag', 'purse', 'tote', 'clutch', 'shoulder bag', 'crossbody',
    'louis vuitton', 'lv', 'chanel', 'hermes', 'gucci', 'prada', 'celine',
    'fendi', 'dior', 'balenciaga', 'bottega veneta', 'ysl', 'saint laurent',
    'coach', 'michael kors', 'kate spade', 'marc jacobs',
  ],
  inspectionRegions: [
    {
      name: 'Interior Stamp/Heat Stamp',
      description: 'Leather stamp inside the bag, usually near an interior pocket or on the interior leather',
      lookFor: ['brand name', 'made in country', 'date code', 'serial number'],
      examplePrompt: 'Look inside the bag for a leather stamp or heat stamp. Read ALL text including any codes like "SD1234", "AR2189", or serial numbers. Note the font style and stamping quality.',
      priority: 10,
      canProvideFields: ['brand', 'model', 'year', 'authenticity'],
    },
    {
      name: 'Hardware Engravings',
      description: 'Text engraved on zippers, clasps, D-rings, and other metal hardware',
      lookFor: ['brand name', 'logo', 'material stamp (925, gold plated)', 'zipper brand'],
      examplePrompt: 'Examine all visible metal hardware including zippers, clasps, chains, D-rings, and buckles. Read any engraved text, logos, or stamps. Note the hardware color (gold, silver, brass).',
      priority: 8,
      canProvideFields: ['brand', 'authenticity'],
    },
    {
      name: 'Main Logo/Embossing',
      description: 'Primary brand logo embossed or printed on the exterior',
      lookFor: ['brand logo', 'monogram pattern', 'logo style'],
      examplePrompt: 'Find the main brand logo or monogram. Note the exact style, depth of embossing, and any variations. For LV, note if monogram is printed or embossed.',
      priority: 9,
      canProvideFields: ['brand', 'model'],
    },
    {
      name: 'Interior Tag/Patch',
      description: 'Fabric or leather tag sewn inside the bag',
      lookFor: ['style number', 'size', 'material composition', 'care instructions'],
      examplePrompt: 'Look for fabric tags or leather patches inside the bag. Read all text including style numbers, size indicators, and material information.',
      priority: 7,
      canProvideFields: ['model', 'size', 'materials'],
    },
    {
      name: 'Zipper Pull',
      description: 'The zipper pull and zipper tape',
      lookFor: ['zipper brand (YKK, Lampo, RiRi)', 'brand logo on pull', 'quality indicators'],
      examplePrompt: 'Examine the zipper closely. Read any text on the zipper pull and zipper tape. Note the brand (authentic bags use specific zipper brands).',
      priority: 6,
      canProvideFields: ['authenticity'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Louis Vuitton Date Code',
      description: 'Two letters (factory) + four digits (week and year)',
      decodingPattern: 'Format: AA#### where AA = factory code, first & third digits = week, second & fourth digits = year. Example: SD1234 = San Dimas factory, week 13, year 2024',
      example: 'SD1234, AR2189, FL0192',
      matchPattern: '^[A-Z]{2}\\d{4}$',
    },
    {
      feature: 'Chanel Serial Number',
      description: 'Serial sticker inside bag + authenticity card',
      decodingPattern: '7-8 digit serial number that should match the authenticity card. Format indicates production year.',
      example: '12345678, 30123456',
      matchPattern: '^\\d{7,8}$',
    },
    {
      feature: 'Hermès Blindstamp',
      description: 'Craftsman mark and year stamp on leather',
      decodingPattern: 'Letter indicates year (A=1997, B=1998... resets every 26 years). Craftsman initials also stamped.',
      example: 'X (2016), A (2017), B (2018)',
      matchPattern: '^[A-Z]$',
    },
  ],
  commonBrands: [
    {
      brand: 'Louis Vuitton',
      identifiers: ['LV monogram', 'date code inside', 'Made in France/USA/Spain/Italy', 'leather tab stamp'],
      modelPatterns: ['Neverfull', 'Speedy', 'Alma', 'Pochette', 'Keepall'],
      authenticityMarkers: ['Date code format', 'Heat stamp depth', 'Stitching count', 'Canvas alignment'],
      priceRange: { min: 200, max: 15000 },
    },
    {
      brand: 'Chanel',
      identifiers: ['CC logo', 'serial sticker', 'authenticity card', 'Made in France/Italy'],
      modelPatterns: ['Classic Flap', 'Boy Bag', 'Gabrielle', 'GST', '2.55'],
      authenticityMarkers: ['Serial sticker matches card', 'Chain weight', 'Quilting alignment'],
      priceRange: { min: 500, max: 20000 },
    },
    {
      brand: 'Hermès',
      identifiers: ['Hermès Paris Made in France stamp', 'blindstamp', 'craftsman mark'],
      modelPatterns: ['Birkin', 'Kelly', 'Constance', 'Evelyne', 'Garden Party'],
      authenticityMarkers: ['Blindstamp', 'Sangles', 'Hand-stitched saddle stitch'],
      priceRange: { min: 1000, max: 100000 },
    },
    {
      brand: 'Gucci',
      identifiers: ['GG monogram', 'serial number tag', 'Made in Italy'],
      modelPatterns: ['Marmont', 'Dionysus', 'Ophidia', 'Jackie'],
      priceRange: { min: 200, max: 5000 },
    },
  ],
  valueDrivers: [
    'Limited edition or collaboration',
    'Discontinued style',
    'Rare color or material (exotic leather)',
    'Size (certain sizes more valuable)',
    'Hardware condition (no tarnish)',
    'Box and dust bag included',
    'Receipt or authenticity card',
    'Vintage/older production date',
  ],
  authenticityMarkers: [
    {
      name: 'Stitching Quality',
      description: 'Authentic bags have consistent, even stitches. Count per inch should be uniform.',
      importance: 'critical',
    },
    {
      name: 'Hardware Weight',
      description: 'Authentic hardware is heavier and more substantial than counterfeit.',
      importance: 'important',
    },
    {
      name: 'Interior Lining',
      description: 'Quality of interior fabric/leather and how cleanly it is attached.',
      importance: 'important',
    },
  ],
  typicalFields: ['brand', 'model', 'color', 'size', 'materials', 'condition', 'year'],
};

/**
 * Sneakers (Nike, Adidas, Jordan, New Balance, etc.)
 */
export const sneakersGuide: CategoryInspectionGuide = {
  categoryId: 'sneakers',
  categoryName: 'Sneakers & Athletic Footwear',
  categoryKeywords: [
    'sneakers', 'shoes', 'kicks', 'trainers', 'runners', 'basketball shoes',
    'nike', 'air jordan', 'jordan', 'adidas', 'yeezy', 'new balance', 'asics',
    'puma', 'reebok', 'converse', 'vans', 'air max', 'dunk', 'force',
  ],
  inspectionRegions: [
    {
      name: 'Size Tag/Label',
      description: 'Label inside the shoe, usually on the tongue or inside the shoe',
      lookFor: ['size', 'style code', 'colorway code', 'production date', 'country of origin'],
      examplePrompt: 'Find the size tag inside the shoe (usually on tongue or interior). Read ALL text including the style code (e.g., "CW2288-111"), size, and production date code. The style code is critical for exact identification.',
      priority: 10,
      canProvideFields: ['model', 'size', 'colorway', 'year'],
    },
    {
      name: 'Box Label',
      description: 'Label on the shoe box with product information',
      lookFor: ['style code', 'colorway name', 'size', 'retail price', 'barcode'],
      examplePrompt: 'Read all information from the box label including style number, color name, size, and UPC barcode. The style code format varies by brand (Nike: XXX-XXX, Adidas: XXXXXX).',
      priority: 10,
      canProvideFields: ['model', 'colorway', 'size', 'upc'],
    },
    {
      name: 'Tongue Logo',
      description: 'Brand logo and any text on the tongue exterior',
      lookFor: ['brand logo', 'model name', 'special edition markings'],
      examplePrompt: 'Examine the tongue exterior for logos, model names, and any special edition markings or collaboration logos.',
      priority: 7,
      canProvideFields: ['brand', 'model'],
    },
    {
      name: 'Heel/Back Tab',
      description: 'Back of the shoe including heel tab and any logos',
      lookFor: ['brand logo', 'model identifier', 'pull tab text'],
      examplePrompt: 'Look at the heel area and back tab. Read any text or logos. For Jordans, note the Jumpman or Wings logo position.',
      priority: 6,
      canProvideFields: ['brand', 'model'],
    },
    {
      name: 'Outsole/Bottom',
      description: 'Bottom of the shoe with size and manufacturing info',
      lookFor: ['size', 'factory code', 'manufacturing date'],
      examplePrompt: 'Check the outsole (bottom) for any size markings, factory codes, or date stamps.',
      priority: 5,
      canProvideFields: ['size', 'year'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Nike Style Code',
      description: 'Unique identifier for each Nike shoe model and colorway',
      decodingPattern: 'Format: XXXXXX-XXX (e.g., CW2288-111). First 6 chars = model, last 3 = colorway.',
      example: 'CW2288-111, DD1391-100, DH7138-006',
      matchPattern: '^[A-Z0-9]{6}-[A-Z0-9]{3}$',
    },
    {
      feature: 'Jordan Style Code',
      description: 'Jordan brand style codes follow Nike format',
      decodingPattern: 'Same as Nike: XXXXXX-XXX. Jordan-specific codes often start with CT, DD, DQ.',
      example: 'CT8532-008, DD9336-103',
      matchPattern: '^[A-Z]{2}\\d{4}-\\d{3}$',
    },
    {
      feature: 'Adidas Article Number',
      description: 'Adidas product identifier',
      decodingPattern: 'Format: XX#### (6 characters). Letter prefix varies by line.',
      example: 'GW2871, FY4393, HP8739',
      matchPattern: '^[A-Z]{2}\\d{4}$',
    },
    {
      feature: 'Production Date Code',
      description: 'Manufacturing date on size tag',
      decodingPattern: 'Usually format MM/DD/YY or factory code + date. Varies by brand.',
      example: '01/15/23, 2301 (Jan 2023)',
    },
  ],
  commonBrands: [
    {
      brand: 'Nike',
      identifiers: ['Swoosh logo', 'Nike Air branding', 'Style code on tag'],
      modelPatterns: ['Air Max', 'Air Force 1', 'Dunk', 'Air Jordan', 'Blazer', 'Cortez'],
      priceRange: { min: 40, max: 2000 },
    },
    {
      brand: 'Air Jordan',
      identifiers: ['Jumpman logo', 'Wings logo', 'Air Jordan text', 'Nike Air heel tab'],
      modelPatterns: ['Jordan 1', 'Jordan 3', 'Jordan 4', 'Jordan 11', 'Jordan 12'],
      priceRange: { min: 80, max: 5000 },
    },
    {
      brand: 'Adidas',
      identifiers: ['Three stripes', 'Trefoil logo', 'Adidas text'],
      modelPatterns: ['Yeezy', 'Ultraboost', 'NMD', 'Stan Smith', 'Superstar', 'Forum'],
      priceRange: { min: 50, max: 1500 },
    },
    {
      brand: 'New Balance',
      identifiers: ['NB logo', 'New Balance text', 'Model number on side'],
      modelPatterns: ['990', '992', '993', '550', '574', '2002R'],
      priceRange: { min: 60, max: 500 },
    },
  ],
  valueDrivers: [
    'Limited release / collaboration',
    'OG (original) vs Retro release',
    'Colorway rarity',
    'Size (popular sizes more valuable)',
    'Deadstock (DS) vs worn condition',
    'Box condition and accessories',
    'Special packaging',
    'Release date / vintage status',
  ],
  typicalFields: ['brand', 'model', 'colorway', 'size', 'condition', 'year'],
};

/**
 * Watches (Rolex, Omega, Seiko, vintage, etc.)
 */
export const watchesGuide: CategoryInspectionGuide = {
  categoryId: 'watches',
  categoryName: 'Watches & Timepieces',
  categoryKeywords: [
    'watch', 'timepiece', 'wristwatch', 'chronograph', 'automatic', 'quartz',
    'rolex', 'omega', 'seiko', 'casio', 'tag heuer', 'breitling', 'cartier',
    'patek philippe', 'audemars piguet', 'iwc', 'tissot', 'citizen', 'timex',
  ],
  inspectionRegions: [
    {
      name: 'Dial/Face',
      description: 'The watch face showing brand, model, and features',
      lookFor: ['brand name', 'model name', 'dial color', 'complications', 'indices'],
      examplePrompt: 'Examine the watch dial carefully. Read the brand name, any model text (e.g., "Submariner", "Speedmaster"), dial color, and note all complications (date, chronograph, moon phase).',
      priority: 10,
      canProvideFields: ['brand', 'model', 'features'],
    },
    {
      name: 'Case Back',
      description: 'Back of the watch case with serial numbers and specifications',
      lookFor: ['serial number', 'model/reference number', 'material', 'water resistance', 'movement info'],
      examplePrompt: 'Read ALL text on the case back including serial numbers, reference numbers, material stamps (Stainless Steel, 18K), water resistance rating, and any engravings.',
      priority: 10,
      canProvideFields: ['model', 'serial', 'materials', 'year'],
    },
    {
      name: 'Crown',
      description: 'The winding crown on the side of the watch',
      lookFor: ['brand logo', 'crown type (screw-down, push)', 'material'],
      examplePrompt: 'Look at the crown. Note if it has a brand logo engraved (Rolex coronet, Omega symbol). Check if it is a screw-down crown.',
      priority: 6,
      canProvideFields: ['brand', 'authenticity'],
    },
    {
      name: 'Bracelet/Strap',
      description: 'The watch band including clasp',
      lookFor: ['brand on clasp', 'model on links', 'material', 'clasp type'],
      examplePrompt: 'Examine the bracelet or strap. Read any text on the clasp (brand, model). Note the material and clasp type (deployment, folding, tang).',
      priority: 7,
      canProvideFields: ['brand', 'materials'],
    },
    {
      name: 'Between Lugs',
      description: 'Area between the lugs where bracelet attaches (often has reference number)',
      lookFor: ['reference number', 'serial number', 'model code'],
      examplePrompt: 'If visible, check between the lugs (at 6 and 12 o\'clock where band attaches) for engraved reference or serial numbers.',
      priority: 8,
      canProvideFields: ['model', 'serial'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Rolex Reference Number',
      description: 'Model identifier for Rolex watches',
      decodingPattern: '4-6 digit reference number. Examples: 116610 (Submariner), 126710 (GMT-Master II)',
      example: '116610, 126710, 16610, 5513',
      matchPattern: '^\\d{4,6}$',
    },
    {
      feature: 'Rolex Serial Number',
      description: 'Production serial for dating the watch',
      decodingPattern: 'Letters and numbers. Modern (2010+) start with random letters. Older have prefix letters indicating year.',
      example: 'Z123456, M738495, Random serial',
    },
    {
      feature: 'Omega Reference',
      description: 'Omega model reference number',
      decodingPattern: 'Multiple formats: Traditional (311.30.42.30.01.005) or vintage (145.022)',
      example: '311.30.42.30.01.005, 210.30.42.20.01.001',
    },
    {
      feature: 'Seiko Movement Code',
      description: 'Movement caliber visible on case back or dial',
      decodingPattern: 'Format: #### (4 digits). Indicates movement type and features.',
      example: '7S26, 4R36, 6R15, NH35',
      matchPattern: '^[A-Z0-9]{4}$',
    },
  ],
  commonBrands: [
    {
      brand: 'Rolex',
      identifiers: ['Rolex coronet logo', 'Oyster Perpetual text', 'Superlative Chronometer'],
      modelPatterns: ['Submariner', 'Datejust', 'GMT-Master', 'Daytona', 'Explorer', 'Sea-Dweller'],
      authenticityMarkers: ['Coronet etched at 6 o\'clock (modern)', 'Serial between lugs', 'Rehaut engraving'],
      priceRange: { min: 3000, max: 100000 },
    },
    {
      brand: 'Omega',
      identifiers: ['Omega symbol', 'Seamaster/Speedmaster text', 'Co-Axial'],
      modelPatterns: ['Speedmaster', 'Seamaster', 'Constellation', 'De Ville'],
      priceRange: { min: 1000, max: 30000 },
    },
    {
      brand: 'Seiko',
      identifiers: ['Seiko text', 'Movement code on back', 'Made in Japan'],
      modelPatterns: ['SKX', 'Presage', 'Prospex', 'Grand Seiko', '5 Sports'],
      priceRange: { min: 50, max: 5000 },
    },
  ],
  valueDrivers: [
    'Box and papers',
    'Service history',
    'Original parts vs replaced',
    'Dial condition (no fading, patina type)',
    'Limited edition or special dial',
    'Bracelet vs strap',
    'Full set vs watch only',
    'Vintage / discontinued',
  ],
  authenticityMarkers: [
    {
      name: 'Movement Inspection',
      description: 'The internal movement should match the reference and show proper finishing.',
      importance: 'critical',
      applicableBrands: ['Rolex', 'Omega', 'Patek Philippe'],
    },
    {
      name: 'Dial Details',
      description: 'Font, printing quality, lume plots should all be correct for the reference.',
      importance: 'critical',
    },
    {
      name: 'Case Proportions',
      description: 'Case dimensions, lug shape, and crown guards should match exactly.',
      importance: 'important',
    },
  ],
  typicalFields: ['brand', 'model', 'reference', 'materials', 'size', 'condition', 'year'],
};

/**
 * Electronics - Phones (iPhone, Samsung, etc.)
 */
export const electronicsPhonesGuide: CategoryInspectionGuide = {
  categoryId: 'electronics_phones',
  categoryName: 'Smartphones & Mobile Devices',
  categoryKeywords: [
    'phone', 'smartphone', 'iphone', 'samsung', 'galaxy', 'pixel', 'android',
    'cell phone', 'mobile', 'oneplus', 'xiaomi', 'huawei',
  ],
  inspectionRegions: [
    {
      name: 'Back/Rear',
      description: 'Back of the phone with model info and regulatory markings',
      lookFor: ['model number', 'storage capacity', 'regulatory info', 'brand logo'],
      examplePrompt: 'Look at the back of the phone. Read the model number (e.g., "A2894" for iPhone), any storage capacity text, and regulatory markings.',
      priority: 10,
      canProvideFields: ['brand', 'model', 'storage'],
    },
    {
      name: 'Settings/About',
      description: 'Phone settings showing model and storage info (if accessible)',
      lookFor: ['model name', 'storage capacity', 'iOS/Android version', 'serial number'],
      examplePrompt: 'If the phone is on and accessible, go to Settings > General > About (iPhone) or Settings > About Phone (Android). Note the model name, capacity, and serial.',
      priority: 10,
      canProvideFields: ['model', 'storage', 'serial'],
    },
    {
      name: 'SIM Tray',
      description: 'SIM card tray often has model number',
      lookFor: ['model number', 'IMEI'],
      examplePrompt: 'If the SIM tray is visible, check for any model numbers or IMEI engraved on it.',
      priority: 6,
      canProvideFields: ['model', 'imei'],
    },
    {
      name: 'Box Label',
      description: 'Product box with full specifications',
      lookFor: ['model', 'storage', 'color', 'IMEI', 'serial number'],
      examplePrompt: 'Read all information from the box label including model name, storage capacity, color, IMEI, and serial number.',
      priority: 9,
      canProvideFields: ['model', 'storage', 'color', 'serial'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'iPhone Model Number',
      description: 'Apple model identifier (A####)',
      decodingPattern: 'Format: A#### (e.g., A2894). Different numbers for different carriers/regions.',
      example: 'A2894, A2651, A2890',
      matchPattern: '^A\\d{4}$',
    },
    {
      feature: 'Samsung Model Number',
      description: 'Samsung model identifier',
      decodingPattern: 'Format: SM-XXXX (e.g., SM-S918U for S23 Ultra)',
      example: 'SM-S918U, SM-G998U, SM-N986U',
      matchPattern: '^SM-[A-Z]\\d{3}[A-Z]?$',
    },
    {
      feature: 'IMEI Number',
      description: 'Unique device identifier',
      decodingPattern: '15-digit number unique to each device. Can verify model and unlock status.',
      example: '353046101234567',
      matchPattern: '^\\d{15}$',
    },
  ],
  commonBrands: [
    {
      brand: 'Apple',
      identifiers: ['Apple logo', 'iPhone text', 'Designed by Apple in California'],
      modelPatterns: ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone SE'],
      priceRange: { min: 100, max: 1500 },
    },
    {
      brand: 'Samsung',
      identifiers: ['Samsung text', 'Galaxy branding'],
      modelPatterns: ['Galaxy S23', 'Galaxy S22', 'Galaxy Z Fold', 'Galaxy Z Flip'],
      priceRange: { min: 100, max: 1200 },
    },
    {
      brand: 'Google',
      identifiers: ['Google G logo', 'Pixel text'],
      modelPatterns: ['Pixel 8', 'Pixel 7', 'Pixel 6'],
      priceRange: { min: 150, max: 900 },
    },
  ],
  valueDrivers: [
    'Storage capacity (64GB vs 256GB vs 512GB)',
    'Color/finish',
    'Carrier locked vs unlocked',
    'Battery health percentage',
    'Cosmetic condition (cracks, scratches)',
    'Accessories included (charger, box)',
    'AppleCare/warranty status',
    'iCloud lock status',
  ],
  typicalFields: ['brand', 'model', 'storage', 'color', 'carrier', 'condition'],
};

/**
 * Electronics - Gaming Consoles
 */
export const electronicsGamingGuide: CategoryInspectionGuide = {
  categoryId: 'electronics_gaming',
  categoryName: 'Gaming Consoles & Handhelds',
  categoryKeywords: [
    'console', 'gaming', 'playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch',
    'game console', 'gaming system', 'series x', 'series s', 'wii', 'handheld',
  ],
  inspectionRegions: [
    {
      name: 'Front/Face',
      description: 'Front of console with branding and model indicators',
      lookFor: ['brand logo', 'model name', 'edition markings'],
      examplePrompt: 'Look at the front of the console for brand logo, model name (PS5, Xbox Series X), and any special edition markings.',
      priority: 9,
      canProvideFields: ['brand', 'model'],
    },
    {
      name: 'Back/Rear Label',
      description: 'Back sticker with model number and serial',
      lookFor: ['model number', 'serial number', 'regulatory info', 'manufacturing date'],
      examplePrompt: 'Find the label on the back or bottom of the console. Read the model number (e.g., CFI-1215A), serial number, and any date codes.',
      priority: 10,
      canProvideFields: ['model', 'serial', 'year'],
    },
    {
      name: 'Controllers',
      description: 'Included controllers and their condition',
      lookFor: ['controller model', 'color', 'special edition'],
      examplePrompt: 'Examine any included controllers. Note the color, any special edition markings, and overall condition.',
      priority: 6,
      canProvideFields: ['accessories'],
    },
    {
      name: 'Box Label',
      description: 'Product box with specifications',
      lookFor: ['model', 'storage', 'bundle contents', 'UPC'],
      examplePrompt: 'Read the box label for model number, storage capacity (for consoles with storage options), included items, and UPC.',
      priority: 8,
      canProvideFields: ['model', 'storage', 'upc'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'PlayStation Model Number',
      description: 'Sony model identifier',
      decodingPattern: 'PS5: CFI-XXXX, PS4: CUH-XXXX. Letter suffix indicates revision.',
      example: 'CFI-1215A, CFI-1015A, CUH-7215B',
      matchPattern: '^C[FU][IH]-\\d{4}[A-Z]?$',
    },
    {
      feature: 'Xbox Model Number',
      description: 'Microsoft model identifier',
      decodingPattern: 'Model number on back label. Format varies by generation.',
      example: '1882 (Series X), 1883 (Series S)',
      matchPattern: '^\\d{4}$',
    },
    {
      feature: 'Nintendo Model Number',
      description: 'Nintendo model identifier',
      decodingPattern: 'Switch: HAC-XXX, Switch OLED: HEG-XXX',
      example: 'HAC-001, HEG-001',
      matchPattern: '^H[AE][CG]-\\d{3}$',
    },
  ],
  commonBrands: [
    {
      brand: 'Sony PlayStation',
      identifiers: ['PlayStation logo', 'PS5/PS4 text'],
      modelPatterns: ['PS5 Digital', 'PS5 Disc', 'PS4 Pro', 'PS4 Slim'],
      priceRange: { min: 150, max: 600 },
    },
    {
      brand: 'Microsoft Xbox',
      identifiers: ['Xbox logo', 'X button'],
      modelPatterns: ['Series X', 'Series S', 'One X', 'One S'],
      priceRange: { min: 150, max: 500 },
    },
    {
      brand: 'Nintendo',
      identifiers: ['Nintendo logo', 'Switch branding'],
      modelPatterns: ['Switch OLED', 'Switch V2', 'Switch Lite'],
      priceRange: { min: 150, max: 400 },
    },
  ],
  valueDrivers: [
    'Storage capacity',
    'Digital vs disc edition',
    'Special/limited edition',
    'Controllers included (quantity and condition)',
    'Original box and accessories',
    'Firmware version (for modding)',
    'Warranty status',
  ],
  typicalFields: ['brand', 'model', 'storage', 'edition', 'condition'],
};

/**
 * Vintage Denim (Levi's, Lee, Wrangler)
 */
export const vintageDenimGuide: CategoryInspectionGuide = {
  categoryId: 'vintage_denim',
  categoryName: 'Vintage Denim & Jeans',
  categoryKeywords: [
    'jeans', 'denim', 'vintage jeans', 'levis', "levi's", 'lee', 'wrangler',
    '501', '505', 'selvedge', 'big e', 'redline', 'vintage denim',
  ],
  inspectionRegions: [
    {
      name: 'Red Tab',
      description: 'Small tab on back pocket (Levi\'s)',
      lookFor: ['LEVI\'S text', 'Big E vs small e', 'tab color and style'],
      examplePrompt: 'Find the red tab on the back pocket. CRITICAL: Is it "LEVI\'S" (Big E - all caps, valuable vintage) or "Levi\'s" (small e - post-1971)? Note exact capitalization.',
      priority: 10,
      canProvideFields: ['brand', 'era', 'value_indicator'],
    },
    {
      name: 'Back Patch',
      description: 'Leather or cardboard patch on waistband',
      lookFor: ['size', 'style number', 'Two Horse logo', 'material (leather vs cardboard)'],
      examplePrompt: 'Examine the back patch. Read the size (e.g., "32 x 32"), style number (501, 505), and note if it\'s leather (older) or cardboard (newer). Look for "Two Horse" brand imagery.',
      priority: 9,
      canProvideFields: ['brand', 'model', 'size'],
    },
    {
      name: 'Care Tag/Label',
      description: 'Inside tag with care instructions and manufacturing info',
      lookFor: ['style number', 'size', 'made in country', 'fabric content', 'care symbols'],
      examplePrompt: 'Find the care tags inside. Read the style number, size, country of manufacture (Made in USA is more valuable), and fabric content.',
      priority: 8,
      canProvideFields: ['model', 'size', 'origin', 'year'],
    },
    {
      name: 'Selvedge Line',
      description: 'Self-edge on inside of outseam (visible when cuffed)',
      lookFor: ['selvedge edge', 'redline', 'selvedge color'],
      examplePrompt: 'Check the inside of the outseam (cuff the jeans). Is there a clean selvedge edge? Note the color (red line is most common, but white, green, pink exist).',
      priority: 9,
      canProvideFields: ['selvedge', 'value_indicator'],
    },
    {
      name: 'Button/Rivets',
      description: 'Main button and rivets',
      lookFor: ['button stamps', 'rivet stamps', 'hidden rivets'],
      examplePrompt: 'Examine the main button and rivets. Read any stamps (factory numbers, brand logos). Are there hidden rivets on back pockets (older feature)?',
      priority: 7,
      canProvideFields: ['era', 'authenticity'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Levi\'s Big E vs Small e',
      description: 'Capitalization of "LEVI\'S" indicates era',
      decodingPattern: 'Big E (all caps "LEVI\'S") = pre-1971, very valuable. Small e ("Levi\'s") = post-1971.',
      example: 'LEVI\'S (Big E, vintage) vs Levi\'s (small e)',
    },
    {
      feature: 'Levi\'s Care Tag Date',
      description: 'Care tag style can date the jeans',
      decodingPattern: 'No care tag = pre-1971. Single care tag = 1971-1983. Modern tags post-1983.',
    },
    {
      feature: 'Selvedge Denim',
      description: 'Self-finished edge on denim, indicator of quality/vintage',
      decodingPattern: 'Redline selvedge = more valuable. White selvedge also exists. No selvedge = modern mass production.',
    },
    {
      feature: 'Made in USA',
      description: 'Country of manufacture affects value',
      decodingPattern: 'Made in USA = more valuable (especially for Levi\'s). Mexico, various Asian countries = less valuable.',
    },
  ],
  commonBrands: [
    {
      brand: "Levi's",
      identifiers: ['Red tab', 'Two Horse patch', 'LEVI\'S/Levi\'s branding'],
      modelPatterns: ['501', '505', '517', '550', '560', '606'],
      priceRange: { min: 20, max: 5000 },
    },
    {
      brand: 'Lee',
      identifiers: ['Lee logo', 'Lazy S back pocket stitch'],
      modelPatterns: ['101', 'Rider', 'Storm Rider'],
      priceRange: { min: 20, max: 500 },
    },
    {
      brand: 'Wrangler',
      identifiers: ['W stitching on back pocket', 'Wrangler patch'],
      modelPatterns: ['13MWZ', '936', 'Cowboy Cut'],
      priceRange: { min: 15, max: 300 },
    },
  ],
  valueDrivers: [
    'Big E vs small e (Levi\'s)',
    'Selvedge/redline',
    'Made in USA',
    'Era (1950s-60s most valuable)',
    'Condition (fades, wear patterns)',
    'Size (popular sizes more liquid)',
    'Original buttons/rivets',
    'No alterations',
  ],
  authenticityMarkers: [
    {
      name: 'Stitching Color',
      description: 'Original vintage Levi\'s used orange thread. Modern reproductions sometimes use different colors.',
      importance: 'important',
      applicableBrands: ["Levi's"],
    },
    {
      name: 'Rivet Style',
      description: 'Rivet construction changed over decades. Hidden rivets, copper vs aluminum all indicate era.',
      importance: 'important',
    },
  ],
  typicalFields: ['brand', 'model', 'size', 'era', 'condition', 'selvedge'],
};

/**
 * Designer Clothing
 */
export const designerClothingGuide: CategoryInspectionGuide = {
  categoryId: 'designer_clothing',
  categoryName: 'Designer Clothing & Apparel',
  categoryKeywords: [
    'designer', 'luxury', 'gucci', 'prada', 'versace', 'balenciaga', 'off-white',
    'supreme', 'bape', 'burberry', 'fendi', 'givenchy', 'ysl', 'dior', 'valentino',
  ],
  inspectionRegions: [
    {
      name: 'Main Label',
      description: 'Primary brand label (usually at neck or waist)',
      lookFor: ['brand name', 'made in country', 'logo style', 'label material'],
      examplePrompt: 'Find the main brand label. Read all text including brand name, "Made in" country, and any collection/season info. Note if label is woven or printed.',
      priority: 10,
      canProvideFields: ['brand', 'origin'],
    },
    {
      name: 'Care Label',
      description: 'Tag with size, materials, and care instructions',
      lookFor: ['size', 'material composition', 'style number', 'season code'],
      examplePrompt: 'Find the care label. Read size, material percentages (e.g., "100% Cotton"), style numbers, and any season codes.',
      priority: 9,
      canProvideFields: ['size', 'materials', 'model'],
    },
    {
      name: 'Authenticity Tag',
      description: 'Serial number or QR code tag',
      lookFor: ['serial number', 'QR code', 'RFID tag', 'authenticity certificate'],
      examplePrompt: 'Look for any authenticity features: serial number tags, QR codes, RFID chips, or attached certificates. Read all numbers/codes.',
      priority: 8,
      canProvideFields: ['serial', 'authenticity'],
    },
    {
      name: 'Hardware/Details',
      description: 'Zippers, buttons, and other hardware',
      lookFor: ['branded zippers', 'button logos', 'rivet stamps'],
      examplePrompt: 'Check all hardware - zippers, buttons, snaps. Look for brand engravings or logos on hardware.',
      priority: 6,
      canProvideFields: ['authenticity'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Style Number',
      description: 'Product identifier on care label',
      decodingPattern: 'Varies by brand. Often includes season code and style info.',
      example: 'Gucci: 123456, Prada: UCS123',
    },
    {
      feature: 'Season Code',
      description: 'Indicates collection/season',
      decodingPattern: 'Format varies. Examples: SS23 (Spring/Summer 2023), FW22 (Fall/Winter 2022)',
      example: 'SS23, FW22, Pre-Fall 2023',
    },
  ],
  commonBrands: [
    {
      brand: 'Gucci',
      identifiers: ['GG monogram', 'Interlocking G', 'Made in Italy'],
      priceRange: { min: 100, max: 5000 },
    },
    {
      brand: 'Supreme',
      identifiers: ['Box logo', 'Supreme text', 'Red and white'],
      priceRange: { min: 50, max: 2000 },
    },
    {
      brand: 'Balenciaga',
      identifiers: ['Balenciaga text', 'BB logo', 'Oversized fit'],
      priceRange: { min: 200, max: 3000 },
    },
    {
      brand: 'Off-White',
      identifiers: ['Diagonal stripes', 'Quotation marks', '"OFF"/"WHITE" text'],
      priceRange: { min: 100, max: 1500 },
    },
  ],
  valueDrivers: [
    'Limited collaboration',
    'Runway/mainline vs diffusion',
    'Vintage/discontinued',
    'Celebrity association',
    'Size (popular sizes)',
    'Tags attached vs removed',
    'Receipt or proof of purchase',
  ],
  typicalFields: ['brand', 'model', 'size', 'materials', 'season', 'condition'],
};

/**
 * Trading Cards (Pokemon, Sports, MTG, etc.)
 */
export const tradingCardsGuide: CategoryInspectionGuide = {
  categoryId: 'trading_cards',
  categoryName: 'Trading Cards & Collectible Cards',
  categoryKeywords: [
    'card', 'trading card', 'pokemon', 'baseball', 'basketball', 'football',
    'magic', 'mtg', 'yugioh', 'sports card', 'psa', 'bgs', 'graded',
  ],
  inspectionRegions: [
    {
      name: 'Card Front',
      description: 'Main image side with player/character and card info',
      lookFor: ['player/character name', 'card name', 'set symbol', 'card number', 'rarity'],
      examplePrompt: 'Read all text on the card front: player/character name, card number (e.g., #/123), set symbol, rarity symbol, year, and any parallel/variant indicators (holo, refractor).',
      priority: 10,
      canProvideFields: ['name', 'set', 'number', 'rarity'],
    },
    {
      name: 'Card Back',
      description: 'Back of card with copyright and additional info',
      lookFor: ['copyright year', 'manufacturer', 'card back style'],
      examplePrompt: 'Check the card back for copyright year, manufacturer info, and back style (useful for identifying vintage vs modern).',
      priority: 7,
      canProvideFields: ['year', 'manufacturer'],
    },
    {
      name: 'Grade Label (if graded)',
      description: 'PSA/BGS/CGC grading label',
      lookFor: ['grade number', 'cert number', 'grading company', 'subgrades'],
      examplePrompt: 'If the card is graded, read the label: grading company (PSA, BGS, CGC), grade number (1-10), certification number, and any subgrades.',
      priority: 10,
      canProvideFields: ['grade', 'certification', 'grader'],
    },
    {
      name: 'Card Edges/Corners',
      description: 'Condition indicators for raw cards',
      lookFor: ['corner wear', 'edge whitening', 'surface scratches', 'centering'],
      examplePrompt: 'Examine the card\'s physical condition: corner sharpness, edge wear, surface scratches, centering (is image centered?).',
      priority: 6,
      canProvideFields: ['condition'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Card Number',
      description: 'Position in the set',
      decodingPattern: 'Format: #/total (e.g., 25/150). Short prints may have different numbering.',
      example: '25/150, RC (Rookie Card), SP (Short Print)',
    },
    {
      feature: 'Set Symbol/Code',
      description: 'Identifies which set the card is from',
      decodingPattern: 'Each set has unique symbol (Pokemon) or code (sports cards).',
      example: 'Base Set, 1st Edition, Topps Chrome',
    },
    {
      feature: 'PSA Cert Number',
      description: 'Unique certification for graded cards',
      decodingPattern: '8-digit number. Can be verified at psacard.com',
      example: '12345678',
      matchPattern: '^\\d{8}$',
    },
  ],
  commonBrands: [
    {
      brand: 'Pokemon',
      identifiers: ['Pokemon logo', 'Nintendo/Creatures/Game Freak copyright'],
      priceRange: { min: 1, max: 500000 },
    },
    {
      brand: 'Topps',
      identifiers: ['Topps logo', 'Baseball/Basketball/Football'],
      priceRange: { min: 1, max: 100000 },
    },
    {
      brand: 'Panini',
      identifiers: ['Panini logo', 'NBA/NFL license'],
      priceRange: { min: 1, max: 50000 },
    },
  ],
  valueDrivers: [
    'Grade (PSA 10 vs PSA 9)',
    'Player/character popularity',
    '1st Edition vs unlimited',
    'Rookie card status',
    'Parallel/refractor/holo type',
    'Short print or insert',
    'Autograph or memorabilia',
    'Population (how many graded this high)',
  ],
  typicalFields: ['name', 'set', 'year', 'number', 'rarity', 'grade', 'condition'],
};

/**
 * Audio Equipment
 */
export const audioEquipmentGuide: CategoryInspectionGuide = {
  categoryId: 'audio_equipment',
  categoryName: 'Audio Equipment & Hi-Fi',
  categoryKeywords: [
    'speaker', 'headphones', 'amplifier', 'receiver', 'turntable', 'record player',
    'bose', 'sonos', 'jbl', 'sony', 'sennheiser', 'audio technica', 'pioneer',
    'vintage audio', 'stereo', 'subwoofer', 'soundbar',
  ],
  inspectionRegions: [
    {
      name: 'Front Panel',
      description: 'Main face with brand and model',
      lookFor: ['brand name', 'model name/number', 'features'],
      examplePrompt: 'Read the front panel: brand name, model number (often printed prominently), and any feature indicators.',
      priority: 9,
      canProvideFields: ['brand', 'model'],
    },
    {
      name: 'Back Panel/Label',
      description: 'Rear with specifications and serial',
      lookFor: ['model number', 'serial number', 'power specs', 'manufacturing info'],
      examplePrompt: 'Check the back panel for model number, serial number, power specifications (watts, impedance), and country of manufacture.',
      priority: 10,
      canProvideFields: ['model', 'serial', 'specifications'],
    },
    {
      name: 'Driver/Speaker Cone',
      description: 'Speaker driver details (for speakers)',
      lookFor: ['driver size', 'brand on driver', 'driver type'],
      examplePrompt: 'If visible, examine the speaker drivers. Note size (e.g., 8 inch woofer), brand, and type (paper cone, Kevlar, etc.).',
      priority: 6,
      canProvideFields: ['specifications'],
    },
  ],
  identifyingFeatures: [
    {
      feature: 'Model Number',
      description: 'Unique product identifier',
      decodingPattern: 'Varies by brand. Often includes series and features.',
      example: 'Sony WH-1000XM5, Bose 700, JBL Flip 6',
    },
  ],
  commonBrands: [
    {
      brand: 'Sony',
      identifiers: ['Sony logo'],
      modelPatterns: ['WH-1000XM', 'WF-1000XM', 'SRS-'],
      priceRange: { min: 50, max: 500 },
    },
    {
      brand: 'Bose',
      identifiers: ['Bose text'],
      modelPatterns: ['QuietComfort', 'SoundLink', '700'],
      priceRange: { min: 100, max: 400 },
    },
    {
      brand: 'JBL',
      identifiers: ['JBL logo'],
      modelPatterns: ['Flip', 'Charge', 'Xtreme', 'Boombox'],
      priceRange: { min: 50, max: 400 },
    },
  ],
  valueDrivers: [
    'Condition (working perfectly)',
    'Original accessories (cables, case)',
    'Vintage/discontinued status',
    'Special edition',
    'Battery health (for wireless)',
  ],
  typicalFields: ['brand', 'model', 'type', 'condition'],
};

/**
 * General/Fallback category
 */
export const generalGuide: CategoryInspectionGuide = {
  categoryId: 'general',
  categoryName: 'General Products',
  categoryKeywords: [],
  inspectionRegions: [
    {
      name: 'Main Label/Brand',
      description: 'Primary branding on the product',
      lookFor: ['brand name', 'logo', 'model information'],
      examplePrompt: 'Find any visible brand name, logo, or model number on the product. Read all text that could identify what this product is.',
      priority: 10,
      canProvideFields: ['brand', 'model'],
    },
    {
      name: 'Tags/Labels',
      description: 'Any attached tags with product information',
      lookFor: ['product name', 'model number', 'SKU', 'UPC', 'price tag'],
      examplePrompt: 'Look for any tags or labels. Read product names, model numbers, SKUs, UPC barcodes, or price tags.',
      priority: 9,
      canProvideFields: ['model', 'upc', 'price'],
    },
    {
      name: 'Packaging/Box',
      description: 'Product packaging if available',
      lookFor: ['product name', 'model', 'features', 'UPC'],
      examplePrompt: 'If packaging is visible, read all product information including name, model, features, and barcode.',
      priority: 8,
      canProvideFields: ['model', 'brand', 'upc'],
    },
    {
      name: 'Manufacturing Info',
      description: 'Made in country, date codes, etc.',
      lookFor: ['made in country', 'date code', 'batch number'],
      examplePrompt: 'Look for any manufacturing information: country of origin, date codes, batch numbers.',
      priority: 6,
      canProvideFields: ['origin', 'year'],
    },
  ],
  identifyingFeatures: [],
  commonBrands: [],
  valueDrivers: [
    'Brand recognition',
    'Condition',
    'Completeness (all parts included)',
    'Original packaging',
    'Working condition',
  ],
  typicalFields: ['brand', 'model', 'condition', 'description'],
};

/**
 * All category inspection guides indexed by category ID
 */
export const CATEGORY_INSPECTION_GUIDES: Record<CategoryId, CategoryInspectionGuide> = {
  luxury_handbags: luxuryHandbagsGuide,
  sneakers: sneakersGuide,
  watches: watchesGuide,
  electronics_phones: electronicsPhonesGuide,
  electronics_computers: generalGuide, // TODO: Create specific guide
  electronics_gaming: electronicsGamingGuide,
  vintage_denim: vintageDenimGuide,
  designer_clothing: designerClothingGuide,
  vintage_tshirts: generalGuide, // TODO: Create specific guide
  trading_cards: tradingCardsGuide,
  vinyl_records: generalGuide, // TODO: Create specific guide
  collectible_toys: generalGuide, // TODO: Create specific guide
  jewelry: generalGuide, // TODO: Create specific guide
  art_prints: generalGuide, // TODO: Create specific guide
  camera_equipment: generalGuide, // TODO: Create specific guide
  audio_equipment: audioEquipmentGuide,
  sporting_goods: generalGuide, // TODO: Create specific guide
  musical_instruments: generalGuide, // TODO: Create specific guide
  tools_equipment: generalGuide, // TODO: Create specific guide
  general: generalGuide,
};

/**
 * Get the inspection guide for a category
 */
export function getCategoryInspectionGuide(categoryId: CategoryId): CategoryInspectionGuide {
  return CATEGORY_INSPECTION_GUIDES[categoryId] || generalGuide;
}

/**
 * Get all keywords for category detection
 */
export function getAllCategoryKeywords(): Map<string, CategoryId> {
  const keywordMap = new Map<string, CategoryId>();

  for (const guide of Object.values(CATEGORY_INSPECTION_GUIDES)) {
    for (const keyword of guide.categoryKeywords) {
      keywordMap.set(keyword.toLowerCase(), guide.categoryId);
    }
  }

  return keywordMap;
}
