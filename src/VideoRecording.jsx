import React, { useRef, useState, useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { blobVideoState } from "./recoilState";

function VideoRecording() {
    const [recording, setRecording] = useState(false);
    const [videoURL, setVideoURL] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [cameraOn, setCameraOn] = useState(false);
    const setBlobVideo = useSetRecoilState(blobVideoState);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const startRecording = () => {
        setRecording(true);
        setTimeLeft(5); // Set time limit to 5 seconds
        setBlobVideo(null); // Reset the blob in Recoil state

        const stream = videoRef.current.srcObject;
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, {
                type: "video/webm",
            });
            setBlobVideo(blob); // Store the blob in Recoil state
            const url = URL.createObjectURL(blob);
            setVideoURL(url);

            // Clean up
            recordedChunksRef.current = [];
            stream.getTracks().forEach((track) => track.stop());
            setCameraOn(false);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;

        // Stop recording after 5 seconds
        setTimeout(() => {
            if (recording) {
                stopRecording();
            }
        }, 5000);
    };

    const stopRecording = () => {
        setRecording(false);
        mediaRecorderRef.current.stop();
    };

    const toggleCamera = async () => {
        if (cameraOn) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach((track) => track.stop());
            setCameraOn(false);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            videoRef.current.srcObject = stream;
            setCameraOn(true);
        }
    };

    useEffect(() => {
        let timer;
        if (recording && timeLeft > -1) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        }
        if (timeLeft === -1 && recording) {
            stopRecording();
        }

        return () => clearInterval(timer);
    }, [recording, timeLeft]);

    return (
        <div className="col">
            <div>
                <h3>Recorded Video:</h3>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    style={{
                        width: "100%",
                        minHeight: "30rem",
                        minWidth: "40rem",
                    }}
                />
                <br />
                <button onClick={toggleCamera}>
                    {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                </button>
                {cameraOn && (
                    <span>
                        {recording ? (
                            <button onClick={stopRecording}>
                                Stop Recording
                            </button>
                        ) : (
                            <button onClick={startRecording}>
                                Start Recording
                            </button>
                        )}
                        <br />
                        {recording && <p>Recording Time Left: {timeLeft}s</p>}
                    </span>
                )}
            </div>
            <div>
                <h3>Recorded Video:</h3>
                <video
                    src={videoURL}
                    controls
                    loop
                    autoPlay
                    style={{
                        width: "100%",
                        minHeight: "30rem",
                        minWidth: "40rem",
                    }}
                />
            </div>
        </div>
    );
}

export default VideoRecording;
