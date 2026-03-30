import "dotenv/config";
import { app } from "./app";

const PORT = process.env.PORT ;
const HOST = process.env.HOST

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`API DOCS URL ${HOST}:${PORT}/api/docs`)
});
