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

func (s ConfiguConfigStore) Get(queries []ConfigStoreQuery) ([]Config, error) {
	payload, _ := json.Marshal(getRequestPayload{queries})
	request, _ := http.NewRequest("GET", "https://api.configu.com/config", bytes.NewBuffer(payload))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Org", s.Org)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.Token))

	resp, err := (&http.Client{}).Do(request)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var responseBody []Config
	if err = json.NewDecoder(resp.Body).Decode(&responseBody); err != nil {
		return nil, err
	}
	return responseBody, nil
}

func (s ConfiguConfigStore) Set(configs []Config) error {
	payload, err := json.Marshal(setRequestPayload{configs})
	if err != nil {
		return err
	}
	request, err := http.NewRequest("PUT", "https://api.configu.com/config", bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Org", s.Org)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.Token))
	resp, err := (&http.Client{}).Do(request)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		return ConfiguError{
			Message:  fmt.Sprintf("failed to set configs in configu store. Received status code %v", resp.StatusCode),
			Location: []string{"ConfiguConfigStore", "Set"},
		}
	}
	return nil
}

func (s ConfiguConfigStore) GetType() string {
	return "configu"
}
