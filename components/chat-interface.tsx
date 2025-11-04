"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, MessageSquare, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/useSocket"
import { toast } from "sonner"
import AudioPlayer from "@/components/audio-player"
import VoiceRecorder from "@/components/voice-recorder"

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: {
    subject: string
    body: string
  }
  messageType: "TEXT" | "AUDIO" | "FILE"
  fileUrl?: string
  timestamp: string
  read: boolean
  sender: {
    id: string
    name: string
    email: string
    role: string
  }
  receiver: {
    id: string
    name: string
    email: string
    role: string
  }
  isSentByMe: boolean
}

interface ChatInterfaceProps {
  chatPartnerId: string
  chatPartnerName: string
  className?: string
}

export default function ChatInterface({ 
  chatPartnerId, 
  chatPartnerName, 
  className 
}: ChatInterfaceProps) {
  const { data: session } = useSession()
  const { socket, sendMessage: sendSocketMessage, startTyping, stopTyping } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [chatPartnerId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('new-message', (message: Message) => {
      if (message.senderId === chatPartnerId || message.receiverId === chatPartnerId) {
        setMessages(prev => [...prev, message])
        markMessagesAsRead([message.id])
      }
    })

    socket.on('user-typing', ({ senderName }: { senderName: string }) => {
      setTypingUser(senderName)
      setIsTyping(true)
    })

    socket.on('user-stop-typing', () => {
      setIsTyping(false)
      setTypingUser(null)
    })

    return () => {
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('user-stop-typing')
    }
  }, [socket, chatPartnerId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?userId=${chatPartnerId}`)
      if (response.ok) {
        const data = await response.json()
        const messages = data.messages || []
        setMessages(messages)
        markMessagesAsRead(messages.filter((msg: Message) => 
          !msg.isSentByMe && !msg.read
        ).map((msg: Message) => msg.id))
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return

    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds }),
      })
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    // Stop typing indicator
    stopTyping(chatPartnerId)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: chatPartnerId,
          content: messageContent,
          messageType: 'TEXT'
        }),
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        
        // Send real-time message via socket
        sendSocketMessage(chatPartnerId, message)
        
        toast.success("Message sent")
      } else {
        setNewMessage(messageContent) // Restore message on error
        toast.error("Failed to send message")
      }
    } catch (error) {
      setNewMessage(messageContent) // Restore message on error
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    
    if (value.trim() && !isTyping) {
      startTyping(chatPartnerId, session?.user?.name || "User")
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chatPartnerId)
    }, 2000)
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      setSending(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', audioBlob, 'voice-message.webm')
      formData.append('receiverId', chatPartnerId)
      formData.append('messageType', 'AUDIO')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { fileUrl } = await response.json()
        
        // Send audio message
        const messageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiverId: chatPartnerId,
            content: 'Voice message',
            messageType: 'AUDIO',
            fileUrl
          }),
        })

        if (messageResponse.ok) {
          const message = await messageResponse.json()
          setMessages(prev => [...prev, message])
          sendSocketMessage(chatPartnerId, message)
          setShowVoiceRecorder(false)
          toast.success("Voice message sent")
        } else {
          toast.error("Failed to send voice message")
        }
      } else {
        toast.error("Failed to upload voice message")
      }
    } catch (error) {
      toast.error("Failed to send voice message")
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const dateKey = new Date(message.timestamp).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })

    return groups
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div>Loading chat...</div>
        </CardContent>
      </Card>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Chat with {chatPartnerName}</span>
        </CardTitle>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(messageGroups).length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <Badge variant="outline" className="bg-gray-50">
                  {formatDate(dateMessages[0].timestamp)}
                </Badge>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwnMessage = message.isSentByMe
                const showAvatar = index === 0 || 
                  dateMessages[index - 1]?.senderId !== message.senderId

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end space-x-2 mb-2",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.sender.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-8" />
                    )}

                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        isOwnMessage
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      {message.messageType === 'AUDIO' && message.fileUrl ? (
                        <div className="space-y-2">
                          <p className="text-xs opacity-75">Voice Message</p>
                          <AudioPlayer 
                            audioUrl={message.fileUrl} 
                            className={cn(
                              isOwnMessage ? "bg-blue-400" : "bg-white"
                            )}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm">
                            {message.content.subject && (
                              <p className="font-semibold mb-1">{message.content.subject}</p>
                            )}
                            <p>{message.content.body}</p>
                          </div>
                          {message.fileUrl && message.messageType !== 'AUDIO' && (
                            <div className="mt-2">
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline"
                              >
                                View attachment
                              </a>
                            </div>
                          )}
                        </>
                      )}
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isOwnMessage ? "text-blue-100" : "text-gray-500"
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>

                    {isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {session?.user?.name?.charAt(0) || "Y"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Typing Indicator */}
      {isTyping && typingUser && (
        <div className="px-4 py-2 text-sm text-gray-500 italic">
          {typingUser} is typing...
        </div>
      )}

      {/* Message Input */}
      <div className="border-t p-4 space-y-3">
        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <VoiceRecorder 
            onSendAudio={sendVoiceMessage}
            className="border rounded-lg p-3"
          />
        )}
        
        {/* Text Input */}
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || showVoiceRecorder}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={cn(
              "border-gray-300 hover:bg-gray-50",
              showVoiceRecorder && "bg-red-50 border-red-300 hover:bg-red-100"
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            className="border-gray-300 hover:bg-gray-50"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button 
            type="submit" 
            disabled={sending || !newMessage.trim() || showVoiceRecorder}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}