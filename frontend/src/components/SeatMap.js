// src/components/SeatMap.jsx
import React, { useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import { EventSeat, CheckCircle, Close } from "@mui/icons-material";
import "../styles/SeatMap.css";

/**
 * SeatMap props:
 * - capacity (number)
 * - reserved: array of seat numbers already booked (e.g. [1,2,10])
 * - selected: array of selected seat numbers
 * - onToggle(seatNumber)
 *
 * Layout: rows of 4 seats (2x2 with an aisle)
 */
export default function SeatMap({ capacity, reserved = [], selected = [], onToggle }) {
  const seats = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= capacity; i++) arr.push(i);
    return arr;
  }, [capacity]);

  const renderSeat = (num) => {
    const isReserved = reserved.includes(num);
    const isSelected = selected.includes(num);
    
    const seatClass = `seat-button ${
      isReserved ? "reserved" : isSelected ? "selected" : "available"
    }`;

    return (
      <Button
        key={num}
        onClick={() => !isReserved && onToggle(num)}
        disabled={isReserved}
        className={seatClass}
        title={isReserved ? "Reserved" : isSelected ? "Selected" : "Available"}
      >
        <span className="seat-number">{num}</span>
        {isSelected && <CheckCircle className="seat-check-icon" />}
        {isReserved && <Close className="seat-cross-icon" />}
      </Button>
    );
  };

  // Create rows - 4 seats per row but show 2 + aisle + 2
  const rows = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  return (
    <Box className="seat-map-wrapper">
      {/* Header */}
      <Box className="seat-map-header">
        <EventSeat className="bus-icon" />
        <Typography variant="h6" className="seat-map-title">
          Select Your Seats
        </Typography>
      </Box>

      {/* Driver Area */}
      <Box className="driver-section">
        <Box className="steering-wheel">
          <Box className="wheel-center" />
        </Box>
        <Typography variant="caption" className="driver-label">
          Driver
        </Typography>
      </Box>

      {/* Seat Grid */}
      <Box className="seat-map-container">
        {rows.map((row, idx) => (
          <Box key={idx} className="seat-row" data-row={`Row ${idx + 1}`}>
            {/* Left Side Seats */}
            <Box className="seat-group left-seats">
              {row.slice(0, 2).map(renderSeat)}
            </Box>

            {/* Aisle */}
            <Box className="aisle-spacer">
              <Box className="aisle-line" />
            </Box>

            {/* Right Side Seats */}
            <Box className="seat-group right-seats">
              {row.slice(2, 4).map(renderSeat)}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box className="seat-legend">
        <Box className="legend-item">
          <Box className="legend-box available" />
          <Typography variant="body2">Available</Typography>
        </Box>
        <Box className="legend-item">
          <Box className="legend-box selected">
            <CheckCircle sx={{ fontSize: 14, color: "white" }} />
          </Box>
          <Typography variant="body2">Selected</Typography>
        </Box>
        <Box className="legend-item">
          <Box className="legend-box reserved">
            <Close sx={{ fontSize: 14, color: "#ef4444" }} />
          </Box>
          <Typography variant="body2">Reserved</Typography>
        </Box>
      </Box>

      {/* Selection Summary */}
      {selected.length > 0 && (
        <Box className="selection-summary">
          <Typography variant="body2" className="summary-text">
            {selected.length} {selected.length === 1 ? "seat" : "seats"} selected:
          </Typography>
          <Box className="selected-seats-list">
            {selected.map((seat) => (
              <span key={seat} className="selected-seat-tag">
                {seat}
              </span>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}