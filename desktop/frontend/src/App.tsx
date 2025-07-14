import { useState } from 'react'
import Workspace from './Workspace'

interface WorkspaceInfo { id: number }

function App() {
    const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([{ id: 0 }])
    const [active, setActive] = useState(0)

    function addWorkspace() {
        const id = Date.now()
        setWorkspaces([...workspaces, { id }])
        setActive(workspaces.length)
    }

    return (
        <div className="workspaces-container">
            <div className="tabs">
                {workspaces.map((ws, idx) => (
                    <div
                        key={ws.id}
                        className={`tab ${idx === active ? 'active' : ''}`}
                        onClick={() => setActive(idx)}
                    >
                        Workspace {idx + 1}
                    </div>
                ))}
                <div className="tab add" onClick={addWorkspace}>+</div>
            </div>
            <Workspace key={workspaces[active].id} />
        </div>
    )
}

export default App
