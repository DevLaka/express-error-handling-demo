const express = require("express");
const CustomError = require("./CustomError");
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// *** Handling Async Errors: A basic solution ***

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
app.get('/users/:id', async (req, res, next) => {
    const { id } = req.params;
    const userResult = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        });
    if(!userResult) {
        // next() will call the next middleware.
        // But, next(err) will call the next error handling middleware.
        // Error handling middleware will have the signature of (err, req, res, next).
        return next(new CustomError('User not found', 404));
    }
    // Calling next() without returning will call this statement.
    // This cause "Cannot set headers after they are sent to the client" error.
    // To prevent this, we have to return next() as above.
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