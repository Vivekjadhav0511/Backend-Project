
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { LIMIT } from './constants.js'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({  // to accept data in json { throught body }
    limit: LIMIT
}))

app.use(express.urlencoded({  //to accept data from url
    extended: true,
    limit: LIMIT
}))

app.use(express.static("public"))  // to store pdf image foldar in server public asset

app.use(cookieParser())

// routes

import userRoutes  from './routes/user.routes.js'

// routes declaration

app.use("/api/v1/users" , userRoutes )

// http://localhost:8000/api/v1/users/register

export default app