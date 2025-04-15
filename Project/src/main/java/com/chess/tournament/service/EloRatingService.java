package com.chess.tournament.service;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.MatchResult;
import com.chess.tournament.model.User;
import org.springframework.stereotype.Service;

@Service
public class EloRatingService {
    // Standard K-factor for ELO rating
    private static final int K_FACTOR = 32;
    
    /**
     * Update player ratings based on match result
     * 
     * @param match The match with result
     */
    public void updateRatings(Match match) {
        if (match.getResult() == null || match.getResult() == MatchResult.NOT_PLAYED) {
            return; // Don't update ratings for matches that haven't been played
        }
        
        User player1 = match.getPlayer1();
        User player2 = match.getPlayer2();
        MatchResult result = match.getResult();
        
        // Skip for byes (player matched against themselves)
        if (player1.getId().equals(player2.getId())) {
            return;
        }
        
        // Get current ratings
        int rating1 = player1.getEloRating();
        int rating2 = player2.getEloRating();
        
        // Calculate expected scores (probability of winning)
        double expected1 = getExpectedScore(rating1, rating2);
        double expected2 = getExpectedScore(rating2, rating1);
        
        // Calculate actual scores
        double actual1 = 0.0;
        double actual2 = 0.0;
        
        if (result == MatchResult.PLAYER1_WIN) {
            actual1 = 1.0;
            actual2 = 0.0;
        } else if (result == MatchResult.PLAYER2_WIN) {
            actual1 = 0.0;
            actual2 = 1.0;
        } else if (result == MatchResult.DRAW) {
            actual1 = 0.5;
            actual2 = 0.5;
        }
        
        // Calculate new ratings
        int newRating1 = calculateNewRating(rating1, actual1, expected1);
        int newRating2 = calculateNewRating(rating2, actual2, expected2);
        
        // Update player ratings
        player1.setEloRating(newRating1);
        player2.setEloRating(newRating2);
    }
    
    /**
     * Calculate the expected score (probability of winning)
     */
    private double getExpectedScore(int rating1, int rating2) {
        return 1.0 / (1.0 + Math.pow(10.0, (rating2 - rating1) / 400.0));
    }
    
    /**
     * Calculate the new rating using the ELO formula
     */
    private int calculateNewRating(int oldRating, double actualScore, double expectedScore) {
        return (int) Math.round(oldRating + K_FACTOR * (actualScore - expectedScore));
    }
} 