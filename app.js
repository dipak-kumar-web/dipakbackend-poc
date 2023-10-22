const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();


require('dotenv').config();

app.use(bodyParser.json());

mongoose.connect(`${process.env.DB_URI}`);
app.get("/user", (req, res)=>{
      res.send("its running")
})

app.use('/', require('./userRouter'));


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
