package api

import (
	_ "embed"
	"encoding/base64"
	"fmt"
	svg "github.com/ajstarks/svgo"
	"net/http"
	"strings"
)

//go:embed flower-and-so-called-feather.svg
var flower []byte

//go:embed ringbearer.ttf
var RingFont []byte

const (
	width  = 342 + 100
	height = 332 + 100
)

func WhataHandler(w http.ResponseWriter, r *http.Request) {
	// Set the content type to SVG
	w.Header().Set("Content-Type", "image/svg+xml")

	// add w to new canvas
	canvas := svg.New(w)

	canvas.Start(width, height)

	// Convert the embedded SVG content to a string
	svgContent := string(flower)

	// Remove the xml tag, which cause bug in html response
	svgContent = strings.Replace(svgContent, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>", "", 1)
	// set width and height
	svgContent = strings.Replace(svgContent, "<svg", "<svg width=\"342\" height=\"332\" x=\"50\" y=\"20\"", 1)

	// Write the cleaned SVG content to the canvas
	if _, err := canvas.Writer.Write([]byte(svgContent)); err != nil {
		http.Error(w, "Failed to write SVG content", http.StatusInternalServerError)
		return
	}

	canvas.AnimateRotate("#Layer_1-2", 0, (width-100)/2, (height-100)/2,
		360, (width-100)/2, (height-100)/2, 10, -1)

	canvas.Def()
	canvas.LinearGradient("gradient", 0, 0, 100, 0, []svg.Offcolor{
		{Offset: 0, Color: "red", Opacity: 1},
		{Offset: 50, Color: "purple", Opacity: 1},
		{Offset: 100, Color: "orange", Opacity: 1},
	})
	fontBase64 := base64.StdEncoding.EncodeToString(RingFont)
	canvas.Style("text/css", fmt.Sprintf(`
        @font-face {
            font-family: 'customFont';
            src: url(data:font/ttf;base64,%s) format('truetype');
        }
    `, fontBase64))

	canvas.DefEnd()

	// add text
	canvas.Gstyle("font-family:customFont; text-anchor:middle; fill:url(#gradient); font-size:12px")

	canvas.Text(width/2, height-80, "Believe nothing, no matter where you read it")
	canvas.Text(width/2, height-65, "or who said it,")
	canvas.Text(width/2, height-50, "no matter if I have said it")
	canvas.Text(width/2, height-35, "unless it agrees with your own reason")
	canvas.Text(width/2, height-20, "and your own common sense.")
	canvas.Gend()
	canvas.Text(width/2, height-5, "\"Buddha\"", "text-anchor:middle; font-size:8px;font-style:italic")
	// Close the canvas
	canvas.End()

}
