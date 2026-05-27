const { query } = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

/**
 * GET /api/v1/items
 * Fetch all active items with optional filters and primary image.
 */
async function getItems(req, res) {
  try {
    const { school_id, category_id, q } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = ['i.is_active = true'];
    const params = [];
    let idx = 1;

    if (school_id) {
      conditions.push(`i.school_id = $${idx++}`);
      params.push(school_id);
    }
    if (category_id) {
      conditions.push(`i.category_id = $${idx++}`);
      params.push(category_id);
    }
    if (q) {
      conditions.push(
        `(i.name ILIKE $${idx} OR i.description ILIKE $${idx})`
      );
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Count total matching rows (same filters, images not needed for count)
    const countSql = `SELECT COUNT(*)::int AS total FROM items i ${where}`;
    const countResult = await query(countSql, params);
    const total = countResult.rows[0].total;

    const sql = `
      SELECT i.*, img.image_url AS primary_image_url
      FROM items i
      LEFT JOIN item_images img
        ON i.id = img.item_id AND img.sort_order = 0
      ${where}
      ORDER BY i.id DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const result = await query(sql, [...params, limit, offset]);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Items] getItems error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

/**
 * GET /api/v1/items/:id
 * Fetch a single item with school name, category name, and all images.
 */
async function getItemById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        i.*,
        s.name AS school_name,
        c.name AS category_name,
        COALESCE(
          (SELECT json_agg(
             json_build_object(
               'id',         img.id,
               'image_url',  img.image_url,
               'sort_order', img.sort_order
             ) ORDER BY img.sort_order ASC, img.id ASC
           ) FROM item_images img WHERE img.item_id = i.id),
          '[]'::json
        ) AS images
      FROM items i
      LEFT JOIN schools s ON i.school_id = s.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1 AND i.is_active = TRUE
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Items] getItemById error:', err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
}

/**
 * POST /api/v1/items
 * Create a new item and optionally attach uploaded images.
 */
async function createItem(req, res) {
  try {
    const {
      name, description, condition, quantity_total, quantity_available,
      category_id,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Condition whitelist
    const validConditions = ['excellent', 'good', 'fair', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({
        error: `condition must be one of: ${validConditions.join(', ')}`,
      });
    }

    const itemResult = await query(
      `INSERT INTO items
         (school_id, added_by, category_id, name, description, condition,
          quantity_total, quantity_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.user.schoolId,
        req.user.userId,
        category_id          || null,
        name,
        description          || null,
        condition            || null,
        quantity_total       || null,
        quantity_available   || null,
      ]
    );

    const item = itemResult.rows[0];

    // Attach images if uploaded.
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await query(
          `INSERT INTO item_images (item_id, image_url, sort_order, cloudinary_public_id)
           VALUES ($1, $2, $3, $4)`,
          [item.id, file.path, i, file.filename]
        );
      }
    }

    // Re-fetch to include images in the response.
    const result = await query(
      `SELECT i.*,
              COALESCE(
                (SELECT json_agg(
                   json_build_object(
                     'id',         img.id,
                     'image_url',  img.image_url,
                     'sort_order', img.sort_order
                   ) ORDER BY img.sort_order ASC, img.id ASC
                 ) FROM item_images img WHERE img.item_id = i.id),
                '[]'::json
              ) AS images
       FROM items i
       WHERE i.id = $1`,
      [item.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Items] createItem error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
}

/**
 * DELETE /api/v1/items/:id
 * Soft-delete an item. Only the original uploader or an admin can delete.
 */
