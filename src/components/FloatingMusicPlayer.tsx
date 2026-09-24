import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Volume2, VolumeX, Disc } from 'lucide-react';
import { MusicTrackRecord } from '../types';

interface FloatingMusicPlayerProps {
  queue: MusicTrackRecord[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const FloatingMusicPlayer: React.FC<FloatingMusicPlayerProps> = ({
  queue,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const currentTrack = queue[currentIndex] || null;

  const safePlay = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    try {
      const promise = audio.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            playPromiseRef.current = null;
            setIsPlaying(true);
          })
          .catch((e: any) => {
            playPromiseRef.current = null;
            setIsPlaying(false);
            if (e?.name !== 'AbortError') {
              console.warn('Audio playback error:', e);
            }
          });
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Audio play exception:', e);
      }
    }
  }, []);

  const safePause = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        })
        .catch(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    const audio = audioRef.current;
    let isCancelled = false;

    // Safely pause before changing source
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (!isCancelled && audio) {
            audio.pause();
          }
        })
        .catch(() => {});
    } else {
      audio.pause();
    }

    if (audio.src) {
      try {
        URL.revokeObjectURL(audio.src);
      } catch (e) {}
    }

    const objectUrl = URL.createObjectURL(currentTrack.fileData);
    audio.src = objectUrl;
    audio.load();

    const promise = audio.play();
    if (promise !== undefined) {
      playPromiseRef.current = promise;
      promise
        .then(() => {
          if (!isCancelled) {
            playPromiseRef.current = null;
            setIsPlaying(true);
          }
        })
        .catch((e: any) => {
          playPromiseRef.current = null;
          if (!isCancelled) {
            setIsPlaying(false);
            if (e?.name !== 'AbortError') {
              console.warn('Audio playback error:', e);
            }
          }
        });
    }

    return () => {
      isCancelled = true;
      if (playPromiseRef.current) {
        playPromiseRef.current
          .then(() => {
            if (audio) audio.pause();
          })
          .catch(() => {});
      } else {
        if (audio) audio.pause();
      }
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (e) {}
    };
  }, [currentTrack]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      safePause();
    } else {
      safePlay();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleClose = () => {
    safePause();
    onClose();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Hidden persistent audio element to prevent DOM removal errors */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
        className="hidden"
      />

      {isOpen && currentTrack && (
        <div className="fixed bottom-14 left-0 right-0 z-45 px-3 py-2.5 bg-[#161925]/95 backdrop-blur-md text-white border-t border-slate-800 shadow-2xl transition-all animate-in slide-in-from-bottom-5">
          <div className="max-w-4xl mx-auto space-y-1.5">
            {/* Top bar with track info and close */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div
                  className={`w-8 h-8 rounded-full bg-[#3DDC84] text-[#0F111A] flex items-center justify-center shrink-0 ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '4s' }}
                >
                  <Disc size={16} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-mono font-bold text-slate-100 truncate" title={currentTrack.title}>
                    {currentTrack.title}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    FOLDER: {currentTrack.folder || 'Favorit'} • [{currentIndex + 1}/{queue.length}]
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <button
                  type="button"
                  id="btn-close-floating-player"
                  onClick={handleClose}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Tutup Pemutar Musik"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Progress seek bar */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-[#3DDC84]">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#3DDC84]"
              />
              <span>{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 pt-0.5">
              <button
                type="button"
                onClick={onPrev}
                className="p-1 text-slate-300 hover:text-[#3DDC84] active:scale-95 transition-all cursor-pointer"
                title="Lagu Sebelumnya"
              >
                <SkipBack size={16} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] flex items-center justify-center active:scale-90 transition-all shadow-md cursor-pointer"
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause size={15} className="stroke-[2.5]" />
                ) : (
                  <Play size={15} className="ml-0.5 stroke-[2.5]" fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                onClick={onNext}
                className="p-1 text-slate-300 hover:text-[#3DDC84] active:scale-95 transition-all cursor-pointer"
                title="Lagu Berikutnya"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
