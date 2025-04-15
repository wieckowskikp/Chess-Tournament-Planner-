package com.chess.tournament.controller;

import com.chess.tournament.dto.TournamentDto;
import com.chess.tournament.model.Match;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;
import com.chess.tournament.service.MatchService;
import com.chess.tournament.service.SwissPairingService;
import com.chess.tournament.service.TournamentService;
import com.chess.tournament.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {
    private final TournamentService tournamentService;
    private final SwissPairingService swissPairingService;
    private final UserService userService;
    private final MatchService matchService;

    @Autowired
    public TournamentController(TournamentService tournamentService,
                              SwissPairingService swissPairingService,
                              UserService userService,
                              MatchService matchService) {
        this.tournamentService = tournamentService;
        this.swissPairingService = swissPairingService;
        this.userService = userService;
        this.matchService = matchService;
    }

    @PostMapping
    public ResponseEntity<?> createTournament(
            @RequestBody TournamentDto tournamentDto,
            @RequestParam Long adminId) {
        try {
            User admin = userService.getUserById(adminId)
                    .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
            
            Tournament tournament = new Tournament();
            tournament.setName(tournamentDto.getName());
            tournament.setStartDate(tournamentDto.getStartDate());
            tournament.setEndDate(tournamentDto.getEndDate());
            tournament.setAdmin(admin);
            
            Tournament createdTournament = tournamentService.createTournament(tournament);
            return ResponseEntity.ok(createdTournament);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{tournamentId}/players/{playerId}")
    public ResponseEntity<?> addPlayerToTournament(@PathVariable Long tournamentId, @PathVariable Long playerId) {
        try {
            // Fetch tournament and user to verify they exist
            Optional<Tournament> tournamentOpt = tournamentService.getTournamentById(tournamentId);
            if (!tournamentOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Tournament not found: " + tournamentId);
            }

            Optional<User> playerOpt = userService.getUserById(playerId);
            if (!playerOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Player not found: " + playerId);
            }
            
            System.out.println("Adding player to tournament: Tournament #" + tournamentId + " | Player #" + playerId);
            tournamentService.addPlayerToTournament(tournamentId, playerId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Log the full exception
            return ResponseEntity.status(500).body("Error adding player: " + e.getMessage());
        }
    }

    @GetMapping("/admin/{adminId}")
    public ResponseEntity<List<Tournament>> getTournamentsByAdmin(@PathVariable Long adminId) {
        User admin = userService.getUserById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return ResponseEntity.ok(tournamentService.getTournamentsByAdmin(admin));
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<Tournament>> getTournamentsByPlayer(@PathVariable Long playerId) {
        List<Tournament> tournaments = tournamentService.getAllTournaments().stream()
                .filter(t -> t.getPlayers().stream()
                        .anyMatch(p -> p.getId().equals(playerId)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(tournaments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tournament> getTournament(@PathVariable Long id) {
        return tournamentService.getTournamentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> startTournament(@PathVariable Long id) {
        try {
            tournamentService.startTournament(id);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> endTournament(@PathVariable Long id) {
        try {
            tournamentService.endTournament(id);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/generate-round")
    public ResponseEntity<?> generateNextRound(@PathVariable Long id) {
        try {
            Tournament tournament = tournamentService.getTournamentById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
            
            int nextRound = tournament.getCurrentRound() + 1;
            List<Match> matches = swissPairingService.generatePairings(tournament, nextRound);
            
            tournamentService.saveMatches(matches);
            tournament.setCurrentRound(nextRound);
            tournamentService.saveTournament(tournament);
            
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/matches")
    public ResponseEntity<List<Match>> getTournamentMatches(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getTournamentMatches(id));
    }

    @PutMapping("/matches/{matchId}/result")
    public ResponseEntity<?> updateMatchResult(@PathVariable Long matchId, @RequestBody Map<String, String> request) {
        try {
            String resultStr = request.get("result");
            tournamentService.updateMatchResult(matchId, resultStr);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/standings")
    public ResponseEntity<List<Map<String, Object>>> getTournamentStandings(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.calculateStandings(id));
    }
} 