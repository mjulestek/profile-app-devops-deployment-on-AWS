let express = require('express');
let path = require('path');
let fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
let bodyParser = require('body-parser');

let app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/profile-picture', function (req, res) {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));

  res.writeHead(200, {
    'Content-Type': 'image/jpg'
  });

  res.end(img, 'binary');
});

/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
| Uses Docker Compose service name "mongodb"
| Falls back to local Docker setup if env variable is missing
|--------------------------------------------------------------------------
*/

let mongoUrl =
  process.env.MONGO_URL ||
  "mongodb://admin:password123@mongodb:27017/user-account?authSource=admin";

/*
|--------------------------------------------------------------------------
| Mongo Client Options
|--------------------------------------------------------------------------
*/

let mongoClientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

/*
|--------------------------------------------------------------------------
| Database Settings
|--------------------------------------------------------------------------
*/

let databaseName = "user-account";
let collectionName = "users";

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
*/

app.get('/get-profile', function (req, res) {

  MongoClient.connect(mongoUrl, mongoClientOptions, function (err, client) {

    if (err) {
      console.error("MongoDB connection failed:", err);
      return res.status(500).send({
        error: "Database connection failed"
      });
    }

    let db = client.db(databaseName);

    let myquery = {
      userid: 1
    };

    db.collection(collectionName).findOne(myquery, function (err, result) {

      if (err) {
        console.error("Query failed:", err);
        client.close();

        return res.status(500).send({
          error: "Database query failed"
        });
      }

      client.close();

      res.send(result ? result : {});
    });
  });
});

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/

app.post('/update-profile', function (req, res) {

  let userObj = req.body;

  MongoClient.connect(mongoUrl, mongoClientOptions, function (err, client) {

    if (err) {
      console.error("MongoDB connection failed:", err);

      return res.status(500).send({
        error: "Database connection failed"
      });
    }

    let db = client.db(databaseName);

    userObj['userid'] = 1;

    let myquery = {
      userid: 1
    };

    let newvalues = {
      $set: userObj
    };

    db.collection(collectionName).updateOne(
      myquery,
      newvalues,
      { upsert: true },
      function (err, result) {

        if (err) {
          console.error("Update failed:", err);
          client.close();

          return res.status(500).send({
            error: "Database update failed"
          });
        }

        client.close();

        res.send(userObj);
      }
    );
  });
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(3000, function () {
  console.log("App listening on port 3000!");
  console.log("Connected Mongo URL:", mongoUrl);
});