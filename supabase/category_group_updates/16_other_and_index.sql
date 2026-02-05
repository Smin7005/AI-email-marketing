-- Catch-all: Assign remaining uncategorized to 'Other'
UPDATE rawdata_yellowpage_new
SET category_group = 'Other'
WHERE category_group IS NULL;

-- Add index for query performance
CREATE INDEX IF NOT EXISTS idx_category_group ON rawdata_yellowpage_new(category_group);

-- Verification: Check distribution
SELECT category_group, COUNT(*) as count
FROM rawdata_yellowpage_new
GROUP BY category_group
ORDER BY count DESC;
