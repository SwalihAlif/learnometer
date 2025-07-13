import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function VideoCall({ role = "mentor" }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [callStarted, setCallStarted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const peerConnection = useRef(null);
    const socketRef = useRef(null);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);

    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenTrackRef = useRef(null);

    const [callStatus, setCallStatus] = useState("Waiting"); // Initial state
    const [callTime, setCallTime] = useState(0); // seconds
    const timerRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const mediaRecorderRef = useRef(null);




    const { sessionId } = useParams();
    const isMentor = role === "mentor";

    // ✅ Tailwind theme setup
    const theme = {
        containerBg: isMentor ? "bg-emerald-50" : "bg-gray-50",
        headerText: isMentor ? "text-emerald-900" : "text-indigo-900",
        labelColor: isMentor ? "text-emerald-800" : "text-indigo-800",
        buttonJoin: isMentor
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-yellow-400 hover:bg-yellow-500",
        buttonEnd: isMentor
            ? "bg-emerald-700 hover:bg-emerald-800"
            : "bg-indigo-600 hover:bg-indigo-700",
        borderColor: isMentor ? "border-emerald-700" : "border-indigo-600",
    };

    // ✅ Create and return configured peer connection
    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // ✅ Send ICE candidates to peer via WebSocket
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: event.candidate,
                }));
            }
        };

        // ✅ Attach remote stream to video
        pc.ontrack = (event) => {
            console.log("✅ Received remote track:", event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        return pc;
    };


    useEffect(() => {
        const newSocket = new WebSocket(`ws://localhost:8000/ws/signaling/${sessionId}/`);
        socketRef.current = newSocket;

        const iceCandidateQueue = [];

        newSocket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log("🧠 Received signaling message:", data);

            if (data.type === "offer" && role === "learner") {
                if (!peerConnection.current) {
                    peerConnection.current = createPeerConnection();

                    peerConnection.current.onconnectionstatechange = () => {
                        console.log("🔄 Connection state:", peerConnection.current.connectionState);
                    };
                }

                try {
                    await peerConnection.current.setRemoteDescription(
                        new RTCSessionDescription({ type: "offer", sdp: data.sdp })
                    );
                    console.log("✅ Remote description set");

                    for (const candidate of iceCandidateQueue) {
                        try {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                            console.log("✅ Queued ICE candidate added after remote description");
                        } catch (err) {
                            console.error("❌ Error adding queued ICE candidate", err);
                        }
                    }
                    iceCandidateQueue.length = 0;

                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);

                    socketRef.current?.send(JSON.stringify({
                        type: "answer",
                        sdp: answer.sdp,
                    }));
                    console.log("📨 Sent SDP answer");
                } catch (error) {
                    console.error("❌ Error handling SDP offer:", error);
                }
            }

            if (data.type === "answer" && role === "mentor") {
                if (peerConnection.current && !peerConnection.current.currentRemoteDescription) {
                    try {
                        await peerConnection.current.setRemoteDescription(
                            new RTCSessionDescription({ type: "answer", sdp: data.sdp })
                        );
                        console.log("✅ Remote description set (mentor)");
                    } catch (error) {
                        console.error("❌ Error setting remote description:", error);
                    }
                }
            }

            if (data.type === "ice-candidate" && data.candidate) {
                if (peerConnection.current?.remoteDescription) {
                    try {
                        await peerConnection.current.addIceCandidate(
                            new RTCIceCandidate(data.candidate)
                        );
                        console.log("✅ Added remote ICE candidate");
                    } catch (err) {
                        console.error("❌ Error adding ICE candidate", err);
                    }
                } else {
                    console.log("🕓 Remote description not set yet. Queueing ICE candidate.");
                    iceCandidateQueue.push(data.candidate);
                }
            }
        };

        return () => {
            console.log("🧹 Cleaning up WebSocket");
            newSocket.close();
        };
    }, [sessionId, role]);





    const startCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setLocalStream(stream);

            if (!peerConnection.current) {
                peerConnection.current = createPeerConnection();
            }

            stream.getTracks().forEach((track) =>
                peerConnection.current.addTrack(track, stream)
            );

            if (role === "mentor") {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);

                socketRef.current?.send(JSON.stringify({
                    type: "offer",
                    sdp: offer.sdp,
                }));
            }

            setCallStarted(true);
            console.log("✅ Call started:", role);


            setCallStarted(true);
            setCallStatus("In Call");
            setCallTime(0);

            // Start call timer
            timerRef.current = setInterval(() => {
                setCallTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("❌ Error accessing media devices:", error);
            alert("Please allow camera/mic access.");
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];

            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
                toast(audioTrack.enabled ? "🎙️ Microphone unmuted" : "🔇 Microphone muted")
            }
        }

    }

    const toggleCam = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];

            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsCamOn(videoTrack.enabled)
                toast(videoTrack.enabled ? "📸 Camera turned on" : "📷 Camera turned off")
            }
        }

    }

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            screenTrackRef.current = screenTrack;
            setIsScreenSharing(true);
            toast("🖥️ Screen sharing started");

            // Replace the video track in peer connection
            const sender = peerConnection.current.getSenders().find(s => s.track.kind === "video");
            if (sender) sender.replaceTrack(screenTrack);

            // Update local video preview
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream;
            }

            // Stop screen sharing when user stops from browser control
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error("❌ Screen sharing error:", err);
            toast.error("Could not start screen sharing");
        }
    };

    const stopScreenShare = async () => {
        if (!screenTrackRef.current) return;

        // Stop the screen track
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
        setIsScreenSharing(false);
        toast("🛑 Screen sharing stopped");

        // Replace with original camera track
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find(s => s.track.kind === "video");
        if (sender && videoTrack) sender.replaceTrack(videoTrack);

        // Restore original local video preview
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    };


    const startRecording = () => {
        if (!localStream) {
            alert("No media stream available to record.");
            return;
        }

        const recorder = new MediaRecorder(localStream, { mimeType: "video/webm; codecs=vp8" });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };

        recorder.onstop = () => {
            console.log("🎥 Recording stopped.");
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        toast("🔴 Recording started");
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast("🟢 Recording stopped");
        }
    };


    const downloadRecording = () => {
        if (recordedChunks.length === 0) return;

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };



    const endCall = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        setLocalStream(null);
        setCallStarted(false);

        setCallStatus("Waiting");

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setCallTime(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };


    return (
        <div className={`min-h-screen p-6 ${theme.containerBg}`}>
            <h1 className={`text-2xl font-bold text-center mb-6 ${theme.headerText}`}>
                {isMentor ? "Mentor Video Call Interface" : "Learner Video Call Interface"}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <div>
                    <p className={`mb-2 text-center font-medium ${theme.labelColor}`}>
                        {isMentor ? "🎥 Mentor (You)" : "🎥 Learner (You)"}
                    </p>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-64 bg-black rounded-2xl shadow border-4 ${theme.borderColor}`}
                    />
                </div>

                <div>
                    <p className={`mb-2 text-center font-medium ${theme.labelColor}`}>
                        {isMentor ? "👤 Learner" : "👤 Mentor"}
                    </p>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-64 bg-black rounded-2xl shadow border-4 ${theme.borderColor}`}
                    />
                </div>
            </div>

            <div className="text-center my-4">
                <p className="text-lg font-semibold">
                    🟢 Status: <span className="text-blue-600">{callStatus}</span>
                </p>
                {callStatus === "In Call" && (
                    <p className="text-md text-gray-700">⏱️ {formatTime(callTime)}</p>
                )}
            </div>



            {/* ✅ Controls */}
            <div className="flex flex-col items-center mt-8 gap-4">
                {/* Join / End Call Button */}
                <div className="flex gap-4">
                    {!callStarted ? (
                        <button
                            onClick={startCall}
                            className={`text-white px-6 py-3 rounded-xl font-semibold shadow ${theme.buttonJoin}`}
                        >
                            Join the Meet
                        </button>
                    ) : (
                        <button
                            onClick={endCall}
                            className={`text-white px-6 py-3 rounded-xl font-semibold shadow ${theme.buttonEnd}`}
                        >
                            End Call
                        </button>
                    )}
                </div>

                {/* Mute/Unmute and Camera Toggle - Only show during call */}
                {callStarted && (
                    <div className="flex gap-4">
                        <button
                            onClick={toggleMic}
                            className="bg-gray-200 px-4 py-2 rounded-xl text-sm font-medium"
                        >
                            {isMicOn ? "🔇 Mute Mic" : "🎙️ Unmute Mic"}
                        </button>
                        <button
                            onClick={toggleCam}
                            className="bg-gray-200 px-4 py-2 rounded-xl text-sm font-medium"
                        >
                            {isCamOn ? "📷 Turn Off Cam" : "📸 Turn On Cam"}
                        </button>
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className="bg-gray-200 px-4 py-2 rounded-xl text-sm font-medium"
                        >
                            {isScreenSharing ? "Stop Share" : "Share Screen"}
                        </button>
                    </div>
                )}

                {callStarted && (
                    <div className="flex gap-4 mt-4 justify-center">
                        {!isRecording ? (
                            <button onClick={startRecording} className="bg-red-600 text-white px-4 py-2 rounded">
                                🔴 Start Recording
                            </button>
                        ) : (
                            <button onClick={stopRecording} className="bg-yellow-500 text-white px-4 py-2 rounded">
                                ⏹️ Stop Recording
                            </button>
                        )}
                        {recordedChunks.length > 0 && (
                            <button onClick={downloadRecording} className="bg-green-600 text-white px-4 py-2 rounded">
                                ⬇️ Download
                            </button>
                        )}
                    </div>
                )}

            </div>
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar />

        </div>
    );
}
