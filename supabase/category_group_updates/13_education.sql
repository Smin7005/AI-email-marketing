-- GROUP 13: Education & Training
UPDATE rawdata_yellowpage_new
SET category_group = 'Education & Training'
WHERE category_name IN (
  'Advanced & Defensive Driving School',
  'Boat Licence Testing',
  'Business (Training & Development)',
  'Business Colleges',
  'Career Counselling',
  'Co-Educational Schools',
  'Driving Lessons & Schools',
  'Driving Training Equipment & Facilities',
  'Flying School',
  'Human Resources (Training & Development)',
  'Kindergartens & Pre-Schools',
  'School Supplies',
  'Schools',
  'Schools--Public (State) - NSW only',
  'Schools--State ( All States except NSW)',
  'Sewing & Dressmaking Tuition',
  'Surfing Instruction',
  'Training, Mentoring & Development',
  'Traffic Schools',
  'Vocational Education & Training (Training & Development)',
  'Music Teachers'
);
