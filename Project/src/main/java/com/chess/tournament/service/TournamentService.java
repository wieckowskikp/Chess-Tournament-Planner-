package com.chess.tournament.service;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.TournamentStatus;
import com.chess.tournament.model.User;
import com.chess.tournament.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface TournamentService {
    Tournament createTournament(Tournament tournament);
    Optional<Tournament> getTournamentById(Long id);
    List<Tournament> getAllTournaments();
    List<Tournament> getTournamentsByAdmin(User admin);
    void addPlayer(Long tournamentId, Long playerId);
    void removePlayer(Long tournamentId, Long playerId);
    void startTournament(Long tournamentId);
    void endTournament(Long tournamentId);
    List<User> getTournamentPlayers(Long tournamentId);
    void updateTournament(Tournament tournament);
    void saveTournament(Tournament tournament);
    void saveMatches(List<Match> matches);
    List<Match> getTournamentMatches(Long tournamentId);
    void updateMatchResult(Long matchId, String result);
    void addPlayerToTournament(Long tournamentId, Long playerId);
    List<Map<String, Object>> calculateStandings(Long tournamentId);
    boolean isRoundComplete(Long tournamentId, int roundNumber);
} 