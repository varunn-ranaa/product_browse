const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/', async (req, res) => {
  try {
    const { category, updated_at, id } = req.query;

    let queryText = `
      SELECT id, name, category, price, created_at, 
      to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') as updated_at_formatted,
      updated_at
      FROM products
    `; //timezone bug detected*

    let conditions = [];
    let params = [];
    let ind = 1;

    //Category Filter
    if (category) {
      conditions.push(`category = $${ind}`);
      params.push(category);
      ind++;
    }

    //Cursor(keyset) Pagination
    if (updated_at && id) {
      // Using plain TIMESTAMP to keep it matching your explicit seed values
      conditions.push(`(updated_at, id) < ($${ind}::timestamp, $${ind + 1}::bigint)`);
      params.push(updated_at);
      params.push(id);
      ind += 2;
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += `
      ORDER BY updated_at DESC, id DESC
      LIMIT 20;
    `;

    const result = await db.query(queryText, params);
    const lastRow = result.rows[result.rows.length - 1];

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        price: row.price,
        created_at: row.created_at,
        updated_at: row.updated_at_formatted // Cleaner text format matching DB
      })),
      nextCursor: lastRow
        ? {
            updated_at: lastRow.updated_at_formatted, // Safe string token
            id: lastRow.id,
          }
        : null,
    });

  } catch (err) {
    console.error('Keyset Pagination Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
