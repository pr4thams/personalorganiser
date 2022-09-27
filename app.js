require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
var dateVal=require(__dirname+"/date.js");
const app = express();
var session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const https = require('https');
const { url } = require('inspector');
const { IPinfoWrapper } = require("node-ipinfo");
const { stringify } = require('querystring');
const { json } = require('body-parser');
const { response } = require('express');
const ipinfo = new IPinfoWrapper(process.env.KEY1);
const PORT = process.env.PORT || 3000;
const requestIp = require('request-ip');
//const JSON= require('JSON');
var ipaddress=""
var country="";
var city="";
var cname="";


// const requestListener = function (req, res) {
//     ipaddress=req.socket.localAddress;
// };
const ipMiddleware = function(req, res) {
    const ipaddress = requestIp.getClientIp(req); 
};

 app.get('/', function (req, res) {
 //   ipaddress = req.socket.remoteAddress;
    res.render("login");
});


ipinfo.lookupIp(ipaddress).then((response) => {
    country=response.country;
    city=response.city;
    cname=country.substring(0,2);
});

var uname="";
day=dateVal();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret: 'Mysecret.',
    resave: false,
    saveUninitialized: true
  }));

  app.use(passport.initialize());
  app.use(passport.session());


// var mongooseA = mongoose.createConnection("mongodb://127.0.0.1:27017/userlistdb");
// var mongooseB = mongoose.createConnection("mongodb://127.0.0.1:27017/todolistdb");

var mongooseA = mongoose.createConnection("mongodb+srv://ajay0608:Gaur%40623@cluster0.kxhcyrr.mongodb.net/?retryWrites=true&w=majority");
var mongooseB = mongoose.createConnection("mongodb+srv://ajay0608:Gaur%40623@cluster0.kxhcyrr.mongodb.net/?retryWrites=true&w=majority");

const userlistSchema = new mongoose.Schema (
{
    user : String,
    password: String
});

const todolistSchema =  new mongoose.Schema(
{
    user : String,
    item : String,
});

userlistSchema.plugin(passportLocalMongoose);

const User = mongooseA.model("User",userlistSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const Item = mongooseB.model("Item",todolistSchema);


app.get('/login', function (req, res) {
        res.render("login");
});
app.post("/login",function(req, res){
    var user = User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user, function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
                passport.authenticate("local")(req,res,function(){
                res.redirect("/list");
            });
        }
    });
    uname=user.username;
});

app.get('/register', function (req, res) {
    res.render("register");
});

app.get('/register-err', function (req, res) {
    res.render("register-err");
});

app.post("/register",function(req, res){
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) {
            res.redirect("/register-err");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                uname=req.body.username;
                res.redirect("/list");
            });
        }
    })});

app.get("/list", function (req, res) {
        if(req.isAuthenticated()){
        if (city==="")
        {
            city="New York";
        }
        const uri='https://api.openweathermap.org/data/2.5/weather?q='+city+'&appid=cfa49417e268c92086a46a5f90a84a64&units=metric';
        https.get(uri,function(response){
        //console.log(response.statusCode);
        response.on("data",function(data){
        const WData=JSON.parse(data);
        const tempr=WData.main.temp;
        const description=WData.weather[0].description;
        const icon=WData.weather[0].icon;
        const imageURL="http://openweathermap.org/img/wn/"+icon+"@2x.png";
        Item.find({user:uname}, function(err,foundItems){
        res.render("list",{listTitle: day, newListItem: foundItems, un: uname, cityname: city, tempo: tempr, des:description, iurl:imageURL});
        })});
        })
        }
        else
        {
            res.redirect("/login");
        }
    });

app.post("/list",function(req, res){
       
    var itemval=req.body.newItem;
    
        if(itemval != "")
        {
            var itemToSave=new Item({user:uname, item:itemval});
            itemToSave.save();
            res.redirect("/list");
        }
        else
        {
            res.redirect("/list");
        }
    }
);

app.post("/delete",function(req, res){
    var itemdel=req.body.delcheck;
    Item.findByIdAndDelete(itemdel, function(err)
    {
        if(!err)
        {
            console.log("ID removed");
        }
    });
    res.redirect("/list");
    }
);

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.redirect("/login");
        }
    });
  });

app.get("/news", function (req, res) {
var news=[];
if(cname==="")
{
    cname="us";
}
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.KEY2);
// To query /v2/top-headlines
// All options passed to topHeadlines are optional, but you need to include at least one of them

newsapi.v2.topHeadlines({'country': cname}).then(response => {
    //console.log(response);
    const newsval=JSON.parse(JSON.stringify(response));
    for (var i=0;i<10;i++)
    {
        news.push([newsval.articles[i].title,newsval.articles[i].url]);        
    }
    res.render("news",{newListItem: news});
  });
});

app.get("/bnews", function (req, res) {
    var newsb=[];
    if(cname==="")
    {
        cname="us";
    }
    const NewsAPI = require('newsapi');
    const newsapi = new NewsAPI(process.env.KEY2);
    // To query /v2/top-headlines
    // All options passed to topHeadlines are optional, but you need to include at least one of them
    newsapi.v2.topHeadlines({'category': 'business','country':cname}).then(response => {
        //console.log(response);
        const newsvalb=JSON.parse(JSON.stringify(response));
        for (var i=0;i<10;i++)
        {
            newsb.push([newsvalb.articles[i].title,newsvalb.articles[i].url]);        
        }
        res.render("newsb",{newListItem: newsb});
      });
});

app.get("/tnews", function (req, res) {
    var newst=[];
    if(cname==="")
    {
        cname="us";
    }
    const NewsAPI = require('newsapi');
    const newsapi = new NewsAPI(process.env.KEY2);
    // To query /v2/top-headlines
    // All options passed to topHeadlines are optional, but you need to include at least one of them
     newsapi.v2.topHeadlines({'category': 'technology','country':cname}).then(response => {
        //console.log(response);
        const newsvalt=JSON.parse(JSON.stringify(response));
        for (var i=0;i<10;i++)
        {
            newst.push([newsvalt.articles[i].title,newsvalt.articles[i].url]);        
        }
        res.render("newst",{newListItem: newst});
      });
});

app.listen(PORT, function(){
    console.log("Server initiated at 3000");
})
