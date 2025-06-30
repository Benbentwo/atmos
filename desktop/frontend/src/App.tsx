import {useState} from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import {Greet, PickConfigFile} from "../wailsjs/go/main/App";

function App() {
    const [resultText, setResultText] = useState("");
    const [configPath, setConfigPath] = useState('');
    const updateResultText = (result: string) => setResultText(result);

    function chooseConfig() {
        PickConfigFile().then((path: string) => {
            if (path) {
                setConfigPath(path);
                Greet(path).then(updateResultText);
            }
        });
    }

    return (
        <div id="App">
            <img src={logo} id="logo" alt="logo"/>
            <button className="btn" onClick={chooseConfig}>Select atmos.yaml</button>
            <div id="result" className="result console">{resultText}</div>
        </div>
    )
}

export default App
