import { useState } from "react";
import "./App.css";
import VideoRecorder from "./VideoRecorder";
import VideoRecording from "./VideoRecording";

function App() {
    const [count, setCount] = useState(0);
    return (
        <>
            <VideoRecorder />
        </>
    );
}

export default App;
