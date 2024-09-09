package main

import (
	"github.com/nhannht/nhannht/api"
	"net/http"
)

func main() {

	http.HandleFunc("/api/scroll-around-and-around", api.WhataHandler)
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}

}
