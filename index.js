const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
require('dotenv').config('./.env')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongo_uri = process.env['MONGO_URI'];
mongoose.connect(mongo_uri,  { useNewUrlParser: true, useUnifiedTopology: true })

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String
})

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema)

app.post("/api/users", (req, res, next) => {
  let info = req.body.username;

  const userModel = new User({
    username: info
  });

  User.create(userModel, function(err, data){
    if (err) return console.log(err);
  })

  res.send(userModel)
})

app.get('/api/users', (req, res) => {
  User.find({}, { log: 0 }, (err, users) => {
    if (err) console.log(err)
    res.send(users)
    
  })
})

app.post("/api/users/:id/exercises", (req, res) => {
  let id = req.params.id // || param
  let desc = req.body.description
  let duration = parseInt(req.body.duration)
  let date = req.body.date

  let exc = {
    description: desc,
    duration: duration,
    date: date
  }
  
  if(!exc.date || exc.date === undefined){
    exc.date = new Date().toDateString()
  } else if(exc.date){
    exc.date = new Date(exc.date).toDateString()
  }
  User.findByIdAndUpdate(id, {$push: {log: exc}},function(err, exerciseInfo) {
    console.log(exerciseInfo)
   if(!err){
    let userObject = {}
     
      userObject['_id'] = exerciseInfo.id
      userObject['username'] = exerciseInfo.username
      userObject['description'] = exc.description
      userObject['duration'] = exc.duration
      userObject['date'] = exc.date.toString()
      
    console.log('user 123 ', userObject)
   
    res.send(userObject)    
   }
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params._id, (error, result) => {
    if (!error) {
      let resObj = result;

      if (req.query.from || req.query.to) {
        let fromDate = new Date(0);
        let toDate = new Date();

        if (req.query.from) {
          fromDate = new Date(req.query.from);
        }

        if (req.query.to) {
          toDate = new Date(req.query.to);
        }

        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        resObj.log = resObj.log.filter(session => {
          let sessionDate = new Date(session.date).getTime();

          return sessionDate >= fromDate && sessionDate <= toDate;
        });
      }

      if (req.query.limit) {
        resObj.log = resObj.log.slice(0, req.query.limit);
      }

      resObj = resObj.toJSON();
      resObj["count"] = result.log.length;
      res.json(resObj);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
