package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

func fetch(url string) {
	resp, _ := http.Get(url)
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}

func main() {
	url := os.Args[1]
	fetch(url)
}

func unsafeOp() {
	var a [10]int
	fmt.Println(a[20])
}
