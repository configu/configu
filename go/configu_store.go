package configu

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type ConfiguConfigStore struct {
	Org   string
	Token string
}

type getRequestPayload struct {
	Queries []ConfigStoreQuery `json:"queries"`
}

type setRequestPayload struct {
	Configs []Config `json:"configs"`
}

func (s ConfiguConfigStore) Get(queries []ConfigStoreQuery) []Config {
	payload, _ := json.Marshal(getRequestPayload{queries})
	request, _ := http.NewRequest("GET", "https://api.configu.com/config", bytes.NewBuffer(payload))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Org", s.Org)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.Token))

	resp, err := (&http.Client{}).Do(request)
	if err != nil {
		fmt.Println("Something's gone wrong")
	}
	defer resp.Body.Close()
	var responseBody []Config
	json.NewDecoder(resp.Body).Decode(&responseBody)
	return responseBody
}

func (s ConfiguConfigStore) Set(configs []Config) {
	payload, _ := json.Marshal(setRequestPayload{configs})
	request, _ := http.NewRequest("PUT", "https://api.configu.com/config", bytes.NewBuffer(payload))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Org", s.Org)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.Token))
	(&http.Client{}).Do(request)
}

func (s ConfiguConfigStore) GetType() string {
	return "configu"
}
