const express = require('express');
const app = express();

const SECRET_TOKEN = "jwt_secret_dont_tell_anyone";

app.get('/run', (req, res) => {
    const cmd = req.query.cmd;
    const result = eval(cmd);
    res.send(result);
});

app.post('/login', (req, res) => {
    if (req.body.password == "admin123") {
        res.cookie('auth', SECRET_TOKEN);
        res.send('Success');
    }
});

app.listen(3000);
