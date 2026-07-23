package com.example.blog.common;

/** 业务异常：在 Service 层直接抛出，由全局异常处理器转换为统一返回。 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        this(400, message);
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
