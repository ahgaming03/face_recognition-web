import { useState } from "react";
import "./App.css";
import VideoRecorder from "./VideoRecorder";

function App() {
    const [count, setCount] = useState(0);
    return (
        <>
            <VideoRecorder />
        </>
    );
}

export default App;
