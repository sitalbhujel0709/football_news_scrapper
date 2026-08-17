import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import { fetchPage } from "../fetchPage";
import * as cheerio from "cheerio"
export async function scrapeGoaldotcom(url: string) {

    try {
        const response = await fetchPage(url);
        if (!response) {
            return null;
        }
        let articles: Prisma.NewsCreateInput[] = []
        const $ = cheerio.load(response.data);
        const news = $(".component-news-archive").find(".item");
        news.each((index, element) => {
            const card = $(element);
            const title = card.find("h3.title").text().trim()
            const content = card.find("p.teaser").text().trim()
            const imageUrl = card.find("img").attr("src")
            const href = card
                .find('a[data-testid="card-title-url"]')
                .attr("href");
            const sourceURL = href ? new URL(href, "https://goal.com").href : null
            const tagElemets = card.find("a.component-tag")
            const publishedAt = card
                .find('time[data-testid="publish-time"]')
                .attr("datetime") ?? null;
            let tags: string[] = [];
            tagElemets.each((index, element) => {
                const tag = $(element).text().trim();
                if (tag) {
                    tags.push(tag)
                }
            })
            if (title && content && sourceURL) {
                articles.push({
                    title,
                    content,
                    publishedAt: publishedAt ? new Date(publishedAt) : null,
                    imageUrl: imageUrl ?? null,
                    tags,
                    sourceUrl: sourceURL!

                })
            }

        })
        await prisma.news.createMany({
            data:articles,
            skipDuplicates:true
        })
        console.log(`successfully scraped ${articles.length} articles `)
    } catch (error) {
        console.error(`error while scrapping goaldotcom ${error}`)
    }
}