-- GROUP 10: Real Estate & Property
UPDATE rawdata_yellowpage_new
SET category_group = 'Real Estate & Property'
WHERE category_name IN (
  'Apartments & Flats',
  'B&B - Bed & Breakfast Accommodation',
  'Backpackers Accommodation',
  'Guest Houses',
  'Holidays & Resorts',
  'Real Estate Development',
  'Relocation Consultants & Services',
  'Serviced Apartments',
  'Storage Solutions',
  'Warehousing',
  'Accommodation Booking & Inquiry Services'
);
