package com.chess.tournament.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/tournaments")
    public String tournaments() {
        return "tournaments";
    }

    @GetMapping("/tournaments/{id}")
    public String tournamentDetails() {
        return "tournament-details";
    }

    @GetMapping("/profile")
    public String profile() {
        return "profile";
    }
} 