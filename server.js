const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const db = process.env.DATABASE;
mongoose
  .connect(db)
  .then(() => console.log(`Connected to the mongodb....`))
  .catch((err) => console.log(err.message));

const port = process.env.PORT || 3232;
app.listen(port, () => console.log(`Listining on Port ${port}...`));
