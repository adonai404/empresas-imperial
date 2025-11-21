-- Add completed status to operational_tasks table
ALTER TABLE operational_tasks 
ADD COLUMN completed BOOLEAN DEFAULT false;