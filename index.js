const express = require("express");
const CustomError = require("./CustomError");
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// *** Handling Async Errors: A more suitable solution Improvement***
// Sample request URL : http://localhost:8000/users/5000000000000000000000000000000000000000000000000000000000000000000000000000000000000
app.use((req, res, next) => {
    req.requestTime = Date.now();
    console.log(req.method, req.path);
    next();
});

const validateUser = (req, res, next) => {
    const { password } = req.query;
    if (password === 'devlaka') {
        next();
    }
    throw new CustomError('PASSWORD REQUIRED!', 401)
};

function wrapAsync(fn){
  return function(req, res, next) {
    fn(req, res, next).catch(e => next(e));
  } 
}

app.use('/about-us', (req, res, next) => {
    console.log("This middleware runs only for /about-us path");
    next();
});

app.get('/error', (req, res) => {
    console.lg();
})

app.get('/', (req, res) => {
    res.send("Homepage");
});

app.get('/about-us', (req, res) => {
    console.log(`REQUEST TIME: ${req.requestTime}`);
    res.send("About us page");
});

app.get('/private', validateUser, (req, res) => {
    res.send("Private Data");
});

app.get('/top-secret', validateUser, (req, res) => {
    res.send("Top Secret Data");
});

app.get('/users', wrapAsync(async (req, res, next) => {
      const usersResult = await prisma.user.findMany();
      res
        .status(200)
        .send(usersResult);
}));

// Async function
app.get('/users/:id', wrapAsync(async (req, res, next) => {
  const { id } = req.params;
    const userResult = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    res
      .status(200)
      .send(userResult);
}));

app.use((req, res) => {
    res.status(404).send('Requested Resource Not Found!');
});

app.use((err, req, res, next) => {
    const { status = 500 } = err;
    console.log(err.message);
    console.log(err.stack);
    res.status(status).send("Error");
});

app.listen(8000, () => {
    console.log("App is running on port 8000");
});