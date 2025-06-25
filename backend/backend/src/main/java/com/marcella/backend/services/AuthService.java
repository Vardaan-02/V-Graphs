package com.marcella.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.marcella.backend.authDtos.*;
import com.marcella.backend.entities.Users;
import com.marcella.backend.repositories.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
            throw new RuntimeException("Email already registered");
        });

        Users user = Users.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .isActive(true)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .build();
    }

    public AuthResponse signin(SigninRequest request) {
        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .build();
    }

    public Boolean otpValidate(OtpRequest request) {
        var email = request.getEmail();
        var message= request.getOtp();
        var subject = "OTP Verification";
        return emailService.sendEmail(email,subject,message);
    }

    public AuthResponse authenticateWithGoogle(String googleAccessToken) {
        GoogleUserDto googleUser = fetchGoogleUserInfo(googleAccessToken);

        Optional<Users> userOptional = userRepository.findByEmail(googleUser.getEmail());
        Users user = userOptional.orElseGet(() -> {
            Users newUser = Users.builder()
                    .email(googleUser.getEmail())
                    .passwordHash(passwordEncoder.encode("temporary-password"))
                    .name(googleUser.getName())
                    .isActive(true)
                    .build();
            return userRepository.save(newUser);
        });

        String token = jwtService.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .build();
    }

    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail();
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private GoogleUserDto fetchGoogleUserInfo(String accessToken) {
        String url = "https://www.googleapis.com/oauth2/v3/userinfo";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<JsonNode> response = new RestTemplate().exchange(
                url, HttpMethod.GET, entity, JsonNode.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            JsonNode body = response.getBody();
            return new GoogleUserDto(
                    body.get("email").asText(),
                    body.get("name").asText(),
                    body.get("picture").asText()
            );
        }
        throw new RuntimeException("Failed to fetch Google user info");
    }
}
