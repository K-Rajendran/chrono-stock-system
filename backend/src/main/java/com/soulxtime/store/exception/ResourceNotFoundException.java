package com.soulxtime.store.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {
    private final String code = "NOT_FOUND";

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
