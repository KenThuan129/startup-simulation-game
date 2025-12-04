-- Migration: Add offer metadata to loans table
-- Run this migration to track loan offer details and sacrifices

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS offer_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS repayment_plan JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sacrifice JSONB DEFAULT '{}';

