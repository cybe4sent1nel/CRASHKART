"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Search, X } from "lucide-react";
import toast from "react-hot-toast";

export default function VoiceSearch({ onSearch, placeholder = "Search products..." }) {
  const [isListening, setIsListening, ] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event) => {
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          interim += transcriptPart + " ";

          if (event.results[i].isFinal) {
            setSearchText(interim.trim());
          }
        }

        setTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setSearchText("");
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSearch = () => {
    const query = searchText || transcript;
    if (query.trim()) {
      onSearch(query.trim());
      toast.success(`Searching for: ${query}`);
    } else {
      toast.error("Please enter a search term");
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setTranscript("");
  };

  if (!isSupported) {
    return (
      <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        ⚠️ Voice search is not supported in your browser. Please use Chrome, Firefox, or Edge.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchText || transcript}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={placeholder}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Clear Button */}
          {(searchText || transcript) && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Voice Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          title={isListening ? "Stop listening" : "Start voice search"}
        >
          <Mic className="w-5 h-5" />
          <span className="hidden sm:inline">
            {isListening ? "Listening..." : "Voice"}
          </span>
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Transcript Display */}
      {isListening && transcript && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">Listening:</span> {transcript}
        </div>
      )}

      {/* Helpful Text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        💡 Click the microphone icon, speak your search query, then click Search.
        Works best in Chrome, Firefox, or Edge browsers.
      </p>
    </div>
  );
}
