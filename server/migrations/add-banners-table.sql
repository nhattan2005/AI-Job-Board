-- Migration: Add banners table for admin management
-- Description: Allows admin to customize homepage carousel banners
-- Date: 2025-12-26

-- ============================================
-- CREATE BANNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_banners_active_order ON banners(is_active, display_order);

-- ============================================
-- INSERT DEFAULT BANNERS
-- ============================================
INSERT INTO banners (title, subtitle, image_url, display_order, is_active) VALUES
('Find Your Dream Job', 'Thousands of opportunities waiting for you', '/images/banner1.jpg', 1, TRUE),
('Career Growth Starts Here', 'Connect with top employers', '/images/banner2.jpg', 2, TRUE),
('Your Future Awaits', 'Discover amazing opportunities', '/images/banner3.png', 3, TRUE)
ON CONFLICT DO NOTHING;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Banners table created successfully!';
    RAISE NOTICE '✅ Default banners inserted!';
    RAISE NOTICE '🎉 You can now manage banners from Admin Dashboard!';
END $$;
