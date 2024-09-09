package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type GithubRepo struct {
	StargazersCount int    `json:"stargazers_count"`
	OpenIssuesCount int    `json:"open_issues_count"`
	Language        string `json:"language"`
}

type GithubUser struct {
	Followers   int `json:"followers"`
	PublicRepos int `json:"public_repos"`
}

type GithubEvent struct {
	Type    string `json:"type"`
	Payload struct {
		Commits []struct{} `json:"commits"`
	} `json:"payload"`
}

func fetchGithubUserRepoData(username, key string) (int, int, map[string]int, error) {
	config := ""
	if key != "" {
		config = fmt.Sprintf("Bearer %s", key)
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("https://api.github.com/users/%s/repos", username), nil)
	if err != nil {
		return 0, 0, nil, err
	}
	if config != "" {
		req.Header.Set("Authorization", config)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, nil, err
	}
	defer resp.Body.Close()

	var repos []GithubRepo
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return 0, 0, nil, err
	}

	stars := 0
	issues := 0
	languages := make(map[string]int)
	for _, repo := range repos {
		stars += repo.StargazersCount
		issues += repo.OpenIssuesCount
		if repo.Language != "" {
			languages[repo.Language]++
		}
	}

	return stars, issues, languages, nil
}

func fetchGithubUserData(username, key string) (int, int, error) {
	config := ""
	if key != "" {
		config = fmt.Sprintf("Bearer %s", key)
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("https://api.github.com/users/%s", username), nil)
	if err != nil {
		return 0, 0, err
	}
	if config != "" {
		req.Header.Set("Authorization", config)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	var user GithubUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return 0, 0, err
	}

	return user.Followers, user.PublicRepos, nil
}

