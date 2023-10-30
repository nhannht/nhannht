import {NextApiRequest, NextApiResponse} from "next";
import {promises as fs} from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const adventureTiredImage = await fs.readFile(path.resolve(process.cwd() + "/public", "adventurer-run.base64"))
    const fontBlackChancery = await fs.readFile(path.resolve(process.cwd() + "/public", "blackchancery64"))
    const forestBackground = await fs.readFile(path.resolve(process.cwd() + "/public", "forest.base64"))

    const svg = `
    <svg id="aventurer"
      viewBox="0 500 1000 1000"
       xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        >
        <defs>
        <style>
        @font-face {
            font-family: "BlackChancery";
            src: url("data:font/ttf;base64,${fontBlackChancery}") format("truetype");        
        }
        </style> 
        
    </defs>
    <image id="forest"
     
     href="data:image/png;base64,${forestBackground}"  />
    <image id="adventure" href="data:image/png;base64,${adventureTiredImage}" y="650" width="100" height="100" >
        <animate
            id="adventureMoveRight"
            attributeName="x"
            from="0"
            to="800"
            dur="2s"
            begin="0"
            fill="freeze"
            />
    </image>
    <text x="50"
     font-family="BlackChancery" 
     y="650"  font-size="100" fill="transparent" >Life is adventures
     
     <animate
     id="textAppear"
        attributeName="fill"
        from="transparent"
        to="white"
        dur="1s"
        begin="adventureMoveRight.end"
        fill="freeze"/>
     </text>
    
    </svg>
    `
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(200).send(svg)
}