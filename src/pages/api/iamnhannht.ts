import {NextApiRequest, NextApiResponse} from "next";
import GithubColors from "@/data/colors.json"
import * as fs from "fs";
import {base} from "next/dist/build/webpack/config/blocks/base";
import path from "path";

async function fetchGithubUserRepoData(username: string, key = "") {
    const config = key !== "" ? {
        headers: {
            Authorization: `Bearer ${key}`
        }
    } : {}
    const userData = await fetch(`https://api.github.com/users/${username}/repos`, config)
    const json = await userData.json()
    const stars = json.reduce((totalStars: number, repo: any) => totalStars + repo.stargazers_count, 0)
    const issues = json.reduce((totalIssues: number, repo: any) => totalIssues + repo.open_issues_count, 0)
    const languages = new Map<string, number>()
    json.forEach((repo: any) => {
        const language = repo.language
        if (language) {
            languages.set(language, (languages.get(language) || 0) + 1)
        }
    })
    return {
        stars,
        issues,
        languages
    }
}

async function fetchGithubUserData(username: string, key = "") {
    const config = key !== "" ? {
        headers: {
            Authorization: `Bearer ${key}`
        }
    } : {}
    const userData = await fetch(`https://api.github.com/users/${username}`, config)
    const json = await userData.json()
    const followers = json.followers
    const repos = json.public_repos
    return {
        followers,
        repos
    }
}

async function fetchGithubEventsData(username: string, key = "") {
    const config = key !== "" ? {
        headers: {
            Authorization: `Bearer ${key}`
        }
    } : {}
    const userData = await fetch(`https://api.github.com/users/${username}/events`, {})
    const json = await userData.json()

    const commits = json.reduce((totalCommits: number, event: any) => {
        if (event.type === "PushEvent") {
            totalCommits += event.payload.commits.length
        }
        return totalCommits
    }, 0)
    return {
        commits
    }
}

async function generateCardSVG(stat: number,
                               unit: string,
                               x: number,
                               y: number,
                               width: number,
                               height: number) {

    let svg = ` 
 <g class="card">
 
    <rect class="cardContainer"
     x="${x}%" y="${y}%" width="${width}%" height="${height}%"
      rx="5%" fill="url(#blackPinkGradient)"
       stroke-dashoffset="100"
       stroke-dasharray="100"
       >
       <animate id="cardContainerReveal"
         attributeName="opacity"
            from="0"
            to="1"
            dur="1s"
            begin="0s"
            fill="freeze"
            />
</rect>
    <rect class="cardContainerInner1"
     x="${x + width * 0.05}%" y="${y + height * 0.05}%"
      width="${width * 0.9}%" height="${height * 0.9}%"
       rx="5%"
        fill="transparent"
         stroke="url(#rainbowGradient)"
       stroke-width="2"
        stroke-dashoffset="100"
        stroke-dasharray="150"
        >
    <animate id="cardContainerInner1StrokeDraw"
    attributeName="stroke-dashoffset"
    from="100"
    to="-200"
    dur="2s"
    repeatCount="indefinite"
    />
</rect>
    <text class="statNumber" font-family="Black Chancery"
     x="${x + width / 3}%" y="${y + height / 2}%"
      text-anchor="middle" alignment-baseline="middle" 
       font-size="60"  stroke="url(#rainbowGradient)" fill="transparent" stroke-dasharray="100" stroke-dashoffset="100"> 
${stat}
<animate id="strokeDraw" attributeName="stroke-dashoffset" from="100" to="0" dur="2s" fill="freeze" begin="0s" />
<animate id="hideStroke" attributeName="stroke" from="url(#mainGradient)" to="transparent" dur="0.5s" fill="freeze" begin="strokeDraw.end" />
<animate id="statReveal" attributeName="fill" from="transparent" to="white" dur="1s" fill="freeze" begin="hideStroke.end" />
     </text>
    <text class="unit" font-family="Black Chancery"
     x="${x + width * 2 / 3}%" y="${y + height / 2}%"
      font-size="40" opacity="0" text-anchor="middle" alignment-baseline="middle" fill="white" >
${unit}
<animate
id="unitReveal"
attributeName="opacity"
from="0"
to="1"
dur="1s"
begin="statReveal.end"
fill="freeze"
/>
</text> 
</g>
    `
    return svg
}

