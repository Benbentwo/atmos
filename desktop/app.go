package main

import (
	"context"
	"fmt"

	"github.com/cloudposse/atmos/internal/exec"
	"github.com/cloudposse/atmos/pkg/config"
	"github.com/cloudposse/atmos/pkg/list"
	"github.com/cloudposse/atmos/pkg/schema"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(atmosPath string) string {
	configAndStacksInfo := schema.ConfigAndStacksInfo{}
	configAndStacksInfo.AtmosBasePath = atmosPath
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
	return fmt.Sprintf("Hello %s, It's show time!", output)
}
