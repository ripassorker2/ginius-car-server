const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// require('crypto').randomBytes(64).toString('hex') --->>> random token create

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gvjclco.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({ message: "401 unathorization access " });
  }
  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.USER_SECRET_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(402).send({ message: "401 unathorization access " });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("genius-car").collection("services");
    const orderCollection = client.db("genius-car").collection("orders");

    // token

    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.USER_SECRET_TOKEN, {
        expiresIn: "7d",
      });
      res.send({ token });
    });

    // services api

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const servcices = await cursor.toArray();
      res.send(servcices);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: id };
      const product = await serviceCollection.findOne(queary);
      res.send(product);
    });

    //orders api

    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log(decoded);

      if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "Unmatched email" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/orders",verifyJWT, async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // delete
    app.delete("/orders/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Genius car servar is running");
});

app.listen(port, () => {
  console.log("Server is running in 5000 port");
});
