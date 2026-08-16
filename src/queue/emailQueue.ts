import {Queue} from "bullmq";
import { bullmqConnection } from "../config/redis";

const emailQueue = new Queue("email-queue",{
    connection: bullmqConnection
});

export const addEmailJob = async (emailData: { to: string, subject: string, html: string }) => {
    await emailQueue.add("send-email", emailData, {
        attempts: 3, 
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
       
    });
};

import { Worker, Job } from "bullmq";
import { sendEmail } from "../config/mailer";

export const emailWorker = new Worker(
    "email-queue",
    async (job: Job) => {
        const { to, subject, html } = job.data;
        console.log(`Processing email job ${job.id} to ${to}...`);
        
        await sendEmail(to, subject, html);
    },
    { 
        connection: bullmqConnection 
    }
);

emailWorker.on("completed", (job) => {
    console.log(`Email job ${job.id} has completed successfully!`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed with error:`, err.message);
});