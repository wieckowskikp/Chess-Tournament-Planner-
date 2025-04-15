package com.chess.tournament.repository;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournament(Tournament tournament);
    List<Match> findByTournamentAndRoundNumber(Tournament tournament, int roundNumber);
    List<Match> findByTournamentAndPlayer1OrPlayer2(Tournament tournament, User player1, User player2);
    List<Match> findByTournamentId(Long tournamentId);
    List<Match> findByTournamentIdAndRoundNumber(Long tournamentId, int roundNumber);
} 