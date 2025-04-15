package com.chess.tournament.controller;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.MatchResult;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;
import com.chess.tournament.service.MatchService;
import com.chess.tournament.service.TournamentService;
import com.chess.tournament.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;
    private final TournamentService tournamentService;
    private final UserService userService;

    @Autowired
    public MatchController(MatchService matchService, TournamentService tournamentService, UserService userService) {
        this.matchService = matchService;
        this.tournamentService = tournamentService;
        this.userService = userService;
    }

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<Match>> getTournamentMatches(@PathVariable Long tournamentId) {
        Tournament tournament = tournamentService.getTournamentById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        return ResponseEntity.ok(matchService.getTournamentMatches(tournament));
    }

    @GetMapping("/tournament/{tournamentId}/round/{roundNumber}")
    public ResponseEntity<List<Match>> getRoundMatches(
            @PathVariable Long tournamentId,
            @PathVariable int roundNumber) {
        Tournament tournament = tournamentService.getTournamentById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        return ResponseEntity.ok(matchService.getRoundMatches(tournament, roundNumber));
    }

    @PutMapping("/{matchId}/result")
    public ResponseEntity<?> updateMatchResult(
            @PathVariable Long matchId,
            @RequestBody Map<String, String> request) {
        try {
            String resultStr = request.get("result");
            if (resultStr == null) {
                return ResponseEntity.badRequest().body("Result is required");
            }

            MatchResult result = MatchResult.valueOf(resultStr.toUpperCase());
            matchService.updateMatchResult(matchId, result);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<Match>> getPlayerMatches(
            @PathVariable Long playerId,
            @RequestParam Long tournamentId) {
        Tournament tournament = tournamentService.getTournamentById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        User player = userService.getUserById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        return ResponseEntity.ok(matchService.getPlayerMatches(tournament, player));
    }
} 