import { useState } from 'react'
import YAML from 'js-yaml'

import {
    PickConfigFile,
    LoadAtmosData,
    Describe,
    RunTerraform,
} from "../wailsjs/go/main/App"

interface Item { stack: string; component: string }

function App() {
    const [configPath, setConfigPath] = useState('')
    const [items, setItems] = useState<Item[]>([])
    const [filterStack, setFilterStack] = useState('')
    const [filterComponent, setFilterComponent] = useState('')
    const [selectedStack, setSelectedStack] = useState<string | null>(null)
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
    const [describeText, setDescribeText] = useState('')
    const [describeObj, setDescribeObj] = useState<any>(null)
    const [sections, setSections] = useState<string[]>([])
    const [sectionFilter, setSectionFilter] = useState('all')
    const [command, setCommand] = useState('plan')
    const [consoleOut, setConsoleOut] = useState('')
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

    function chooseConfig() {
        PickConfigFile().then((path: string) => {
            if (path) {
                setConfigPath(path)
                LoadAtmosData(path).then(setItems)
            }
        })
    }

    function selectStack(stack: string) {
        setSelectedStack(stack)
        setSelectedComponent(null)
        setDescribeText('')
        setDescribeObj(null)
        setSections([])
        setSectionFilter('all')
    }

    function selectComponent(component: string) {
        if (!selectedStack) return
        setSelectedComponent(component)
        Describe(selectedStack, component).then(text => {
            setDescribeText(text)
            try {
                const obj = YAML.load(text)
                if (obj && typeof obj === 'object') {
                    setDescribeObj(obj)
                    setSections(Object.keys(obj as any))
                } else {
                    setDescribeObj(null)
                    setSections([])
                }
            } catch {
                setDescribeObj(null)
                setSections([])
            }
            setSectionFilter('all')
        })
    }

    function startCommand() {
        if (!selectedStack || !selectedComponent) return
        RunTerraform(command, selectedStack, selectedComponent).then(setConsoleOut)
    }

    const stacks = Array.from(new Set(items.map(i => i.stack)))
        .filter(s => filterStack === '' || s.includes(filterStack))
        .sort()

    const components = selectedStack
        ? Array.from(new Set(items.filter(i => i.stack === selectedStack).map(i => i.component)))
            .filter(c => filterComponent === '' || c.includes(filterComponent))
            .sort()
        : []

    let displayText = describeText
    if (sectionFilter !== 'all' && describeObj) {
        const part = (describeObj as any)[sectionFilter]
        if (part !== undefined) {
            displayText = YAML.dump(part)
        }
    }

    return (
        <div className="app-container">
            <div className="header">
                <input 
                    className="header-input" 
                    value={configPath} 
                    readOnly 
                    placeholder="Select atmos.yaml"
                />
                <button 
                    className="header-button" 
                    onClick={chooseConfig}
                >
                    Select atmos.yaml
                </button>
            </div>
            <div className="main-content">
                <div className="sidebar">
                    <select 
                        className="sidebar-select hover:nav-gradient" 
                        value={command} 
                        onChange={e => setCommand(e.target.value)}
                    >
                        <option value="plan">plan</option>
                        <option value="apply">apply</option>
                    </select>
                    <button
                        className="sidebar-button"
                        onClick={startCommand}
                        disabled={!selectedStack || !selectedComponent}
                    >
                        Start
                    </button>
                </div>
                <div className="content">
                    <div className="filter-container">
                        <input 
                            className="filter-input" 
                            placeholder="Filter stack" 
                            value={filterStack} 
                            onChange={e => setFilterStack(e.target.value)}
                        />
                        <input 
                            className="filter-input" 
                            placeholder="Filter component" 
                            value={filterComponent} 
                            onChange={e => setFilterComponent(e.target.value)}
                        />
                    </div>
                    <div className="grid-container">
                        <div className="list">
                            <div className="list-title">
                                <span>Stacks</span>
                                <span>{stacks.length}</span>
                            </div>
                            <div className="list-content">
                                {stacks.map(s => (
                                    <div 
                                        key={s} 
                                        onClick={() => selectStack(s)} 
                                        className={`list-item ${selectedStack===s ? "selected" : ""}`}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="list">
                            <div className="list-title">
                                <span>Components</span>
                                <span>{components.length}</span>
                            </div>
                            <div className="list-content">
                                {components.map(c => (
                                    <div 
                                        key={c} 
                                        onClick={() => selectComponent(c)} 
                                        className={`list-item ${selectedComponent===c ? "selected" : ""}`}
                                    >
                                        {c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {consoleOut && (
                        <pre className="console">
                            {consoleOut}
                        </pre>
                    )}
                </div>
                <div className={`right-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
                    <div 
                        className="toggle-panel" 
                        onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                    >
                        <span className={`toggle-panel-icon ${rightPanelCollapsed ? 'collapsed' : ''}`}>
                            {rightPanelCollapsed ? '›' : '‹'}
                        </span>
                    </div>
                    {!rightPanelCollapsed && (
                        <>
                            {sections.length > 0 && (
                                <select 
                                    className="section-select" 
                                    value={sectionFilter} 
                                    onChange={e => setSectionFilter(e.target.value)}
                                >
                                    <option value="All">All</option>
                                    {sections.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            )}
                            <pre className="code-display">
                                {displayText}
                            </pre>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App
