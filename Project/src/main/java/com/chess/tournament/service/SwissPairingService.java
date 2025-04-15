package com.chess.tournament.service;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SwissPairingService {
    private final MatchService matchService;

    public SwissPairingService(MatchService matchService) {
        this.matchService = matchService;
    }

    public List<Match> generatePairings(Tournament tournament, int roundNumber) {
        List<User> players = new ArrayList<>(tournament.getPlayers());
        
        // Sort players by score (and ELO as secondary criteria)
        players.sort((p1, p2) -> {
            double score1 = calculateTournamentScore(p1, tournament);
            double score2 = calculateTournamentScore(p2, tournament);
            if (score1 != score2) {
                return Double.compare(score2, score1);
            }
            return Integer.compare(p2.getEloRating(), p1.getEloRating());
        });

        // Get previous matches to avoid rematches if possible
        Set<String> previousPairings = getPreviousPairings(tournament);
        List<Match> newMatches = new ArrayList<>();
        Set<User> pairedPlayers = new HashSet<>();

        // Generate pairings
        for (int i = 0; i < players.size(); i++) {
            if (pairedPlayers.contains(players.get(i))) {
                continue;
            }

            User player1 = players.get(i);
            User player2 = null;

            // Find suitable opponent
            for (int j = i + 1; j < players.size(); j++) {
                User candidate = players.get(j);
                if (!pairedPlayers.contains(candidate) && 
                    !previousPairings.contains(createPairingKey(player1, candidate))) {
                    player2 = candidate;
                    break;
                }
            }

            // If no ideal opponent found, take the first unpaired player
            if (player2 == null) {
                for (int j = i + 1; j < players.size(); j++) {
                    if (!pairedPlayers.contains(players.get(j))) {
                        player2 = players.get(j);
                        break;
                    }
                }
            }

            // Create match if opponent found
            if (player2 != null) {
                Match match = matchService.createMatch(tournament, player1, player2, roundNumber);
                newMatches.add(match);
                pairedPlayers.add(player1);
                pairedPlayers.add(player2);
            }
        }

        // Handle bye if odd number of players
        if (pairedPlayers.size() < players.size()) {
            User playerWithBye = players.stream()
                .filter(p -> !pairedPlayers.contains(p))
                .findFirst()
                .orElseThrow();
            
            // Create a "bye" match with the same player as both player1 and player2
            Match byeMatch = matchService.createMatch(tournament, playerWithBye, playerWithBye, roundNumber);
            newMatches.add(byeMatch);
        }

        return newMatches;
    }

    private double calculateTournamentScore(User player, Tournament tournament) {
        return matchService.getPlayerMatches(tournament, player).stream()
            .mapToDouble(match -> {
                if (match.getPlayer1().equals(player)) {
                    return match.getPlayer1Score();
                } else {
                    return match.getPlayer2Score();
                }
            })
            .sum();
    }

    private Set<String> getPreviousPairings(Tournament tournament) {
        return matchService.getTournamentMatches(tournament).stream()
            .map(match -> createPairingKey(match.getPlayer1(), match.getPlayer2()))
            .collect(Collectors.toSet());
    }

    private String createPairingKey(User player1, User player2) {
        return player1.getId() < player2.getId() 
            ? player1.getId() + "-" + player2.getId()
            : player2.getId() + "-" + player1.getId();
    }
} 