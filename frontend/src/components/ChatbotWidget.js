import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../api/chatbot";
import "../styles/ChatbotWidget.css";

const starterPrompts = [
  "How do I book a ticket?",
  "How can I track my booked bus?",
  "How do I cancel a booking?",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I am PT Assistant 🚌\nI can help with booking, tracking, cancellations, and account issues.\n\nTry: \"I want a bus from Delhi to Jalandhar\"",
};

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  // Booking context: persisted across turns, reset on new route query
  const [bookingContext, setBookingContext] = useState({
    from: null,
    to: null,
    date: null,
    passengers: null,
  });

  // Mini booking form (shown after bus results when date/passengers unknown)
  const [miniForm, setMiniForm] = useState({ date: "", passengers: 1 });
  const [showMiniForm, setShowMiniForm] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, showMiniForm]);

  const contextMessages = useMemo(
    () => messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-12),
    [messages]
  );

  const handleSend = async (text, overrideContext) => {
    const userText = String(text || input).trim();
    if (!userText || isLoading) return;

    const mergedContext = overrideContext || bookingContext;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInput("");
    setShowMiniForm(false);
    setIsLoading(true);

    try {
      const res = await sendChatMessage({
        message: userText,
        messages: contextMessages,
        context: mergedContext,
      });

      // Update booking context from server response
      if (res?.bookingContext) {
        setBookingContext((prev) => ({
          from: res.bookingContext.from || prev.from,
          to: res.bookingContext.to || prev.to,
          date: res.bookingContext.date || prev.date,
          passengers: res.bookingContext.passengers || prev.passengers,
        }));
      }

      // If new tripQuery, reset stale context fields that came from old queries
      if (res?.tripQuery) {
        setBookingContext({
          from: res.tripQuery.from || null,
          to: res.tripQuery.to || null,
          date: res.bookingContext?.date || null,
          passengers: res.bookingContext?.passengers || null,
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res?.reply || "I could not generate a response right now.",
          buses: Array.isArray(res?.busResults) ? res.busResults : [],
          tripQuery: res?.tripQuery || null,
        },
      ]);

      // Show mini booking form if route is known but date/passengers are not
      if (res?.needsBookingDetails && (res?.busResults?.length > 0 || bookingContext.from)) {
        setShowMiniForm(true);
        setMiniForm({ date: bookingContext.date || "", passengers: bookingContext.passengers || 1 });
      }

      // Handle actions
      if (res?.action?.type === "navigate_to_confirm" && res?.action?.confirmPayload) {
        navigate("/book/confirm", { state: res.action.confirmPayload });
        setIsOpen(false);
        return;
      }

      if (res?.action?.type === "navigate_to_booking" && res?.action?.params) {
        const { from, to, date, passengers } = res.action.params;
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (date) params.set("date", date);
        if (passengers) params.set("passengers", String(passengers));
        navigate(`/book?${params.toString()}`);
        setIsOpen(false);
        return;
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.response?.data?.message ||
            "Assistant is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mini form submit: navigate directly to booking with all context
  const handleMiniFormSubmit = (e) => {
    e.preventDefault();
    const from = bookingContext.from || "";
    const to = bookingContext.to || "";
    const date = miniForm.date || "";
    const passengers = miniForm.passengers || 1;

    if (!from || !to || !date) return;

    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    params.set("date", date);
    params.set("passengers", String(passengers));

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Opening booking page for ${from} → ${to} on ${date} for ${passengers} passenger${passengers > 1 ? "s" : ""}. 🚌`,
      },
    ]);
    setShowMiniForm(false);
    setIsOpen(false);
    navigate(`/book?${params.toString()}`);
  };

  // Build the "Book this bus" URL including any known context
  const buildBookUrl = (bus) => {
    const from = bus.from || bookingContext.from || "";
    const to = bus.to || bookingContext.to || "";
    const date = bookingContext.date || "";
    const passengers = bookingContext.passengers || "";
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    if (passengers) params.set("passengers", String(passengers));
    return `/book?${params.toString()}`;
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowMiniForm(false);
  };

  const handleOpen = () => setIsOpen(true);

  return (
    <div className="chatbot-widget-root">
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <span className="chatbot-avatar">🚌</span>
              <div>
                <h3>PT Assistant</h3>
                <p>Powered by Groq</p>
              </div>
            </div>
            <button type="button" onClick={handleClose} className="chatbot-close-btn" aria-label="Close chat">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`chatbot-msg ${msg.role}`}>
                <div className="chatbot-msg-text">{msg.content}</div>

                {/* Bus result cards */}
                {msg.role === "assistant" && Array.isArray(msg.buses) && msg.buses.length > 0 && (
                  <div className="chatbot-bus-list">
                    {msg.buses.map((bus) => (
                      <div className="chatbot-bus-card" key={bus.vehicleId || bus.regNumber}>
                        <div className="chatbot-bus-header">
                          <div className="chatbot-bus-title">
                            🚌 {bus.model}
                          </div>
                          <span className="chatbot-reg-badge">{bus.regNumber}</span>
                        </div>

                        <div className="chatbot-bus-route">
                          {bus.from} → {bus.to}
                          <span className="chatbot-bus-type">{bus.type}</span>
                        </div>

                        <div className="chatbot-bus-times">
                          <span className="chatbot-time-item">
                            <span className="chatbot-time-label">🕐 Dep</span>
                            <span className="chatbot-time-value">{bus.departureTime}</span>
                          </span>
                          <span className="chatbot-time-item">
                            <span className="chatbot-time-label">⏱ Dur</span>
                            <span className="chatbot-time-value">{bus.durationText}</span>
                          </span>
                          <span className="chatbot-time-item">
                            <span className="chatbot-time-label">🏁 ETA</span>
                            <span className="chatbot-time-value">{bus.eta}</span>
                          </span>
                        </div>

                        <div className="chatbot-bus-footer">
                          <span className="chatbot-bus-seats">
                            💺 {bus.seats} seats · ₹{bus.estimatedFare}/seat
                          </span>
                          <button
                            type="button"
                            className="chatbot-book-btn"
                            onClick={() => {
                              navigate(buildBookUrl(bus));
                              setIsOpen(false);
                            }}
                          >
                            Book this bus →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Inline mini booking form */}
            {showMiniForm && (
              <div className="chatbot-msg assistant">
                <div className="chatbot-msg-text">
                  📅 Please fill in your travel details to open the booking page directly:
                </div>
                <form className="chatbot-mini-form" onSubmit={handleMiniFormSubmit}>
                  <div className="chatbot-mini-form-row">
                    <label className="chatbot-mini-label" htmlFor="cb-date">Departure Date</label>
                    <input
                      id="cb-date"
                      type="date"
                      className="chatbot-mini-input"
                      value={miniForm.date}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      onChange={(e) => setMiniForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div className="chatbot-mini-form-row">
                    <label className="chatbot-mini-label" htmlFor="cb-pax">Passengers</label>
                    <input
                      id="cb-pax"
                      type="number"
                      className="chatbot-mini-input"
                      value={miniForm.passengers}
                      min={1}
                      max={10}
                      required
                      onChange={(e) => setMiniForm((p) => ({ ...p, passengers: Number(e.target.value) }))}
                    />
                  </div>
                  <button type="submit" className="chatbot-mini-submit">
                    Open Booking Page 🚌
                  </button>
                </form>
              </div>
            )}

            {isLoading && (
              <div className="chatbot-msg assistant">
                <div className="chatbot-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter prompt chips */}
          <div className="chatbot-prompt-row">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chatbot-prompt-chip"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            className="chatbot-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about routes, booking, tracking…"
              disabled={isLoading}
              className="chatbot-text-input"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="chatbot-send-btn">
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chatbot-fab"
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        aria-label="Open transport assistant chatbot"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}
