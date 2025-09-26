-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    category VARCHAR(100),
    slug VARCHAR(255) UNIQUE NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Create index on published posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at);

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Insert sample blog posts (only if they don't exist)
DO $$
BEGIN
    -- Insert first blog post
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'hemp-future-sustainable-fashion') THEN
        INSERT INTO blog_posts (title, excerpt, content, image_url, category, slug, published_at, is_published, meta_title, meta_description) VALUES (
            'Why Hemp is the Future of Sustainable Fashion',
            'Learn about the incredible benefits of hemp fabric and why it''s a game-changer for the fashion industry.',
            '<p>Hemp is rapidly emerging as one of the most promising materials in sustainable fashion. Unlike conventional cotton, hemp requires significantly less water to grow and actually improves soil health through its cultivation process.</p>

<h2>The Environmental Benefits</h2>
<p>Hemp plants absorb more CO2 per hectare than many trees and forests, making them a carbon-negative crop. They also require no pesticides or herbicides to grow successfully, reducing the environmental impact of farming.</p>

<h2>Superior Fabric Properties</h2>
<ul>
<li>Naturally antimicrobial and odor-resistant</li>
<li>UV protection (up to UPF 50+)</li>
<li>Highly durable and long-lasting</li>
<li>Becomes softer with each wash</li>
<li>Excellent moisture-wicking properties</li>
</ul>

<p>As we move toward a more sustainable future, hemp represents not just an alternative, but a superior choice for conscious consumers who refuse to compromise on quality or environmental responsibility.</p>',
            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop&crop=center',
            'Sustainability',
            'hemp-future-sustainable-fashion',
            NOW() - INTERVAL '5 days',
            true,
            'Why Hemp is the Future of Sustainable Fashion | Hemp Clothing Co.',
            'Discover how hemp fabric is revolutionizing sustainable fashion with superior environmental benefits and fabric properties.'
        );
    END IF;

    -- Insert second blog post
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'style-hemp-t-shirt') THEN
        INSERT INTO blog_posts (title, excerpt, content, image_url, category, slug, published_at, is_published, meta_title, meta_description) VALUES (
            '5 Ways to Style Your Hemp T-Shirt',
            'From casual weekends to smart-casual office looks, we show you how to style our versatile hemp tee.',
            '<p>One of the best things about hemp clothing is its incredible versatility. Our hemp t-shirts can be styled for virtually any occasion, from casual weekend activities to smart-casual office environments.</p>

<h2>1. Casual Weekend Look</h2>
<p>Pair your hemp tee with comfortable jeans and sneakers. The natural texture of hemp adds an effortlessly cool vibe to any casual outfit.</p>

<h2>2. Smart-Casual Office</h2>
<p>Layer your hemp t-shirt under a blazer with chinos and loafers. The moisture-wicking properties keep you comfortable throughout the day.</p>

<h2>3. Athleisure Style</h2>
<p>Combine with joggers and clean white sneakers. Hemp''s natural antimicrobial properties make it perfect for active wear.</p>

<h2>4. Date Night Ready</h2>
<p>Dress it up with a quality denim jacket, dark wash jeans, and dress boots. The subtle texture of hemp fabric adds sophistication.</p>

<h2>5. Beach and Vacation</h2>
<p>Hemp''s natural UV protection makes it ideal for beach days. Pair with shorts and sandals for the perfect vacation look.</p>

<p>The key to styling hemp clothing is embracing its natural, effortless aesthetic while appreciating its functional benefits.</p>',
            'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop&crop=center',
            'Style Guide',
            'style-hemp-t-shirt',
            NOW() - INTERVAL '8 days',
            true,
            '5 Ways to Style Your Hemp T-Shirt | Hemp Clothing Co.',
            'Learn how to style your hemp t-shirt for any occasion - from casual weekends to smart-casual office looks.'
        );
    END IF;

    -- Insert third blog post
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'hemp-clothing-care-tips') THEN
        INSERT INTO blog_posts (title, excerpt, content, image_url, category, slug, published_at, is_published, meta_title, meta_description) VALUES (
            'Tips to Care for Your Hemp Clothing',
            'Hemp is durable, but proper care ensures your clothes last even longer. Read our expert tips.',
            '<p>Hemp clothing is incredibly durable and actually gets better with age, but following proper care instructions will ensure your garments last for decades.</p>

<h2>Washing Guidelines</h2>
<ul>
<li>Machine wash in cold water (30°C/86°F or less)</li>
<li>Use mild, eco-friendly detergent</li>
<li>Avoid bleach and fabric softeners</li>
<li>Turn garments inside out to preserve color</li>
<li>Wash with similar colors</li>
</ul>

<h2>Drying Instructions</h2>
<p>Air drying is best for hemp clothing. If you must use a dryer, use low heat settings. Hemp fibers can shrink slightly in high heat, so gentle drying preserves the fit and extends garment life.</p>

<h2>Storage Tips</h2>
<p>Store hemp clothing in a cool, dry place. Hemp is naturally resistant to mold and mildew, but proper storage ensures optimal longevity. Use cedar blocks instead of mothballs for natural protection.</p>

<h2>Ironing and Maintenance</h2>
<p>Hemp wrinkles easily when wet but smooths out as it dries. If ironing is needed, use medium heat with steam. The natural fibers respond well to moisture and heat.</p>

<p>With proper care, your hemp clothing will become softer and more comfortable with each wear while maintaining its durability for years to come.</p>',
            'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=600&fit=crop&crop=center',
            'Care & Tips',
            'hemp-clothing-care-tips',
            NOW() - INTERVAL '12 days',
            true,
            'Hemp Clothing Care Tips | Hemp Clothing Co.',
            'Learn expert tips for washing, drying, and caring for your hemp clothing to ensure maximum durability and comfort.'
        );
    END IF;

    -- Insert fourth blog post
    IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'hemp-vs-cotton-environment') THEN
        INSERT INTO blog_posts (title, excerpt, content, image_url, category, slug, published_at, is_published, meta_title, meta_description) VALUES (
            'The Environmental Impact of Hemp vs Cotton',
            'Discover how hemp farming benefits the environment compared to traditional cotton production.',
            '<p>When comparing hemp to conventional cotton, the environmental benefits of hemp become immediately clear. Let''s examine the key differences in environmental impact.</p>

<h2>Water Usage</h2>
<p>Cotton is notoriously water-intensive, requiring approximately 2,700 liters of water to produce a single t-shirt. Hemp, on the other hand, requires only about 300-500 liters for the same amount of fiber - a reduction of over 80%.</p>

<h2>Pesticide and Chemical Use</h2>
<p>Conventional cotton farming uses about 25% of the world''s pesticides despite occupying only 3% of agricultural land. Hemp naturally resists pests and diseases, requiring zero pesticides or herbicides to grow successfully.</p>

<h2>Soil Health and Regeneration</h2>
<p>Unlike cotton, which depletes soil nutrients, hemp actually improves soil health through:</p>
<ul>
<li>Deep root systems that prevent erosion</li>
<li>Natural soil aeration</li>
<li>Adding organic matter back to the soil</li>
<li>Breaking pest and disease cycles for other crops</li>
</ul>

<h2>Carbon Sequestration</h2>
<p>Hemp absorbs more CO2 per hectare than many trees, making it a carbon-negative crop. It sequesters approximately 1.63 tons of CO2 per ton of hemp produced.</p>

<h2>Land Efficiency</h2>
<p>Hemp produces 2-3 times more fiber per hectare than cotton, requiring less land to produce the same amount of textile material.</p>

<p>The choice between hemp and cotton isn''t just about personal preference - it''s about choosing a sustainable future for our planet.</p>',
            'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&h=600&fit=crop&crop=center',
            'Environment',
            'hemp-vs-cotton-environment',
            NOW() - INTERVAL '15 days',
            true,
            'Hemp vs Cotton: Environmental Impact Comparison | Hemp Clothing Co.',
            'Compare the environmental impact of hemp vs cotton farming - water usage, pesticides, soil health, and carbon footprint.'
        );
    END IF;
END $$;