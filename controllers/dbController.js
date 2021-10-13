const mysql = require('mysql2/promise');
// require('dotenv').config();

// const uri = process.env.ATLAS_URI;
// const db_info = {
//   host: 'localhost',
//   port: '3306',
//   user: 'root',
//   password: '',
//   database: 'cinema'
// }
const db_info = {
  host: 'db',
  port: '3306',
  user: 'root',
  password: 'root',
  database: 'cinema'
}
let pool = mysql.createPool(db_info);
let connection;

module.exports = {
  init: dbInit,
  dbQuery: dbQuery,
  getTodayMovies: getTodayMovies,
  getMovies:getMovies
};

//     connection.query('SELECT * FROM user', function (error, results, fields) {
//         if (error) {
//             console.log(error);
//         }
//         console.log('The solution is: ', results);
//     });

async function dbInit() {
  try {
    connection = await pool.getConnection(async conn => conn);
    console.log("DB connected");
  } catch (err) {
    console.log('DB err');
    console.log(err);
  }
  return connection;
}

async function dbQuery(type, sql, params) {
  try {
    let result = {};
    // const connection = await pool.getConnection(async conn => conn);
    try {
      const [rows] = await connection.query(sql, params); // sql 쿼리문 실행
      if(type == "GET") result.row = rows;
      result.state = true;
      connection.release(); // 사용된 풀 반환
      return result;
    } catch (err) {
      console.log('Query Error');
      console.log(err);
      result.state = false;
      result.error = err;
      connection.release();
      return result;
    }
  } catch (err) {
    console.log('DB Error');
    console.log(err);
    result.state = false;
    result.error = err;
    return result;
  }
}

async function dbConnQuery(conn, type, sql, params) {
  try {
    let result = {};
    // const connection = await pool.getConnection(async conn => conn);
    try {
      const [rows] = await conn.query(sql, params); // sql 쿼리문 실행
      if(type == "GET") result.row = rows;
      result.state = true;
      return result;
    } catch (err) {
      console.log('Query Error');
      console.log(err);
      result.state = false;
      result.error = err;
      return result;
    }
  } catch (err) {
    console.log('DB Error');
    console.log(err);
    result.state = false;
    result.error = err;
    return result;
  } finally {
    conn.release(); // 사용된 풀 반환
  }
}

async function getTodayMovies() {
  let conn = await dbInit();
  let sql = `
      SELECT a.*, b.* FROM \`movie\` a inner join \`movie_score\` b on a.movie_id = b.movie_id 
      where  DATE_FORMAT(now(), '%Y-%m-%d') = left(b.created, 10)
      order by b.reservation_rate desc`;
  return await dbConnQuery(conn, "GET", sql, []);
}

async function getMovies() {
  let conn = await dbInit();
  let sql = `SELECT * FROM movie `;
  return await dbConnQuery(conn, "GET", sql, []);
}
