import { sleep } from "../utils/sleep";
import { scrapeGoaldotcom } from "./pages/goal";

interface ScrapperConfig {
    baseUrl: string;
    scrapper: (url:string)=> Promise<void | null>;
}

const scrapperList: ScrapperConfig[] = [
    {
        baseUrl:"https://goal.com/en-in/news",
        scrapper: scrapeGoaldotcom,
    }
]

export async function runAllScrapper():Promise<void>{
    try {
        for(const scrapperConfig of scrapperList){
            const {baseUrl,scrapper} = scrapperConfig;
            await scrapper(baseUrl);
            await sleep(1000)
        }
        console.log("Successfully scraped all the websites")
    } catch (error) {
        console.error("Error ",error)
    }
}