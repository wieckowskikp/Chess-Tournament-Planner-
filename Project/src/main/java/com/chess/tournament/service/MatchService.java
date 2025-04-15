package com.chess.tournament.service;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.MatchResult;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.User;

import java.util.List;

public interface MatchService {
    List<Match> getTournamentMatches(Tournament tournament);
    List<Match> getRoundMatches(Tournament tournament, int roundNumber);
    List<Match> getPlayerMatches(Tournament tournament, User player);
    Match updateMatchResult(Match match, MatchResult result);
    Match createMatch(Tournament tournament, User player1, User player2, int roundNumber);
    void updateMatchResult(Long matchId, MatchResult result);
} 