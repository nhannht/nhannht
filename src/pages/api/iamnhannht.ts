import {NextRequest} from "next/server";
import {NextApiRequest, NextApiResponse} from "next";
function generateCaroBackground(row: number, col: number) {
    let result = ""
    for (let r = 0; r < row; r++) {
        for (let c = 0; c < col; c++) {
//language=html
            const slot = `
                <rect class="slot" width="${100 / col}%" height="${100 / row}%" 
                      id="slot-${r}-${c}"
                      x="${c*100/col}%"
                      y="${r*100/row}%"
                      fill="white"
                >
                    <animate
                            attributeName="fill"
                            values="rgb(${c*100/col},${r*100/row},${(r+c) * 100/ (row + col)})"
                            begin="${(row*r + c)/(row+col)}s"
                        />
                    
                    
                </rect> `
                      // fill="rgb(${c*100/col},${r*100/row},${(r+c) * 100/ (row + col)})"
                      // fill="rgb(${calculateRGB(r,c)})"
            result += "\n"
            result += slot
        }
    }
    // console.log(result)
    return result

}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // language=html
    const helloBanner = `
        <svg id="banner"
             viewBox="0 0 1000 1000"
             xmlns="http://www.w3.org/2000/svg"
             xmlns:xlink="http://www.w3.org/1999/xlink"

        >
            <!--            define filter and gradient -->
            <defs>

                <linearGradient id="mainGradient">
                    <stop offset="0%" stop-color="yellow"/>
                    <stop offset="100%" stop-color="green"/>
                </linearGradient>
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
                <rect class="card" width="35%" x="7.5%" y="10%" height="20%" fill="white"/>
                <rect class="card" width="35%" x="7.5%" y="40%" height="20%" fill="white"/>
                <rect class="card" width="35%" x="7.5%" y="70%" height="20%" fill="white"/>
            </g>

            <g>
                <rect class="card" width="35%" x="57.5%" y="10%" height="20%" fill="white"/>
                <rect class="card" width="35%" x="57.5%" y="40%" height="20%" fill="white"/>
                <rect class="card" width="35%" x="57.5%" y="70%" height="20%" fill="white"/>
            </g>
        </svg>
    `
    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(200).send(helloBanner)
}