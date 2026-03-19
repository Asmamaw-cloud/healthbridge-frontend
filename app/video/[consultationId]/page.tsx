'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
// We use dynamic import for Agora to avoid SSR issues
import dynamic from 'next/dynamic';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp } from 'lucide-react';

export default function VideoCallRoom() {
  const { consultationId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [agoraConfig, setAgoraConfig] = useState<any>(null);
  
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  // Since we use Agora SDK dynamically in client components, we store the refs
  const rtcClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);

  useEffect(() => {
    // Only provider initiates start, but patient can also poll/join.
    // For MVP, we assume fetching /consultations/:id gives us the meeting payload if started,
    // or we call POST /consultations/:id/start for provider.
    const setupCall = async () => {
      try {
        setJoining(true);
        // Provider starts, patient joins
        const endpoint = user?.role === 'provider' 
          ? `/consultations/${consultationId}/start` 
          : `/consultations/${consultationId}`;
          
        const method = user?.role === 'provider' ? 'post' : 'get';
        const res = await api[method](endpoint);
        
        // Assume backend returns token and channel info, either directly or under meetingLink parsed
        const config = res.data.meetingConfig || res.data; 
        
        let channelName = null;
        if (config.meetingLink && config.meetingLink.startsWith('agora:')) {
           const parts = config.meetingLink.split(':');
           channelName = parts[2];
        } else if (config.channelName) {
           channelName = config.channelName;
        }

        if (!channelName) {
           setError('Waiting for provider to start the meeting...');
           return;
        }

        const finalAppId = config.appId || process.env.NEXT_PUBLIC_AGORA_APP_ID;
        
        if (!finalAppId) {
           setError('Configuration Error: Missing Agora App ID. Ensure the backend .env contains AGORA_APP_ID.');
           return;
        }

        setAgoraConfig({
          appId: finalAppId,
          channel: channelName,
          token: config.token || null,
          uid: Math.floor(Math.random() * 1000000)
        });
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initialize the consultation room.');
      } finally {
        setJoining(false);
      }
    };
    setupCall();
  }, [consultationId, user]);

  useEffect(() => {
    if (!agoraConfig || !agoraConfig.channel || !agoraConfig.appId) return;

    let isMounted = true;
    
    const initAgora = async () => {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtcClientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
           setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
        }
        if (mediaType === 'audio') {
           user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
           setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        }
      });
      
      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        await client.join(agoraConfig.appId, agoraConfig.channel, agoraConfig.token, agoraConfig.uid);
        
        // Handle physical device mismatches or permission denials safely
        let tracks: any[] = [];
        try {
          tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        } catch (deviceErr) {
          console.warn("Could not find camera/mic devices. Attempting to proceed without them...", deviceErr);
          if (isMounted) setError('No Camera or Microphone detected. Please connect devices and refresh.');
          return;
        }

        const [audioTrack, videoTrack] = tracks;
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;
        
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        
        await client.publish([audioTrack, videoTrack]);
        if (isMounted) setJoined(true);
        
      } catch (err) {
        console.error('Agora join error', err);
        if (isMounted) setError('Failed to join the video channel.');
      }
    };

    initAgora();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();
        await rtcClientRef.current?.leave();
      };
      cleanup();
    };
  }, [agoraConfig]);

  // Handle remote video elements
  useEffect(() => {
    remoteUsers.forEach(r => {
      const containerId = `remote-video-${r.uid}`;
      const container = document.getElementById(containerId);
      if (container && r.videoTrack && !r.videoTrack.isPlaying) {
         r.videoTrack.play(container);
      }
    });
  }, [remoteUsers]);

  const toggleMic = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setMuted(micOn);
      setMicOn(!micOn);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setMuted(videoOn);
      setVideoOn(!videoOn);
    }
  };

  const leaveCall = async () => {
    try {
       localAudioTrackRef.current?.close();
       localVideoTrackRef.current?.close();
       await rtcClientRef.current?.leave();
       
       if (user?.role === 'provider') {
         // Provider transitions to writing prescriptions
         router.push('/provider/prescriptions');
       } else {
         router.push('/patient/dashboard');
       }
    } catch (e) {
      console.error(e);
      router.back();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="p-8 bg-gray-800 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Consultation Room</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-80 absolute top-0 w-full z-10">
        <h1 className="text-lg font-semibold">Telehealth Consultation</h1>
        <div className="text-sm px-3 py-1 bg-green-500 rounded-full">
          {joined ? 'Connected' : joining ? 'Connecting...' : 'Initializing'}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 mt-16 pb-24 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex items-center justify-center">
          <div ref={localVideoRef} className="absolute inset-0 w-full h-full object-cover"></div>
          {!videoOn && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold">
                   {user?.fullName?.charAt(0)}
                </div>
             </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-sm z-20">
            You {micOn ? '' : '(Muted)'}
          </div>
        </div>

        {/* Remote Videos */}
        {remoteUsers.length === 0 ? (
          <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex items-center justify-center">
             <div className="text-center">
               <div className="w-16 h-16 rounded-full bg-gray-700 mx-auto flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-gray-500 rounded-full animate-ping"></div>
               </div>
               <p className="text-gray-400">Waiting for others to join...</p>
             </div>
          </div>
        ) : (
          remoteUsers.map(r => (
            <div key={r.uid} id={`remote-video-${r.uid}`} className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex items-center justify-center">
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-sm z-20">
                Participant {r.uid}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-gray-900 to-transparent flex justify-center space-x-6 z-20">
        <button 
          onClick={toggleMic}
          className={`p-4 rounded-full shadow-lg transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full shadow-lg transition-colors ${videoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
        
        <button 
          className="p-4 rounded-full shadow-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          onClick={() => setScreenSharing(!screenSharing)}
        >
          <MonitorUp className={`w-6 h-6 ${screenSharing ? 'text-blue-400' : 'text-white'}`} />
        </button>
        
        <button 
          onClick={leaveCall}
          className="p-4 rounded-full shadow-lg bg-red-600 hover:bg-red-700 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
