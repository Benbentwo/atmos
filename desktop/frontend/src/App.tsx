import { useState } from 'react'
import logo from './assets/images/logo-universal.png'
import './App.css'
import {
    PickConfigFile,
    LoadAtmosData,
    Describe,
    RunTerraform
} from "../wailsjs/go/main/App"

interface Item {stack: string, component: string}

function App() {
    const [configPath, setConfigPath] = useState('')
    const [items, setItems] = useState<Item[]>([])
    const [filterStack, setFilterStack] = useState('')
    const [filterComponent, setFilterComponent] = useState('')
    const [selected, setSelected] = useState<Item | null>(null)
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

    function selectRow(item: Item) {
        setSelected(item)
        Describe(item.stack, item.component).then(setDescribeText)
    }

    function startCommand() {
        if (!selected) return
        RunTerraform(command, selected.stack, selected.component).then(setConsoleOut)
    }

    const filtered = items.filter(i =>
        (filterStack === '' || i.stack.includes(filterStack)) &&
        (filterComponent === '' || i.component.includes(filterComponent))
    )

    return (
        <div id="App">
            <div className="top-bar">
                <input value={configPath} readOnly placeholder="Select atmos.yaml"/>
                <button className="btn" onClick={chooseConfig}>Select atmos.yaml</button>
            </div>
            {configPath && (
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
                            {filtered.map((it, idx) => (
                                <tr key={idx} onClick={() => selectRow(it)} className={selected===it?"selected":""}>
                                    <td>{it.stack}</td>
                                    <td>{it.component}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <button className="btn" onClick={startCommand}>Start</button>
                        <pre className="console">{consoleOut}</pre>
                    </div>
                    <div className="right">
                        <pre>{describeText}</pre>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
