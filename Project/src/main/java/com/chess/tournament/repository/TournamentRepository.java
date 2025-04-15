package com.chess.tournament.repository;

import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByAdmin(User admin);
    List<Tournament> findByPlayersContaining(User player);
} 