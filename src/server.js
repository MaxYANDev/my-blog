import  express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from "mongodb"
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

app.get('/api', (req, res) => {
  res.send('Hello world!');
})

const withDb  = async (operations,res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
    const db = await client.db('my-blog')
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({message:'Error connecting to db', error});
    
  }
}
app.get('/api/articles/:name',(req, res) => {
  const article = req.params.name;
  withDb(async (db) => {
    const articlesInfo = await db.collection('articles').findOne({name:article});
    console.log(articlesInfo);
    res.status(200).json(articlesInfo);
  }, res)
});

app.post('/api/articls/:name/upvotes', async (req, res) => {
  const article = req.params.name;
  withDb(async (db) => {
    const articleInfo = await db.collection('articles').findOne({name:article});
    await db.collection('articles').updateOne({name:article}, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      }
    });
    const updateArticles = await db.collection('articles').findOne({name:article});
    res.status(200).json(updateArticles);
  }, res)
});

app.post('/api/articls/:name/add-comment', (req, res) => {
  const {username, text} = req.body;
  const article = req.params.name;
  withDb(async (db) => {
    const articleInfo = await db.collection('articles').findOne({name:article});
    await db.collection('articles').updateOne({name:article}, {
      '$set': {
        comments: [...articleInfo.comments, {username, text}]
      }
    })
    const updateArticle = await db.collection('articles').findOne({name:article});
    console.log(updateArticle);
    res.status(200).json(updateArticle);
  }, res)
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
})
app.listen(8000, () => console.log('Listening on port 8000'))
