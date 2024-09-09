package api

import (
	_ "embed"
	svg "github.com/ajstarks/svgo"
	"net/http"
	"strings"
)

//go:embed flower-and-so-called-feather.svg
var flower []byte

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

	canvas.DefEnd()

	// add text
	canvas.Text(width/2, height-50, "Believe nothing, no matter where you read it", "text-anchor:middle; font-size:16px; fill:url(#gradient)")
	canvas.Text(width/2, height-35, "or who said it,", "text-anchor:middle; font-size:16px; fill:url(#gradient)")
	canvas.Text(width/2, height-20, "no matter if I have said it", "text-anchor:middle; font-size:16px; fill:url(#gradient)")
	canvas.Text(width/2, height-5, "unless it agrees with your own reason and your own common sense.", "text-anchor:middle; font-size:16px; fill:url(#gradient)")
	// Close the canvas
	canvas.End()

}
