package stores

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/configu/configu/go/core/generated"
)

type ConfiguConfigStore struct {
	Org   string
	Token string
}

type getRequestPayload struct {
	Queries []generated.ConfigStoreQuery `json:"queries"`
}

type setRequestPayload struct {
	Configs []generated.Config `json:"configs"`
}

func (s ConfiguConfigStore) Get(queries []generated.ConfigStoreQuery) []generated.Config {
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
	var responseBody []generated.Config
	json.NewDecoder(resp.Body).Decode(&responseBody)
	return responseBody
}

func (s ConfiguConfigStore) Set(configs []generated.Config) {
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