func fetchGithubEventsData(username, key string) (int, error) {
	config := ""
	if key != "" {
		config = fmt.Sprintf("Bearer %s", key)
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("https://api.github.com/users/%s/events", username), nil)
	if err != nil {
		return 0, err
	}
	if config != "" {
		req.Header.Set("Authorization", config)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var events []GithubEvent
	if err := json.NewDecoder(resp.Body).Decode(&events); err != nil {
		return 0, err
	}

	commits := 0
	for _, event := range events {
		if event.Type == "PushEvent" {
			commits += len(event.Payload.Commits)
		}
	}

	return commits, nil
}

func generateCardSVG(stat int, unit string, x, y, width, height float64) string {
	return fmt.Sprintf(`
<g class="card">
    <rect class="cardContainer" x="%f%%" y="%f%%" width="%f%%" height="%f%%" rx="5%%" fill="url(#blackPinkGradient)" stroke-dashoffset="100" stroke-dasharray="100">
        <animate id="cardContainerReveal" attributeName="opacity" from="0" to="1" dur="1s" begin="0s" fill="freeze"/>
    </rect>
    <rect class="cardContainerInner1" x="%f%%" y="%f%%" width="%f%%" height="%f%%" rx="5%%" fill="transparent" stroke="url(#rainbowGradient)" stroke-width="2" stroke-dashoffset="100" stroke-dasharray="150">
        <animate id="cardContainerInner1StrokeDraw" attributeName="stroke-dashoffset" from="100" to="-200" dur="2s" repeatCount="indefinite"/>
    </rect>
    <text class="statNumber" font-family="Black Chancery" x="%f%%" y="%f%%" text-anchor="middle" alignment-baseline="middle" font-size="60" stroke="url(#rainbowGradient)" fill="transparent" stroke-dasharray="100" stroke-dashoffset="100">
        %d
        <animate id="strokeDraw" attributeName="stroke-dashoffset" from="100" to="0" dur="2s" fill="freeze" begin="0s"/>
        <animate id="hideStroke" attributeName="stroke" from="url(#mainGradient)" to="transparent" dur="0.5s" fill="freeze" begin="strokeDraw.end"/>
        <animate id="statReveal" attributeName="fill" from="transparent" to="white" dur="1s" fill="freeze" begin="hideStroke.end"/>
    </text>
    <text class="unit" font-family="Black Chancery" x="%f%%" y="%f%%" font-size="40" opacity="0" text-anchor="middle" alignment-baseline="middle" fill="white">
        %s
        <animate id="unitReveal" attributeName="opacity" from="0" to="1" dur="1s" begin="statReveal.end" fill="freeze"/>
    </text>
</g>
`, x, y, width, height, x+width*0.05, y+height*0.05, width*0.9, height*0.9, x+width/3, y+height/2, stat, x+width*2/3, y+height/2, unit)
}

func generateCaroBackground(row, col int) string {
	var result strings.Builder
	for r := 0; r < row; r++ {
		for c := 0; c < col; c++ {
			slot := fmt.Sprintf(`
<rect class="slot" width="%f%%" height="%f%%" id="slot%d%d" x="%f%%" y="%f%%" fill="white">
    <animate id="slot%d%dFill" attributeName="fill" from="white" to="rgb(%d,%d,%d)" dur="1.5s" begin="%fs" fill="freeze"/>
    <animate id="slot%d%dStartGlowing" attributeName="fill" from="rgb(%d,%d,%d)" to="white" dur="1s" begin="slot%d%dFill.end + 5s; slot%d%dStartGlowing.end + 5s" fill="freeze"/>
    <animate id="slot%d%dEndGlowing" attributeName="fill" from="white" to="rgb(%d,%d,%d)" dur="1s" begin="slot%d%dStartGlowing.end" fill="freeze"/>
</rect>`, 100/float64(col), 100/float64(row), r, c, float64(c)*100/float64(col), float64(r)*100/float64(row), r, c, c*100/col, r*100/row, (r+c)*100/(row+col), float64(r+c)/float64(row+col), r, c, c*100/col, r*100/row, (r+c)*100/(row+col), r, c, r, c, r, c, c*100/col, r*100/row, (r+c)*100/(row+col), r, c)
			result.WriteString(slot)
		}
	}
	return result.String()
}

func generateSVG(stars, issues, commits, repos, followers int, languages map[string]int) (string, error) {
	fontPath := filepath.Join("public", "blackchancery64")
	font, err := ioutil.ReadFile(fontPath)
	if err != nil {
		return "", err
	}
	fontBase64 := base64.StdEncoding.EncodeToString(font)

	return fmt.Sprintf(`
<svg id="banner" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <linearGradient id="rainbowGradient">
            <stop offset="0%%" stop-color="#FF0000"/>
            <stop offset="16.67%%" stop-color="#FF7F00"/>
            <stop offset="33.33%%" stop-color="#FFFF00"/>
            <stop offset="50%%" stop-color="#00FF00"/>
            <stop offset="66.67%%" stop-color="#0000FF"/>
            <stop offset="83.33%%" stop-color="#4B0082"/>
            <stop offset="100%%" stop-color="#8F00FF"/>
        </linearGradient>
        <linearGradient id="blackPinkGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%%" stop-color="#000000"/>
            <stop offset="100%%" stop-color="#FF00FF"/>
        </linearGradient>
        <linearGradient id="lightGreenGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%%" stop-color="#00FF00"/>
            <stop offset="100%%" stop-color="#FFFFFF"/>
        </linearGradient>
        <style>
            @font-face {
                font-family: "Black Chancery";
                src: url(data:font/ttf;charset=utf-8;base64,%s) format("truetype");
            }
        </style>
    </defs>
    <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blurred"/>
    </filter>
    <clipPath id="clip">
        <rect id="rect1" width="40%%" x="5%%" y="5%%" height="90%%" rx="5%%"/>
        <rect id="rect2" width="40%%" x="55%%" y="5%%" height="90%%" rx="5%%"/>
    </clipPath>
    <g id="backdrop">
        %s
    </g>
    <g style="clip-path: url(#clip)">
        <use xlink:href="#backdrop" style="filter: url(#blur)"/>
    </g>
    <use href="#rect1" style="fill:none;stroke:black; filter:drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4))"/>
    <use href="#rect2" style="fill:none;stroke:black; filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4))"/>
    <g>
        %s
        %s
        %s
    </g>
    <g>
        %s
        %s
    </g>
</svg>`, fontBase64, generateCaroBackground(20, 20), generateCardSVG(repos, "repos", 7.5, 10, 35, 20), generateCardSVG(followers, "folks", 7.5, 40, 35, 20), generateCardSVG(stars, "stars", 7.5, 70, 35, 20), generateCardSVG(commits, "commits", 57.5, 10, 35, 35), generateCardSVG(issues, "issues", 57.5, 55, 35, 35)), nil
}

func AnotherHandler(w http.ResponseWriter, r *http.Request) {
	key := os.Getenv("GITHUB_TOKEN")
	stars, issues, languages, err := fetchGithubUserRepoData("nhannht", key)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	followers, repos, err := fetchGithubUserData("nhannht", key)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	commits, err := fetchGithubEventsData("nhannht", key)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	svg, err := generateSVG(stars, issues, commits, repos, followers, languages)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Cache-Control", "s-maxage=600, stale-while-revalidate")
	w.Header().Set("Content-Type", "image/svg+xml")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(svg))
}
