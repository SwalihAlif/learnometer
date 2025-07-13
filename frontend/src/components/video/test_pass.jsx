import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function VideoCall({ role = "mentor" }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [callStarted, setCallStarted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const peerConnection = useRef(null);
    const socketRef = useRef(null); // ✅ newly added for stable socket reference

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
        } catch (error) {
            console.error("❌ Error accessing media devices:", error);
            alert("Please allow camera/mic access.");
        }
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

            {/* ✅ Controls */}
            <div className="flex justify-center mt-8 gap-4">
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
        </div>
    );
}
