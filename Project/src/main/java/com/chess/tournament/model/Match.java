package com.chess.tournament.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "matches")
@Data
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @ManyToOne
    @JoinColumn(name = "player1_id")
    private User player1;

    @ManyToOne
    @JoinColumn(name = "player2_id")
    private User player2;

    private int roundNumber;

    @Column
    @Enumerated(EnumType.STRING)
    private MatchResult result;

    @Column(name = "player1_score")
    private Double player1Score;

    @Column(name = "player2_score")
    private Double player2Score;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public User getPlayer1() {
        return player1;
    }

    public void setPlayer1(User player1) {
        this.player1 = player1;
    }

    public User getPlayer2() {
        return player2;
    }

    public void setPlayer2(User player2) {
        this.player2 = player2;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }

    public MatchResult getResult() {
        return result;
    }

    public void setResult(MatchResult result) {
        this.result = result;
    }

    public Double getPlayer1Score() {
        return player1Score;
    }

    public void setPlayer1Score(Double player1Score) {
        this.player1Score = player1Score;
    }

    public Double getPlayer2Score() {
        return player2Score;
    }

    public void setPlayer2Score(Double player2Score) {
        this.player2Score = player2Score;
    }
} 