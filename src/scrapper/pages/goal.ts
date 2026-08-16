import { appendFile } from "node:fs/promises";
import { fetchPage } from "../fetchPage";
import * as cheerio from "cheerio"
export async function scrapeGoaldotcom(url: string) {

    try {
        const response = await fetchPage(url);
        if (!response) {
            return null;
        }
        const $ = cheerio.load(response.data);
        const news = $(".component-news-archive").find(".item");
        news.each((index, element) => {
            const card = $(element);
            const title = card.find("h3.title").text().trim()
            const teaser = card.find("p.teaser").text().trim()
            const imageUrl = card.find("img").attr("src")
            const href = card
                .find('a[data-testid="card-title-url"]')
                .attr("href");
            const sourceURL = href? new URL(href,"https://goal.com").href : null
            const tagElemets = card.find("a.component-tag")
            let tags: string[] = [];
            tagElemets.each((index, element) => {
                const tag = $(element).text().trim();
                if (tag) {
                    tags.push(tag)
                }
            })

            console.log({
                title,
                teaser,
                tags,
                sourceURL
            })

        })
    } catch (error) {
        console.error(`error while scrapping goaldotcom ${error}`)
    }
}