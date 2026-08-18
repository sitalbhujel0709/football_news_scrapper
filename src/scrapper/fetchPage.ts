import axios from "axios"
import { sleep } from "../utils/sleep";

interface FetchOptions {
    retries?: number;
    delay?: number;
    timeout?: number;
    headers?: Record<string, string>
}
export async function fetchPage(url: string, options: FetchOptions = {}) {
    const { retries = 3, delay = 0, timeout = 15000, headers = {} } = options
    const randomDelay = delay || Math.floor(Math.random() * 900 + 300);
    await sleep(randomDelay);

    const defaultHeaders = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": getDomain(url),
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        ...headers,
    };
    for(let attempt = 1; attempt<=retries;attempt++){
        try {
            const response = await axios.get(url,{
                headers:defaultHeaders,
                timeout,
                validateStatus: (status) => status<500,
                maxRedirects:5
            })
            if(response.status === 200){
                return {data: response.data, status: response.status}
            }
            if(response.status >= 400 && response.status <500){
                return null
            }

            if(attempt < retries){
                const backoffDelay = attempt*1000;
                await sleep(backoffDelay);
            }
        } catch (error:any) {
            const isLastAttempt = attempt === retries;
            console.log(error)
            if(isLastAttempt){
                console.error(`Failed to fetch ${url} after ${retries} attempts`,error);
                return null;
            }
            if(error.code === "ENOTFOUND" || error.code === "ECONNREFUSED"){
                console.log(2)
                return null
            }
            const backoffDelay = attempt*1000;
            await sleep(backoffDelay);
        }
        return null
    }
}

function getDomain(url: string) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (error) {
        return "";
    }
}