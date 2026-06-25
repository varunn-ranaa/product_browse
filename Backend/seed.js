const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

const ttl_rec = 200000;
const b_s = 5000; 
const categories = ['Electronics', 'Clothing', 'Books', 'Sports', 'Beauty', 'Toys'];

async function fakeData() {
 
  for (let i = 0; i < ttl_rec; i += b_s) {
    const values = [];
    const placeholders = [];
    let ind = 1;

    for (let j = 0; j < b_s ; j++) {

      const name = faker.commerce.productName();
      const category = categories[Math.floor(Math.random() * categories.length)];
      const price = Number(faker.commerce.price({ min: 100, max: 5000 }));
      const date = new Date(Date.now() - (ttl_rec - (i+j)) * 1000);  // * help

      values.push(name, category, price, date, date);
      placeholders.push(`($${ind}, $${ind + 1}, $${ind + 2}, $${ind + 3}, $${ind + 4})`);
      ind += 5;
    }

    //Build and execute the SQL query
    const query = `
      INSERT INTO products (name, category, price, created_at, updated_at)
      VALUES ${placeholders.join(', ')}
    `;

    try {
      await pool.query(query, values);
      console.log(`Inserted ${Math.min(i + b_s, ttl_rec)}/${ttl_rec}`);
    } catch (error) {
      console.error('Error inserting batch:', error);
      break; 
    }
  }

  console.log('completed!');
  await pool.end();
}

seedData().catch(console.error);
