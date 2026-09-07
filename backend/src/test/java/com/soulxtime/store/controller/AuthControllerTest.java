package com.soulxtime.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soulxtime.store.dto.request.LoginRequest;
import com.soulxtime.store.dto.request.RegisterRequest;
import com.soulxtime.store.entity.User;
import com.soulxtime.store.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder encoder;

    @Test
    @DisplayName("POST /api/auth/register returns 201 and JWT tokens")
    void register_validRequest_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "Test User",
                "testuser" + System.nanoTime() + "@example.com",
                "+91 99999 00001",
                "Test@12345"
        );

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("POST /api/auth/register with duplicate email returns 400")
    void register_duplicateEmail_returns400() throws Exception {
        String email = "dupe" + System.nanoTime() + "@example.com";
        userRepository.save(User.builder()
                .fullName("Existing User")
                .email(email)
                .passwordHash(encoder.encode("Test@12345"))
                .role(User.UserRole.CUSTOMER)
                .active(true)
                .build());

        RegisterRequest req = new RegisterRequest("Another", email, "+91 99999 00002", "Test@12345");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    @DisplayName("POST /api/auth/login with valid credentials returns tokens")
    void login_validCredentials_returnsTokens() throws Exception {
        String email = "logintest" + System.nanoTime() + "@example.com";
        userRepository.save(User.builder()
                .fullName("Login Test")
                .email(email)
                .passwordHash(encoder.encode("Correct@99"))
                .role(User.UserRole.CUSTOMER)
                .active(true)
                .build());

        LoginRequest req = new LoginRequest(email, "Correct@99");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/login with wrong password returns 401")
    void login_wrongPassword_returns401() throws Exception {
        String email = "wrongpass" + System.nanoTime() + "@example.com";
        userRepository.save(User.builder()
                .fullName("Wrong Pass")
                .email(email)
                .passwordHash(encoder.encode("Correct@99"))
                .role(User.UserRole.CUSTOMER)
                .active(true)
                .build());

        LoginRequest req = new LoginRequest(email, "WrongPassword!");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/register with weak password returns 400 with field errors")
    void register_weakPassword_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("Test", "test@example.com", "+91 99999 99999", "weak");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty());
    }
}
