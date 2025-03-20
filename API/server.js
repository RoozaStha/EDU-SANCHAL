import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// MONGODB CONNECTION
mongoose
  .connect('mongodb+srv://stharooza3:jiEiWZqJAQnHz9vp@cluster0.f6if5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('MongoDb is connected Successfully.');
  })
  .catch((e) => {
    console.log('MongoDb error', e);
  });


  app.get("/test", (req,res)=>{
    res.send({id:1, message : "Welcome"})
  })

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server is running at PORT=>', PORT);
});