function generateCaroBackground(row: number, col: number) {
    let result = ""
    for (let r = 0; r < row; r++) {
        for (let c = 0; c < col; c++) {
//language=html
            const slot = `
                <rect class="slot" width="${100 / col}%" height="${100 / row}%"
                      id="slot${r}${c}"
                      x="${c * 100 / col}%"
                      y="${r * 100 / row}%"
                      fill="white"
                >
                    <animate
                            id="slot${r}${c}Fill"
                            attributeName="fill"
                            from="white"
                            to="rgb(${c * 100 / col},${r * 100 / row},${(r + c) * 100 / (row + col)})"
                            dur="1.5s"
                            begin="${(r + c) / (row + col)}s"
                            fill="freeze"
                    />
                    <animate
                            id="slot${r}${c}StartGlowing"
                            attributeName="fill"
                            from="rgb(${c * 100 / col},${r * 100 / row},${(r + c) * 100 / (row + col)})"
                            to="white"
                            dur="1s"
                            begin="slot${r}${c}Fill.end + 5s; slot${r}${c}StartGlowing.end + 5s"
                            fill="freeze"
                    />

                    <animate
                            id="slot${r}${c}EndGlowing"
                            attributeName="fill"
                            from="white"
                            to="rgb(${c * 100 / col},${r * 100 / row},${(r + c) * 100 / (row + col)})"
                            dur="1s"
                            begin="slot${r}${c}StartGlowing.end"
                            fill="freeze"
                    />
                </rect> `
            result += "\n"
            result += slot
        }
    }
    // console.log(result)


    // <animate
    //     id="slot${r}${c}Hallo"
    // attributeName="fill"
    // values="rgb(${c * 100 / col},${r * 100 / row},${(r + c) * 100 / (row + col)})"
    //
    //     />
    return result

}


async function generateSVG(stars: number,
                           issues: number,
                           commits: number,
                           repos: number,
                           followers: number,
                           languages: Map<string, number>) {
    const font = fs.readFileSync(path.resolve(process.cwd() + "/public", "blackchancery64"))
    // convert to base64
    return `
        <svg id="banner"
             viewBox="0 0 1000 1000"
             xmlns="http://www.w3.org/2000/svg"
             xmlns:xlink="http://www.w3.org/1999/xlink"

        >
            <!--            define filter and gradient -->
            <defs>
                <linearGradient id="rainbowGradient">
                    <stop offset="0%" stop-color="#FF0000"/>
                    <stop offset="16.67%" stop-color="#FF7F00"/>
                    <stop offset="33.33%" stop-color="#FFFF00"/>
                    <stop offset="50%" stop-color="#00FF00"/>
                    <stop offset="66.67%" stop-color="#0000FF"/>
                    <stop offset="83.33%" stop-color="#4B0082"/>
                    <stop offset="100%" stop-color="#8F00FF"/>
                </linearGradient>
                <linearGradient id="blackPinkGradient" x1="0" y1="0" x2="1" y2="1" >
                    <stop offset="0%" stop-color="#000000"/>
                    <stop offset="100%" stop-color="#FF00FF"/>
                </linearGradient>
                <linearGradient id="lightGreenGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#00FF00"/>
                    <stop offset="100%" stop-color="#FFFFFF"/>
                </linearGradient>
                <style>
                @font-face {
                    font-family: "Black Chancery";
                    src: url(data:font/ttf;charset=utf-8;base64,${font})
                     format("truetype");
                }
                </style>
            </defs>

            <filter id="blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blurred"/>
            </filter>
            <!--            clippath-->

            <clipPath
                    id="clip"
            >
                <rect id="rect1" width="40%" x="5%" y="5%" height="90%" rx="5%"/>
                <rect id="rect2" width="40%" x="55%" y="5%" height="90%" rx="5%"/>
            </clipPath>
            <!--            background-->
            <g id="backdrop">
                ${generateCaroBackground(20, 20)}
                <!--                <rect fill="red" x="0" y="0" width="200" height="100" />-->
            </g>

            <g style="clip-path: url(#clip)">
                <use xlink:href="#backdrop" style="filter: url(#blur)"/>
            </g>

            <use href="#rect1" style="fill:none;stroke:black; filter:drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4))  "/>
            <use href="#rect2" style="fill:none;stroke:black; filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4)) "/>


            <g>
                ${await generateCardSVG(repos, "repos", 7.5, 10, 35, 20)}
                ${await generateCardSVG(followers, "folks", 7.5, 40, 35, 20)}
                ${await generateCardSVG(stars, "stars", 7.5, 70, 35, 20)}
            </g>

            <g>
                ${await generateCardSVG(commits, "commits", 57.5, 10, 35, 35)}
                ${await generateCardSVG(issues, "issues", 57.5, 55, 35, 35)}
            </g>
        </svg>
    `
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const key = process.env.GITHUB_TOKEN
    const {stars, issues, languages} = await fetchGithubUserRepoData("nhannht", key)
    const {followers, repos} = await fetchGithubUserData("nhannht", key)
    const {commits} = await fetchGithubEventsData("nhannht", key)
    const svg = await generateSVG(stars, issues, commits, repos, followers, languages)
    // convert to edge function in vercel
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(200).send(svg)
}