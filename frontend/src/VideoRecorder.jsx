import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const VideoRecorder = () => {
    const serverURL = import.meta.env.VITE_SERVER_URL;
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState(null); // State to store recorded video URL
    const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
    const [timer, setTimer] = useState(0); // State to track recording time
    const timerRef = useRef(null); // Ref to store the interval ID

    useEffect(() => {
        if (recording) {
            timerRef.current = setInterval(() => {
                setTimer((prevTime) => prevTime + 1);
            }, 1000); // Update timer every second
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [recording]);

    const startRecording = () => {
        setRecordedChunks([]);
        setRecordedVideoUrl(null); // Reset recorded video URL when starting new recording
        setTimer(0); // Reset timer when starting recording
        setRecording(true);

        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                videoRef.current.srcObject = stream;
                mediaRecorderRef.current = new MediaRecorder(stream);

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        setRecordedChunks((prev) => [...prev, event.data]);
                    }
                };

                mediaRecorderRef.current.start();
            })
            .catch((error) => {
                console.error("Error accessing the camera:", error);
            });
    };

    const stopRecording = () => {
        setRecording(false);
        mediaRecorderRef.current.stop();

        // Create a URL for the recorded video
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl); // Set the recorded video URL
    };

    const uploadRecording = async () => {
        setProcessedVideoUrl(null);
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recorded-video.webm");

        try {
            const res = await axios.post(`${serverURL}/api/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setProcessedVideoUrl(res.data.processed_video_url);
        } catch (error) {
            console.error("Error uploading the video:", error);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
        <div>
            <h1>Real-time Camera Feed</h1>
            <video
                ref={videoRef}
                width="640"
                height="480"
                autoPlay
                muted
            ></video>
            <div>
                {recording ? (
                    <>
                        <button onClick={stopRecording}>Stop Recording</button>
                        <p>Recording Time: {formatTime(timer)}</p>
                    </>
                ) : (
                    <button onClick={startRecording}>Start Recording</button>
                )}
                {recordedChunks.length > 0 && recordedVideoUrl && (
                    <div>
                        <h2>Recorded Video:</h2>
                        <video width="640" height="480" controls>
                            <source src={recordedVideoUrl} type="video/webm" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                {recordedChunks.length > 0 && (
                    <>
                        <button onClick={uploadRecording}>
                            Upload Recording
                        </button>
                        {processedVideoUrl && (
                            <div>
                                <h2>Processed Video:</h2>
                                <video width="640" height="480" controls>
                                    <source
                                        src={`${serverURL}${processedVideoUrl}`}
                                        type="video/webm"
                                    />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoRecorder;
