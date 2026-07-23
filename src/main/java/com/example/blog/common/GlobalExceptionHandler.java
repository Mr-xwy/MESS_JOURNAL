package com.example.blog.common;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** 全局异常处理器：所有 Controller 抛出的异常都会在此统一成 Result 结构返回。 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleOther(Exception e) {
        // 生产环境应打印日志，不要直接把异常信息暴露给前端
        return Result.error(500, e.getMessage() == null ? "服务器内部错误" : e.getMessage());
    }
}
