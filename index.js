const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const  ObjectID = require('mongodb').ObjectId;
const admin = require("firebase-admin");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gxvqj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];

      try {
          const decodedUser = await admin.auth().verifyIdToken(token);
          req.decodedEmail = decodedUser.email;
      }
      catch {

      }

  }
  next();
}


async function run() {
    try {
      await client.connect();
      console.log('database conneted');
      const database = client.db('nicheproductsdb');
      const packageCollection = database.collection('watchs');
      const usersCollection = database.collection('users');
      const orderCollection = database.collection('orderplace');
      const reviewCollection = database.collection('reviews');
  
      // Get servise API
      app.get('/watchs',async(req,res)=>{
          const cursor = packageCollection.find({});
          const packages = await cursor.toArray();
          res.send(packages);
      })
      // get order place api
      app.get('/orderplace',async(req,res)=>{
          const cursor = orderCollection.find({});
          const allorder = await cursor.toArray();
          res.send(allorder);
      })
      
      app.get('/orderplace',verifyToken,async(req,res)=>{
        const email = req.query.email
        const query = { email: email }
          const cursor = orderCollection.find(query);
          const myorder = await cursor.toArray();
          res.send(myorder);
      })
      // Get reviews api
      app.get('/reviews',async(req,res)=>{
          const cursor = reviewCollection.find({});
          const reviews = await cursor.toArray();
          res.send(reviews);
      })
      app.get('/users/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        let isAdmin = false;
        if (user?.role === 'admin') {
            isAdmin = true;
        }
        res.json({ admin: isAdmin });
    })

        // Add Orders API
        app.post('/orderplace', async (req, res) => {
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.json(result);
      })

      // Review api
        app.post('/reviews', async (req, res) => {
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.json(result);
      })
      // watch post api for add product
      app.post('/watchs', async (req, res) => {
        const package = req.body;
        console.log('hit the post api', package);
        const result = await packageCollection.insertOne(package);
        console.log(result);
        res.json(result)
    });
          // Delete ApI
          app.delete('/watchs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await packageCollection.deleteOne(query);
            res.json(result);
        })

        // users and make addmin post put api

      app.post('/users',async(req,res)=>{
        const user = req.body;
        const result = await usersCollection.insertOne(user)
        console.log(result)
        res.json(result)
      })
      app.put('/users', async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const options = { upsert: true };
        const updateDoc = { $set: user };
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.json(result);
    });

    app.put('/users/admin', verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
          const requesterAccount = await usersCollection.findOne({ email: requester });
          if (requesterAccount.role === 'admin') {
              const filter = { email: user.email };
              const updateDoc = { $set: { role: 'admin' } };
              const result = await usersCollection.updateOne(filter, updateDoc);
              res.json(result);
          }
      }
      else {
          res.status(403).json({ message: 'Acces Prob' })
      }

  })
  
    } 
    finally {
      // await client.close();
    }
  }
  run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Niche Products!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})