package terraform_backend

import (
	"encoding/json"
	"fmt"
	"strings"

	errUtils "github.com/cloudposse/atmos/errors"
	cfg "github.com/cloudposse/atmos/pkg/config"
	"github.com/cloudposse/atmos/pkg/schema"
	u "github.com/cloudposse/atmos/pkg/utils"
)

// GetTerraformWorkspace returns the `workspace` section for a component in a stack.
func GetTerraformWorkspace(sections *map[string]any) string {
	if workspace, ok := (*sections)[cfg.WorkspaceSectionName].(string); ok {
		return workspace
	}
	return ""
}

// GetTerraformComponent returns the `component` section for a component in a stack.
func GetTerraformComponent(sections *map[string]any) string {
	if workspace, ok := (*sections)[cfg.ComponentSectionName].(string); ok {
		return workspace
	}
	return ""
}

// GetComponentBackend returns the `backend` section for a component in a stack.
func GetComponentBackend(sections *map[string]any) map[string]any {
	if remoteStateBackend, ok := (*sections)[cfg.BackendSectionName].(map[string]any); ok {
		return remoteStateBackend
	}
	return nil
}

// GetComponentBackendType returns the `backend_type` section for a component in a stack.
func GetComponentBackendType(sections *map[string]any) string {
	if backendType, ok := (*sections)[cfg.BackendTypeSectionName].(string); ok {
		return backendType
	}
	return ""
}

// GetBackendAttribute returns an attribute from a section in the backend.
func GetBackendAttribute(section *map[string]any, attribute string) string {
	if i, ok := (*section)[attribute].(string); ok {
		return i
	}
	return ""
}

// GetTerraformBackendVariable returns the output from the configured backend.
func GetTerraformBackendVariable(
	atmosConfig *schema.AtmosConfiguration,
	values map[string]any,
	variable string,
) (any, error) {
	val := variable
	if !strings.HasPrefix(variable, ".") {
		val = "." + val
	}

	res, err := u.EvaluateYqExpression(atmosConfig, values, val)
	if err != nil {
		return nil, err
	}

	return res, nil
}

// RawTerraformState represents a raw Terraform state file.
type RawTerraformState struct {
	Version          int    `json:"version"`           // Internal format version
	TerraformVersion string `json:"terraform_version"` // CLI version used
	Outputs          map[string]struct {
		Value any `json:"value"` // Can be any JSON type
		Type  any `json:"type"`  // HCL type representation
	} `json:"outputs"`
	Resources interface{} `json:"resources,omitempty"`
}

// ProcessTerraformStateFile processes a Terraform state file.
func ProcessTerraformStateFile(data []byte) (map[string]any, error) {
	if len(data) == 0 {
		return nil, nil
	}

	var rawState RawTerraformState
	if err := json.Unmarshal(data, &rawState); err != nil {
		return nil, err
	}

	rawOutputs := rawState.Outputs
	result := make(map[string]any, len(rawOutputs))

	for key, output := range rawOutputs {
		result[key] = output.Value
	}

	return result, nil
}

// GetTerraformBackend reads and processes the Terraform state file from the configured backend.
func GetTerraformBackend(
	atmosConfig *schema.AtmosConfiguration,
	componentSections *map[string]any,
) (map[string]any, error) {
	RegisterTerraformBackends()

	backendType := GetComponentBackendType(componentSections)
	if backendType == "" {
		backendType = cfg.BackendTypeLocal
	}

	readBackendStateFunc := GetTerraformBackendReadFunc(backendType)
	if readBackendStateFunc == nil {
		return nil, fmt.Errorf("%w: `%s`\nsupported backends: `local`, `s3`", errUtils.ErrUnsupportedBackendType, backendType)
	}

	content, err := readBackendStateFunc(atmosConfig, componentSections)
	if err != nil {
		return nil, err
	}

	data, err := ProcessTerraformStateFile(content)
	if err != nil {
		return nil, fmt.Errorf("%w\n%v", errUtils.ErrProcessTerraformStateFile, err)
	}

	return data, nil
}
