package main

import (
	"context"
	"fmt"
	"path/filepath"
	"sort"
	"strings"

	"github.com/cloudposse/atmos/internal/exec"
	"github.com/cloudposse/atmos/pkg/config"
	"github.com/cloudposse/atmos/pkg/list"
	"github.com/cloudposse/atmos/pkg/schema"
	u "github.com/cloudposse/atmos/pkg/utils"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

// App struct
type App struct {
	ctx        context.Context
	configPath string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// StackComponent represents a Terraform component in a stack.
type StackComponent struct {
	Stack     string `json:"stack"`
	Component string `json:"component"`
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// PickConfigFile opens a dialog to select the atmos.yaml file and returns the path
func (a *App) PickConfigFile() string {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:           "Select atmos.yaml",
		DefaultFilename: "atmos.yaml",
		Filters:         []runtime.FileFilter{{DisplayName: "YAML files", Pattern: "*.yaml;*.yml"}},
	})
	if err != nil {
		return ""
	}
	return path
}

// Greet returns a greeting for the given name
func (a *App) Greet(atmosPath string) string {
	configAndStacksInfo := schema.ConfigAndStacksInfo{}
	configAndStacksInfo.AtmosBasePath = filepath.Dir(atmosPath)
	atmosConfig, err := config.InitCliConfig(configAndStacksInfo, true)
	if err != nil {
		return "Error initializing CLI config: " + err.Error()
	}
	stacksMap, err := exec.ExecuteDescribeStacks(atmosConfig, "", nil, nil, nil, false, false, false, false, nil)
	if err != nil {
		return "Error describing stacks: " + err.Error()
	}

	output, err := list.FilterAndListStacks(stacksMap, "")
	if err != nil {
		return "Error filtering stacks: " + err.Error()
	}
	return fmt.Sprintf("Hello %s, It's show time!", strings.Join(output, "\n"))
}

// LoadAtmosData loads stacks and components from the provided atmos.yaml path.
func (a *App) LoadAtmosData(atmosPath string) ([]StackComponent, error) {
	a.configPath = atmosPath

	configAndStacksInfo := schema.ConfigAndStacksInfo{}
	configAndStacksInfo.AtmosBasePath = filepath.Dir(atmosPath)
	atmosConfig, err := config.InitCliConfig(configAndStacksInfo, true)
	if err != nil {
		return nil, err
	}
	stacksMap, err := exec.ExecuteDescribeStacks(atmosConfig, "", nil, nil, nil, false, false, false, false, nil)
	if err != nil {
		return nil, err
	}

	var result []StackComponent
	for stackName := range stacksMap {
		components, err := list.FilterAndListComponents(stackName, stacksMap)
		if err != nil {
			continue
		}
		for _, comp := range components {
			result = append(result, StackComponent{Stack: stackName, Component: comp})
		}
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Stack == result[j].Stack {
			return result[i].Component < result[j].Component
		}
		return result[i].Stack < result[j].Stack
	})
	return result, nil
}

// Describe returns the YAML description of the provided stack/component.
func (a *App) Describe(stack, component string) string {
	data, err := exec.ExecuteDescribeComponent(component, stack, true, true, nil)
	if err != nil {
		return "Error: " + err.Error()
	}
	b, err := yaml.Marshal(data)
	if err != nil {
		return "Error: " + err.Error()
	}
	return string(b)
}

// RunTerraform executes a terraform command and returns its output.
func (a *App) RunTerraform(cmd, stack, component string) string {
	command := fmt.Sprintf("atmos terraform %s %s -s %s", cmd, component, stack)
	out, err := u.ExecuteShellAndReturnOutput(command, "terraform-"+cmd, filepath.Dir(a.configPath), nil, false)
	if err != nil {
		return "Error: " + err.Error()
	}
	return out
}
