import app from "./app";
import connectToDB from "./config/database";
import redisClient from "./config/redis";
import "./queue/emailQueue"; // Initialize the email worker
import { addScrapeJob } from "./queue/scrapeQueue";
import { fetchPage } from "./scrapper/fetchPage";
const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectToDB();
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log("Redis connected successfully");
    await addScrapeJob("https://goal.com/en-in/news",1000*5);
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
