package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.LoginRequest;
import com.soulxtime.store.dto.request.RegisterRequest;
import com.soulxtime.store.dto.response.AuthResponse;
import com.soulxtime.store.entity.RefreshToken;
import com.soulxtime.store.entity.User;
import com.soulxtime.store.exception.BusinessException;
import com.soulxtime.store.repository.RefreshTokenRepository;
import com.soulxtime.store.repository.UserRepository;
import com.soulxtime.store.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BusinessException("EMAIL_TAKEN", "An account with this email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.CUSTOMER)
                .active(true)
                .build();

        user = userRepository.save(user);
        log.info("New customer registered: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        if (!user.isActive()) {
            throw new BusinessException("ACCOUNT_DISABLED", "Your account has been deactivated");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        String tokenHash = hashToken(refreshTokenValue);

        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token"));

        if (!stored.isValid()) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new BusinessException("REFRESH_TOKEN_EXPIRED", "Refresh token has expired. Please log in again.");
        }

        User user = stored.getUser();

        // Rotate refresh token (invalidate old, issue new)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllUserTokens(userId);
        log.info("User {} logged out, all refresh tokens revoked", userId);
    }

    // ─────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );

        String rawRefreshToken = generateSecureToken();
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpiryMs))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Token hashing failed", e);
        }
    }
}
