import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const VideoRecorder = () => {
    const serverURL = import.meta.env.VITE_SERVER_URL;
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null); // Ref to store the media stream
    const [cameraOn, setCameraOn] = useState(false); // State to track if the camera is on
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
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [recording]);

    const startCamera = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                setCameraOn(true);
            })
            .catch((error) => {
                console.error("Error accessing the camera:", error);
            });
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            setCameraOn(false);
            streamRef.current = null;
        }
    };

    const toggleCamera = () => {
        if (cameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    const startRecording = () => {
        setRecordedChunks([]);
        setRecordedVideoUrl(null);
        setTimer(0);
        setRecording(true);

        mediaRecorderRef.current = new MediaRecorder(streamRef.current);

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };

        mediaRecorderRef.current.start();
    };

    const stopRecording = () => {
        setRecording(false);
        mediaRecorderRef.current.stop();

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
    };

    const uploadRecording = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recorded-video.webm");

        try {
            const res = await axios.post("/api/upload", formData, {
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
                <button onClick={toggleCamera}>
                    {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                </button>
                {cameraOn && (
                    <>
                        {recording ? (
                            <>
                                <button onClick={stopRecording}>
                                    Stop Recording
                                </button>
                                <p>Recording Time: {formatTime(timer)}</p>
                            </>
                        ) : (
                            <button
                                onClick={startRecording}
                                disabled={!cameraOn}
                            >
                                Start Recording
                            </button>
                        )}
                        {recordedChunks.length > 0 && recordedVideoUrl && (
                            <div>
                                <h2>Recorded Video:</h2>
                                <video width="640" height="480" controls>
                                    <source
                                        src={recordedVideoUrl}
                                        type="video/webm"
                                    />
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
                                        <video
                                            width="640"
                                            height="480"
                                            controls
                                        >
                                            <source
                                                src={`http://localhost:5000${processedVideoUrl}`}
                                                type="video/webm"
                                            />
                                            Your browser does not support the
                                            video tag.
                                        </video>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoRecorder;
