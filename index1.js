const exp = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('./middleware/auth');
   const cors = require('cors');
const app = exp();
app.use(exp.json()) //Middleware for post request
   app.use(cors({ origin: 'http://localhost:3000' }));
const pool = require('./db');


//GET request

// app.get('/tasks', async (req, res) => {
//     const [rows] = await pool.query('SELECT * FROM tasks');
//     res.json(rows);
// })


app.post('/auth/register',async (req,res) =>{
const {name,email,password} = req.body;
if(!name || typeof name !== 'string' || name.trim() === ''){
   return res.status(201).send('Name is Required')
}
if(!email || typeof email !== 'string' || email.trim() === ''){
    return res.status(201).send('Email is Required')
}
if(!password || typeof password !== 'string' || password.trim() === ''){
    return res.status(201).send('Password is required')
}

const [existingRow]= await pool.query('SELECT id FROM users WHERE email = ?',[email]);
if(existingRow.length > 0){
    return res.status(409).send('Email already registered!!')
}

const passwordHash = await bcrypt.hash(password, 10);

const [result]= await pool.query('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [name.trim(), email, passwordHash]);

res.status(201).json({id:result.insertId, name:name.trim(), email})
})

app.post('/auth/login', async(req, res) =>{
    const {email,password} = req.body;

    if(!email || typeof email !== 'string' || email.trim() === ''){
        return res.status(201).send('Email is required')
    }
     if(!password || typeof password !== 'string' || password.trim() === ''){
        return res.status(201).send('Password is required')
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email=?',[email]);
   const user = rows[0];

   if(!user){
    return res.status(201).send('Invalid email or password');
   }
     const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).send('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

app.get('/tasks', authenticate, async(req,res) =>{
const [rows] = await pool.query('SELECT id, title, created_at FROM tasks WHERE user_id=?',[req.user.id]);
console.log('tasks rows', rows);
res.json(rows);
});

// app.get('/tasks', async (req,res) =>{
//     const [rows] = await pool.query(
//         `SELECT tasks.id, tasks.title,tasks.created_at, users.name AS owner_name, users.email AS owner_email
//         FROM tasks
//         LEFT JOIN users ON tasks.user_id = users.id`
//     );

//     res.json(rows);
// });

app.get('/tasks/:id', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id =? ', [req.params.id])
    if (rows.length === 0) {
        return res.status(404).send('Task not found')
    }

    res.json(rows[0]);
})


//POST Request

app.post('/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).send('Title is required')
    }
    const [result] = await pool.query('INSERT INTO tasks (title) VALUES (?)', [title])
    res.status(201).json({ id: result.insertId, title: req.body.title });
})

//PUT Request
app.put('/tasks/:id', async (req, res) => {
    const {title} = req.body;
    if(!title || typeof title !== 'string' || title.trim() === ''){
        return res.status(400).send('Title is Required')
    }
    const [result] = await pool.query("UPDATE tasks SET title = ? WHERE id = ? ", [title, req.params.id]);
    if (result.affectedRows === 0) {
        return res.status(404).send('Task not found');
    }
    res.json({ id: req.params.id, title: title });
})


//DELETE Request
app.delete('/tasks/:id', async (req, res) => {
    const [result] = await pool.query("DELETE FROM tasks WHERE id = ? ", [req.params.id]);
    if (result.affectedRows === 0) {
        return res.status(404).send('TASK Doesnt exist')
    }
    res.status(204).send()
})

app.listen(4000, () => {
    console.log('restart Server running on http://localhost:4000');
})