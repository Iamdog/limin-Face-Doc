package com.example.workshop;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    @ExceptionHandler(BizException.class)
    ResponseEntity<ApiError> business(BizException error, HttpServletRequest request) {
        return ResponseEntity.status(error.status()).body(ApiError.of(request, error.code(), error.getMessage()));
    }
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
                       MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiError> invalid(Exception error, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ApiError.of(request, "INVALID_REQUEST", "请检查请求参数与 JSON 格式"));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unknown(Exception error, HttpServletRequest request) {
        log.error("request failed", error);
        return ResponseEntity.internalServerError().body(ApiError.of(request, "INTERNAL_ERROR", "服务暂时不可用"));
    }
}
