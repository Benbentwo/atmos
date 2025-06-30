import { useState } from 'react'
import logo from './assets/images/logo-universal.png'
import './App.css'
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
    }

    function selectComponent(component: string) {
        if (!selectedStack) return
        setSelectedComponent(component)
        Describe(selectedStack, component).then(setDescribeText)
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

    return (
        <div id="App">
            <div className="top-bar">
                <input value={configPath} readOnly placeholder="Select atmos.yaml"/>
                <button className="btn" onClick={chooseConfig}>Select atmos.yaml</button>
            </div>
            <div className="main">
                <div className="left">
                    <select value={command} onChange={e => setCommand(e.target.value)}>
                        <option value="plan">plan</option>
                        <option value="apply">apply</option>
                    </select>
                </div>
                <div className="center">
                    <div className="filters">
                        <input placeholder="Filter stack" value={filterStack} onChange={e => setFilterStack(e.target.value)}/>
                        <input placeholder="Filter component" value={filterComponent} onChange={e => setFilterComponent(e.target.value)}/>
                    </div>
                    <table className="items">
                        <thead>
                        <tr><th>Stack</th><th>Component</th></tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>
                                <ul className="list">
                                    {stacks.map(s => (
                                        <li key={s} onClick={() => selectStack(s)} className={selectedStack===s?"selected":""}>{s}</li>
                                    ))}
                                </ul>
                            </td>
                            <td>
                                <ul className="list">
                                    {components.map(c => (
                                        <li key={c} onClick={() => selectComponent(c)} className={selectedComponent===c?"selected":""}>{c}</li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <button className="btn" onClick={startCommand}>Start</button>
                    <pre className="console">{consoleOut}</pre>
                </div>
                <div className="right">
                    <pre>{describeText}</pre>
                </div>
            </div>
        </div>
    )
}

export default App
