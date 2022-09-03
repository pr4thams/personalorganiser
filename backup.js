const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
var dateVal=require(__dirname+"/date.js");
const app = express();
day=dateVal();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistdb",{useNewUrlParser:true});

const todolistSchema = 
{
    item : String
}

const Item = mongoose.model("Item",todolistSchema);

app.get('/', function (req, res) {

    Item.find({}, function(err,foundItems){
    res.render("list",{listTitle: day, newListItem: foundItems});
    });
});

app.get("/:customListName", function(req,res)
{
    console.log(req.params.customListName);
});

app.post("/",function(req, res){
    var itemval=req.body.newItem;
        if(itemval != "")
        {
            var itemToSave=new Item({item:itemval});
            itemToSave.save();
            res.redirect("/");
        }
        else
        {
            res.redirect("/");
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
    res.redirect("/");
    }
);

app.listen(3000, function(){
    console.log("Server initiated at 3000");
})