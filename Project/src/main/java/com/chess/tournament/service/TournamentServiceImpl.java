package com.chess.tournament.service;

import com.chess.tournament.model.Match;
import com.chess.tournament.model.MatchResult;
import com.chess.tournament.model.Tournament;
import com.chess.tournament.model.TournamentStatus;
import com.chess.tournament.model.User;
import com.chess.tournament.repository.MatchRepository;
import com.chess.tournament.repository.TournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TournamentServiceImpl implements TournamentService {

    private final TournamentRepository tournamentRepository;
    private final MatchRepository matchRepository;
    private final UserService userService;
    private final EloRatingService eloRatingService;

    @Autowired
    public TournamentServiceImpl(TournamentRepository tournamentRepository,
                               MatchRepository matchRepository,
                               UserService userService,
                               EloRatingService eloRatingService) {
        this.tournamentRepository = tournamentRepository;
        this.matchRepository = matchRepository;
        this.userService = userService;
        this.eloRatingService = eloRatingService;
    }

    @Override
    @Transactional
    public Tournament createTournament(Tournament tournament) {
        return tournamentRepository.save(tournament);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Tournament> getTournamentById(Long id) {
        return tournamentRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tournament> getTournamentsByAdmin(User admin) {
        return tournamentRepository.findByAdmin(admin);
    }

    @Override
    @Transactional
    public void addPlayer(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        User player = userService.findById(playerId);

        if (tournament.getPlayers().contains(player)) {
            throw new IllegalArgumentException("Player already in tournament");
        }

        tournament.getPlayers().add(player);
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional
    public void removePlayer(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        User player = userService.findById(playerId);

        if (!tournament.getPlayers().contains(player)) {
            throw new IllegalArgumentException("Player not in tournament");
        }

        tournament.getPlayers().remove(player);
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional
    public void startTournament(Long tournamentId) {
        Tournament tournament = getTournamentById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        if (tournament.getStatus() != TournamentStatus.PENDING) {
            throw new IllegalArgumentException("Tournament cannot be started");
        }
        tournament.setStatus(TournamentStatus.IN_PROGRESS);
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional
    public void endTournament(Long tournamentId) {
        Tournament tournament = getTournamentById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        if (tournament.getStatus() != TournamentStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Tournament cannot be ended");
        }
        tournament.setStatus(TournamentStatus.ENDED);
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getTournamentPlayers(Long tournamentId) {
        Tournament tournament = getTournamentById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        return new ArrayList<>(tournament.getPlayers());
    }

    @Override
    @Transactional
    public void updateTournament(Tournament tournament) {
        if (!tournamentRepository.existsById(tournament.getId())) {
            throw new IllegalArgumentException("Tournament not found");
        }
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional
    public void saveTournament(Tournament tournament) {
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional
    public void saveMatches(List<Match> matches) {
        matchRepository.saveAll(matches);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Match> getTournamentMatches(Long tournamentId) {
        return matchRepository.findByTournamentId(tournamentId);
    }

    @Override
    @Transactional
    public void updateMatchResult(Long matchId, String result) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (match.getTournament().getStatus() != TournamentStatus.IN_PROGRESS) {
            throw new IllegalStateException("Tournament is not in progress");
        }

        MatchResult previousResult = match.getResult();
        MatchResult newResult = MatchResult.valueOf(result);
        match.setResult(newResult);
        
        // Set the scores based on result
        if (newResult == MatchResult.PLAYER1_WIN) {
            match.setPlayer1Score(1.0);
            match.setPlayer2Score(0.0);
        } else if (newResult == MatchResult.PLAYER2_WIN) {
            match.setPlayer1Score(0.0);
            match.setPlayer2Score(1.0);
        } else if (newResult == MatchResult.DRAW) {
            match.setPlayer1Score(0.5);
            match.setPlayer2Score(0.5);
        } else {
            match.setPlayer1Score(0.0);
            match.setPlayer2Score(0.0);
        }
        
        // Save the match
        matchRepository.save(match);
        
        // Update ELO ratings if this is a new result or a result change
        if (previousResult != newResult && newResult != MatchResult.NOT_PLAYED) {
            eloRatingService.updateRatings(match);
        }
        
        // Check if all matches for this round are completed
        checkRoundCompletion(match.getTournament().getId());
    }

    /**
     * Checks if a round is complete and either starts a new round or ends the tournament
     */
    private void checkRoundCompletion(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        
        // Get all matches for current round
        List<Match> currentRoundMatches = matchRepository.findByTournamentIdAndRoundNumber(
                tournamentId, tournament.getCurrentRound());
        
        // Check if all matches have results
        boolean roundComplete = currentRoundMatches.stream()
                .allMatch(m -> m.getResult() != null && m.getResult() != MatchResult.NOT_PLAYED);
        
        if (roundComplete) {
            // Calculate maximum rounds for Swiss tournament
            // For Swiss system, log2(n) rounded up where n is the number of players
            int numPlayers = tournament.getPlayers().size();
            int maxRounds = (int) Math.ceil(Math.log(numPlayers) / Math.log(2));
            
            // If we've reached the maximum number of rounds or a predefined limit, end the tournament
            if (tournament.getCurrentRound() >= maxRounds) {
                endTournament(tournament.getId());
            }
        }
    }

    @Override
    @Transactional
    public void addPlayerToTournament(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));

        if (tournament.getStatus() != TournamentStatus.PENDING) {
            throw new IllegalStateException("Cannot add players to a started tournament");
        }

        User player = userService.getUserById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        // Initialize players set if null
        if (tournament.getPlayers() == null) {
            tournament.setPlayers(new HashSet<>());
        }

        // Check if player is already in the tournament
        boolean playerExists = tournament.getPlayers().stream()
                .anyMatch(p -> p.getId().equals(playerId));
        
        if (playerExists) {
            throw new IllegalArgumentException("Player is already in the tournament");
        }

        // Add player and save
        tournament.getPlayers().add(player);
        tournamentRepository.save(tournament);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> calculateStandings(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));

        List<Match> matches = matchRepository.findByTournamentId(tournamentId);
        Map<Long, Map<String, Object>> standings = new HashMap<>();

        // Initialize standings for all players
        tournament.getPlayers().forEach(player -> {
            Map<String, Object> playerStanding = new HashMap<>();
            playerStanding.put("player", player);
            playerStanding.put("score", 0.0);
            playerStanding.put("matches", 0);
            standings.put(player.getId(), playerStanding);
        });

        // Calculate scores
        matches.forEach(match -> {
            if (match.getResult() == null) {
                return;
            }

            Map<String, Object> player1Standing = standings.get(match.getPlayer1().getId());
            Map<String, Object> player2Standing = standings.get(match.getPlayer2().getId());

            player1Standing.put("matches", (int) player1Standing.get("matches") + 1);
            player2Standing.put("matches", (int) player2Standing.get("matches") + 1);

            switch (match.getResult()) {
                case PLAYER1_WIN:
                    player1Standing.put("score", (double) player1Standing.get("score") + 1.0);
                    break;
                case PLAYER2_WIN:
                    player2Standing.put("score", (double) player2Standing.get("score") + 1.0);
                    break;
                case DRAW:
                    player1Standing.put("score", (double) player1Standing.get("score") + 0.5);
                    player2Standing.put("score", (double) player2Standing.get("score") + 0.5);
                    break;
            }
        });

        // Convert to list and sort
        return standings.values().stream()
                .sorted((a, b) -> {
                    double scoreA = (double) a.get("score");
                    double scoreB = (double) b.get("score");
                    if (scoreA != scoreB) {
                        return Double.compare(scoreB, scoreA);
                    }
                    User playerA = (User) a.get("player");
                    User playerB = (User) b.get("player");
                    return Integer.compare(playerB.getEloRating(), playerA.getEloRating());
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRoundComplete(Long tournamentId, int roundNumber) {
        List<Match> matches = matchRepository.findByTournamentIdAndRoundNumber(tournamentId, roundNumber);
        
        // If no matches for the round, it's not complete
        if (matches.isEmpty()) {
            return false;
        }
        
        // Check if all matches have a result
        return matches.stream()
                .allMatch(m -> m.getResult() != null && m.getResult() != MatchResult.NOT_PLAYED);
    }
} 