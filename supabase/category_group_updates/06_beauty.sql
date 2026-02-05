-- GROUP 6: Beauty & Personal Care
UPDATE rawdata_yellowpage_new
SET category_group = 'Beauty & Personal Care'
WHERE category_name IN (
  'Artificial Nails',
  'Barbers & Barber Shops',
  'Beauty Courses',
  'Beauty Salon Supplies & Equipment',
  'Beauty Salons',
  'Body & Ear Piercing',
  'Cosmetic Store',
  'Cosmetic Surgery',
  'Day Spas',
  'Hair Care Products',
  'Hair Removal',
  'Hair Treatment & Replacement',
  'Hairdressers',
  'Hairdressing Courses',
  'Hairdressing Supplies',
  'Make-Up Artists & Supplies',
  'Spray Tanning',
  'Sunglasses',
  'Tattoo Removal'
);
