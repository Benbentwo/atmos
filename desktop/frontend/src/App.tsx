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
                        className="sidebar-select" 
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
                        <ul className="list">
                            {stacks.map(s => (
                                <li 
                                    key={s} 
                                    onClick={() => selectStack(s)} 
                                    className={`list-item ${selectedStack===s ? "selected" : ""}`}
                                >
                                    {s}
                                </li>
                            ))}
                        </ul>
                        <ul className="list">
                            {components.map(c => (
                                <li 
                                    key={c} 
                                    onClick={() => selectComponent(c)} 
                                    className={`list-item ${selectedComponent===c ? "selected" : ""}`}
                                >
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {consoleOut && (
                        <pre className="console">
                            {consoleOut}
                        </pre>
                    )}
                </div>
                <div className="right-panel">
                    {sections.length > 0 && (
                        <select 
                            className="section-select" 
                            value={sectionFilter} 
                            onChange={e => setSectionFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            {sections.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    )}
                    <pre className="code-display">
                        {displayText}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default App
