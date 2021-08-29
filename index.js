const {app,BrowserWindow,ipcMain}   = require("electron");
const mongoose   = require("mongoose");

//mongodb connection
mongoose.connect("mongodb://localhost:27017/electdemo",
{useCreateIndex:true,useNewUrlParser:true,useUnifiedTopology:true,useUnifiedTopology:true})
.then(()=>{
   console.log("connected to db");
})
.catch((err)=>{
  console.log("db connection error",err);
})

var todoSchema = new mongoose.Schema({
     items : {
       type:String,
       required:true
     },
     createdAt:{
       type:Date
     },
     updatedAt:{
       type:Date,
       default:null
     }
});

var todoModel = mongoose.model("todo",todoSchema);

let win = null
app.on('ready', () => {
 win = new BrowserWindow({
     width:800,height:600, webPreferences: {
     nodeIntegration: true,
     contextIsolation: false,
     enableRemoteModule: true,
     devTools:true
      }
    });
 win.setMenu(null);   // hide the menu
 win.loadURL(`file://${__dirname}/index.html`)

 win.webContents.on('did-finish-load',()=>{
    todoModel.find({},{},(err,data)=>{
      if(err){
        console.log(err);
      }
      else{
            var dataa = JSON.stringify(data);
         win.webContents.send('getonload',dataa)
      }
    })
 })

 win.on('closed', () => {
 win = null
  })
});

ipcMain.on('add', (event, arg) => {
  console.log(arg);
     let todoData = new todoModel({
         items: arg,
         createdAt:Date.now()
     });
     todoData.save((err,data)=>{
         if(err){
           console.log(err.message);
         }
         else{
           todoModel.find({},{},(err,fdata)=>{
              if(err){
                console.log(err);
              }
              else{
                var dataa = JSON.stringify(fdata);
               event.sender.send('getonload',dataa);
              }
           });
         }
     });
});

ipcMain.on("edit",(event,arg)=>{
    todoModel.findOne({"_id":arg},(err,data)=>{
          if(err){
            console.log(err);
          }
          else{
            var dataa = {
              id:data._id,
              items:data.items
            }
            console.log(dataa);
            dataa = JSON.stringify(dataa);
            event.sender.send("editedData",dataa);
          }
    });
});

ipcMain.on("update",(event,arg)=>{
     console.log(arg);
     todoModel.findOneAndUpdate({"_id":arg.id},{$set:{"items":arg.items,"updatedAt":Date.now()}},{new:true},(err,udata)=>{
           if(err){
             console.log(err);
           }
           else if(udata){
            todoModel.find({},{},(err,data)=>{
              if(err){
                console.log(err);
              }
              else{
                    var dataa = JSON.stringify(data);
                 event.sender.send('getonload',dataa)
              }
            })
           }
           else{
             console.log("data not updated");
           }
     });
});

ipcMain.on("delete",(event,arg)=>{
   todoModel.deleteOne({"_id":arg},(err,deldata)=>{
      if(err){
        console.log(err);
      }
      else{
        todoModel.find({},{},(err,data)=>{
          if(err){
            console.log(err);
          }
          else{
                var dataa = JSON.stringify(data);
             event.sender.send('getonload',dataa)
          }
        })
      }
   });
});

   