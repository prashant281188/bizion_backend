import express from "express";

import cors from 'cors'

import categoryRoutes from "./routes/category"
import hsnRoutes from "./routes/hsn"
import groupRoutes from "./routes/group"
import productRoutes from "./routes/product"
import taxRoutes from "./routes/tax"
import unitRoutes from "./routes/unit"
import transportRoutes from "./routes/transport"
import partyRoutes from "./routes/party"
import { responseHandler } from "./utils/responseHandler";

const app = express();

const PORT = process.env.PORT

const allowedOrigin = ["http://localhost:3000", "https://192.168.29.120:3000", "*"];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigin.indexOf(origin) !== -1) {
      callback(null, true)
    }
    else {
      callback(new Error('not allowed'))
    }
  },
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions));

app.use(express.json());
app.use(responseHandler)


app.get("/", (req, res) => {
  res.send("Hellow from your Express server");
});


app.use('/api/v1/category', categoryRoutes)
app.use('/api/v1/group', groupRoutes)
app.use('/api/v1/hsn', hsnRoutes)
app.use('/api/v1/party', partyRoutes)
app.use('/api/v1/product', productRoutes)
app.use('/api/v1/tax', taxRoutes)
app.use('/api/v1/transport', transportRoutes)
app.use('/api/v1/unit', unitRoutes)




app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
