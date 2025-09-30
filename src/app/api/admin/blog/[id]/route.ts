import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { revalidateAfterBlogChange } from '@/lib/revalidation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get blog post with author information
    const result = await query(`
      SELECT 
        bp.*,
        u.email as author_email
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1
    `, [id])

    if (!result || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('GET /api/admin/blog/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      image_url,
      category,
      slug,
      author_id,
      is_published,
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

    // Check if blog post exists
    const existingPost = await query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    )

    if (!existingPost || existingPost.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const oldPost = existingPost.rows[0]

    // Check if slug is being changed and if new slug already exists
    if (slug && slug !== oldPost.slug) {
      const existingSlugResult = await query(
        'SELECT id FROM blog_posts WHERE slug = $1 AND id != $2',
        [slug, id]
      )

      if ((existingSlugResult?.rows?.length || 0) > 0) {
        return NextResponse.json(
          { success: false, error: 'A blog post with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Set published_at if publishing for the first time
    let finalPublishedAt = published_at
    if (is_published && !oldPost.published_at && !finalPublishedAt) {
      finalPublishedAt = new Date().toISOString()
    } else if (is_published === false) {
      finalPublishedAt = null
    }

    // Update blog post
    const result = await query(`
      UPDATE blog_posts SET 
        title = $1, 
        excerpt = $2, 
        content = $3, 
        image_url = $4,
        category = $5,
        slug = $6,
        author_id = $7,
        is_published = $8,
        published_at = $9,
        meta_title = $10,
        meta_description = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      title, excerpt, content, image_url, category, 
      slug || oldPost.slug, author_id, is_published, finalPublishedAt,
      meta_title, meta_description, id
    ])

    const updatedPost = result?.rows[0]
    
    // Trigger client site cache revalidation (async, don't wait for completion)
    // Use both old and new slug in case slug was changed
    revalidateAfterBlogChange(updatedPost.slug)
    if (oldPost.slug !== updatedPost.slug) {
      revalidateAfterBlogChange(oldPost.slug)
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Blog post updated successfully'
    })

  } catch (error) {
    console.error('PUT /api/admin/blog/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if blog post exists
    const existingPost = await query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    )

    if (!existingPost || existingPost.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const postSlug = existingPost.rows[0].slug
    
    // Delete blog post
    await query('DELETE FROM blog_posts WHERE id = $1', [id])

    // Trigger client site cache revalidation (async, don't wait for completion)
    revalidateAfterBlogChange(postSlug)

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error) {
    console.error('DELETE /api/admin/blog/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}