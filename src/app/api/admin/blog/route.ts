import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { revalidateAfterBlogChange } from '@/lib/revalidation-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || '' // 'published', 'draft'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * pageSize

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (category) {
      whereClause += ` AND category ILIKE $${paramIndex}`
      params.push(`%${category}%`)
      paramIndex++
    }

    if (status) {
      const isPublished = status === 'published'
      whereClause += ` AND is_published = $${paramIndex}`
      params.push(isPublished)
      paramIndex++
    }

    // Build ORDER BY clause
    const validSortFields = ['title', 'category', 'published_at', 'created_at', 'updated_at']
    const validSortOrders = ['asc', 'desc']
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC'

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM blog_posts ${whereClause}`
    const countResult = await query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)

    // Get blog posts with pagination
    const postsQuery = `
      SELECT 
        id, 
        title,
        excerpt,
        image_url,
        category,
        slug,
        author_id,
        published_at,
        is_published,
        meta_title,
        meta_description,
        created_at,
        updated_at,
        (SELECT email FROM users WHERE id = author_id) as author_email
      FROM blog_posts 
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(pageSize, offset)
    const result = await query(postsQuery, params)

    const totalPages = Math.ceil(total / pageSize)

    // Get stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE is_published = true) as published_posts,
        COUNT(*) FILTER (WHERE is_published = false) as draft_posts,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
        COUNT(DISTINCT category) as total_categories
      FROM blog_posts
    `)

    const stats = statsResult.rows[0] || {
      total_posts: 0,
      published_posts: 0,
      draft_posts: 0,
      new_this_month: 0,
      total_categories: 0
    }

    // Get categories
    const categoriesResult = await query(`
      SELECT category, COUNT(*) as post_count
      FROM blog_posts
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY post_count DESC, category ASC
    `)

    return NextResponse.json({
      success: true,
      data: {
        posts: result.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        },
        stats: {
          totalPosts: parseInt(stats.total_posts),
          publishedPosts: parseInt(stats.published_posts),
          draftPosts: parseInt(stats.draft_posts),
          newThisMonth: parseInt(stats.new_this_month),
          totalCategories: parseInt(stats.total_categories)
        },
        categories: categoriesResult.rows
      }
    })

  } catch (error) {
    console.error('GET /api/admin/blog error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      image_url,
      category,
      slug,
      author_id,
      is_published = false,
      published_at,
      meta_title,
      meta_description
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    let finalSlug = slug
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }

    // Check if slug already exists
    const existingSlugResult = await query(
      'SELECT id FROM blog_posts WHERE slug = $1',
      [finalSlug]
    )

    if (existingSlugResult.rows.length > 0) {
      finalSlug = `${finalSlug}-${Date.now()}`
    }

    // Set published_at if publishing
    let finalPublishedAt = published_at
    if (is_published && !finalPublishedAt) {
      finalPublishedAt = new Date().toISOString()
    }

    // Create blog post
    const result = await query(
      `INSERT INTO blog_posts (
        id, title, excerpt, content, image_url, category, slug, 
        author_id, is_published, published_at, meta_title, meta_description, 
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING *`,
      [
        title, excerpt, content, image_url, category, finalSlug, 
        author_id, is_published, finalPublishedAt, meta_title, meta_description
      ]
    )

    const createdPost = result.rows[0]
    
    // Trigger client site cache revalidation (async, don't wait for completion)
    revalidateAfterBlogChange(createdPost.slug)

    return NextResponse.json({
      success: true,
      data: createdPost,
      message: 'Blog post created successfully'
    })

  } catch (error) {
    console.error('POST /api/admin/blog error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}