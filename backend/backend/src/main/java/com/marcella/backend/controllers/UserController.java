package com.marcella.backend.controllers;

import com.marcella.backend.authDtos.UserResponse;
import com.marcella.backend.entities.Users;
import com.marcella.backend.sidebar.SidebarStatsResponse;
import com.marcella.backend.sidebar.SidebarStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final SidebarStatsService sidebarStatsService;

    @GetMapping("/current-user")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        try {
            Users user = getUser(authentication);
            UserResponse response = UserResponse.builder()
                    .name(user.getName())
                    .email(user.getEmail())
                    .build();
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/sidebar-stats")
    public ResponseEntity<SidebarStatsResponse> getSidebarStats(Authentication authentication) {
        try {
            Users user = getUser(authentication);
            SidebarStatsResponse stats = sidebarStatsService.getStats(user.getId());
            return ResponseEntity.ok(stats);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    private Users getUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof Users user) {
            return user;
        }

        throw new RuntimeException("Unexpected principal type: " + principal.getClass().getName());
    }
}
