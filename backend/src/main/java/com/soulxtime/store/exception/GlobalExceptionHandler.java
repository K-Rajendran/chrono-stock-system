package com.soulxtime.store.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralized exception handling.
 * Returns structured error responses; NEVER exposes stack traces to clients.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─────────────────────────────────────────────────────────
    // Domain / Application Exceptions
    // ─────────────────────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, ex.getCode(), ex.getMessage(), request);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest request) {
        log.warn("Business exception: {} - {}", ex.getCode(), ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, ex.getCode(), ex.getMessage(), request);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex, HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", ex.getMessage(), request);
    }

    @ExceptionHandler(DuplicateRequestException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateRequestException ex, HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_REQUEST", ex.getMessage(), request);
    }

    // ─────────────────────────────────────────────────────────
    // Spring Security
    // ─────────────────────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not have permission to perform this action", request);
    }

    // ─────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        ValidationErrorResponse response = ValidationErrorResponse.builder()
                .timestamp(Instant.now())
                .status(400)
                .code("VALIDATION_ERROR")
                .message("Request validation failed")
                .path(request.getRequestURI())
                .fieldErrors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // ─────────────────────────────────────────────────────────
    // Catch-all
    // ─────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again later.", request);
    }

    // ─────────────────────────────────────────────────────────
    // Builder helpers
    // ─────────────────────────────────────────────────────────

    private ResponseEntity<ErrorResponse> error(
            HttpStatus status, String code, String message, HttpServletRequest request) {

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .code(code)
                .message(message)
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(status).body(response);
    }

    // ─────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────

    @lombok.Builder
    @lombok.Getter
    public static class ErrorResponse {
        private final Instant timestamp;
        private final int status;
        private final String code;
        private final String message;
        private final String path;
    }

    @lombok.Builder
    @lombok.Getter
    public static class ValidationErrorResponse {
        private final Instant timestamp;
        private final int status;
        private final String code;
        private final String message;
        private final String path;
        private final Map<String, String> fieldErrors;
    }
}
