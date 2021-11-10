const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gxvqj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
      await client.connect();
      console.log('database conneted');
      const database = client.db('nicheproductsdb');
      const packageCollection = database.collection('watchs');
  
      // Get servise API
      app.get('/watchs',async(req,res)=>{
          const cursor = packageCollection.find({});
          const packages = await cursor.toArray();
          res.send(packages);
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