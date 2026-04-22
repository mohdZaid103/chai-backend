import express from "express"  
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN
}))
/*json data handle */
app.use(express.json({limit:"20kb"}))
/*url data handling */
app.use(express.urlencoded({
    extended:true
}))

/*public assets anyone can use */
app.use(express.static("public"))

app.use(cookieParser())



export default app