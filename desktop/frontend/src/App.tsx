import { useState } from 'react'
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
            <div className="top-bar d-flex">
                <input className="form-control me-2" value={configPath} readOnly placeholder="Select atmos.yaml"/>
                <button className="btn btn-primary" onClick={chooseConfig}>Select atmos.yaml</button>
            </div>
            <div className="main">
                <div className="left">
                    <select className="form-select mb-2" value={command} onChange={e => setCommand(e.target.value)}>
                        <option value="plan">plan</option>
                        <option value="apply">apply</option>
                    </select>
                    <button className="btn btn-success" disabled={!selectedStack || !selectedComponent} onClick={startCommand}>Start</button>
                </div>
                <div className="center">
                    <div className="filters mb-2 d-flex gap-2">
                        <input className="form-control" placeholder="Filter stack" value={filterStack} onChange={e => setFilterStack(e.target.value)}/>
                        <input className="form-control" placeholder="Filter component" value={filterComponent} onChange={e => setFilterComponent(e.target.value)}/>
                    </div>
                    <table className="items table table-sm">
                        <thead>
                        <tr><th>Stack</th><th>Component</th></tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>
                                <ul className="list list-group">
                                    {stacks.map(s => (
                                        <li key={s} onClick={() => selectStack(s)} className={`list-group-item ${selectedStack===s?"active":""}`}>{s}</li>
                                    ))}
                                </ul>
                            </td>
                            <td>
                                <ul className="list list-group">
                                    {components.map(c => (
                                        <li key={c} onClick={() => selectComponent(c)} className={`list-group-item ${selectedComponent===c?"active":""}`}>{c}</li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    {consoleOut && <pre className="console">{consoleOut}</pre>}
                </div>
                <div className="right">
                    <pre className="describe-box">{describeText}</pre>
                </div>
            </div>
        </div>
    )
}

export default App
