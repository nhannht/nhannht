import {NextApiRequest, NextApiResponse} from "next";
import {promises as fs} from "fs";
import path from "path";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const adventureRunImage = await fs.readFile(path.resolve(process.cwd() + "/public", "adventurer-run.base64"))
    const adventureAttackImage = await fs.readFile(path.resolve(process.cwd() + "/public", "adventurer-attack-chain.base64"))
    const minotaurTaackImage = await fs.readFile(path.resolve(process.cwd() + "/public", "minotaur-attack.base64"))
    const minotaurStandingImage = await fs.readFile(path.resolve(process.cwd() + "/public", "minotaur-standing.base64"))
    const fontBlackChancery = await fs.readFile(path.resolve(process.cwd() + "/public", "blackchancery64"))
    const forestBackground = await fs.readFile(path.resolve(process.cwd() + "/public", "forest-bottom.base64"))
    const programmingAdventureDay = new Date() - new Date("2018-08-01")
    const lifeAdventureDay = new Date() - new Date("1997-11-06")
    const svg = `
    <svg id="aventurer"
      viewBox="0 0 1000 300"
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
    <image id="adventure" href="data:image/png;base64,${adventureRunImage}" y="150" width="100" height="100" >
        <animate
            id="adventureMoveRight"
            attributeName="x"
            from="0"
            to="650"
            dur="2s"
            begin="0"
            fill="freeze"
            />
        <animate attributeName="opacity"
        id="adventureMoveRightHide"
        from="1"
        to="0"
        dur="0.01s"
        fill="freeze"
        begin="adventureMoveRight.end"/>
    </image>
    <image id="adventure-attack" href="data:image/png;base64,${adventureAttackImage}"
     opacity="0" x="650" y="150" width="100" height="100" >
    <animate attributeName="opacity"
    from="0"
    to="1"
    dur="0.01s"
    fill="freeze"
    begin="adventureMoveRight.end"/>
</image>
    <image id="minotaur-standing" href="data:image/png;base64,${minotaurStandingImage}" x="690" y="85" width="200" height="200" >
    <animate 
    id="hideMinotaurStanding"
    attributeName="opacity"
    from="1"
    to="0"
    dur="0.01s"
    fill="freeze"
    begin="adventureMoveRight.end"/>
    </image>
    <image id="minotaur-attack" href="data:image/png;base64,${minotaurTaackImage}" opacity="0" x="690" y="85" width="200" height="200" >
    <animate attributeName="opacity"
    from="0"
    to="1"
    dur="0.01s"
    fill="freeze"
    begin="adventureMoveRight.end"/>
</image>
    <text x="50"
     font-family="BlackChancery" 
     y="100"  font-size="100" fill="transparent" >Life are adventures
     
     <animate
     id="titleAppear"
        attributeName="fill"
        from="transparent"
        to="white"
        dur="1s"
        begin="adventureMoveRight.end"
        fill="freeze"/>
     </text>
     <text x="100" y="170"
     fill="transparent"
     font-family="BlackChancery"
     font-size="25">
     Programming adventure: ${Math.floor(programmingAdventureDay / (1000 * 60 * 60 * 24))} days
     <animate
     id="subtitleAppear"
        attributeName="fill"
        from="transparent"
        to="#70CA6C"
        dur="1s"
        begin="titleAppear.end+1s"
        fill="freeze"/>
    </text>
    
    </svg>
    `
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(200).send(svg)
}