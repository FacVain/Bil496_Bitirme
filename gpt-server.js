require('dotenv').config();
const express = require('express');
const passport = require('passport');
const path = require('path')
require('./routes/auth');
const axios = require('axios');
const session = require('express-session');
//require('./passport-setup')

// database kurulacak ardından id ve kaç tane negatifle sonuçlanmış kaydedilecek 

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
  res.sendFile('index.html')
})

app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false , maxAge: 24 * 60 * 60 * 1000 } // true if https !!
}))

function isLoggedIn(req, res, next) {
  console.log(req.user);
  req.user ? next() : res.status(401).send('You must be logged in to perform this action');
}

app.use(passport.initialize());
app.use(passport.session());


app.get('/getask', isLoggedIn, (req, res) => {
  console.log('bohohooooooyt')
  res.sendFile('ask.html')
})

app.get('/ask', isLoggedIn, (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'ask.html');
  res.sendFile(indexPath);
});

app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['email', 'profile']
    }
  )
);


app.get('/api/sessions/oauth/google', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

app.get('/dashboard', isLoggedIn, (req, res) => {
  res.send(`Welcome ${req.user.displayName}!`);
});

app.get('/login', (req, res) => {
  res.send(`Login failured try again`);
});

app.post('/api/query', isLoggedIn, async (req, res) => {
  const query = req.body.query;

  try {
    // Save the query to the database
    /*
    const newQuery = await pool.query(
      'INSERT INTO queries (user_id, query) VALUES ($1, $2) RETURNING *',
      [req.user.id, query]
    ); */

    // Send the query to OpenAI's API
    const response = await axios.post('https://api.openai.com/v1/engines/gpt-3.5-turbo-1106/completions', {
      prompt: query,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Send response back to client
    res.json({ query: newQuery.rows[0], response: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});