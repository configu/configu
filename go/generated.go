// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse and unparse this JSON data, add this code to your project and do:
//
//    cfguType, err := UnmarshalCfguType(bytes)
//    bytes, err = cfguType.Marshal()
//
//    cfgu, err := UnmarshalCfgu(bytes)
//    bytes, err = cfgu.Marshal()
//
//    config, err := UnmarshalConfig(bytes)
//    bytes, err = config.Marshal()
//
//    configSchemaType, err := UnmarshalConfigSchemaType(bytes)
//    bytes, err = configSchemaType.Marshal()
//
//    configSchema, err := UnmarshalConfigSchema(bytes)
//    bytes, err = configSchema.Marshal()
//
//    configSchemaContentsValue, err := UnmarshalConfigSchemaContentsValue(bytes)
//    bytes, err = configSchemaContentsValue.Marshal()
//
//    configSchemaContents, err := UnmarshalConfigSchemaContents(bytes)
//    bytes, err = configSchemaContents.Marshal()
//
//    configSet, err := UnmarshalConfigSet(bytes)
//    bytes, err = configSet.Marshal()
//
//    configStore, err := UnmarshalConfigStore(bytes)
//    bytes, err = configStore.Marshal()
//
//    configStoreQuery, err := UnmarshalConfigStoreQuery(bytes)
//    bytes, err = configStoreQuery.Marshal()
//
//    configStoreContentsElement, err := UnmarshalConfigStoreContentsElement(bytes)
//    bytes, err = configStoreContentsElement.Marshal()
//
//    configStoreContents, err := UnmarshalConfigStoreContents(bytes)
//    bytes, err = configStoreContents.Marshal()

package configu

import "encoding/json"

func UnmarshalCfguType(data []byte) (CfguType, error) {
	var r CfguType
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *CfguType) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalCfgu(data []byte) (Cfgu, error) {
	var r Cfgu
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *Cfgu) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfig(data []byte) (Config, error) {
	var r Config
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *Config) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigSchemaType(data []byte) (ConfigSchemaType, error) {
	var r ConfigSchemaType
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigSchemaType) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigSchema(data []byte) (ConfigSchema, error) {
	var r ConfigSchema
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigSchema) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigSchemaContentsValue(data []byte) (ConfigSchemaContentsValue, error) {
	var r ConfigSchemaContentsValue
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigSchemaContentsValue) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

type ConfigSchemaContents map[string]ConfigSchemaContentsValue

func UnmarshalConfigSchemaContents(data []byte) (ConfigSchemaContents, error) {
	var r ConfigSchemaContents
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigSchemaContents) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigSet(data []byte) (ConfigSet, error) {
	var r ConfigSet
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigSet) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigStore(data []byte) (ConfigStore, error) {
	var r ConfigStore
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigStore) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigStoreQuery(data []byte) (ConfigStoreQuery, error) {
	var r ConfigStoreQuery
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigStoreQuery) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func UnmarshalConfigStoreContentsElement(data []byte) (ConfigStoreContentsElement, error) {
	var r ConfigStoreContentsElement
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigStoreContentsElement) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

type ConfigStoreContents []ConfigStoreContentsElement

func UnmarshalConfigStoreContents(data []byte) (ConfigStoreContents, error) {
	var r ConfigStoreContents
	err := json.Unmarshal(data, &r)
	return r, err
}

func (r *ConfigStoreContents) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

// A generic declaration of a Config, aka Cfgu that specifies information about its type and
// other characteristics
type Cfgu struct {
	Default     *string  `json:"default,omitempty"`
	Depends     []string `json:"depends,omitempty"`
	Description *string  `json:"description,omitempty"`
	Pattern     *string  `json:"pattern,omitempty"`
	Required    *bool    `json:"required,omitempty"`
	Template    *string  `json:"template,omitempty"`
	Type        CfguType `json:"type"`
}

// A generic representation of a software configuration, aka Config
type Config struct {
	Key   string `json:"key"`
	Set   string `json:"set"`
	Value string `json:"value"`
}

// An interface of a <file>.cfgu.json, aka ConfigSchema
// that contains binding records between a unique Config.<key> and its Cfgu declaration
type ConfigSchema struct {
	Path string           `json:"path"`
	Type ConfigSchemaType `json:"type"`
}

type ConfigSchemaContentsValue struct {
	Default     *string  `json:"default,omitempty"`
	Depends     []string `json:"depends,omitempty"`
	Description *string  `json:"description,omitempty"`
	Pattern     *string  `json:"pattern,omitempty"`
	Required    *bool    `json:"required,omitempty"`
	Template    *string  `json:"template,omitempty"`
	Type        CfguType `json:"type"`
}

// An interface of a path in an hierarchy, aka ConfigSet
// that uniquely groups Config.<key> with their Config.<value>.
type ConfigSet struct {
	Hierarchy []string `json:"hierarchy"`
	Path      string   `json:"path"`
}

// An interface of a storage, aka ConfigStore
// that I/Os Config records (Config[])
type ConfigStore struct {
	Type string `json:"type"`
}

type ConfigStoreQuery struct {
	Key string `json:"key"`
	Set string `json:"set"`
}

type ConfigStoreContentsElement struct {
	Key   string `json:"key"`
	Set   string `json:"set"`
	Value string `json:"value"`
}

type CfguType string

const (
	AZRegion         CfguType = "AZRegion"
	AlibabaRegion    CfguType = "AlibabaRegion"
	Arn              CfguType = "ARN"
	AwsRegion        CfguType = "AwsRegion"
	Base64           CfguType = "Base64"
	Boolean          CfguType = "Boolean"
	Color            CfguType = "Color"
	ConnectionString CfguType = "ConnectionString"
	Country          CfguType = "Country"
	Currency         CfguType = "Currency"
	DateTime         CfguType = "DateTime"
	DockerImage      CfguType = "DockerImage"
	Domain           CfguType = "Domain"
	Email            CfguType = "Email"
	GCPRegion        CfguType = "GCPRegion"
	Hex              CfguType = "Hex"
	IBMRegion        CfguType = "IBMRegion"
	IPv4             CfguType = "IPv4"
	IPv6             CfguType = "IPv6"
	Language         CfguType = "Language"
	LatLong          CfguType = "LatLong"
	Locale           CfguType = "Locale"
	MACAddress       CfguType = "MACAddress"
	MIMEType         CfguType = "MIMEType"
	Md5              CfguType = "MD5"
	MobilePhone      CfguType = "MobilePhone"
	MongoID          CfguType = "MongoId"
	Number           CfguType = "Number"
	OracleRegion     CfguType = "OracleRegion"
	RegEx            CfguType = "RegEx"
	SHA              CfguType = "SHA"
	SemVer           CfguType = "SemVer"
	String           CfguType = "String"
	URL              CfguType = "URL"
	UUID             CfguType = "UUID"
)

type ConfigSchemaType string

const (
	JSON ConfigSchemaType = "json"
)
