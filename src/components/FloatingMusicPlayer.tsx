import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  VolumeX,
  Disc,
  Music,
  ExternalLink
} from 'lucide-react';
import { MusicTrackRecord } from '../types';

export interface FloatingMusicPlayerProps {
  queue: MusicTrackRecord[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenMusicTab?: () => void;
}

export const FloatingMusicPlayer: React.FC<FloatingMusicPlayerProps> = ({
  queue,
  currentIndex,
  isOpen,
  onClose,
  onOpen,
  onNext,
  onPrev,
  onOpenMusicTab
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const currentTrack = queue[currentIndex] || null;
  const isYouTubeTrack = currentTrack?.sourceType === 'youtube' && Boolean(currentTrack.youtubeId);

  // Click outside listener for popover card
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const sendYouTubeCommand = useCallback((func: 'playVideo' | 'pauseVideo' | 'mute' | 'unMute') => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }),
        '*'
      );
    }
  }, []);

  const safePlay = useCallback(() => {
    if (isYouTubeTrack) {
      sendYouTubeCommand('playVideo');
      setIsPlaying(true);
      return;
    }

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
  }, [isYouTubeTrack, sendYouTubeCommand]);

  const safePause = useCallback(() => {
    if (isYouTubeTrack) {
      sendYouTubeCommand('pauseVideo');
      setIsPlaying(false);
      return;
    }

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
  }, [isYouTubeTrack, sendYouTubeCommand]);

  useEffect(() => {
    if (!currentTrack) {
      setIsPlaying(false);
      return;
    }

    // Handle YouTube track
    if (currentTrack.sourceType === 'youtube' && currentTrack.youtubeId) {
      // Pause local audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(currentTrack.duration || 210);
      return;
    }

    // Handle Local audio Blob track
    if (!currentTrack.fileData || !audioRef.current) return;

    const audio = audioRef.current;
    let isCancelled = false;

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
    if (isPlaying) {
      safePause();
    } else {
      safePlay();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isYouTubeTrack) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current && !isYouTubeTrack) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (isYouTubeTrack) {
      sendYouTubeCommand(isMuted ? 'unMute' : 'mute');
      setIsMuted(!isMuted);
    } else if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleClose = () => {
    safePause();
    setIsPopoverOpen(false);
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
      {/* Hidden persistent local audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
        className="hidden"
      />

      {/* Hidden YouTube Iframe for YouTube Music audio streams */}
      {isYouTubeTrack && (
        <div className="fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none">
          <iframe
            ref={ytIframeRef}
            id="yt-music-iframe-floating"
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.origin : ''
            )}`}
            title={currentTrack.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-1 h-1"
          />
        </div>
      )}

      {isOpen && currentTrack ? (
        <div ref={popoverRef} className="relative flex items-center">
          {/* Active square button with neon green logo, matching theme button */}
          <button
            id="btn-active-music-square"
            type="button"
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            className="relative w-9 h-9 rounded-xl border border-[#3DDC84]/50 dark:border-[#3DDC84]/60 bg-emerald-500/10 dark:bg-[#12141F] hover:bg-emerald-500/20 dark:hover:bg-slate-800 text-[#3DDC84] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
            title={`Musik: ${currentTrack.title} (${isPlaying ? 'Sedang Memutar' : 'Dijeda'}) - Klik untuk kontrol`}
          >
            <Disc
              size={18}
              className={`text-[#3DDC84] ${isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '3.5s' }}
            />
            {/* Small active green pulsing dot */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-[#3DDC84] opacity-75 ${
                  isPlaying ? 'animate-ping' : ''
                }`}
              ></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3DDC84] border border-white dark:border-[#0F111A]"></span>
            </span>
          </button>

          {/* Floating Popover Card anchored right under the square button */}
          {isPopoverOpen && (
            <div
              id="floating-music-popover-card"
              className="absolute right-0 top-11 sm:top-12 z-50 w-72 sm:w-84 p-3.5 rounded-2xl bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside popover */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  {currentTrack.thumbnailUrl ? (
                    <img
                      src={currentTrack.thumbnailUrl}
                      alt={currentTrack.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full bg-[#3DDC84] text-[#0F111A] flex items-center justify-center shrink-0 ${
                        isPlaying ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                    >
                      <Disc size={15} />
                    </div>
                  )}

                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 truncate"
                        title={currentTrack.title}
                      >
                        {currentTrack.title}
                      </p>
                      {isYouTubeTrack && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600/15 text-red-600 dark:text-red-400 border border-red-500/20 uppercase tracking-wider shrink-0">
                          AUDIO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                      {currentTrack.artist || currentTrack.folder || 'Favorit'} • [{currentIndex + 1}/{queue.length}]
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Suara Aktif' : 'Senyapkan'}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>

                  <button
                    type="button"
                    id="btn-close-floating-player"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Tutup Pemutar Musik"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Seek Bar (or duration info) */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                <span className="text-[#3DDC84] min-w-[30px] font-bold">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={isYouTubeTrack}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#3DDC84] disabled:opacity-50"
                />
                <span className="min-w-[30px] text-right">{formatTime(duration)}</span>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {onOpenMusicTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPopoverOpen(false);
                        onOpenMusicTab();
                      }}
                      className="text-[10px] font-mono text-slate-500 hover:text-[#3DDC84] flex items-center gap-1 transition-colors"
                      title="Buka Menu Musik Lengkap"
                    >
                      <span>Menu Musik</span>
                      <ExternalLink size={10} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onPrev}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#3DDC84] active:scale-95 transition-all cursor-pointer"
                    title="Lagu Sebelumnya"
                  >
                    <SkipBack size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] flex items-center justify-center active:scale-90 transition-all shadow-md shadow-[#3DDC84]/20 cursor-pointer"
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
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#3DDC84] active:scale-95 transition-all cursor-pointer"
                    title="Lagu Berikutnya"
                  >
                    <SkipForward size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standby Music Icon Button beside Mode Toggle */
        <button
          id="btn-open-music-top"
          type="button"
          onClick={() => {
            if (queue.length > 0 && onOpen) {
              onOpen();
            } else if (onOpenMusicTab) {
              onOpenMusicTab();
            }
          }}
          className="relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
          title={queue.length > 0 ? 'Buka Pemutar Musik' : 'Buka Tab Musik YouTube & Offline'}
        >
          <Music size={16} className="text-slate-700 dark:text-slate-300" />
          {queue.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDC84] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3DDC84] border border-[#0F111A]"></span>
            </span>
          )}
        </button>
      )}
    </>
  );
};
