import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Subtitles } from 'lucide-react';

interface ActiveVideoModalProps {
  isOpen: boolean;
  videoName: string;
  videoBlob: Blob | null;
  subtitleText: string | null;
  subtitleName?: string;
  onClose: () => void;
}

export const ActiveVideoModal: React.FC<ActiveVideoModalProps> = ({
  isOpen,
  videoName,
  videoBlob,
  subtitleText,
  subtitleName,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen || !videoBlob || !videoRef.current) return;

    const video = videoRef.current;
    const url = URL.createObjectURL(videoBlob);
    video.src = url;

    // Remove old tracks
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }

    // Add subtitle track if available
    if (subtitleText) {
      let vttContent = subtitleText;
      if (!vttContent.startsWith('WEBVTT')) {
        // Convert SRT to WebVTT format
        vttContent =
          'WEBVTT\n\n' +
          subtitleText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      }

      const subBlob = new Blob([vttContent], { type: 'text/vtt' });
      const subUrl = URL.createObjectURL(subBlob);

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = subtitleName || 'Subtitle Indonesia';
      track.srclang = 'id';
      track.src = subUrl;
      track.default = true;
      video.appendChild(track);
    }

    // Resume saved position
    const resumeKey = 'resume_vid_' + videoName;
    const savedTime = localStorage.getItem(resumeKey);

    const onLoadedMetadata = () => {
      if (savedTime && parseFloat(savedTime) > 0) {
        video.currentTime = parseFloat(savedTime);
      }
    };

    const onTimeUpdate = () => {
      if (video.currentTime > 0) {
        localStorage.setItem(resumeKey, video.currentTime.toString());
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);

    video.play().catch((err) => console.log('Video autoplay error:', err));

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.pause();
      URL.revokeObjectURL(url);
    };
  }, [isOpen, videoBlob, videoName, subtitleText, subtitleName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F111A] text-white flex flex-col animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161925] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            id="btn-close-active-video"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F111A] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white transition-colors"
          >
            <ArrowLeft size={14} className="text-[#3DDC84]" />
            <span>KEMBALI</span>
          </button>
          <h3 className="text-xs font-mono font-bold truncate max-w-xs sm:max-w-md text-slate-200 uppercase tracking-tight" title={videoName}>
            {videoName}
          </h3>
        </div>

        {subtitleText && (
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#3DDC84] bg-[#3DDC84]/15 px-2 py-1 rounded-md border border-[#3DDC84]/30 uppercase">
            <Subtitles size={13} />
            <span className="hidden sm:inline">SUBTITLE AKTIF</span>
          </div>
        )}
      </div>

      {/* Video element */}
      <div className="flex-1 flex items-center justify-center bg-[#0F111A] overflow-hidden">
        <video
          ref={videoRef}
          controls
          crossOrigin="anonymous"
          playsInline
          className="w-full h-full max-h-[calc(100vh-60px)] object-contain"
        />
      </div>
    </div>
  );
};
