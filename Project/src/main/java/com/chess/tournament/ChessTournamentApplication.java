package com.chess.tournament;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.chess.tournament")
@EntityScan("com.chess.tournament.model")
@EnableJpaRepositories("com.chess.tournament.repository")
public class ChessTournamentApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChessTournamentApplication.class, args);
    }
} 