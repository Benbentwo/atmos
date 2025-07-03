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
        <div id="App" className="h-screen flex flex-col">
            <div className="flex gap-2 p-4 bg-cpblue">
                <input className="hs-input flex-grow px-2 py-1 rounded bg-white text-black" value={configPath} readOnly placeholder="Select atmos.yaml"/>
                <button className="px-4 py-1 bg-cpnavy text-white rounded" onClick={chooseConfig}>Select atmos.yaml</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-32 p-2 flex flex-col gap-2">
                    <select className="p-1 text-sm rounded text-black" value={command} onChange={e => setCommand(e.target.value)}>
                        <option value="plan">plan</option>
                        <option value="apply">apply</option>
                    </select>
                    <button className="px-2 py-1 bg-green-600 rounded disabled:opacity-50" disabled={!selectedStack || !selectedComponent} onClick={startCommand}>Start</button>
                </div>
                <div className="flex-1 p-2 overflow-auto">
                    <div className="flex gap-2 mb-2">
                        <input className="flex-grow px-2 py-1 rounded text-black" placeholder="Filter stack" value={filterStack} onChange={e => setFilterStack(e.target.value)}/>
                        <input className="flex-grow px-2 py-1 rounded text-black" placeholder="Filter component" value={filterComponent} onChange={e => setFilterComponent(e.target.value)}/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ul className="border rounded divide-y">
                            {stacks.map(s => (
                                <li key={s} onClick={() => selectStack(s)} className={`px-2 py-1 cursor-pointer ${selectedStack===s?"bg-cpblue text-white":"hover:bg-slate-700"}`}>{s}</li>
                            ))}
                        </ul>
                        <ul className="border rounded divide-y">
                            {components.map(c => (
                                <li key={c} onClick={() => selectComponent(c)} className={`px-2 py-1 cursor-pointer ${selectedComponent===c?"bg-cpblue text-white":"hover:bg-slate-700"}`}>{c}</li>
                            ))}
                        </ul>
                    </div>
                    {consoleOut && <pre className="mt-2 bg-black text-green-500 p-2 max-h-72 overflow-auto">{consoleOut}</pre>}
                </div>
                <div className="w-1/2 p-2 bg-slate-800 overflow-auto">
                    {sections.length > 0 && (
                        <select className="mb-2 p-1 text-black rounded" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                            <option value="all">All</option>
                            {sections.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    )}
                    <pre className="whitespace-pre-wrap text-left">{displayText}</pre>
                </div>
            </div>
        </div>
    )
}

export default App