async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const result = await query(
      `UPDATE items
       SET is_active = false
       WHERE id = $1
         AND (added_by = $2 OR $3 = 'admin')
       RETURNING id, name, is_active`,
      [id, userId, role]
    );

    if (result.rows.length === 0) {
      // Determine whether the item doesn't exist or it's a permissions issue.
      const exists = await query(
        'SELECT id, added_by FROM items WHERE id = $1', [id]
      );
      if (exists.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    res.json({ message: 'Item deleted', item: result.rows[0] });
  } catch (err) {
    console.error('[Items] deleteItem error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}

/**
 * PATCH /api/v1/items/:id
 * Update an existing item. Acting user must belong to the item's school.
 */
async function updateItem(req, res) {
  try {
    const { id } = req.params;

    // Fetch item to verify existence and school ownership
    const itemResult = await query(
      'SELECT id, school_id, quantity_available FROM items WHERE id = $1',
      [id]
    );
    const item = itemResult.rows[0];
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.school_id !== req.user.schoolId) {
      return res.status(403).json({ error: 'Not authorized to edit this item' });
    }

    const {
      name, description, condition, category_id, quantity_total, is_active,
    } = req.body;

    // Condition whitelist
    const validConditions = ['excellent', 'good', 'fair', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({
        error: `condition must be one of: ${validConditions.join(', ')}`,
      });
    }

    // Resolve quantity_total
    let qtyTotal = quantity_total !== undefined ? parseInt(quantity_total, 10) : null;
    if (qtyTotal !== null && (isNaN(qtyTotal) || qtyTotal < 0)) {
      return res.status(400).json({ error: 'quantity_total must be a non-negative integer' });
    }

    // If quantity_total is reduced below current quantity_available, cap it
    let qtyAvailable = item.quantity_available;
    if (qtyTotal !== null && qtyTotal < item.quantity_available) {
      qtyAvailable = qtyTotal;
    }

    // Build explicit SET clauses — no dynamic column construction
    const setClauses = [];
    const params = [];
    let idx = 1;

    // Always update these if provided; fall back to current values from the row
    setClauses.push(`name = $${idx++}`);             params.push(name !== undefined ? name : null);
    setClauses.push(`description = $${idx++}`);       params.push(description !== undefined ? description : null);
    setClauses.push(`condition = $${idx++}`);         params.push(condition !== undefined ? condition : null);
    setClauses.push(`category_id = $${idx++}`);       params.push(category_id !== undefined ? category_id : null);
    setClauses.push(`quantity_total = $${idx++}`);    params.push(qtyTotal);
    setClauses.push(`quantity_available = $${idx++}`); params.push(qtyAvailable);
    setClauses.push(`is_active = $${idx++}`);         params.push(is_active !== undefined ? is_active : null);

    params.push(id); // WHERE id = $N

    const updateResult = await query(
      `UPDATE items SET ${setClauses.join(', ')} WHERE id = $${idx}
       RETURNING *`,
      params
    );

    // Re-fetch in same shape as getItemById
    const result = await query(
      `SELECT
        i.*,
        s.name AS school_name,
        c.name AS category_name,
        COALESCE(
          (SELECT json_agg(
             json_build_object(
               'id',         img.id,
               'image_url',  img.image_url,
               'sort_order', img.sort_order
             ) ORDER BY img.sort_order ASC, img.id ASC
           ) FROM item_images img WHERE img.item_id = i.id),
          '[]'::json
        ) AS images
      FROM items i
      LEFT JOIN schools s ON i.school_id = s.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Items] updateItem error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
}

/**
 * POST /api/v1/items/:id/images
 * Add images to an existing item. Acting user must belong to the item's school.
 */
async function addItemImages(req, res) {
  try {
    const { id } = req.params;

    // Verify item exists and check school ownership
    const itemResult = await query(
      'SELECT id, school_id FROM items WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    const item = itemResult.rows[0];
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.school_id !== req.user.schoolId) {
      return res.status(403).json({ error: 'Not authorized to add images to this item' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image file is required' });
    }

    // Count existing images
    const countResult = await query(
      'SELECT COUNT(*)::int AS count, COALESCE(MAX(sort_order), -1) AS max_sort FROM item_images WHERE item_id = $1',
      [id]
    );
    const { count, max_sort } = countResult.rows[0];

    if (count + req.files.length > 5) {
      return res.status(400).json({
        error: `Item can have at most 5 images. Currently has ${count}, tried to add ${req.files.length}.`,
      });
    }

    let nextSort = max_sort + 1;
    for (const file of req.files) {
      await query(
        'INSERT INTO item_images (item_id, image_url, sort_order, cloudinary_public_id) VALUES ($1, $2, $3, $4)',
        [id, file.path, nextSort++, file.filename]
      );
    }

    // Return updated image list
    const imagesResult = await query(
      'SELECT id, image_url, sort_order FROM item_images WHERE item_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    res.status(201).json({ images: imagesResult.rows });
  } catch (err) {
    console.error('[Items] addItemImages error:', err);
    res.status(500).json({ error: 'Failed to add images' });
  }
}

/**
 * DELETE /api/v1/items/:id/images/:imageId
 * Remove an image from an item. Acting user must belong to the item's school.
 * TODO: also delete the image asset from Cloudinary using its public_id.
 */
async function deleteItemImage(req, res) {
  try {
    const { id, imageId } = req.params;

    // Verify item exists and check school ownership
    const itemResult = await query(
      'SELECT id, school_id FROM items WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    const item = itemResult.rows[0];
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.school_id !== req.user.schoolId) {
      return res.status(403).json({ error: 'Not authorized to remove images from this item' });
    }

    // Verify image belongs to this item
    const imageResult = await query(
      'SELECT id, cloudinary_public_id FROM item_images WHERE id = $1 AND item_id = $2',
      [imageId, id]
    );
    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found on this item' });
    }
    const image = imageResult.rows[0];

    await query('DELETE FROM item_images WHERE id = $1', [imageId]);

    if (image.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(image.cloudinary_public_id);
      } catch (err) {
        console.error('[Items] Cloudinary cleanup failed for', image.cloudinary_public_id, ':', err.message);
      }
    }

    res.status(204).send();
  } catch (err) {
    console.error('[Items] deleteItemImage error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
}

module.exports = { getItems, getItemById, createItem, deleteItem, updateItem, addItemImages, deleteItemImage };
