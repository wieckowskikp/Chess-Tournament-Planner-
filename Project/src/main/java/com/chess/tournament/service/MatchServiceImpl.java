package com.chess.tournament.service;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.MatchResult;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;
import com.chess.tournament.repository.MatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MatchServiceImpl implements MatchService {
    private final MatchRepository matchRepository;

    public MatchServiceImpl(MatchRepository matchRepository) {
        this.matchRepository = matchRepository;
    }

    @Override
    public List<Match> getTournamentMatches(Tournament tournament) {
        return matchRepository.findByTournament(tournament);
    }

    @Override
    public List<Match> getRoundMatches(Tournament tournament, int roundNumber) {
        return matchRepository.findByTournamentAndRoundNumber(tournament, roundNumber);
    }

    @Override
    public List<Match> getPlayerMatches(Tournament tournament, User player) {
        return matchRepository.findByTournamentAndPlayer1OrPlayer2(tournament, player, player);
    }

    @Override
    @Transactional
    public Match updateMatchResult(Match match, MatchResult result) {
        match.setResult(result);
        
        // Update scores based on result
        switch (result) {
            case PLAYER1_WIN:
                match.setPlayer1Score(1.0);
                match.setPlayer2Score(0.0);
                break;
            case PLAYER2_WIN:
                match.setPlayer1Score(0.0);
                match.setPlayer2Score(1.0);
                break;
            case DRAW:
                match.setPlayer1Score(0.5);
                match.setPlayer2Score(0.5);
                break;
            default:
                match.setPlayer1Score(0.0);
                match.setPlayer2Score(0.0);
        }

        return matchRepository.save(match);
    }

    @Override
    @Transactional
    public void updateMatchResult(Long matchId, MatchResult result) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));
        updateMatchResult(match, result);
    }

    @Override
    @Transactional
    public Match createMatch(Tournament tournament, User player1, User player2, int roundNumber) {
        Match match = new Match();
        match.setTournament(tournament);
        match.setPlayer1(player1);
        match.setPlayer2(player2);
        match.setRoundNumber(roundNumber);
        match.setResult(MatchResult.NOT_PLAYED);
        match.setPlayer1Score(0.0);
        match.setPlayer2Score(0.0);

        return matchRepository.save(match);
    }
} 