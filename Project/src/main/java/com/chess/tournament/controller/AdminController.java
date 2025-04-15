package com.chess.tournament.controller;

import com.chess.tournament.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;

    @Autowired
    public AdminController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/users")
    public String userManagement(Model model) {
        return "admin/users";
    }
    
    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }
} 