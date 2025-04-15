package com.chess.tournament.config;

import com.chess.tournament.model.User;
import com.chess.tournament.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Check if admin user exists
        if (!userRepository.existsByUsername("admin")) {
            // Create admin user
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin"));
            adminUser.setEmail("admin@chess-tournament.com");
            
            // Add admin role
            Set<String> roles = new HashSet<>();
            roles.add("ADMIN");
            roles.add("PLAYER");
            adminUser.setRoles(roles);
            
            // Set default ELO rating
            adminUser.setEloRating(2000);
            
            // Save admin user
            userRepository.save(adminUser);
            
            System.out.println("Admin user created successfully");
        }
    }
} 