import { Job, Queue, Worker } from "bullmq";
import { bullmqConnection} from "../config/redis";
import { sleep } from "../utils/sleep";
import { fetchPage } from "../scrapper/fetchPage";
import * as cheerio from "cheerio";

import { appendFile } from "node:fs/promises";
import { scrapeGoaldotcom } from "../scrapper/pages/goal";

const scrapeQueue = new Queue("scrape-queue",{
    connection:bullmqConnection
})

const scrapeWorker = new Worker("scrape-queue", async (job:Job)=>{
    console.log(`Processing scrape job ${job.id}`)
    await sleep()
    scrapeGoaldotcom("https://goal.com/en-in/news")
    
},{
    connection:bullmqConnection
})

export const addScrapeJob = async (url:string,time:number)=>{
    await scrapeQueue.upsertJobScheduler("scrape-job",{
        every:time
    },{
        name:"scrape-job",
        data:{
            url:url,
            time:time
        },
        opts:{
            attempts:3,
            backoff:{
                type:"exponential",
                delay:1000
            },
            removeOnComplete:true
        }
    })
}

scrapeWorker.on("completed",(job)=>{
    console.log(`Scrape job ${job.id} has completed successfully!`)
})

scrapeWorker.on("failed",(job,error)=>{
    console.log(`Scrape job ${job?.id} has failed with error: ${error.message}`)
})
