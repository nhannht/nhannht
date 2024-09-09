package main

import (
	"github.com/nhannht/nhannht/api"
	"net/http"
)

func main() {

	http.HandleFunc("/api/scrollaround", api.WhataHandler)
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}

}
