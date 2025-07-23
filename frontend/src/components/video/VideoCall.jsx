import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from "../../axios";


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

    // Tailwind theme setup
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

    // Create and return configured peer connection
    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Send ICE candidates to peer via WebSocket
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: event.candidate,
                }));
            }
        };

        // Attach remote stream to video
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
            console.log("Received signaling message:", data);

            if (data.type === "session-completed") {
                console.log("Session has been marked as completed");

                setCallStatus("Completed");
                setCallStarted(false);

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                if (peerConnection.current) {
                    peerConnection.current.close();
                    peerConnection.current = null;
                }
                if (localStream) {
                    localStream.getTracks().forEach((track) => track.stop());
                    setLocalStream(null);
                }
                alert("The mentor has ended the session.");
                return
            }

            if (data.type === "offer" && role === "learner") {
                if (!peerConnection.current) {
                    peerConnection.current = createPeerConnection();

                    peerConnection.current.onconnectionstatechange = () => {
                        console.log("Connection state:", peerConnection.current.connectionState);
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

            if (data.type === "recording-status") {
                const from = data.sender === "mentor" ? "Mentor" : "Learner";
                const message = data.isRecording
                    ? `📹 ${from} started recording`
                    : `🛑 ${from} stopped recording`;
                toast(message);
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

        socketRef.current?.send(JSON.stringify({
        type: "recording-status",
        isRecording: true,
        sender: role,
    }));
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast("🟢 Recording stopped");

            socketRef.current?.send(JSON.stringify({
            type: "recording-status",
            isRecording: false,
            sender: role,
        }));
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



    const endCall = async () => {
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
            // Mentor sends "end-session" only if role === "mentor"
        if (role === "mentor" && socketRef.current) {
            socketRef.current.send(JSON.stringify({
                type: "end-session",
            }));

            try {
                //capturing the payment for the mentor after the completion of the meetiong
                const res = await axiosInstance.post(`mentorship/capture-session-payment/${sessionId}/`);
                console.log("Mentor session payment captured: ", res.data);
            } catch (error) {
                console.error("Error capturing session payment:", error);
                alert("Payment capture failed. Please check your wallet balance.");
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };


   return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${theme.containerBg} transition-all duration-300`}>
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10">
                <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 ${theme.headerText} transition-colors duration-300`}>
                    {isMentor ? "Mentor Video Call Interface" : "Learner Video Call Interface"}
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto mb-8">
                {/* Local Video */}
                <div className="relative group">
                    <div className="flex items-center justify-center mb-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${theme.labelColor} bg-opacity-10 backdrop-blur-sm border border-opacity-20`}>
                            {isMentor ? "🎥 Mentor (You)" : "🎥 Learner (You)"}
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-64 sm:h-72 lg:h-80 bg-gradient-to-br from-gray-900 to-gray-800 object-cover border-4 ${theme.borderColor} transition-all duration-300 group-hover:shadow-2xl`}
                        />
                        {!isCamOn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80 backdrop-blur-sm">
                                <div className="text-center text-white">
                                    <div className="text-4xl mb-2">📷</div>
                                    <p className="text-sm">Camera is off</p>
                                </div>
                            </div>
                        )}
                        {/* Recording indicator */}
                        {isRecording && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                REC
                            </div>
                        )}
                    </div>
                </div>

                {/* Remote Video */}
                <div className="relative group">
                    <div className="flex items-center justify-center mb-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${theme.labelColor} bg-opacity-10 backdrop-blur-sm border border-opacity-20`}>
                            {isMentor ? "👤 Learner" : "👤 Mentor"}
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={`w-full h-64 sm:h-72 lg:h-80 bg-gradient-to-br from-gray-900 to-gray-800 object-cover border-4 ${theme.borderColor} transition-all duration-300 group-hover:shadow-2xl`}
                        />
                        {callStatus !== "In Call" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80 backdrop-blur-sm">
                                <div className="text-center text-white">
                                    <div className="text-4xl mb-2">👤</div>
                                    <p className="text-sm">Waiting for connection...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Section */}
            <div className="text-center mb-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto border border-white border-opacity-20">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-lg font-semibold">
                        Status: <span className="text-blue-600 font-bold">{callStatus}</span>
                    </p>
                </div>
                {callStatus === "In Call" && (
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                        <span className="text-sm">⏱️</span>
                        <p className="text-md font-mono">{formatTime(callTime)}</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
                {/* All Controls in One Line */}
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl border border-white border-opacity-20">
                    {/* Main Call Button */}
                    {!callStarted ? (
                        <button
                            onClick={startCall}
                            className={`text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 ${theme.buttonJoin} hover:shadow-2xl flex items-center gap-2`}
                        >
                            <span className="text-lg">🚀</span>
                            <span className="hidden sm:inline">Join the Meet</span>
                            <span className="sm:hidden">Join</span>
                        </button>
                    ) : (
                        <>
                            {/* End Call Button */}
                            <button
                                onClick={endCall}
                                className={`text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 ${theme.buttonEnd} hover:shadow-2xl flex items-center gap-2`}
                            >
                                <span className="text-lg">📞</span>
                                <span className="hidden sm:inline">End Call</span>
                                <span className="sm:hidden">End</span>
                            </button>

                            {/* Media Controls */}
                            <button
                                onClick={toggleMic}
                                className={`px-4 py-3 rounded-xl text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center gap-2 ${
                                    isMicOn 
                                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' 
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                                <span className="text-lg">{isMicOn ? "🔇" : "🎙️"}</span>
                                <span className="hidden sm:inline">{isMicOn ? "Mute" : "Unmute"}</span>
                            </button>
                            
                            <button
                                onClick={toggleCam}
                                className={`px-4 py-3 rounded-xl text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center gap-2 ${
                                    isCamOn 
                                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' 
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                                <span className="text-lg">{isCamOn ? "📷" : "📸"}</span>
                                <span className="hidden sm:inline">{isCamOn ? "Turn Off" : "Turn On"}</span>
                            </button>
                            
                            <button
                                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                                className={`px-4 py-3 rounded-xl text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center gap-2 ${
                                    isScreenSharing 
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                }`}
                            >
                                <span className="text-lg">{isScreenSharing ? "🛑" : "🖥️"}</span>
                                <span className="hidden sm:inline">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
                                <span className="sm:hidden">{isScreenSharing ? "Stop" : "Share"}</span>
                            </button>

                            {/* Recording Controls */}
                            {!isRecording ? (
                                <button 
                                    onClick={startRecording} 
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
                                >
                                    <span className="text-lg">🔴</span>
                                    <span className="hidden sm:inline">Start Recording</span>
                                    <span className="sm:hidden">Record</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={stopRecording} 
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-xl font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center gap-2 animate-pulse"
                                >
                                    <span className="text-lg">⏹️</span>
                                    <span className="hidden sm:inline">Stop Recording</span>
                                    <span className="sm:hidden">Stop</span>
                                </button>
                            )}
                            
                            {recordedChunks.length > 0 && (
                                <button 
                                    onClick={downloadRecording} 
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
                                >
                                    <span className="text-lg">⬇️</span>
                                    <span className="hidden sm:inline">Download</span>
                                    <span className="sm:hidden">Save</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Toast Container */}
            <ToastContainer 
                position="top-right" 
                autoClose={1500} 
                hideProgressBar 
                className="!top-4 !right-4"
                toastClassName="!bg-white !bg-opacity-90 !backdrop-blur-sm !border !border-gray-200 !rounded-xl !shadow-lg"
            />
        </div>
    );
}
