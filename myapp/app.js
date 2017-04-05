var express = require('express')
var bodyParser = require("body-parser");
var app = express()
var lambda = require('../lambdatrans/index.js');
var convo = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: false, inflate: true, strict: false }));


app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.post('/login',function(req,res){
  var appid = req.body.app_id;
  var conv_id = JSON.stringify(req.body.data.item.id);
  var text = JSON.stringify(req.body.data.item.conversation_message.body);
  convo = {key1: text, key2: conv_id};
  console.log(req.body);
  console.log("APP ID " + appid );
  console.log("TEXT " + text);
  console.log("ID " + conv_id);
  lambda.handler(convo, "context")
  res.status(200);
  res.send();  
  res.end("yes");
});

app.listen(3001, function () {
  console.log('Example app listening on port 3000!')
})
