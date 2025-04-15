package com.chess.tournament.service;

import com.chess.tournament.dto.UserRegistrationDto;
import com.chess.tournament.model.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;

public interface UserService extends UserDetailsService {
    User registerNewUser(UserRegistrationDto registrationDto);
    User findByUsername(String username);
    User findById(Long id);
    User registerUser(User user);
    Optional<User> getUserById(Long id);
    Optional<User> getUserByUsername(String username);
    void updateUser(User user);
    void updateEloRating(Long userId, int newRating);
    List<User> searchByUsername(String username);
    List<User> getAllUsers();
} 