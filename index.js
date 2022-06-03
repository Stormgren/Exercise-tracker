const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const { response } = require('express');
require('dotenv').config('./.env')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongo_uri = process.env.MONGO_URI;
mongoose.connect(mongo_uri,  { useNewUrlParser: true, useUnifiedTopology: true })

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
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

  let exercise = new Exercise({
    description: desc,
    duration: duration,
    date: date
  })

  
  if(excerise.date === ''){
    exercise.date = new Date().toISOString().substring(0,10)
  }
  
  User.findByIdAndUpdate(id, {$push: {log: exercise}},function(err, exerciseInfo) {
    console.log(exerciseInfo)
   if(!err){
    let userObject = {}
      // userObject['description'] = exercise.desc,
      // userObject['duration'] = exercise.duration,
      // userObject['date'] = exercise.date
      userObject['_id'] = exerciseInfo.id
      userObject['username'] = exerciseInfo.username
      userObject['description'] = exercise.description
      userObject['duration'] = exercise.duration
      userObject['date'] = new Date(exercise.date).toDateString()
     
    
    console.log('user 123 ', userObject)
   

    res.json(userObject)    
   }
  })
})

app.get("/api/users/:id/logs", (req, res) => {
  let id = req.params.id
  let fromDate = req.query.from
  let toDate = req.query.to
  let respLimit = req.query.limit;
  let responseFilter = null;
  User.findById(id, {username: 0, _id: 0}, (err, logs) => {
    
    let count = logs.log.length
    let respObj = {
      count: count,
      log: logs.log
    }

    if(fromDate){
      const fromTime = new Date(fromDate).getTime();
      if(toDate){
        const toTime = new Date(toDate).getTime();
        responseFilter = logs.log.filter(ex => new Date(ex.date).getTime() >= fromTime && new Date(ex.date).getTime() <= toTime);
      }else{
        responseFilter = logs.log.filter(ex => new Date(ex.date).getTime() >= fromTime);
      }
    }
    if(respLimit){
      responseFilter = logs.log.slice(0, respLimit);
    }
    // logs['count'] =  count
    if(err) console.log(err)
    
   
   
      res.json(respObj)
   
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
