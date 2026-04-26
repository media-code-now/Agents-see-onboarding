-- Make week_end nullable (week_start is sufficient; week_end is optional)
ALTER TABLE weekly_plans ALTER COLUMN week_end DROP NOT NULL;
