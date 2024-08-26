import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

import { Loading } from "./components/Loading";
import VideoRecording from "./VideoRecording";
import { useRecoilValue } from "recoil";
import { blobVideoState } from "./recoilState";

const VideoRecorder = () => {
    const serverURL = import.meta.env.VITE_SERVER_URL;
    const blobVideo = useRecoilValue(blobVideoState);

    const [isLoading, setIsLoading] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState(null);

    const uploadRecording = async () => {
        if (!blobVideo) {
            return console.error("No video to upload");
        }
        setProcessedVideoUrl(null);
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", blobVideo, "recorded-video.webm");

        try {
            console.log("Uploading video...");
            const res = await axios.post(`${serverURL}/api/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("Video uploaded successfully:", res.data);
            setProcessedVideoUrl(res.data.processed_video_url);
            setIsLoading(false);
        } catch (error) {
            console.error("Error uploading the video:", error);
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1>Video recognition</h1>
            <VideoRecording />
            <div>
                <h2>Process Video:</h2>
                {blobVideo && (
                    <>
                        {isLoading ? (
                            <div>Processing...</div>
                        ) : (
                            <button onClick={uploadRecording}>
                                Upload Recording
                            </button>
                        )}
                        <br />
                        <br />
                        {processedVideoUrl && (
                            <div>
                                <video
                                    width="640"
                                    height="480"
                                    controls
                                    autoPlay
                                    loop
                                >
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
