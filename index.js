const express = require("express");
const CustomError = require("./CustomError");
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// *** Handling Async Errors: Problem Definition ***

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
    // Validate user function is no async. Thus, throws this error.
    // Our Error handling middleware will catch this.
    // Works as intended.
    throw new CustomError('PASSWORD REQUIRED!', 401)
};

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

app.get('/users', async (req, res) => {
    try {
        const usersResult = await prisma.user.findMany();
        res
          .status(200)
          .send(usersResult);
      } catch (err) {
        res
        .status(500)
        .send("Error getting list of users.");
      }
});

// Async function
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    const userResult = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        });
    // Throwing an error inside async function throws an UnhandledPromiseRejectionWarning.
    // Our error handling middleware will not catch this.
    // Doesn't work as intended.
    if(!userResult) {
        throw new CustomError('User no found', 404);
    }
    res
        .status(200)
        .send(userResult);
});

app.use((req, res) => {
    res.status(404).send('Requested Resource Not Found!');
});

app.use((err, req, res, next) => {
    const { status = 500, message = 'Error!' } = err;
    console.log(err.stack);
    res.status(status).send(message);
});

app.listen(8000, () => {
    console.log("App is running on port 8000");
});