const { query } = require('../config/db');

/**
 * GET /api/v1/items
 * Fetch all active items with optional filters and primary image.
 */
async function getItems(req, res) {
  try {
    const { school_id, category_id, q } = req.query;

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

    const sql = `
      SELECT i.*, img.url AS primary_image_url
      FROM items i
      LEFT JOIN item_images img
        ON i.id = img.item_id AND img.is_primary = true
      ${where}
      ORDER BY i.id DESC
    `;

    const result = await query(sql, params);
    res.json(result.rows);
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
               'id',          img.id,
               'url',         img.url,
               'public_id',   img.public_id,
               'is_primary',  img.is_primary
             ) ORDER BY img.is_primary DESC, img.id ASC
           ) FROM item_images img WHERE img.item_id = i.id),
          '[]'::json
        ) AS images
      FROM items i
      LEFT JOIN schools s ON i.school_id = s.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1
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
      tags, era, size_notes, school_id, category_id,
    } = req.body;

    if (!name || !school_id) {
      return res.status(400).json({ error: 'name and school_id are required' });
    }

    // Condition whitelist
    const validConditions = ['excellent', 'good', 'fair', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({
        error: `condition must be one of: ${validConditions.join(', ')}`,
      });
    }

    // Handle tags — may arrive as a JSON string or already be an array.
    let tagsArray = null;
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else {
        try { tagsArray = JSON.parse(tags); } catch { tagsArray = null; }
      }
    }

    const itemResult = await query(
      `INSERT INTO items
         (school_id, added_by, category_id, name, description, condition,
          quantity_total, quantity_available, tags, era, size_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        school_id,
        req.user.userId,
        category_id          || null,
        name,
        description          || null,
        condition            || null,
        quantity_total       || null,
        quantity_available   || null,
        tagsArray,
        era                  || null,
        size_notes           || null,
      ]
    );

    const item = itemResult.rows[0];

    // Attach images if uploaded.
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await query(
          `INSERT INTO item_images (item_id, url, public_id, is_primary)
           VALUES ($1, $2, $3, $4)`,
          [item.id, file.path, file.filename, i === 0]
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
                     'url',        img.url,
                     'public_id',  img.public_id,
                     'is_primary', img.is_primary
                   ) ORDER BY img.is_primary DESC, img.id ASC
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

module.exports = { getItems, getItemById, createItem, deleteItem };
