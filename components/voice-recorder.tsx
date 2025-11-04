"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, X, Send } from 'lucide-react'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface VoiceRecorderProps {
  onSendAudio: (audioBlob: Blob) => void
  className?: string
}

export default function VoiceRecorder({ onSendAudio, className }: VoiceRecorderProps) {
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const {
    isRecording,
    duration,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration
  } = useVoiceRecording({
    onRecordingComplete: (audioBlob) => {
      setRecordedAudio(audioBlob)
      setAudioUrl(URL.createObjectURL(audioBlob))
    },
    maxDuration: 120 // 2 minutes max
  })

  const handleStartRecording = async () => {
    if (!isSupported) {
      toast.error("Voice recording not supported in this browser")
      return
    }
    
    try {
      await startRecording()
    } catch (error) {
      toast.error("Could not access microphone. Please check permissions.")
    }
  }

  const handleSendAudio = () => {
    if (recordedAudio) {
      onSendAudio(recordedAudio)
      resetRecording()
      toast.success("Voice message sent!")
    }
  }

  const resetRecording = () => {
    setRecordedAudio(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }

  const handleCancel = () => {
    if (isRecording) {
      cancelRecording()
    }
    resetRecording()
  }

  if (!isSupported) {
    return (
      <div className={cn("text-center p-4 text-gray-500", className)}>
        <Mic className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Voice recording not supported</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Recording Controls */}
      {!recordedAudio && !isRecording && (
        <Button
          onClick={handleStartRecording}
          className="w-full flex items-center space-x-2"
          variant="outline"
        >
          <Mic className="h-4 w-4" />
          <span>Record Voice Message</span>
        </Button>
      )}

      {/* Recording in Progress */}
      {isRecording && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
            <span className="text-sm text-gray-600">{formatDuration(duration)}</span>
          </div>
          
          <div className="flex space-x-1">
            <Button
              onClick={stopRecording}
              size="sm"
              variant="default"
              className="h-8"
            >
              <Square className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Recorded Audio Preview */}
      {recordedAudio && audioUrl && (
        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Message Ready</span>
            <span className="text-xs text-gray-500">{formatDuration(duration)}</span>
          </div>
          
          {/* Simple audio preview */}
          <audio controls className="w-full h-8" src={audioUrl} />
          
          <div className="flex space-x-2">
            <Button
              onClick={handleSendAudio}
              size="sm"
              className="flex-1 h-8"
            >
              <Send className="h-3 w-3 mr-1" />
              Send
            </Button>
            <Button
              onClick={resetRecording}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}