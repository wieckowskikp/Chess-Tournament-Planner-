package com.chess.tournament.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TournamentDto {
    private String name;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
} 